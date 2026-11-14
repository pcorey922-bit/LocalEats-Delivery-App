import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import {
  partialRefundsTable,
  refundsTable,
  paymentsTable,
  financialOperationsTable,
} from "@workspace/db";
import { audit, notifyOrder, type Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";
import { postJournal, requirePaymentJournal } from "./ledger";
export class RefundReconciliationError extends CommerceError {
  requiresReconciliation = true;
  constructor(message: string) {
    super(409, message);
  }
}
export async function fullRefundAmount(
  tx: Transaction,
  orderId: string,
  total: number,
) {
  const rows = await tx
    .select()
    .from(partialRefundsTable)
    .where(eq(partialRefundsTable.orderId, orderId));
  if (rows.some((r) => !["succeeded", "failed", "canceled"].includes(r.status)))
    throw new CommerceError(
      409,
      "Resolve pending partial refunds before requesting the remaining full refund",
    );
  return (
    total -
    rows
      .filter((r) => r.status === "succeeded")
      .reduce((n, r) => n + r.amountCents, 0)
  );
}
export async function applyPartialRefund(
  tx: Transaction,
  refund: typeof partialRefundsTable.$inferSelect,
  result: { id: string; status: string },
) {
  if (refund.providerRefundId && refund.providerRefundId !== result.id)
    throw new CommerceError(409, "Partial refund provider identity mismatch");
  if (refund.status === "succeeded") return false;
  if (
    ["failed", "canceled"].includes(refund.status) &&
    !["succeeded", "failed", "canceled"].includes(result.status)
  )
    return false;
  if (
    !["pending", "requires_action", "succeeded", "failed", "canceled"].includes(
      result.status,
    )
  )
    throw new CommerceError(409, "Unknown partial refund status");
  if (result.status === "succeeded") {
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, refund.orderId));
    const others = await tx
      .select()
      .from(partialRefundsTable)
      .where(eq(partialRefundsTable.orderId, refund.orderId));
    const [full] = await tx
      .select()
      .from(refundsTable)
      .where(eq(refundsTable.orderId, refund.orderId));
    const reserved = others
      .filter(
        (r) => r.id !== refund.id && !["failed", "canceled"].includes(r.status),
      )
      .reduce((n, r) => n + r.amountCents, 0);
    if (
      !payment ||
      refund.amountCents +
        reserved +
        (full && !["failed", "canceled"].includes(full.status)
          ? full.amountCents
          : 0) >
        payment.amountCents
    )
      throw new RefundReconciliationError(
        "Confirmed refund conflicts with the cumulative payment limit",
      );
    await requirePaymentJournal(tx, refund.orderId);
    await postJournal(tx, {
      id: `partial_refund:${refund.id}`,
      orderId: refund.orderId,
      kind: "refund",
      lines: [
        { account: "platform_revenue", amountCents: refund.amountCents },
        { account: "platform_cash", amountCents: -refund.amountCents },
      ],
    });
    await notifyOrder(
      tx,
      refund.orderId,
      `partial_refund:${refund.id}`,
      "Partial refund confirmed (test)",
      "The provider confirmed a platform-funded partial refund. View payment details for the amount.",
    );
  }
  await tx
    .update(partialRefundsTable)
    .set({ providerRefundId: result.id, status: result.status })
    .where(eq(partialRefundsTable.id, refund.id));
  await audit(tx, null, "partial_refund.updated", refund.orderId, {
    refundId: refund.id,
    status: result.status,
    amountCents: refund.amountCents,
    fundingPolicy: refund.fundingPolicy,
  });
  return true;
}
// Called only after the webhook verifies signature, provider payment and order lock.
export async function applyPartialRefundEvent(
  tx: Transaction,
  remote: Stripe.Refund,
  payment: typeof paymentsTable.$inferSelect,
) {
  const operationId = remote.metadata?.operationId;
  let [refund] = await tx
    .select()
    .from(partialRefundsTable)
    .where(eq(partialRefundsTable.providerRefundId, remote.id));
  if (!refund && operationId?.startsWith("partial_refund:")) {
    const [operation] = await tx
      .select()
      .from(financialOperationsTable)
      .where(eq(financialOperationsTable.id, operationId));
    if (
      operation?.kind === "partial_refund" &&
      operation.firstAttemptAt &&
      operation.orderId === payment.orderId
    ) {
      [refund] = await tx
        .select()
        .from(partialRefundsTable)
        .where(eq(partialRefundsTable.id, operation.resourceId));
    }
  }
  if (!refund) return false;
  if (
    refund.orderId !== payment.orderId ||
    remote.amount !== refund.amountCents ||
    remote.currency !== "usd"
  )
    throw new CommerceError(
      409,
      "Partial refund event does not match the saved request",
    );
  if (
    !(await applyPartialRefund(tx, refund, {
      id: remote.id,
      status: remote.status ?? "pending",
    }))
  )
    return true;
  // Fence any in-flight worker: the signed provider event is durable confirmation.
  await tx
    .update(financialOperationsTable)
    .set({
      state:
        remote.status === "succeeded"
          ? "succeeded"
          : ["failed", "canceled"].includes(remote.status ?? "")
            ? "failed"
            : "pending",
      result: { id: remote.id, status: remote.status ?? "pending" },
      leaseToken: null,
      leaseExpiresAt: null,
      completedAt: ["succeeded", "failed", "canceled"].includes(
        remote.status ?? "",
      )
        ? new Date()
        : null,
    })
    .where(eq(financialOperationsTable.id, `partial_refund:${refund.id}`));
  return true;
}
