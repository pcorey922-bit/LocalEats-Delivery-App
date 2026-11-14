import { testPricing } from "./testing/pricing";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocateEarnings,
  calculatePrice,
  orderingEnabled,
  paymentMode,
  privateTestOrderingEnabled,
} from "./commerce-policy";
test("fees, tax, and tip use integer cents and immutable allocation inputs", () => {
  const price = calculatePrice(1999, 300, {
    ...testPricing,
    taxBps: 925,
    taxDeliveryAndService: true,
  });
  assert.deepEqual(price, {
    subtotalCents: 1999,
    deliveryFeeCents: 499,
    serviceFeeCents: 100,
    taxCents: 240,
    tipCents: 300,
    totalCents: 3138,
  });
  assert.deepEqual(
    allocateEarnings({ ...price, pricingSnapshot: testPricing }),
    { restaurantCents: 1799, driverCents: 699 },
  );
});
test("invalid, unsafe, and excessive amounts are rejected", () => {
  for (const cents of [-1, 0, 1.25, NaN, Number.MAX_SAFE_INTEGER])
    assert.throws(() => calculatePrice(cents, 0, testPricing));
  assert.throws(() => calculatePrice(100, -1, testPricing));
});
test("live and restricted secret keys cannot activate charges", () => {
  for (const key of ["sk_live_secret", "rk_live_secret", "rk_test_secret"])
    assert.throws(() =>
      paymentMode({ PAYMENT_PROVIDER: "stripe_test", STRIPE_SECRET_KEY: key }),
    );
  assert.throws(() =>
    paymentMode({ PAYMENT_PROVIDER: "sandbox", NODE_ENV: "production" }),
  );
  assert.throws(() => paymentMode({ PAYMENT_PROVIDER: "stripe_test" }));
  assert.equal(paymentMode({}), "disabled");
  assert.equal(
    paymentMode({ PAYMENT_PROVIDER: "sandbox", NODE_ENV: "test" }),
    "sandbox",
  );
});

test("private test ordering fails closed unless public ordering is explicitly off and Stripe TEST is configured", () => {
  const env = {
    ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED: "true",
    ROCOEATS_PRIVATE_STAGING: "true",
    ROCOEATS_ORDERING_ENABLED: "false",
    PAYMENT_PROVIDER: "stripe_test",
    STRIPE_SECRET_KEY: "sk_test_fixture",
    STRIPE_WEBHOOK_SECRET: "whsec_fixture",
  };
  assert.equal(privateTestOrderingEnabled(env), true);
  assert.equal(orderingEnabled(env), true);
  for (const patch of [
    { ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED: undefined },
    { ROCOEATS_PRIVATE_STAGING: "false" },
    { ROCOEATS_ORDERING_ENABLED: undefined },
    { ROCOEATS_ORDERING_ENABLED: "true" },
    { PAYMENT_PROVIDER: "sandbox" },
    { STRIPE_SECRET_KEY: "sk_live_fixture" },
    { STRIPE_WEBHOOK_SECRET: undefined },
  ]) {
    assert.equal(privateTestOrderingEnabled({ ...env, ...patch }), false);
    assert.equal(orderingEnabled({ ...env, ...patch }), false);
  }
  assert.equal(orderingEnabled({ ROCOEATS_ORDERING_ENABLED: "true" }), true);
});
