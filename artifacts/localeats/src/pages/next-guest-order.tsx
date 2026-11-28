import { type FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { privateGuestLink, saveGuestToken } from "../lib/guest-session";
export function NextGuestOrder({ token }: { token: string }) {
  const [saved, setSaved] = useState(false),
    client = useQueryClient(),
    [, navigate] = useLocation();
  const start = useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const next = await customFetch<{ token: string }>(
        "/api/guest/session/next",
        { method: "POST", body: JSON.stringify(input) },
      );
      saveGuestToken(next.token);
      client.clear();
      navigate("/cart");
    },
  });
  let link = "";
  try {
    link = privateGuestLink(token);
  } catch {
    /* Native configuration must be corrected before replacing access. */
  }
  return (
    <section className="roco-card">
      <h2>Start another guest order</h2>
      <p>
        Your previous order keeps its own access, receipts and refund updates.
        Save its private link before starting a fresh quote. Starting again does
        not revoke the old link, reopen the old order or create a charge.
      </p>
      {link ? (
        <label className="roco-field">
          Previous order's private tracking link
          <input
            className="roco-input"
            value={link}
            readOnly
            onFocus={(e) => e.target.select()}
          />
        </label>
      ) : (
        <p role="alert">
          Configure the app's HTTPS staging origin before replacing saved guest
          access.
        </p>
      )}
      <form
        className="roco-form-grid"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          start.mutate({
            name: String(f.get("nextName")),
            email: String(f.get("nextEmail")),
            phone: String(f.get("nextPhone")),
            previousLinkSaved: saved,
          });
        }}
      >
        <label className="roco-field">
          <input
            type="checkbox"
            checked={saved}
            required
            onChange={(e) => setSaved(e.target.checked)}
          />
          I saved the previous order's private tracking link somewhere safe
        </label>
        <label className="roco-field">
          Name for the next order
          <input
            className="roco-input"
            name="nextName"
            required
            minLength={2}
            maxLength={120}
          />
        </label>
        <label className="roco-field">
          Email for the next receipt
          <input
            className="roco-input"
            name="nextEmail"
            type="email"
            required
            maxLength={254}
          />
        </label>
        <label className="roco-field">
          Phone for the next delivery
          <input
            className="roco-input"
            name="nextPhone"
            type="tel"
            required
            minLength={7}
            maxLength={30}
          />
        </label>
        <button
          className="roco-button primary"
          disabled={!saved || !link || start.isPending}
        >
          Start fresh guest checkout
        </button>
      </form>
      {start.isError && <p role="alert">{start.error.message}</p>}
    </section>
  );
}
