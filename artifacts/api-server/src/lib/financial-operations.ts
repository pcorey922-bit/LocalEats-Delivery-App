import { requireTelephoneAcceptance } from "./telephone-confirmation";
import { databaseNow } from "./database-clock";
import { requireNoFinancialHold } from "./financial-holds";
import { alias } from "drizzle-orm/pg-core";
import { restoreUnacceptedInventory } from "./inventory";
import { expireReservation } from "./reservation-expiry";
import {
  fullRefundAmount,
  applyPartialRefund,
  RefundReconciliationError,
} from "./partial-refunds";
import {
  requirePaymentJournal,
  journalTransfer,
  journalRefund,
  journalReversal,
} from "./ledger";
import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  eq,
  inArray,
  lte,
  or,
  sql,
  notExists,
  exists,
} from "drizzle-orm";
import {
  db,
  guestSessionsTable,
  financialOperationsTable as operations,
  ordersTable,
  paymentsTable,
  payoutsTable,
  refundsTable,
  partialRefundsTable,
  financialHoldsTable,
  connectedAccountsTable,
  restaurantsTable,
  deliveriesTable,
  orderEventsTable,
  profilesTable,
  type Profile,
} from "@workspace/db";
import {
  audit,
  notifyOrder,
  recordPayment,
  type Transaction,
} from "./commerce";
import { CommerceError } from "./commerce-policy";
import {
  enqueueFinancialOperation,
  queueSettlementRecovery,
} from "./finance-queue";
import { checkoutOrigin } from "./commerce-policy";
import { stripeTest, requireTestWebhook } from "./payment-provider";
import { ensureAccepting } from "./restaurant-availability";
export type FinancialOperation = typeof operations.$inferSelect;
export type OperationResult = {
  id?: string;
  status: string;
  url?: string | null;
  paymentId?: string;
  amount?: number;
  currency?: string;
};
const retryWindowMs = 23 * 60 * 60 * 1000;
const leaseMs = 120000;

