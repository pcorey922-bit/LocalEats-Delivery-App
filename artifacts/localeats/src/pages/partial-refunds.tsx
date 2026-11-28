import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type Credit = {
  id: string;
  amountCents: number;
  status: string;
  fundingPolicy: string;
};
export function PartialRefundControls({ orderId }: { orderId: string }) {
  const client = useQueryClient(),
    [id, setId] = useState(() => crypto.randomUUID()),
    [amount, setAmount] = useState(""),
    [reason, setReason] = useState("");
  const rows = useQuery({
    queryKey: ["partial-refunds", orderId],
    queryFn: () =>
      customFetch<Credit[]>(`/api/admin/orders/${orderId}/partial-refunds`),
    refetchInterval: 10000,
  });
  const submit = useMutation({
    mutationFn: () => {
      if (!/^\d{1,8}(\.\d{1,2})?$/.test(amount))
        throw new Error("Enter dollars with at most two decimal places");
      const [dollars, cents = ""] = amount.split(".");
      const amountCents = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
      return customFetch(`/api/admin/orders/${orderId}/partial-refunds`, {
        method: "POST",
        body: JSON.stringify({
          id,
          amountCents,
          fundingPolicy: "platform_goodwill_v1",
          reason,
        }),
      });
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["partial-refunds", orderId] });
      void client.invalidateQueries({ queryKey: ["payment", orderId] });
    },
  });
  const send = (e: FormEvent) => {
    e.preventDefault();
    submit.mutate();
  };
  return (
    <section>
      <h4>Platform-funded partial test refund</h4>
      <p>
        For delivered Stripe test orders. RoCoEats covers this credit;
        restaurant earnings, driver earnings and tips stay intact. This does not
        allocate a tax or recipient-funded refund. Resolve pending credits
        before requesting the remaining full refund.
      </p>
      <form onSubmit={send}>
        <label className="roco-field">
          Amount in dollars
          <input
            className="roco-input"
            inputMode="decimal"
            value={amount}
            required
            onChange={(e) => setAmount(e.target.value)}
            disabled={submit.isPending || submit.isSuccess}
          />
        </label>
        <label className="roco-field">
          Reason
          <input
            className="roco-input"
            value={reason}
            required
            minLength={10}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            disabled={submit.isPending || submit.isSuccess}
          />
        </label>
        <button
          className="roco-button"
          disabled={submit.isPending || submit.isSuccess}
        >
          Request partial test refund
        </button>
      </form>
      {submit.error && (
        <p role="alert">
          {submit.error.message} Retry the same request after a connection
          failure; its ID is retained.
        </p>
      )}
      {submit.isSuccess && (
        <p role="status">
          Refund request saved. Provider confirmation is pending.
        </p>
      )}
      {submit.isSuccess && (
        <button
          className="roco-button"
          onClick={() => {
            setId(crypto.randomUUID());
            setAmount("");
            setReason("");
            submit.reset();
          }}
        >
          Start another refund request
        </button>
      )}
      {rows.error && <p role="alert">{rows.error.message}</p>}
      {rows.data?.map((r) => (
        <p key={r.id}>
          ${(r.amountCents / 100).toFixed(2)} · {r.status} · platform-funded
        </p>
      ))}
    </section>
  );
}
