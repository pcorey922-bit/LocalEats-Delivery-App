import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function PaymentReconciliation({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState("");
  const check = useMutation({
    mutationFn: () =>
      customFetch<{ feeCents: number; netCents: number }>(
        `/api/admin/orders/${orderId}/reconcile-payment`,
        { method: "POST", body: JSON.stringify({ reason }) },
      ),
  });
  const evidence = (check.error as { data?: { code?: string; error?: string; availableOn?: string } } | null)?.data;
  const waiting = evidence?.code === 'STRIPE_BALANCE_PENDING' || evidence?.code === 'STRIPE_BALANCE_MISSING';
  const availableOn = evidence?.availableOn && Number.isFinite(Date.parse(evidence.availableOn)) ? new Date(evidence.availableOn).toLocaleString() : null;
  return (
    <section>
      <h4>Verify original charge and fees</h4>
      <p>
        Reads Stripe test evidence and records available balance entries. Pending funds stay unreconciled. This
        does not verify bank payouts or every refund fee.
      </p>
      <label className="roco-field">
        Review reason
        <input
          className="roco-input"
          value={reason}
          minLength={10}
          maxLength={1000}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button
        className="roco-button"
        disabled={check.isPending || reason.trim().length < 10}
        onClick={() => check.mutate()}
      >
        Reconcile Stripe test charge
      </button>
      {check.error && (waiting ? <div role="status">
        <strong>Reconciliation pending</strong>
        <p>{evidence?.error}</p>
        {availableOn && <p>Stripe’s reported availability: {availableOn}. This is not confirmation that funds are available.</p>}
        <p>No fee or net evidence was recorded by this attempt. Keep this existing order; do not repeat its payment. Check Stripe and manually retry when the balance is available.</p>
      </div> : <p role="alert">{check.error.message}</p>)}
      {check.data && (
        <p role="status">
          Verified charge fee ${(check.data.feeCents / 100).toFixed(2)}; net to
          provider balance ${(check.data.netCents / 100).toFixed(2)}.
        </p>
      )}
    </section>
  );
}
type Hold = {
  id: string;
  orderId: string;
  active: boolean;
  providerStatus: string;
  amountCents: number;
  version: number;
  note: string | null;
};
function HoldCard({ hold }: { hold: Hold }) {
  const [reason, setReason] = useState(""),
    client = useQueryClient();
  const check = useMutation({
    mutationFn: () =>
      customFetch<Hold>(
        `/api/admin/financial-holds/${encodeURIComponent(hold.id)}/reconcile`,
        { method: "POST", body: JSON.stringify({ reason }) },
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["financial-holds"] });
    },
  });
  return (
    <article className="roco-card">
      <h3>Order {hold.orderId}</h3>
      <p>
        Dispute ${(hold.amountCents / 100).toFixed(2)} · {hold.providerStatus} ·{" "}
        {hold.active
          ? "outgoing funds held"
          : "provider evidence reconciled; hold released"}
      </p>
      {hold.note && <p>{hold.note}</p>}
      <label className="roco-field">
        Provider review note
        <input
          className="roco-input"
          value={reason}
          minLength={10}
          maxLength={1000}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button
        className="roco-button"
        disabled={check.isPending || reason.trim().length < 10}
        onClick={() => check.mutate()}
      >
        Read Stripe test dispute and reconcile
      </button>
      {check.error && <p role="alert">{check.error.message}</p>}
      {check.isSuccess && (
        <p role="status">
          {check.data.active
            ? "Evidence recorded. Hold remains active."
            : "Provider evidence verified; hold released."}
        </p>
      )}
    </article>
  );
}
export function FinancialHoldConsole() {
  const holds = useQuery({
    queryKey: ["financial-holds"],
    queryFn: () => customFetch<Hold[]>("/api/admin/financial-holds"),
    refetchInterval: 15000,
  });
  return (
    <section>
      <h2>Financial dispute holds</h2>
      <p>
        Known disputes block new transfers and refund execution. Won disputes
        require verified settled withdrawal/reinstatement evidence before
        release. Lost disputes remain held for owner review. Reconciliation
        reads provider objects and records immutable evidence; it does not
        submit dispute evidence or move new funds.
      </p>
      {holds.error && <p role="alert">{holds.error.message}</p>}
      {holds.data?.map((h) => (
        <HoldCard key={h.id} hold={h} />
      ))}
      {holds.data?.length === 0 && <p>No recorded dispute holds.</p>}
    </section>
  );
}
