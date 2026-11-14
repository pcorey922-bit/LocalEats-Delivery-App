import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
type DeclinedOffer = {
  orderId: string;
  restaurantName: string;
  declineId: string;
  declinedUntil: string;
};
export function DeclinedOffers() {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const offers = useQuery({
    queryKey: ["driver-declined-offers", userId],
    queryFn: () =>
      customFetch<DeclinedOffer[]>("/api/driver/offers?declined=true"),
    enabled: !!userId && open,
    refetchInterval: open ? 15000 : false,
  });
  const reconsider = useMutation({
    mutationFn: (offer: DeclinedOffer) =>
      customFetch(`/api/driver/orders/${offer.orderId}/decline-offer`, {
        method: "DELETE",
        body: JSON.stringify({ expectedDeclineId: offer.declineId }),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["driver-offers"] }),
        client.invalidateQueries({ queryKey: ["driver-declined-offers"] }),
      ]);
    },
  });
  return (
    <section className="roco-card">
      <button
        type="button"
        className="roco-button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Declined offers
      </button>
      <p>
        Declining hides an unassigned offer for 15 minutes for you. Other
        couriers can still accept it. You can reconsider while it remains
        available.
      </p>
      {open && (
        <>
          {offers.isPending && <p role="status">Loading declined offers…</p>}
          {offers.isError && <p role="alert">{offers.error.message}</p>}
          {offers.data?.map((offer) => (
            <div className="roco-row" key={offer.orderId}>
              <p>
                {offer.restaurantName} · declined until{" "}
                {new Date(offer.declinedUntil).toLocaleTimeString()}
              </p>
              <button
                className="roco-button"
                disabled={reconsider.isPending}
                onClick={() => reconsider.mutate(offer)}
              >
                Reconsider offer
              </button>
            </div>
          ))}
          {offers.data?.length === 0 && <p>No declined unassigned offers.</p>}
        </>
      )}
      {reconsider.isError && <p role="alert">{reconsider.error.message}</p>}
    </section>
  );
}
