import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";

export function GuestTestInvitation() {
  const [link, setLink] = useState("");
  const create = useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      phone: string;
    }) => {
      const result = await customFetch<{ token: string }>(
        "/api/guest/sessions",
        { method: "POST", body: JSON.stringify(input) },
      );
      setLink(
        `${location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/guest/order#access=${result.token}`,
      );
    },
  });
  return (
    <section className="roco-card">
      <h2>Private guest test access</h2>
      <p>
        Create a scoped guest link for an invited test customer. Open it in a
        separate private browser with no Clerk session. This does not enable
        ordering or approve a restaurant. Use test contact details. Links expire
        in seven days.
      </p>
      <form
        className="roco-form-grid"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          create.mutate({
            name: String(f.get("guestName")),
            email: String(f.get("guestEmail")),
            phone: String(f.get("guestPhone")),
          });
        }}
      >
        <label className="roco-field">
          Test guest name
          <input
            className="roco-input"
            name="guestName"
            required
            minLength={2}
            maxLength={120}
          />
        </label>
        <label className="roco-field">
          Test guest email
          <input
            className="roco-input"
            type="email"
            name="guestEmail"
            required
            maxLength={254}
          />
        </label>
        <label className="roco-field">
          Test guest phone
          <input
            className="roco-input"
            type="tel"
            name="guestPhone"
            required
            minLength={7}
            maxLength={30}
          />
        </label>
        <button className="roco-button" disabled={create.isPending}>
          Create private guest test link
        </button>
      </form>
      {create.isError && <p role="alert">{create.error.message}</p>}
      {link && (
        <>
          <p>Private access — do not post this link publicly.</p>
          <input
            aria-label="Private guest test link"
            className="roco-input"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
          />
        </>
      )}
    </section>
  );
}