export async function requestProviderCheckout(orderId: string, actor: Profile) {
  requireTestWebhook();
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .for("update")
      .limit(1);
    if (!order) throw new CommerceError(404, "Order not found");
    if (order.customerProfileId !== actor.id && actor.role !== "admin")
      throw new CommerceError(403, "You cannot access this checkout");
    if (await expireReservation(tx, order))
      return {
        expired: true,
        error: "Reservation expired. Start a new order.",
      };
    if (order.status !== "placed")
      throw new CommerceError(409, "Order cannot enter checkout");
    await requireTelephoneAcceptance(tx, order);
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, orderId))
      .limit(1);
    if (
      !payment ||
      payment.provider !== "stripe_test" ||
      !["pending", "failed"].includes(payment.status)
    )
      throw new CommerceError(409, "Payment is not available");
    const [restaurant] = await tx
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, order.restaurantId))
      .limit(1);
    if (restaurant?.status !== "approved")
      throw new CommerceError(409, "Restaurant is not accepting orders");
    await ensureAccepting(restaurant, tx);
    // Reuse the saved attempt, including an ambiguous provider outcome. A fresh
    // attempt is only allowed after a confirmed failure/expiry of that session.
    let attempt = payment.checkoutAttempt || 1;
    let [existing] = await tx
      .select()
      .from(operations)
      .where(eq(operations.id, `checkout:${orderId}:${attempt}`))
      .limit(1);
    if (
      existing?.state === "succeeded" &&
      existing.result?.status === "expired"
    ) {
      attempt++;
      existing = undefined as unknown as FinancialOperation;
    }
    if (!existing) {
      existing = await enqueueFinancialOperation(tx, {
        id: `checkout:${orderId}:${attempt}`,
        orderId,
        kind: "checkout",
        resourceId: payment.id,
        payload: {
          amount: payment.amountCents,
          currency: "usd",
          origin: checkoutOrigin(),
          attempt,
        },
      });
      await tx
        .update(paymentsTable)
        .set({
          checkoutAttempt: attempt,
          status: "pending",
          checkoutSessionId: null,
        })
        .where(eq(paymentsTable.id, payment.id));
    }
    return {
      mode: "stripe_test",
      testMode: true,
      operationId: existing.id,
      status: existing.state,
      url:
        existing.state === "succeeded" ? (existing.result?.url ?? null) : null,
    };
  });
}
export async function requestProviderTransfer(
  payoutId: string,
  actor: Profile,
) {
  if (actor.role !== "admin")
    throw new CommerceError(403, "Administrator access is required");
  const [initial] = await db
    .select()
    .from(payoutsTable)
    .where(eq(payoutsTable.id, payoutId))
    .limit(1);
  if (!initial?.orderId)
    throw new CommerceError(404, "Order settlement not found");
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, initial.orderId!))
      .for("update")
      .limit(1);
    const [payout] = await tx
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.id, payoutId))
      .limit(1);
    await requireNoFinancialHold(tx, order.id);
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, order.id))
      .limit(1);
    const [refund] = await tx
      .select()
      .from(refundsTable)
      .where(eq(refundsTable.orderId, order.id))
      .limit(1);
    if (
      order.status !== "delivered" ||
      payment?.status !== "succeeded" ||
      payment.provider !== "stripe_test" ||
      refund
    )
      throw new CommerceError(
        409,
        "Settlement is blocked by order/payment/refund state",
      );
    if (payout.providerTransferId) return payout;
    const [account] = await tx
      .select()
      .from(connectedAccountsTable)
      .where(eq(connectedAccountsTable.profileId, payout.recipientProfileId))
      .limit(1);
    if (!account?.ready || account.provider !== "stripe_test")
      throw new CommerceError(409, "Recipient payout onboarding is incomplete");
    const operation = await enqueueFinancialOperation(tx, {
      id: `transfer:${payout.id}`,
      orderId: order.id,
      kind: "transfer",
      resourceId: payout.id,
      payload: {
        amount: payout.amountCents,
        currency: "usd",
        accountId: account.providerAccountId,
      },
    });
    if (["failed", "reconciliation", "cancelled"].includes(operation.state))
      throw new CommerceError(
        409,
        "Settlement operation is held for review; it cannot be blindly resubmitted",
      );
    await tx
      .update(payoutsTable)
      .set({ status: "processing" })
      .where(eq(payoutsTable.id, payout.id));
    await audit(tx, actor.id, "payout.requested", payout.id);
    return { ...payout, status: "processing", operationId: operation.id };
  });
}
export async function enqueueRefund(
  tx: Transaction,
  orderId: string,
  payment: typeof paymentsTable.$inferSelect,
  reason: string,
  actorId: string | null,
) {
  if (!payment.providerPaymentId)
    throw new CommerceError(
      409,
      "Payment requires reconciliation before refund",
    );
  const amount = await fullRefundAmount(tx, orderId, payment.amountCents);
  await tx
    .insert(refundsTable)
    .values({
      id: orderId,
      orderId,
      amountCents: amount,
      reason,
      actorProfileId: actorId,
    })
    .onConflictDoNothing();
  return enqueueFinancialOperation(tx, {
    id: `refund:${orderId}`,
    orderId,
    kind: "refund",
    resourceId: orderId,
    payload: {
      paymentId: payment.providerPaymentId,
      amount,
      currency: "usd",
    },
  });
}
export async function requestProviderCancellation(
  orderId: string,
  actor: Profile,
  reason: string,
) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .for("update")
      .limit(1);
    if (!order) throw new CommerceError(404, "Order not found");
    const [restaurant] = await tx
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, order.restaurantId))
      .limit(1);
    const customer =
      actor.role === "customer" && order.customerProfileId === actor.id;
    const owner =
      actor.role === "restaurant" && restaurant?.ownerProfileId === actor.id;
    if (actor.role !== "admin" && !customer && !owner)
      throw new CommerceError(403, "You cannot cancel this order");
    if (
      customer &&
      !["placed", "restaurant_received", "pending", "cancelled"].includes(
        order.status,
      )
    )
      throw new CommerceError(
        409,
        "Contact support to cancel an accepted order",
      );
    if (owner && ["out_for_delivery", "delivered"].includes(order.status))
      throw new CommerceError(409, "Contact support after pickup");
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, orderId))
      .limit(1);
    if (!payment || payment.provider !== "stripe_test")
      throw new CommerceError(409, "Payment provider mismatch");
    // Stop operational fulfillment immediately. Provider recovery continues in
    // durable jobs; a timeout can no longer roll back a restaurant cancellation.
    if (!["cancelled", "delivered"].includes(order.status)) {
      const restored = await restoreUnacceptedInventory(tx, order);
      if (restored.length)
        await audit(tx, actor.id, "inventory.released", orderId, {
          items: restored,
        });
      await tx
        .update(ordersTable)
        .set({ status: "cancelled" })
        .where(eq(ordersTable.id, orderId));
      await tx
        .update(deliveriesTable)
        .set({ status: "cancelled" })
        .where(eq(deliveriesTable.orderId, orderId));
      await tx.insert(orderEventsTable).values({
        orderId,
        actorProfileId: actor.id,
        fromStatus: order.status,
        toStatus: "cancelled",
        note: reason,
      });
      await notifyOrder(
        tx,
        orderId,
        "cancelled",
        "Order cancelled",
        "Your order was cancelled. Any refund remains pending until the payment provider confirms it.",
      );
    }
    await tx
      .update(operations)
      .set({ state: "cancelled", completedAt: new Date() })
      .where(
        and(
          eq(operations.orderId, orderId),
          inArray(operations.kind, ["checkout", "transfer"]),
          eq(operations.state, "queued"),
          eq(operations.attempts, 0),
        ),
      );
    await tx
      .update(payoutsTable)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(payoutsTable.orderId, orderId),
          eq(payoutsTable.status, "pending"),
        ),
      );
    if (payment.status === "succeeded")
      await enqueueRefund(tx, orderId, payment, reason, actor.id);
    else if (payment.status === "pending")
      await enqueueFinancialOperation(tx, {
        id: `expire:${orderId}`,
        orderId,
        kind: "expire_checkout",
        resourceId: payment.id,
        payload: {},
      });
    await audit(tx, actor.id, "cancellation.requested", orderId, { reason });
    return {
      orderId,
      status: order.status === "delivered" ? "delivered" : "cancelled",
      financialStatus:
        payment.status === "refunded"
          ? "refunded"
          : "pending_provider_confirmation",
      testMode: true,
    };
  });
}

