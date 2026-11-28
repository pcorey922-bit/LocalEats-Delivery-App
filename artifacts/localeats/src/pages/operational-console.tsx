import { type FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { FirebaseOAuthDiagnostic } from "./firebase-oauth";
import { FcmPermissionValidation } from "./fcm-permission";
type Group = { state: string; count: number; oldest?: string | null };
type Health = {
  financial: Group[];
  webhooks: Group[];
  provisioning: Group[];
  pushDeliveries: Group[];
  workers: Array<{
    workerId: string;
    component: string;
    lastSuccessAt: string;
  }>;
  pushConfiguration: {
    android: boolean;
    ios: boolean;
    deliveryEnabled?: boolean;
    androidCredentialStatus?: "missing" | "invalid" | "locally_valid";
  };
  testPayoutsEnabled?: boolean;
  webhookRetentionEnabled?: boolean;
  observedAt: string;
};
type Recovery = {
  id: string;
  state: string;
  attempts: number;
  errorCode: string | null;
  eventType?: string;
  notificationId?: string;
};
function SafetyStatus({
  label,
  enabled,
}: {
  label: string;
  enabled?: boolean;
}) {
  return (
    <article
      className="roco-readiness-card"
      data-state={enabled === false ? "protected" : "attention"}
    >
      <h3>{label}</h3>
      <strong>
        {enabled === false
          ? "Disabled"
          : enabled === true
            ? "Enabled — review required"
            : "Not reported — check required"}
      </strong>
      <p>
        {enabled === false
          ? "This control is closed."
          : "Review the deployed configuration before any protected operation."}
      </p>
    </article>
  );
}

function Retry({ path, done }: { path: string; done: () => void }) {
  const action = useMutation({
    mutationFn: (reason: string) =>
      customFetch(path, { method: "POST", body: JSON.stringify({ reason }) }),
    onSuccess: done,
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    action.mutate(String(new FormData(event.currentTarget).get("reason")));
  };
  return (
    <form onSubmit={submit}>
      <label className="roco-field">
        Recovery reason
        <input
          className="roco-input"
          name="reason"
          required
          minLength={10}
          maxLength={500}
          disabled={action.isPending}
        />
      </label>
      <button className="roco-button" disabled={action.isPending}>
        {action.isPending ? "Requesting retry…" : "Queue audited retry"}
      </button>
      {action.error && <p role="alert">{action.error.message}</p>}
      {action.isSuccess && (
        <p role="status">
          Retry queued. Provider confirmation is still required.
        </p>
      )}
    </form>
  );
}
export function OperationalConsole() {
  const client = useQueryClient();
  const [inboxState, setInboxState] = useState("reconciliation");
  const [pushState, setPushState] = useState("failed");
  const health = useQuery({
    queryKey: ["operational-health"],
    queryFn: () => customFetch<Health>("/api/admin/operational-health"),
    refetchInterval: 15000,
  });
  const inbox = useQuery({
    queryKey: ["webhook-recovery", inboxState],
    queryFn: () =>
      customFetch<Recovery[]>(`/api/admin/webhook-inbox?state=${inboxState}`),
    refetchInterval: 15000,
  });
  const push = useQuery({
    queryKey: ["push-recovery", pushState],
    queryFn: () =>
      customFetch<Recovery[]>(`/api/admin/push-deliveries?state=${pushState}`),
    refetchInterval: 15000,
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["operational-health"] });
    void client.invalidateQueries({ queryKey: ["webhook-recovery"] });
    void client.invalidateQueries({ queryKey: ["push-recovery"] });
  };
  return (
    <section className="roco-card">
      <h2>Service health and recovery</h2>
      <button
        type="button"
        className="roco-button secondary"
        disabled={health.isFetching}
        onClick={() => void health.refetch()}
      >
        Refresh service status
      </button>

      <p>
        Queue status refreshes every 15 seconds. Retries retain the original
        event or device delivery. Review the cause before retrying.
      </p>
      {[health.error, inbox.error, push.error].map((error, index) =>
        error ? (
          <p key={index} role="alert">
            {error.message}
          </p>
        ) : null,
      )}
      {health.isPending && <p role="status">Loading service health…</p>}
      {health.data && (
        <>
          <p className="roco-observed">
            Last updated: {new Date(health.data.observedAt).toLocaleString()}.
            This view reads status only.
          </p>
          <div
            className="roco-readiness-grid"
            aria-label="Protected controls and notification readiness"
          >
            <SafetyStatus
              label="Provider push sending"
              enabled={health.data.pushConfiguration.deliveryEnabled}
            />
            <SafetyStatus
              label="Test payouts"
              enabled={health.data.testPayoutsEnabled}
            />
            <SafetyStatus
              label="Processed checkout payload retention"
              enabled={health.data.webhookRetentionEnabled}
            />
            <article className="roco-readiness-card" data-state="attention">
              <h3>Android push</h3>
              <strong>
                {health.data.pushConfiguration.androidCredentialStatus ===
                "invalid"
                  ? "Credential configuration invalid"
                  : health.data.pushConfiguration.androidCredentialStatus ===
                      "locally_valid"
                    ? "Credentials locally valid; provider delivery unverified"
                    : health.data.pushConfiguration.android
                      ? "Configured; credential validation not reported by deployed backend"
                      : "Configuration required"}
              </strong>
              <p>
                Saved credentials alone do not prove permission to send or
                delivery to a device.
              </p>
            </article>
            <article className="roco-readiness-card" data-state="attention">
              <h3>iOS sandbox push</h3>
              <strong>
                {health.data.pushConfiguration.ios
                  ? "Configured; device delivery unverified"
                  : "Configuration required"}
              </strong>
              <p>
                Physical iOS notification delivery requires separate acceptance.
              </p>
            </article>
          </div>
          <details className="roco-owner-details">
            <summary>Technical work queues and background processing</summary>
            <div style={{ overflowX: "auto" }}>
              <table>
                <caption>Durable work queues</caption>
                <thead>
                  <tr>
                    <th scope="col">Queue</th>
                    <th scope="col">State</th>
                    <th scope="col">Count</th>
                    <th scope="col">Oldest record</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    health.data.financial,
                    health.data.webhooks,
                    health.data.provisioning,
                    health.data.pushDeliveries,
                  ].every((rows) => rows.length === 0) && (
                    <tr>
                      <td colSpan={4}>No queued records reported.</td>
                    </tr>
                  )}
                  {(
                    [
                      ["Finance", health.data.financial],
                      ["Webhooks", health.data.webhooks],
                      ["Connect provisioning", health.data.provisioning],
                      ["Device delivery", health.data.pushDeliveries],
                    ] as const
                  ).flatMap(([name, rows]) =>
                    rows.map((row) => (
                      <tr key={`${name}:${row.state}`}>
                        <th scope="row">{name}</th>
                        <td>{row.state.replaceAll("_", " ")}</td>
                        <td>{row.count}</td>
                        <td>
                          {row.oldest
                            ? new Date(row.oldest).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
            <details>
              <summary>Worker progress</summary>
              {!health.data.workers.length && (
                <p>No worker progress has been recorded.</p>
              )}
              <ul>
                {health.data.workers.map((worker) => (
                  <li key={worker.workerId}>
                    {worker.component}:{" "}
                    {Date.parse(health.data!.observedAt) -
                      Date.parse(worker.lastSuccessAt) <
                    90000
                      ? "recent progress"
                      : "stale; investigate"}{" "}
                    · {new Date(worker.lastSuccessAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </details>
          </details>
        </>
      )}
      <details className="roco-owner-details">
        <summary>Owner-only notification verification</summary>
        <p>
          These checks make external provider requests only after explicit
          confirmation. Opening this section or refreshing status does not
          execute a diagnostic.
        </p>
        <FirebaseOAuthDiagnostic />
        <FcmPermissionValidation />
      </details>
      <details className="roco-owner-details">
        <summary>Payment event recovery (webhooks)</summary>
        <p>
          Review failed payment events here. Retrying is an audited operation,
          not a status check.
        </p>
        <label className="roco-field">
          Event state
          <select
            className="roco-select"
            value={inboxState}
            onChange={(event) => setInboxState(event.target.value)}
          >
            <option value="reconciliation">Reconciliation required</option>
            <option value="dead_letter">Retries exhausted</option>
            <option value="received">Awaiting processing</option>
          </select>
        </label>
        <p>
          Up to 200 matching events. Signed payloads are withheld from this
          view.
        </p>
        {inbox.isPending ? (
          <p role="status">Loading webhook events…</p>
        ) : inbox.data?.length === 0 ? (
          <p>No events match this state.</p>
        ) : (
          inbox.data?.map((event) => (
            <details key={event.id}>
              <summary>
                {event.eventType} · {event.id}
              </summary>
              <p>
                {event.state} · {event.attempts} attempts ·{" "}
                {event.errorCode ?? "No processing error recorded"}
              </p>
              {["reconciliation", "dead_letter"].includes(event.state) && (
                <Retry
                  path={`/api/admin/webhook-inbox/${encodeURIComponent(event.id)}/retry`}
                  done={refresh}
                />
              )}
            </details>
          ))
        )}
      </details>
      <details className="roco-owner-details">
        <summary>Notification delivery recovery</summary>
        <p>
          Review device registration and delivery failures before using the
          existing recovery controls.
        </p>
        <label className="roco-field">
          Delivery state
          <select
            className="roco-select"
            value={pushState}
            onChange={(event) => setPushState(event.target.value)}
          >
            <option value="failed">Retries exhausted</option>
            <option value="pending">Awaiting provider</option>
            <option value="invalid_token">Invalid registration</option>
            <option value="unregistered">Device removed or reassigned</option>
            <option value="provider_accepted">Provider accepted</option>
          </select>
        </label>
        <p>
          Up to 100 matching device deliveries. Provider acceptance does not
          confirm display on the device. Invalid devices must register again.
        </p>
        {push.isPending ? (
          <p role="status">Loading device deliveries…</p>
        ) : push.data?.length === 0 ? (
          <p>No deliveries match this state.</p>
        ) : (
          push.data?.map((event) => (
            <details key={event.id}>
              <summary>
                {event.state.replaceAll("_", " ")} · {event.id}
              </summary>
              <p>
                Notification {event.notificationId} · {event.attempts} attempts
                · {event.errorCode ?? "No processing error recorded"}
              </p>
              {event.state === "failed" && (
                <Retry
                  path={`/api/admin/push-deliveries/${event.id}/retry`}
                  done={refresh}
                />
              )}
            </details>
          ))
        )}
      </details>
    </section>
  );
}
