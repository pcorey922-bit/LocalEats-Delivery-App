import assert from "node:assert/strict";
import { test } from "node:test";
import type Stripe from "stripe";
import {
  inspectStripeSetup,
  stripeApiVersion,
  stripeTestEvents,
} from "./stripe-setup";
const url = "https://qa.onrender.com/api/webhooks/stripe";
const endpoint = (change: Record<string, unknown> = {}) =>
  ({
    url,
    livemode: false,
    status: "enabled",
    api_version: stripeApiVersion,
    enabled_events: [...stripeTestEvents],
    ...change,
  }) as Stripe.WebhookEndpoint;
const client = (
  data: Stripe.WebhookEndpoint[],
  livemode = false,
  has_more = false,
) =>
  ({
    balance: { retrieve: async () => ({ livemode }) },
    webhookEndpoints: { list: async () => ({ data, has_more }) },
  }) as unknown as Pick<Stripe, "balance" | "webhookEndpoints">;
test("read-only Stripe setup verifies test mode, exact URL/version and complete events on the same endpoint", async () => {
  for (const events of [[...stripeTestEvents], ["*"]]) {
    const result = await inspectStripeSetup(
      client([endpoint({ enabled_events: events })]),
      url,
    );
    assert.equal(result.testModeConfirmed, true);
    assert.equal(result.endpointConfigurationVerified, true);
    assert.deepEqual(result.missingEvents, []);
  }
  assert.equal(
    (await inspectStripeSetup(client([endpoint({ url: url + "/wrong" })]), url))
      .endpointFound,
    false,
  );
});
test("Stripe setup rejects live responses, disabled endpoints, version mismatch and incomplete subscriptions", async () => {
  const live = await inspectStripeSetup(
    client([endpoint({ livemode: true })], true),
    url,
  );
  assert.equal(live.testModeConfirmed, false);
  assert.equal(live.balanceError, "unexpected_live_response");
  assert.equal(live.endpointConfigurationVerified, false);
  for (const change of [
    { status: "disabled" },
    { api_version: null },
    { enabled_events: ["refund.created"] },
  ])
    assert.equal(
      (await inspectStripeSetup(client([endpoint(change)]), url))
        .endpointConfigurationVerified,
      false,
    );
  const split = await inspectStripeSetup(
    client([
      endpoint({ status: "disabled" }),
      endpoint({ enabled_events: ["refund.created"] }),
    ]),
    url,
  );
  assert.equal(split.endpointConfigurationVerified, false);
  assert.ok(split.missingEvents.includes("checkout.session.completed"));
});
test("Stripe setup reports pagination uncertainty and sanitized provider failures without payloads or keys", async () => {
  const paged = await inspectStripeSetup(client([], false, true), url);
  assert.equal(paged.endpointSearchComplete, false);
  assert.equal(paged.endpointConfigurationVerified, false);
  const broken = {
    balance: {
      retrieve: async () => {
        throw {
          type: "StripeAuthenticationError",
          message: "sk_test_private_provider_payload",
        };
      },
    },
    webhookEndpoints: {
      list: async () => {
        throw { type: "StripePermissionError", message: "private response" };
      },
    },
  } as unknown as Pick<Stripe, "balance" | "webhookEndpoints">;
  const result = await inspectStripeSetup(broken, url);
  assert.equal(result.balanceError, "provider_authentication_failed");
  assert.equal(result.endpointError, "provider_permission_denied");
  assert.equal(JSON.stringify(result).includes("private"), false);
});