async function claimOperation(): Promise<FinancialOperation | null> {
  const now = await databaseNow();
  const blocked = alias(operations, "blocked_operations");
  const heldRunning = alias(operations, "held_running_operations");
  const candidates = await db
    .select({ orderId: operations.orderId })
    .from(operations)
    .where(
      and(
        inArray(operations.state, ["queued", "processing", "pending"]),
        lte(operations.nextAttemptAt, sql`clock_timestamp()`),
        notExists(
          db
            .select({ id: heldRunning.id })
            .from(heldRunning)
            .where(
              and(
                eq(heldRunning.orderId, operations.orderId),
                eq(heldRunning.state, "processing"),
                inArray(heldRunning.kind, [
                  "transfer",
                  "refund",
                  "partial_refund",
                ]),
                exists(
                  db
                    .select({ id: financialHoldsTable.id })
                    .from(financialHoldsTable)
                    .where(
                      and(
                        eq(financialHoldsTable.orderId, operations.orderId),
                        eq(financialHoldsTable.active, true),
                      ),
                    ),
                ),
              ),
            ),
        ),
        or(
          inArray(operations.kind, ["checkout", "expire_checkout", "reversal"]),
          notExists(
            db
              .select({ id: financialHoldsTable.id })
              .from(financialHoldsTable)
              .where(
                and(
                  eq(financialHoldsTable.orderId, operations.orderId),
                  eq(financialHoldsTable.active, true),
                ),
              ),
          ),
        ),
        notExists(
          db
            .select({ id: blocked.id })
            .from(blocked)
            .where(
              and(
                eq(blocked.orderId, operations.orderId),
                eq(blocked.state, "reconciliation"),
              ),
            ),
        ),
      ),
    )
    .groupBy(operations.orderId)
    .orderBy(sql`min(${operations.createdAt})`)
    .limit(100);
  for (const { orderId } of candidates) {
    const claimed = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update", { skipLocked: true })
        .limit(1);
      if (!order) return null;
      const jobs = await tx
        .select()
        .from(operations)
        .where(eq(operations.orderId, orderId))
        .orderBy(asc(operations.createdAt));
      const [hold] = await tx
        .select()
        .from(financialHoldsTable)
        .where(
          and(
            eq(financialHoldsTable.orderId, orderId),
            eq(financialHoldsTable.active, true),
          ),
        )
        .limit(1);
      const allowed = (j: FinancialOperation) =>
        !hold || !["transfer", "refund", "partial_refund"].includes(j.kind);
      if (jobs.some((j) => j.state === "processing" && !allowed(j)))
        return null;
      if (jobs.some((j) => j.state === "reconciliation")) return null;
      const running = jobs.find((j) => j.state === "processing");
      if (running?.leaseExpiresAt && running.leaseExpiresAt > now) return null;
      const priority = (j: FinancialOperation) =>
        j.firstAttemptAt && j.state === "queued"
          ? -1
          : ({
              expire_checkout: 0,
              refund: 1,
              partial_refund: 1,
              reversal: 2,
              transfer: 3,
              checkout: 4,
            }[j.kind] ?? 5);
      const job =
        (running && allowed(running) ? running : undefined) ??
        jobs
          .filter(
            (j) =>
              allowed(j) &&
              ["queued", "pending"].includes(j.state) &&
              j.nextAttemptAt <= now,
          )
          .sort(
            (a, b) =>
              priority(a) - priority(b) ||
              a.createdAt.getTime() - b.createdAt.getTime(),
          )[0];
      if (!job) return null;
      if (
        job.firstAttemptAt &&
        !(["refund", "partial_refund"].includes(job.kind) && job.result?.id) &&
        now.getTime() - job.firstAttemptAt.getTime() > retryWindowMs
      ) {
        await tx
          .update(operations)
          .set({
            state: "reconciliation",
            errorCode: "IDEMPOTENCY_WINDOW_EXPIRED",
            leaseToken: null,
            leaseExpiresAt: null,
          })
          .where(eq(operations.id, job.id));
        return null;
      }
      if (
        ["transfer", "refund", "partial_refund", "reversal"].includes(job.kind)
      ) {
        try {
          await requirePaymentJournal(tx, orderId);
        } catch (error) {
          if (!(error instanceof CommerceError) || error.status !== 409)
            throw error;
          await tx
            .update(operations)
            .set({
              state: "reconciliation",
              errorCode: "LEDGER_BASELINE_MISSING",
              leaseToken: null,
              leaseExpiresAt: null,
            })
            .where(eq(operations.id, job.id));
          return null;
        }
      }
      // Prevent a queued transfer starting after a refund/cancellation request.
      if (job.kind === "transfer" && !job.firstAttemptAt) {
        const [refund] = await tx
          .select()
          .from(refundsTable)
          .where(eq(refundsTable.orderId, orderId))
          .limit(1);
        const [fullOrder] = await tx
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.id, orderId))
          .limit(1);
        if (refund || fullOrder.status !== "delivered") {
          await tx
            .update(operations)
            .set({ state: "cancelled" })
            .where(eq(operations.id, job.id));
          return null;
        }
      }
      const [updated] = await tx
        .update(operations)
        .set({
          state: "processing",
          attempts: job.attempts + 1,
          firstAttemptAt: job.firstAttemptAt ?? now,
          leaseToken: randomUUID(),
          leaseExpiresAt: new Date(now.getTime() + leaseMs),
          nextAttemptAt: new Date(now.getTime() + leaseMs),
        })
        .where(eq(operations.id, job.id))
        .returning();
      return updated;
    });
    if (claimed) return claimed;
  }
  return null;
}
export async function executeStripeOperation(
  job: FinancialOperation,
): Promise<OperationResult> {
  const stripe = stripeTest();
  const p = job.payload;
  if (job.kind === "checkout") {
    requireTestWebhook();
    const [payment] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, job.orderId))
      .limit(1);
    const [guest]=await db.select({email:guestSessionsTable.email}).from(guestSessionsTable).where(eq(guestSessionsTable.orderId,job.orderId)).limit(1);
    const returnPath=guest ? "/guest/order" : "/orders";
    const session = payment.checkoutSessionId
      ? await stripe.checkout.sessions.retrieve(payment.checkoutSessionId)
      : await stripe.checkout.sessions.create(
          {
            mode: "payment",
            client_reference_id: job.orderId,
            ...(guest ? {customer_email:guest.email} : {}),
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  unit_amount: Number(p.amount),
                  product_data: { name: "RoCoEats order (test payment)" },
                },
                quantity: 1,
              },
            ],
            metadata: { orderId: job.orderId, operationId: job.id },
            payment_intent_data: {
              metadata: { orderId: job.orderId },
              transfer_group: job.orderId,
            },
            success_url: `${p.origin}${returnPath}?payment=returned`,
            cancel_url: `${p.origin}${returnPath}?payment=cancelled`,
          },
          { idempotencyKey: job.id },
        );
    if (session.livemode)
      throw new CommerceError(503, "Live checkout rejected");
    return {
      id: session.id,
      status: session.status ?? "open",
      url: session.url,
    };
  }
  if (job.kind === "transfer") {
    const account = await stripe.accounts.retrieve(String(p.accountId));
    if (
      account.deleted ||
      !account.payouts_enabled ||
      account.capabilities?.transfers !== "active"
    )
      throw new CommerceError(
        409,
        "Recipient account cannot accept settlement",
      );
    const result = await stripe.transfers.create(
      {
        destination: String(p.accountId),
        amount: Number(p.amount),
        currency: "usd",
        transfer_group: job.orderId,
        metadata: {
          orderId: job.orderId,
          payoutId: job.resourceId,
          operationId: job.id,
        },
      },
      { idempotencyKey: job.id },
    );
    if (result.livemode) throw new CommerceError(503, "Live transfer rejected");
    return { id: result.id, status: "succeeded" };
  }
  if (job.kind === "refund" || job.kind === "partial_refund") {
    const result = job.result?.id
      ? await stripe.refunds.retrieve(String(job.result.id))
      : await stripe.refunds.create(
          {
            payment_intent: String(p.paymentId),
            amount: Number(p.amount),
            metadata: { orderId: job.orderId, operationId: job.id },
          },
          { idempotencyKey: job.id },
        );
    if (
      result.payment_intent !== String(p.paymentId) ||
      result.amount !== Number(p.amount) ||
      result.currency !== "usd"
    )
      throw new RefundReconciliationError(
        "Provider refund does not match the committed request",
      );
    return { id: result.id, status: result.status ?? "pending" };
  }
  if (job.kind === "reversal") {
    const result = await stripe.transfers.createReversal(
      String(p.transferId),
      { metadata: { orderId: job.orderId, operationId: job.id } },
      { idempotencyKey: job.id },
    );
    return { id: result.id, status: "succeeded" };
  }
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, job.orderId))
    .limit(1);
  if (!payment.checkoutSessionId) return { status: "expired" };
  let session = await stripe.checkout.sessions.retrieve(
    payment.checkoutSessionId,
  );
  if (session.status === "open") {
    try {
      session = await stripe.checkout.sessions.expire(
        session.id,
        {},
        { idempotencyKey: job.id },
      );
    } catch {
      session = await stripe.checkout.sessions.retrieve(session.id);
      if (session.status === "open")
        throw new Error("CHECKOUT_EXPIRY_UNCONFIRMED");
    }
  }
  if (session.livemode) throw new CommerceError(503, "Live checkout rejected");
  if (
    session.payment_status === "paid" &&
    typeof session.payment_intent === "string"
  )
    return {
      status: "paid",
      paymentId: session.payment_intent,
      amount: session.amount_total ?? -1,
      currency: session.currency ?? "",
    };
  return { status: session.status === "expired" ? "expired" : "pending" };
}
async function applyResult(
  tx: Transaction,
  job: FinancialOperation,
  result: OperationResult,
) {
  const [payment] = await tx
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, job.orderId))
    .limit(1);
  if (job.kind === "checkout") {
    if (!result.id) throw new Error("Provider checkout ID missing");
    await tx
      .update(paymentsTable)
      .set({ checkoutSessionId: result.id })
      .where(eq(paymentsTable.id, payment.id));
  } else if (job.kind === "transfer") {
    if (!result.id) throw new Error("Provider transfer ID missing");
    const [payout] = await tx
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.id, job.resourceId))
      .limit(1);
    await journalTransfer(tx, payout);
    await tx
      .update(payoutsTable)
      .set({
        status: "paid",
        providerTransferId: result.id,
        paidAt: new Date(),
      })
      .where(eq(payoutsTable.id, job.resourceId));
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, job.orderId))
      .limit(1);
    const [refund] = await tx
      .select()
      .from(refundsTable)
      .where(eq(refundsTable.orderId, job.orderId))
      .limit(1);
    if (order.status === "cancelled" || refund)
      await queueSettlementRecovery(tx, job.orderId);
  } else if (job.kind === "partial_refund") {
    if (!result.id) throw new Error("Provider partial refund ID missing");
    const [refund] = await tx
      .select()
      .from(partialRefundsTable)
      .where(eq(partialRefundsTable.id, job.resourceId));
    if (
      !refund ||
      refund.orderId !== job.orderId ||
      refund.amountCents !== Number(job.payload.amount)
    )
      throw new CommerceError(409, "Partial refund operation mismatch");
    await applyPartialRefund(tx, refund, {
      id: result.id,
      status: result.status,
    });
  } else if (job.kind === "refund") {
    if (!result.id) throw new Error("Provider refund ID missing");
    await tx
      .update(refundsTable)
      .set({ providerRefundId: result.id, status: result.status })
      .where(eq(refundsTable.orderId, job.orderId));
    if (result.status === "succeeded") {
      await journalRefund(tx, job.orderId, payment.amountCents);
      await tx
        .update(paymentsTable)
        .set({ status: "refunded" })
        .where(eq(paymentsTable.id, payment.id));
      await queueSettlementRecovery(tx, job.orderId);
      await notifyOrder(
        tx,
        job.orderId,
        "refund.succeeded",
        "Refund confirmed",
        "The payment provider confirmed your refund.",
      );
    }
  } else if (job.kind === "reversal") {
    if (!result.id) throw new Error("Provider reversal ID missing");
    const [payout] = await tx
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.id, job.resourceId))
      .limit(1);
    await journalReversal(tx, payout);
    await tx
      .update(payoutsTable)
      .set({ status: "reversed", providerReversalId: result.id })
      .where(eq(payoutsTable.id, job.resourceId));
  } else if (result.status === "paid") {
    await recordPayment(
      tx,
      job.orderId,
      result.paymentId!,
      result.amount!,
      result.currency!,
    );
  } else if (result.status === "expired")
    await tx
      .update(paymentsTable)
      .set({ status: "failed" })
      .where(
        and(
          eq(paymentsTable.id, payment.id),
          eq(paymentsTable.status, "pending"),
        ),
      );
  await audit(tx, null, `finance.${job.kind}.${result.status}`, job.id, {
    providerId: result.id ?? null,
  });
}
export async function processFinancialOperation(
  execute: (
    job: FinancialOperation,
  ) => Promise<OperationResult> = executeStripeOperation,
) {
  const job = await claimOperation();
  if (!job) return false;
  try {
    // No database transaction or row lock is held during provider network I/O.
    const result = await execute(job);
    await db.transaction(async (tx) => {
      await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, job.orderId))
        .for("update");
      const [current] = await tx
        .select()
        .from(operations)
        .where(eq(operations.id, job.id))
        .limit(1);
      if (
        current.leaseToken !== job.leaseToken ||
        current.state !== "processing"
      )
        return;
      await applyResult(tx, current, result);
      const pending = ["pending", "requires_action"].includes(result.status);
      const failed = ["failed", "canceled"].includes(result.status);
      await tx
        .update(operations)
        .set({
          state: pending ? "pending" : failed ? "failed" : "succeeded",
          result: { ...result },
          errorCode: failed ? "PROVIDER_REJECTED" : null,
          leaseToken: null,
          leaseExpiresAt: null,
          nextAttemptAt: new Date((await databaseNow(tx)).getTime() + 30000),
          completedAt: pending ? null : new Date(),
        })
        .where(eq(operations.id, job.id));
    });
  } catch (error) {
    const code =
      error instanceof CommerceError
        ? "CONFIGURATION_OR_STATE_ERROR"
        : (error as { type?: string })?.type;
    const needsReconciliation =
      (error as { requiresReconciliation?: boolean })
        ?.requiresReconciliation === true ||
      code === "StripeIdempotencyError" ||
      (error as { statusCode?: number })?.statusCode === 500;
    await db
      .update(operations)
      .set({
        state: needsReconciliation ? "reconciliation" : "queued",
        errorCode: needsReconciliation
          ? "PROVIDER_OUTCOME_UNKNOWN"
          : code === "CONFIGURATION_OR_STATE_ERROR"
            ? code
            : "PROVIDER_TEMPORARILY_UNAVAILABLE",
        leaseToken: null,
        leaseExpiresAt: null,
        nextAttemptAt: new Date(
          (await databaseNow()).getTime() +
            Math.min(3600000, 1000 * 2 ** Math.min(job.attempts, 12)),
        ),
      })
      .where(
        and(
          eq(operations.id, job.id),
          eq(operations.leaseToken, job.leaseToken!),
        ),
      );
  }
  return true;
}

