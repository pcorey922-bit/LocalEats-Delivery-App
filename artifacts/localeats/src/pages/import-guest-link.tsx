import { type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
import { saveGuestToken } from "../lib/guest-session";
import { tokenFromGuestLink } from "../lib/guest-access-link";
export function ImportGuestLink() {
  const client = useQueryClient();
  const restore = useMutation({
    mutationFn: async (raw: string) => {
      const token = tokenFromGuestLink(
        raw,
        import.meta.env.VITE_API_ORIGIN || location.origin,
        import.meta.env.BASE_URL,
      );
      await customFetch("/api/guest/session", {
        headers: { "X-RoCoEats-Guest-Token": token },
      });
      saveGuestToken(token);
      client.clear();
    },
  });
  return (
    <section className="roco-card">
      <h2>Use a private guest link</h2>
      <p>
        Paste the private link supplied by dispatch or saved from your order. No
        account is required. It is checked securely with RoCoEats before saving
        on this device. Do not post it publicly.
      </p>
      <form
        className="roco-form-grid"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          restore.mutate(String(form.get("privateLink")));
        }}
      >
        <label className="roco-field">
          Private guest tracking link
          <input
            className="roco-input"
            name="privateLink"
            type="url"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={512}
          />
        </label>
        <button className="roco-button" disabled={restore.isPending}>
          Open my private guest order
        </button>
      </form>
      {restore.isError && (
        <p role="alert">
          Private access could not be restored. Check the link, connection and
          expiry, or contact dispatch. Never send the link to a public support
          channel.
        </p>
      )}
    </section>
  );
}
