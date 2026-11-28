import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function CustomerHandoff({
  orderId,
  delivered = false,
}: {
  orderId: string;
  delivered?: boolean;
}) {
  const code = useMutation({
    mutationFn: () =>
      customFetch<{ code: string; expiresAt: string }>(
        `/api/orders/${orderId}/delivery-code`,
        { method: "POST" },
      ),
  });
  const proof = useQuery({
    queryKey: ["delivery-proof", orderId],
    queryFn: () =>
      customFetch<{ method: string; confirmedAt: string } | null>(
        `/api/orders/${orderId}/delivery-proof`,
      ),
    enabled: delivered,
  });
  return (
    <section className="roco-card">
      <h3>{delivered ? "Delivery receipt" : "Your secure handoff"}</h3>
      {delivered ? (
        <p>
          {proof.data
            ? `Delivery confirmed by customer code at ${new Date(proof.data.confirmedAt).toLocaleString()}`
            : proof.isError
              ? "Unable to load delivery receipt."
              : proof.isLoading ? "Loading delivery receipt…" : "No handoff-code receipt is recorded for this delivery."}
        </p>
      ) : (
        <>
          <p>
            Generate a code when your driver arrives. Share it only after you
            receive your order. A new code replaces the old one.
          </p>
          <button
            className="roco-button"
            disabled={code.isPending}
            onClick={() => code.mutate()}
          >
            Generate handoff code
          </button>
          {code.data && (
            <p role="status">
              <strong style={{ fontSize: 28, letterSpacing: 5 }}>
                {code.data.code}
              </strong>
              <br />
              Expires {new Date(code.data.expiresAt).toLocaleTimeString()}
            </p>
          )}
          {code.isError && <p role="alert">{code.error.message}</p>}
        </>
      )}
    </section>
  );
}
export function DriverHandoff({
  orderId,
  onCompleted,
}: {
  orderId: string;
  onCompleted: () => void;
}) {
  const [code, setCode] = useState("");
  const complete = useMutation({
    mutationFn: () =>
      customFetch(`/api/driver/orders/${orderId}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }),
    onSuccess: onCompleted,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    complete.mutate();
  }
  return (
    <form className="roco-card" onSubmit={submit}>
      <h3>Confirm customer handoff</h3>
      <p>
        Ask the customer to open their order and generate a code after receiving
        the food. If delivery cannot be completed, contact operations; do not
        mark it delivered.
      </p>
      <label>
        Customer handoff code
        <input
          className="roco-input"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]{6}"
          required
          maxLength={6}
        />
      </label>
      <button
        className="roco-button primary"
        disabled={complete.isPending || code.length !== 6}
      >
        {complete.isPending ? "Confirming…" : "Confirm delivery with code"}
      </button>
      {complete.isError && (
        <p role="alert">
          {complete.error.message} Your order is not confirmed here. You can
          retry safely.
        </p>
      )}
    </form>
  );
}
