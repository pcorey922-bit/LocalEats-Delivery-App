import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Entry = {
  order: {
    id: string;
    placedAt: string;
    reservationExpiresAt: string;
    subtotalCents: number;
    totalCents: number;
  };
  restaurant: { name: string; phone: string | null };
  confirmation: { status: string; version: number };
  items: {
    id: string;
    itemNameSnapshot: string;
    quantity: number;
    unitPriceCents: number;
    specialInstructions: string | null;
    modifierSnapshot: { option: string }[] | null;
  }[];
  hours: {
    weekday: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
};
function TelephoneOrder({ entry }: { entry: Entry }) {
  const client = useQueryClient(),
    [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const update = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      customFetch(
        `/api/admin/orders/${entry.order.id}/telephone-confirmation`,
        {
          method: "POST",
          body: JSON.stringify({
            requestId,
            version: entry.confirmation.version,
            ...input,
          }),
        },
      ),
    onSuccess: () => {
      setRequestId(crypto.randomUUID());
      void client.invalidateQueries({ queryKey: ["telephone-orders"] });
      void client.invalidateQueries({
        queryKey: ["order-confirmation", entry.order.id],
      });
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ["telephone-orders"] });
    },
  });
  const action = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const selected = String(f.get("action"));
    update.mutate({
      action: selected,
      note: String(f.get("note")),
      ...(selected === "accept"
        ? {
            preparationMinutes: Number(f.get("minutes")),
            confirmedSubtotalCents: Math.round(
              Number(f.get("foodTotal")) * 100,
            ),
            allItemsAvailable: f.get("available") === "on",
          }
        : {}),
    });
  };
  return (
    <article className="roco-card">
      <h3>
        {entry.restaurant.name} · {entry.confirmation.status}
      </h3>
      <p>Order reference: {entry.order.id}</p>
      <p>
        Pending age:{" "}
        {Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(entry.order.placedAt).getTime()) / 60000,
          ),
        )}{" "}
        min · Reservation ends{" "}
        {new Date(entry.order.reservationExpiresAt).toLocaleTimeString()}
      </p>
      <p>
        Call:{" "}
        {entry.restaurant.phone ? (
          <a href={`tel:${entry.restaurant.phone}`}>{entry.restaurant.phone}</a>
        ) : (
          "Contact phone missing — do not confirm"
        )}
      </p>
      <details>
        <summary>Restaurant hours (weekday 0 = Sunday)</summary>
        {entry.hours.map((h) => (
          <p key={h.weekday}>
            {h.weekday}:{" "}
            {h.isClosed ? "Closed" : `${h.openTime}–${h.closeTime}`}
          </p>
        ))}
      </details>
      <ul>
        {entry.items.map((i) => (
          <li key={i.id}>
            {i.quantity} × {i.itemNameSnapshot} · $
            {((i.quantity * i.unitPriceCents) / 100).toFixed(2)}
            {i.modifierSnapshot?.length
              ? ` · ${i.modifierSnapshot.map((m) => m.option).join(", ")}`
              : ""}
            {i.specialInstructions
              ? ` · Instructions: ${i.specialInstructions}`
              : ""}
          </li>
        ))}
      </ul>
      <p>
        Approved food subtotal: ${(entry.order.subtotalCents / 100).toFixed(2)}{" "}
        · Complete customer total: ${(entry.order.totalCents / 100).toFixed(2)}
      </p>
      {entry.confirmation.status === "accepted" ? (
        <p>
          Restaurant confirmed. Awaiting customer payment; tell the kitchen to
          wait before preparing. Existing cancellation controls handle later
          changes.
        </p>
      ) : (
        <form
          className="roco-form-grid"
          onSubmit={action}
          key={entry.confirmation.version}
        >
          <label className="roco-field">
            Telephone action
            <select
              className="roco-select"
              name="action"
              defaultValue="contact"
            >
              <option value="contact">Mark restaurant contacted</option>
              <option
                value="accept"
                disabled={entry.confirmation.status !== "contacted"}
              >
                Record genuine acceptance
              </option>
              <option value="reject">Reject and cancel unpaid order</option>
            </select>
          </label>
          <label className="roco-field">
            Call notes / unavailable items / price discrepancies
            <textarea
              className="roco-input"
              name="note"
              required
              minLength={5}
              maxLength={2000}
            />
          </label>
          <label className="roco-field">
            Preparation estimate (minutes, acceptance only)
            <input
              className="roco-input"
              type="number"
              name="minutes"
              min={1}
              max={240}
            />
          </label>
          <label className="roco-field">
            Restaurant-confirmed food subtotal ($, acceptance only)
            <input
              className="roco-input"
              type="number"
              name="foodTotal"
              min={0}
              step="0.01"
            />
          </label>
          <label className="roco-field">
            <input type="checkbox" name="available" />
            Restaurant verified every item, quantity, modifier and price;
            preparation waits for payment
          </label>
          <button className="roco-button primary" disabled={update.isPending}>
            Save telephone response
          </button>
        </form>
      )}
      {update.isError && <p role="alert">{update.error.message}</p>}
    </article>
  );
}
export function TelephoneDispatch() {
  const client = useQueryClient();
  const queue = useQuery({
    queryKey: ["telephone-orders"],
    queryFn: () => customFetch<Entry[]>("/api/admin/telephone-orders"),
    refetchInterval: 10000,
  });
  const restaurants = useQuery({
    queryKey: ["telephone-restaurants"],
    queryFn: () =>
      customFetch<
        {
          id: string;
          name: string;
          phone: string | null;
          receiptMode: string;
        }[]
      >("/api/admin/telephone-restaurants"),
  });
  const mode = useMutation({
    mutationFn: (v: { id: string; expectedMode: string; mode: string }) =>
      customFetch(`/api/admin/restaurants/${v.id}/receipt-mode`, {
        method: "PUT",
        body: JSON.stringify({ mode: v.mode, expectedMode: v.expectedMode }),
      }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["telephone-restaurants"] }),
  });
  return (
    <section>
      <h2>Telephone restaurant confirmation</h2>
      <p>
        These orders have not been charged. Call the restaurant, verify every
        item and the approved food subtotal, and record genuine acceptance
        before checkout. Price or item discrepancies require cancellation and a
        fresh customer-approved quote. Preparation starts after verified
        payment. New-order alerts and escalation persist in the database; free
        hosting may pause workers while asleep.
      </p>
      <details>
        <summary>Configure restaurant receipt modes</summary>
        {restaurants.data?.map((r) => (
          <div className="roco-card" key={r.id}>
            <strong>{r.name}</strong>
            <p>
              {r.phone || "Save a restaurant phone first"} · {r.receiptMode}
            </p>
            <button
              className="roco-button"
              disabled={
                mode.isPending || (!r.phone && r.receiptMode === "electronic")
              }
              onClick={() =>
                mode.mutate({
                  id: r.id,
                  expectedMode: r.receiptMode,
                  mode:
                    r.receiptMode === "electronic" ? "telephone" : "electronic",
                })
              }
            >
              Use {r.receiptMode === "electronic" ? "telephone" : "electronic"}{" "}
              confirmation for future orders
            </button>
          </div>
        ))}
      </details>
      {[queue.error, restaurants.error, mode.error]
        .filter(Boolean)
        .map((e, i) => (
          <p key={i} role="alert">
            {e!.message}
          </p>
        ))}
      <button
        className="roco-button"
        disabled={queue.isFetching}
        onClick={() => void queue.refetch()}
      >
        Refresh telephone queue
      </button>
      {queue.isLoading && (
        <p role="status">Loading pending telephone orders…</p>
      )}
      {queue.data?.length === 0 && <p>No pending telephone orders.</p>}
      {queue.data?.map((entry) => (
        <TelephoneOrder key={entry.order.id} entry={entry} />
      ))}
    </section>
  );
}
