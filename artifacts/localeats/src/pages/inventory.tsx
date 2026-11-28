import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { getGetMyRestaurantQueryKey } from "@workspace/api-client-react";
type Item = {
  id: string;
  name: string;
  stockOnHand: number | null;
  revision: number;
};
function StockForm({ item }: { item: Item }) {
  const [stock, setStock] = useState(
    item.stockOnHand === null ? "" : String(item.stockOnHand),
  );
  const [reason, setReason] = useState("");
  const [revision, setRevision] = useState(item.revision);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      customFetch<Item>(`/api/restaurants/me/inventory/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({
          stockOnHand: stock.trim() === "" ? null : Number(stock),
          expectedRevision: revision,
          reason,
        }),
      }),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["restaurant-inventory"] });
    },
    onSuccess: (updated) => {
      void client.invalidateQueries({ queryKey: getGetMyRestaurantQueryKey() });
      setRevision(updated.revision);
      setStock(updated.stockOnHand === null ? "" : String(updated.stockOnHand));
      setReason("");
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };
  return (
    <form className="roco-card" onSubmit={submit}>
      <h3>{item.name}</h3>
      <p>Available units: {item.stockOnHand ?? "untracked"}</p>
      {revision !== item.revision && (
        <p role="status">
          Stock changed since this form was loaded. Refresh values before
          adjusting.
        </p>
      )}
      <label className="roco-field">
        Set available units (blank for untracked)
        <input
          className="roco-input"
          type="number"
          min={0}
          max={1000000}
          step={1}
          value={stock}
          disabled={save.isPending}
          onChange={(e) => setStock(e.target.value)}
        />
      </label>
      <label className="roco-field">
        Adjustment reason
        <input
          className="roco-input"
          required
          minLength={5}
          maxLength={500}
          value={reason}
          disabled={save.isPending}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button
        className="roco-button"
        disabled={save.isPending || reason.trim().length < 5}
      >
        Save stock
      </button>
      {save.error && <p role="alert">{save.error.message}</p>}
      <button
        type="button"
        className="roco-button"
        disabled={save.isPending}
        onClick={() => {
          setRevision(item.revision);
          setStock(item.stockOnHand === null ? "" : String(item.stockOnHand));
          setReason("");
          save.reset();
        }}
      >
        Refresh stock values
      </button>
      {save.isSuccess && <p role="status">Stock updated.</p>}
    </form>
  );
}
export function RestaurantInventory() {
  const items = useQuery({
    queryKey: ["restaurant-inventory"],
    queryFn: () => customFetch<Item[]>("/api/restaurants/me/inventory"),
    refetchInterval: 15000,
  });
  return (
    <section aria-label="Menu inventory">
      <h2>Menu inventory</h2>
      <p>
        Stock counts available units, excluding current order reservations. Set
        zero to mark an item sold out. Untracked items have no quantity limit.
        Cancellation before restaurant acceptance restores reserved units;
        accepted food requires a manual adjustment. Payment failure alone keeps
        the reservation until cancellation.
      </p>
      {items.error && <p role="alert">{items.error.message}</p>}
      {items.data?.map((item) => (
        <StockForm key={item.id} item={item} />
      ))}
      {items.isPending && <p>Loading stock…</p>}
    </section>
  );
}
