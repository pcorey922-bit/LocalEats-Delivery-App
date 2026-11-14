import { type FormEvent, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
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
  pushConfiguration: { android: boolean; ios: boolean };
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
          <p>
            Observed {new Date(health.data.observedAt).toLocaleString()}.
            Android push:{" "}
            {health.data.pushConfiguration.android
              ? "configured"
              : "configuration required"}
            ; iOS sandbox push:{" "}
            {health.data.pushConfiguration.ios
              ? "configured"
              : "configuration required"}
            .
          </p>
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
        </>
      )}
      <h3>Webhook recovery</h3>
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
        Up to 200 matching events. Signed payloads are withheld from this view.
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
      <h3>Device delivery recovery</h3>
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
              Notification {event.notificationId} · {event.attempts} attempts ·{" "}
              {event.errorCode ?? "No processing error recorded"}
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
    </section>
  );
}
