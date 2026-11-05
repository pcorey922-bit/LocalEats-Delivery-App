import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import type Stripe from "stripe";
import {
  db,
  ordersTable,
  paymentsTable,
  providerEventsTable,
  refundsTable,
} from "@workspace/db";
import { audit, notifyOrder, recordPayment } from "../lib/commerce";
import { CommerceError } from "../lib/commerce-policy";
import { stripeTest } from "../lib/payment-provider";

export async function processStripeEvent(event: Stripe.Event) {
  if (event.livemode)
    throw new CommerceError(400, "Live webhook events are rejected");
  await db.transaction(async (tx) => {
    const [received] = await tx
      .insert(providerEventsTable)
      .values({ id: event.id, eventType: event.type })
      .onConflictDoNothing()
      .returning();
    if (!received) return;
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") return;
      const orderId = session.metadata?.orderId;
      if (!orderId || typeof session.payment_intent !== "string")
        throw new CommerceError(400, "Missing checkout payment metadata");
      await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update");
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, orderId))
        .limit(1);
      if (
        payment?.checkoutSessionId !== session.id ||
        payment.provider !== "stripe_test" ||
        session.client_reference_id !== orderId
      )
        throw new CommerceError(
          409,
          "Checkout session does not match the saved order",
        );
      await recordPayment(
        tx,
        orderId,
        session.payment_intent,
        session.amount_total ?? -1,
        session.currency ?? "",
      );
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId)
        throw new CommerceError(400, "Missing checkout order metadata");
      await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update");
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, orderId))
        .limit(1);
      if (
        payment?.provider !== "stripe_test" ||
        payment.checkoutSessionId !== session.id
      )
        throw new CommerceError(
          409,
          "Failed payment session does not match order",
        );
      if (payment.status === "pending") {
        await tx
          .update(paymentsTable)
          .set({ status: "failed" })
          .where(eq(paymentsTable.id, payment.id));
        await notifyOrder(
          tx,
          orderId,
          "payment.failed",
          "Test payment failed",
          "Retry test checkout or cancel the unpaid order.",
        );
      }
    } else if (
      event.type === "refund.updated" ||
      event.type === "refund.created" ||
      event.type === "refund.failed"
    ) {
      const remote = event.data.object as Stripe.Refund;
      if (typeof remote.payment_intent !== "string") return;
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.providerPaymentId, remote.payment_intent))
        .limit(1);
      if (!payment || payment.provider !== "stripe_test") return;
      await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, payment.orderId))
        .for("update");
      const [refund] = await tx
        .select()
        .from(refundsTable)
        .where(eq(refundsTable.orderId, payment.orderId))
        .limit(1);
      if (
        !refund ||
        refund.providerRefundId !== remote.id ||
        remote.amount !== payment.amountCents ||
        remote.currency !== "usd"
      ) {
        await audit(
          tx,
          null,
          "refund.external_reconciliation_required",
          payment.orderId,
          { providerRefundId: remote.id },
        );
        throw new CommerceError(
          409,
          "Refund requires reconciliation with the saved full-refund request",
        );
      }
      // Ignore stale pending/failed events after a confirmed full refund.
      if (refund.status === "succeeded") return;
      await tx
        .update(refundsTable)
        .set({ status: remote.status ?? "pending" })
        .where(eq(refundsTable.id, refund.id));
      if (remote.status === "succeeded") {
        await tx
          .update(paymentsTable)
          .set({ status: "refunded" })
          .where(eq(paymentsTable.id, payment.id));
        await notifyOrder(
          tx,
          payment.orderId,
          "refund.succeeded",
          "Test refund confirmed",
          "The full test payment refund was confirmed by the provider.",
        );
      }
    }
  });
}
export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret?.startsWith("whsec_"))
    throw new CommerceError(503, "Configure a test webhook signing secret");
  if (typeof signature !== "string" || !Buffer.isBuffer(req.body))
    throw new CommerceError(400, "A signed raw webhook body is required");
  let event: Stripe.Event;
  try {
    event = stripeTest().webhooks.constructEvent(req.body, signature, secret);
  } catch {
    throw new CommerceError(400, "Invalid webhook signature");
  }
  await processStripeEvent(event);
  res.json({ received: true });
}
