import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Setup = {
  pricingReady: boolean;
  testProviderConfigured: boolean;
  expectedWebhookUrl: string | null;
  apiVersion: string;
  requiredEvents: string[];
  webhookSecretPresent: boolean;
  lastAcceptedSignedEventAt: string | null;
  latestSignedEvent?: {
    id: string;
    type: string;
    state: string;
    processedAt: string | null;
  } | null;
  orderingEnabled: boolean;
  provider?: {
    testModeConfirmed: boolean;
    balanceError: string | null;
    endpointError: string | null;
    endpointFound: boolean;
    endpointEnabled: boolean;
    apiVersionMatches: boolean;
    missingEvents: string[];
    endpointConfigurationVerified: boolean;
    endpointSearchComplete: boolean;
  };
};
export function PaymentSetupChecks() {
  const client = useQueryClient();
  const state = useQuery({
    queryKey: ["payment-setup"],
    queryFn: () => customFetch<Setup>("/api/admin/payment-setup"),
    retry: false,
  });
  const check = useMutation({
    mutationFn: () =>
      customFetch<Setup>("/api/admin/payment-setup/verify", {
        method: "POST",
        body: "{}",
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["payment-setup"] }),
  });
  const current = state.data;
  return (
    <section className="roco-card">
      <h2>Stripe TEST setup</h2>
      <p>
        This check reads Stripe configuration. It does not charge money or
        enable ordering. Enter keys only in Render’s protected Environment
        settings.
      </p>
      {state.isLoading && <p role="status">Checking local configuration…</p>}
      {state.isError && (
        <p role="alert">
          Setup could not be loaded.{" "}
          <button onClick={() => void state.refetch()}>Retry</button>
        </p>
      )}
      {current && (
        <>
          <dl>
            {[
              ["Pricing saved", current.pricingReady],
              ["Stripe TEST key configured", current.testProviderConfigured],
              ["Webhook signing secret present", current.webhookSecretPresent],
              ["Ordering gate enabled", current.orderingEnabled],
            ].map(([label, value]) => (
              <div className="roco-row" key={String(label)}>
                <dt>{label}</dt>
                <dd>{value ? "Yes" : "No"}</dd>
              </div>
            ))}
          </dl>
          <p>
            Webhook destination:{" "}
            <code style={{ overflowWrap: "anywhere" }}>
              {current.expectedWebhookUrl ??
                "Configure PUBLIC_APP_URL as HTTPS"}
            </code>
          </p>
          <p>
            Snapshot event API version: <code>{current.apiVersion}</code>
          </p>
          <details>
            <summary>Required Stripe event subscriptions</summary>
            <ul>
              {current.requiredEvents.map((event) => (
                <li key={event}>
                  <code>{event}</code>
                </li>
              ))}
            </ul>
          </details>
          <p>
            In your Stripe sandbox, use Workbench → Webhooks → Add destination →
            Your account → Webhook endpoint. Copy that endpoint’s signing secret
            to Render as STRIPE_WEBHOOK_SECRET, then redeploy. Save reviewed
            test pricing below. A Stripe publishable key is not needed for
            hosted Checkout.
          </p>
          <p>
            Last accepted signed event:{" "}
            {current.lastAcceptedSignedEventAt
              ? new Date(current.lastAcceptedSignedEventAt).toLocaleString()
              : "None yet"}
            . Historical receipt does not verify a newly changed signing secret.
          </p>
          {current.latestSignedEvent && (
            <p>
              Latest event <code>{current.latestSignedEvent.id}</code>{" "}
              (<code>{current.latestSignedEvent.type}</code>) ·{" "}
              {current.latestSignedEvent.state}
              {current.latestSignedEvent.processedAt &&
                ` at ${new Date(current.latestSignedEvent.processedAt).toLocaleString()}`}
              . Match this event ID in Stripe and verify the payment on the
              corresponding order.
            </p>
          )}
          <button
            className="roco-button"
            onClick={() => void state.refetch()}
            disabled={state.isFetching}
          >
            {state.isFetching ? "Refreshing setup…" : "Refresh setup status"}
          </button>
          <button
            className="roco-button"
            onClick={() => check.mutate()}
            disabled={
              check.isPending ||
              !current.testProviderConfigured ||
              !current.expectedWebhookUrl
            }
          >
            {check.isPending
              ? "Checking Stripe…"
              : "Verify Stripe TEST connection"}
          </button>
        </>
      )}
      {check.isError && <p role="alert">{check.error.message}</p>}
      {check.data?.provider && (
        <div role="status">
          <p>
            Stripe confirmed TEST mode:{" "}
            {check.data.provider.testModeConfirmed ? "Yes" : "No"}
          </p>
          <p>
            Enabled endpoint, API version and events verified:{" "}
            {check.data.provider.endpointConfigurationVerified ? "Yes" : "No"}
          </p>
          {check.data.provider.balanceError && (
            <p>{check.data.provider.balanceError}</p>
          )}
          {check.data.provider.endpointError && (
            <p>{check.data.provider.endpointError}</p>
          )}
          {!check.data.provider.endpointSearchComplete &&
            !check.data.provider.endpointFound && (
              <p>
                The endpoint search was incomplete. Review destinations in
                Stripe.
              </p>
            )}
          {!!check.data.provider.missingEvents.length && (
            <p>
              Missing subscriptions:{" "}
              {check.data.provider.missingEvents.join(", ")}
            </p>
          )}
          <p>
            These are configuration checks, not payment or webhook-delivery
            certification. Complete a real sandbox checkout and verify its
            signed payment event before marking the payment workflow verified.
          </p>
        </div>
      )}
    </section>
  );
}
