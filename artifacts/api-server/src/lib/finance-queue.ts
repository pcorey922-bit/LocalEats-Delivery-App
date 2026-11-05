import { eq } from "drizzle-orm";
import { financialOperationsTable } from "@workspace/db";
import type { Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";
export type FinanceKind =
  "checkout" | "refund" | "transfer" | "reversal" | "expire_checkout";
export async function enqueueFinancialOperation(
  tx: Transaction,
  input: {
    id: string;
    orderId: string;
    kind: FinanceKind;
    resourceId: string;
    payload: Record<string, unknown>;
  },
) {
  await tx
    .insert(financialOperationsTable)
    .values({ ...input, provider: "stripe_test" })
    .onConflictDoNothing();
  const [operation] = await tx
    .select()
    .from(financialOperationsTable)
    .where(eq(financialOperationsTable.id, input.id))
    .limit(1);
  if (
    !operation ||
    operation.orderId !== input.orderId ||
    operation.kind !== input.kind ||
    JSON.stringify(operation.payload) !== JSON.stringify(input.payload)
  ) {
    // JSONB does not preserve key ordering; compare canonicalized keys.
    const canonical = (value: Record<string, unknown>) =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
        ),
      );
    if (
      !operation ||
      operation.orderId !== input.orderId ||
      operation.kind !== input.kind ||
      canonical(operation.payload) !== canonical(input.payload)
    )
      throw new CommerceError(
        409,
        "Financial operation parameters conflict with a saved request",
      );
  }
  return operation;
}
export async function queueSettlementRecovery(
  tx: Transaction,
  orderId: string,
) {
  const { payoutsTable } = await import("@workspace/db");
  const payouts = await tx
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.orderId, orderId));
  for (const payout of payouts) {
    if (payout.providerTransferId && !payout.providerReversalId) {
      await enqueueFinancialOperation(tx, {
        id: `reversal:${payout.id}`,
        orderId,
        kind: "reversal",
        resourceId: payout.id,
        payload: { transferId: payout.providerTransferId },
      });
      await tx
        .update(payoutsTable)
        .set({ status: "reversal_pending" })
        .where(eq(payoutsTable.id, payout.id));
    } else if (!payout.providerTransferId)
      await tx
        .update(payoutsTable)
        .set({ status: "cancelled" })
        .where(eq(payoutsTable.id, payout.id));
  }
}
