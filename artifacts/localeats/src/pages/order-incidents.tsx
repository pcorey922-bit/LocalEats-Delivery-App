import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { SupportDesk } from "./support-desk";
type Policy = {
  reservationMinutes: number;
  restaurantResponseMinutes: number;
  driverAssignmentMinutes: number;
  driverPickupMinutes: number;
};
type Incident = {
  id: string;
  orderId: string;
  kind: string;
  status: string;
  version: number;
  note: string | null;
  openedAt: string;
};
function IncidentCard({
  incident,
  orderStatus,
}: {
  incident: Incident;
  orderStatus: string;
}) {
  const [note, setNote] = useState("");
  const client = useQueryClient();
  const ack = useMutation({
    mutationFn: () =>
      customFetch(`/api/admin/order-incidents/${incident.id}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ version: incident.version, note }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["order-incidents"] });
      setNote("");
    },
  });
  return (
    <article className="roco-card">
      <h3>{incident.kind.replaceAll("_", " ")}</h3>
      <p>
        Order {incident.orderId} · {orderStatus.replaceAll("_", " ")} ·{" "}
        {incident.status}
      </p>
      <p>Opened {new Date(incident.openedAt).toLocaleString()}</p>
      {incident.note && <p>{incident.note}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ack.mutate();
        }}
      >
        <label className="roco-field">
          Operator recovery plan
          <input
            className="roco-input"
            value={note}
            required
            minLength={10}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button
          className="roco-button"
          disabled={ack.isPending || note.trim().length < 10}
        >
          Acknowledge incident
        </button>
      </form>
      {ack.error && <p role="alert">{ack.error.message}</p>}
      <SupportDesk orderId={incident.orderId} />
    </article>
  );
}
export function OrderIncidentConsole() {
  const client = useQueryClient(),
    [reason, setReason] = useState("");
  const policy = useQuery({
    queryKey: ["order-timing"],
    queryFn: () => customFetch<Policy>("/api/admin/order-timing"),
  });
  const incidents = useQuery({
    queryKey: ["order-incidents"],
    queryFn: () =>
      customFetch<{ incident: Incident; orderStatus: string }[]>(
        "/api/admin/order-incidents",
      ),
    refetchInterval: 10000,
  });
  const save = useMutation({
    mutationFn: (value: Policy) =>
      customFetch("/api/admin/order-timing", {
        method: "PUT",
        body: JSON.stringify({ policy: value, reason }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["order-timing"] });
      setReason("");
    },
  });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    save.mutate(
      Object.fromEntries(
        Object.keys(policy.data!).map((k) => [k, Number(f.get(k))]),
      ) as Policy,
    );
  };
  return (
    <section aria-label="Order timeout recovery">
      <h2>Order timeout recovery</h2>
      <p>
        Unresponsive restaurants and unassigned orders escalate here without
        automatically refunding paid orders. Drivers who report arrival stay
        assigned until operator review or pickup. Other expired assignments
        return to dispatch. Incidents recover automatically when actual order or
        assignment state changes; acknowledgement records your plan.
      </p>
      {policy.data && (
        <form className="roco-card" onSubmit={submit}>
          <h3>Timeout policy for new orders</h3>
          {Object.entries(policy.data).map(([key, value]) => (
            <label className="roco-field" key={key}>
              {
                (
                  {
                    reservationMinutes: "Unpaid reservation",
                    restaurantResponseMinutes: "Restaurant response",
                    driverAssignmentMinutes: "Unassigned delivery",
                    driverPickupMinutes: "Driver arrival",
                  } as Record<string, string>
                )[key]
              }{" "}
              (minutes)
              <input
                className="roco-input"
                name={key}
                type="number"
                min={1}
                max={
                  key === "reservationMinutes" ||
                  key === "restaurantResponseMinutes"
                    ? 120
                    : 240
                }
                step={1}
                defaultValue={value}
                required
              />
            </label>
          ))}
          <label className="roco-field">
            Policy change reason
            <input
              className="roco-input"
              value={reason}
              minLength={10}
              maxLength={500}
              required
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button className="roco-button" disabled={save.isPending}>
            Save timeout policy
          </button>
          {save.error && <p role="alert">{save.error.message}</p>}
          {save.isSuccess && <p role="status">Policy saved for new orders.</p>}
        </form>
      )}
      {policy.error && <p role="alert">{policy.error.message}</p>}
      {incidents.error && <p role="alert">{incidents.error.message}</p>}
      {incidents.data?.map((row) => (
        <IncidentCard key={row.incident.id} {...row} />
      ))}
      {incidents.data?.length === 0 && <p>No active timeout incidents.</p>}
    </section>
  );
}
