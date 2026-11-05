import Stripe from "stripe";
import { CommerceError, checkoutOrigin, paymentMode } from "./commerce-policy";

export function stripeTest() {
  if (paymentMode() !== "stripe_test")
    throw new CommerceError(503, "Stripe test integration is not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    maxNetworkRetries: 2,
    timeout: 15000,
  });
}
export function requirePaymentProvider() {
  const mode = paymentMode();
  if (mode === "disabled")
    throw new CommerceError(
      503,
      "Select the sandbox simulator or configure Stripe test credentials",
    );
  return mode;
}
export function requireFreshOperation(createdAt: Date) {
  // Stripe can prune idempotency keys after 24 hours. An unresolved old operation
  // requires reconciliation rather than risking a duplicate external movement.
  if (Date.now() - createdAt.getTime() > 23 * 60 * 60 * 1000)
    throw new CommerceError(
      409,
      "Operation requires provider reconciliation before retry",
    );
}
export async function createTestCheckout(
  order: { id: string; totalCents: number },
  attempt: number,
) {
  const mode = requirePaymentProvider();
  if (mode === "sandbox")
    return { id: `sandbox_checkout_${order.id}_${attempt}`, url: null };
  const session = await stripeTest().checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: order.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: order.totalCents,
            product_data: {
              name: "RoCoEats TEST order (including fees, tax and tip)",
            },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order.id },
      payment_intent_data: {
        metadata: { orderId: order.id },
        transfer_group: order.id,
      },
      success_url: `${checkoutOrigin()}/orders?payment=returned`,
      cancel_url: `${checkoutOrigin()}/orders?payment=cancelled`,
    },
    { idempotencyKey: `checkout:${order.id}:${attempt}` },
  );
  if (session.livemode)
    throw new CommerceError(503, "Live payment response rejected");
  return { id: session.id, url: session.url };
}
export async function refundTestPayment(
  paymentId: string,
  amount: number,
  refundId: string,
) {
  if (requirePaymentProvider() === "sandbox")
    return { id: `sandbox_refund_${refundId}`, status: "succeeded" };
  const refund = await stripeTest().refunds.create(
    { payment_intent: paymentId, amount },
    { idempotencyKey: `refund:${refundId}` },
  );
  return { id: refund.id, status: refund.status ?? "pending" };
}
export async function transferTestEarnings(
  accountId: string,
  amount: number,
  payoutId: string,
  orderId: string,
) {
  if (requirePaymentProvider() === "sandbox")
    return `sandbox_transfer_${payoutId}`;
  const transfer = await stripeTest().transfers.create(
    {
      destination: accountId,
      amount,
      currency: "usd",
      transfer_group: orderId,
      metadata: { orderId, payoutId },
    },
    { idempotencyKey: `transfer:${payoutId}` },
  );
  if (transfer.livemode) throw new CommerceError(503, "Live transfer rejected");
  return transfer.id;
}
export async function reverseTestTransfer(
  transferId: string,
  payoutId: string,
) {
  if (requirePaymentProvider() === "sandbox")
    return `sandbox_reversal_${payoutId}`;
  const reversal = await stripeTest().transfers.createReversal(
    transferId,
    {},
    { idempotencyKey: `reversal:${payoutId}` },
  );
  return reversal.id;
}
