import Stripe from "stripe";

export const stripeTestEvents = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "refund.created",
  "refund.updated",
  "refund.failed",
  "charge.dispute.created",
  "charge.dispute.updated",
  "charge.dispute.closed",
  "charge.dispute.funds_withdrawn",
  "charge.dispute.funds_reinstated",
] as const;
export const stripeApiVersion = Stripe.API_VERSION;
function errorCode(error: unknown) {
  const type = (error as { type?: string })?.type;
  return type === "StripeAuthenticationError"
    ? "provider_authentication_failed"
    : type === "StripePermissionError"
      ? "provider_permission_denied"
      : type === "StripeConnectionError"
        ? "provider_unavailable"
        : "provider_request_failed";
}

// Read-only provider I/O. Never create charges, endpoints, accounts or transfers.
export async function inspectStripeSetup(
  stripe: Pick<Stripe, "balance" | "webhookEndpoints">,
  expectedUrl: string,
) {
  const [balance, endpoints] = await Promise.allSettled([
    stripe.balance.retrieve(),
    stripe.webhookEndpoints.list({ limit: 100 }),
  ]);
  const matches =
    endpoints.status === "fulfilled"
      ? endpoints.value.data.filter((endpoint) => endpoint.url === expectedUrl)
      : [];
  const missing = (endpoint: Stripe.WebhookEndpoint) =>
    stripeTestEvents.filter(
      (event) =>
        !endpoint.enabled_events.includes("*") &&
        !endpoint.enabled_events.includes(event),
    );
  const complete = (endpoint: Stripe.WebhookEndpoint) =>
    !endpoint.livemode &&
    endpoint.status === "enabled" &&
    endpoint.api_version === stripeApiVersion &&
    !missing(endpoint).length;
  const endpoint =
    matches.find(complete) ??
    matches.find((item) => !item.livemode && item.status === "enabled") ??
    matches[0];
  return {
    testModeConfirmed:
      balance.status === "fulfilled" && balance.value.livemode === false,
    balanceError:
      balance.status === "rejected"
        ? errorCode(balance.reason)
        : balance.value.livemode
          ? "unexpected_live_response"
          : null,
    endpointError:
      endpoints.status === "rejected" ? errorCode(endpoints.reason) : null,
    endpointSearchComplete:
      endpoints.status === "fulfilled" && !endpoints.value.has_more,
    endpointFound: Boolean(endpoint),
    endpointEnabled: endpoint?.status === "enabled" && !endpoint.livemode,
    apiVersionMatches: endpoint?.api_version === stripeApiVersion,
    missingEvents: endpoint ? missing(endpoint) : [...stripeTestEvents],
    endpointConfigurationVerified: Boolean(endpoint && complete(endpoint)),
  };
}
