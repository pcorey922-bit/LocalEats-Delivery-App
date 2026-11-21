import { testPricing } from "./testing/pricing";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocateEarnings,
  calculatePrice,
  orderingEnabled,
  paymentMode,
  privateTestOrderingEnabled,
  testPayoutsEnabled,
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


test("payout admission defaults off and is independent of order intake; only explicit private TEST or local simulation is allowed", () => {
  const env={ROCOEATS_TEST_PAYOUTS_ENABLED:'true',ROCOEATS_PRIVATE_STAGING:'true',PAYMENT_PROVIDER:'stripe_test',STRIPE_SECRET_KEY:'sk_test_fixture',NODE_ENV:'production'};
  assert.equal(testPayoutsEnabled(env),true);
  for(const patch of [{ROCOEATS_TEST_PAYOUTS_ENABLED:undefined},{ROCOEATS_TEST_PAYOUTS_ENABLED:'false'},{ROCOEATS_TEST_PAYOUTS_ENABLED:'TRUE'},{ROCOEATS_PRIVATE_STAGING:undefined},{PAYMENT_PROVIDER:'sandbox'},{STRIPE_SECRET_KEY:'sk_live_fixture'},{STRIPE_SECRET_KEY:undefined}]) assert.equal(testPayoutsEnabled({...env,...patch}),false);
  for(const ordering of ['true','false',undefined]) assert.equal(testPayoutsEnabled({...env,ROCOEATS_TEST_PAYOUTS_ENABLED:undefined,ROCOEATS_ORDERING_ENABLED:ordering}),false);
  assert.equal(testPayoutsEnabled({NODE_ENV:'test',PAYMENT_PROVIDER:'sandbox',ROCOEATS_TEST_PAYOUTS_ENABLED:'true'}),true);
  assert.equal(testPayoutsEnabled({NODE_ENV:'test',PAYMENT_PROVIDER:'sandbox'}),false);
});
