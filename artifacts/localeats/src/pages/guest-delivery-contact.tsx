import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export function GuestDeliveryContact({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const contact = useQuery({
    queryKey: ["guest-contact", orderId],
    queryFn: () =>
      customFetch<{ name: string; phone: string; email?: string } | null>(
        `/api/orders/${orderId}/guest-contact`,
      ),
    enabled: open,
    retry: false,
  });
  return (
    <section>
      <button
        className="roco-button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Guest delivery contact
      </button>
      {open && (
        <>
          {contact.isLoading && (
            <p role="status">Loading authorized contact…</p>
          )}
          {contact.isError && <p role="alert">{contact.error.message}</p>}
          {contact.data === null && (
            <p>No guest contact is recorded for this order.</p>
          )}
          {contact.data && (
            <p>
              {contact.data.name} ·{" "}
              <a href={`tel:${contact.data.phone.replace(/[^+0-9]/g, "")}`}>
                Call guest
              </a>
              {contact.data.email && <> · {contact.data.email}</>}
            </p>
          )}
          <p>
            Use contact details only to fulfill or support this order. Access is
            audited.
          </p>
        </>
      )}
    </section>
  );
}