// Reconciliation only reads provider objects. It never creates a replacement
// transfer/refund or resets an expired idempotency key on an unknown outcome.
async function readFinancialReceipt(
  job: FinancialOperation,
): Promise<OperationResult | undefined> {
  const stripe = stripeTest();
  let result: OperationResult | undefined;
  if (job.kind === "transfer") {
    const matches = [];
    for await (const transfer of stripe.transfers.list({
      transfer_group: job.orderId,
      limit: 100,
    })) {
      if (transfer.metadata?.operationId === job.id) {
        if (
          transfer.livemode ||
          transfer.amount !== Number(job.payload.amount) ||
          transfer.currency !== "usd" ||
          transfer.destination !== job.payload.accountId
        )
          throw new CommerceError(
            409,
            "Provider transfer fields do not match the saved request",
          );
        matches.push(transfer);
        if (matches.length > 1) break;
      }
    }
    if (matches.length === 1)
      result = { id: matches[0].id, status: "succeeded" };
  } else if (job.kind === "refund" || job.kind === "partial_refund") {
    const matches = [];
    for await (const refund of stripe.refunds.list({
      payment_intent: String(job.payload.paymentId),
      limit: 100,
    })) {
      if (refund.metadata?.operationId === job.id) {
        if (
          refund.amount !== Number(job.payload.amount) ||
          refund.currency !== "usd"
        )
          throw new CommerceError(
            409,
            "Provider refund amount does not match the saved request",
          );
        matches.push(refund);
        if (matches.length > 1) break;
      }
    }
    if (matches.length === 1)
      result = { id: matches[0].id, status: matches[0].status ?? "pending" };
  } else if (job.kind === "reversal") {
    const matches = [];
    for await (const reversal of stripe.transfers.listReversals(
      String(job.payload.transferId),
      { limit: 100 },
    ))
      if (reversal.metadata?.operationId === job.id) matches.push(reversal);
    if (matches.length === 1)
      result = { id: matches[0].id, status: "succeeded" };
  } else if (job.kind === "checkout") {
    // Bounded search: absence is not proof that the provider did nothing.
    let seen = 0;
    for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
      if (++seen > 1000) break;
      if (session.metadata?.operationId === job.id) {
        if (
          session.livemode ||
          session.amount_total !== Number(job.payload.amount) ||
          session.client_reference_id !== job.orderId
        )
          throw new CommerceError(
            409,
            "Provider checkout does not match the saved request",
          );
        result = {
          id: session.id,
          status: session.status ?? "open",
          url: session.url,
        };
        break;
      }
    }
  }
  return result;
}
export async function reconcileFinancialOperation(
  id: string,
  actor: Profile,
  read: (
    job: FinancialOperation,
  ) => Promise<OperationResult | undefined> = readFinancialReceipt,
) {
  if (actor.role !== "admin")
    throw new CommerceError(403, "Administrator access is required");
  const [job] = await db
    .select()
    .from(operations)
    .where(eq(operations.id, id))
    .limit(1);
  if (!job) throw new CommerceError(404, "Financial operation not found");
  const eligible = async (
    executor: Pick<typeof db, "select" | "execute">,
    candidate: FinancialOperation,
  ) => {
    if (["reconciliation", "failed"].includes(candidate.state)) return true;
    if (!["pending", "processing"].includes(candidate.state)) return false;
    const [hold] = await executor
      .select()
      .from(financialHoldsTable)
      .where(
        and(
          eq(financialHoldsTable.orderId, candidate.orderId),
          eq(financialHoldsTable.active, true),
        ),
      )
      .limit(1);
    return (
      !!hold &&
      (!candidate.leaseExpiresAt ||
        candidate.leaseExpiresAt <= (await databaseNow(executor)))
    );
  };
  if (!(await eligible(db, job)))
    throw new CommerceError(
      409,
      "Only held or expired disputed operations may be reconciled",
    );
  const result = await read(job);
  if (!result)
    throw new CommerceError(
      409,
      "No unique matching provider object found. Keep this operation held and inspect provider request logs.",
    );
  const receipt = result;
  return db.transaction(async (tx) => {
    await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, job.orderId))
      .for("update");
    const [current] = await tx
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .limit(1);
    if (
      current.state !== job.state ||
      current.attempts !== job.attempts ||
      current.leaseToken !== job.leaseToken ||
      !(await eligible(tx, current))
    )
      throw new CommerceError(
        409,
        "Operation state changed during reconciliation",
      );
    await applyResult(tx, current, receipt);
    const [updated] = await tx
      .update(operations)
      .set({
        state:
          receipt.status === "pending"
            ? "pending"
            : receipt.status === "failed"
              ? "failed"
              : "succeeded",
        result: { ...receipt },
        errorCode: null,
        leaseToken: null,
        leaseExpiresAt: null,
        completedAt: receipt.status === "pending" ? null : new Date(),
        nextAttemptAt: new Date((await databaseNow(tx)).getTime() + 30000),
      })
      .where(eq(operations.id, id))
      .returning();
    await audit(tx, actor.id, "finance.reconciled", id, {
      providerId: receipt.id ?? null,
    });
    return updated;
  });
}
