import { z } from "zod";
export class CommerceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
// This server-only gate authorizes new ordering requests; it does not enable live money.
export function orderingEnabled() {
  return process.env.ROCOEATS_ORDERING_ENABLED === "true";
}
export function requireOrderingEnabled() {
  if (!orderingEnabled())
    throw new CommerceError(
      503,
      "RoCoEats ordering is not open yet. You can still browse and manage your account.",
    );
}
export const pricingSchema = z
  .object({
    deliveryFeeCents: z.number().int().min(0).max(10000),
    serviceFeeBps: z.number().int().min(0).max(3000),
    taxBps: z.number().int().min(0).max(3000),
    taxDeliveryAndService: z.boolean(),
    restaurantCommissionBps: z.number().int().min(0).max(3000),
    driverShareBps: z.number().int().min(0).max(10000),
    allowedPostalCodes: z
      .array(z.string().regex(/^\d{5}$/))
      .min(1)
      .max(100),
    testMode: z.literal(true),
  })
  .strict();
export type Pricing = z.infer<typeof pricingSchema>;
export function calculatePrice(
  subtotalCents: number,
  tipCents: number,
  pricing: Pricing,
) {
  pricingSchema.parse(pricing);
  if (
    !Number.isSafeInteger(subtotalCents) ||
    subtotalCents < 1 ||
    subtotalCents > 1000000 ||
    !Number.isSafeInteger(tipCents) ||
    tipCents < 0 ||
    tipCents > 100000
  )
    throw new CommerceError(400, "Invalid subtotal or tip");
  const deliveryFeeCents = pricing.deliveryFeeCents;
  const serviceFeeCents = Math.round(
    (subtotalCents * pricing.serviceFeeBps) / 10000,
  );
  const taxBase =
    subtotalCents +
    (pricing.taxDeliveryAndService ? deliveryFeeCents + serviceFeeCents : 0);
  const taxCents = Math.round((taxBase * pricing.taxBps) / 10000);
  return {
    subtotalCents,
    deliveryFeeCents,
    serviceFeeCents,
    taxCents,
    tipCents,
    totalCents:
      subtotalCents + deliveryFeeCents + serviceFeeCents + taxCents + tipCents,
  };
}
export function allocateEarnings(order: {
  subtotalCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  pricingSnapshot: {
    restaurantCommissionBps: number;
    driverShareBps: number;
  } | null;
}) {
  if (!order.pricingSnapshot)
    throw new CommerceError(
      409,
      "Legacy order has no settlement pricing snapshot",
    );
  const restaurantCents =
    order.subtotalCents -
    Math.round(
      (order.subtotalCents * order.pricingSnapshot.restaurantCommissionBps) /
        10000,
    );
  const driverCents =
    Math.round(
      (order.deliveryFeeCents * order.pricingSnapshot.driverShareBps) / 10000,
    ) + order.tipCents;
  return { restaurantCents, driverCents };
}
export function paymentMode(
  env = process.env,
): "sandbox" | "stripe_test" | "disabled" {
  if (
    env.STRIPE_SECRET_KEY &&
    !/^sk_test_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY)
  )
    throw new CommerceError(
      503,
      "Only Stripe test secret keys are permitted. Live charges are disabled.",
    );
  if (env.PAYMENT_PROVIDER === "stripe_test") {
    if (!env.STRIPE_SECRET_KEY)
      throw new CommerceError(503, "Stripe test credentials are required");
    return "stripe_test";
  }
  if (env.PAYMENT_PROVIDER === "sandbox") {
    if (env.NODE_ENV !== "test")
      throw new CommerceError(
        503,
        "The local payment simulator is restricted to automated tests",
      );
    return "sandbox";
  }
  return "disabled";
}
export function checkoutOrigin() {
  const url = new URL(process.env.PUBLIC_APP_URL || "http://localhost:5173");
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        url.hostname === "localhost" &&
        url.protocol === "http:"
      ))
  )
    throw new CommerceError(
      503,
      "Configure PUBLIC_APP_URL as a trusted HTTPS origin",
    );
  return url.origin;
}
