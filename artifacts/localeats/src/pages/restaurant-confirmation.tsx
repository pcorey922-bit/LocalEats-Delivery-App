import { useQuery } from "@tanstack/react-query";
import { customFetch } from "../../../../lib/api-client-react/src/custom-fetch";
export type Confirmation = {
  mode: "electronic" | "telephone";
  status: "pending" | "contacted" | "accepted" | "rejected" | null;
  orderStatus: string;
  preparationMinutes: number | null;
};
export function useRestaurantConfirmation(orderId: string) {
  return useQuery({
    queryKey: ["order-confirmation", orderId],
    queryFn: () =>
      customFetch<Confirmation>(`/api/orders/${orderId}/confirmation`),
    refetchInterval: 10000,
    retry: false,
  });
}
export function RestaurantConfirmation({ orderId }: { orderId: string }) {
  const state = useRestaurantConfirmation(orderId),
    v = state.data;
  let message = "Order status is loading.";
  if (v) {
    if (v.orderStatus === "cancelled")
      message =
        "Your order has been cancelled. Review payment details for refund updates, if paid.";
    else if (v.orderStatus === "delivered")
      message = "Your order has been delivered.";
    else if (v.orderStatus === "out_for_delivery")
      message = "Your driver is on the way.";
    else if (v.orderStatus === "ready_for_pickup")
      message = "Your order is ready for pickup.";
    else if (v.orderStatus === "preparing")
      message = "The restaurant is preparing your order.";
    else if (v.orderStatus === "accepted")
      message =
        "Your order has been confirmed! The restaurant is preparing your food.";
    else if (v.mode === "telephone")
      message =
        v.status === "accepted"
          ? "The restaurant has confirmed your order. Complete test payment before preparation begins."
          : v.status === "contacted"
            ? "We're confirming your order with the restaurant."
            : "Your order has been received. We're contacting the restaurant to confirm it.";
    else
      message =
        "Your order has been received. Restaurant confirmation is pending; payment and restaurant acceptance are separate steps.";
  }
  return (
    <section aria-label="Restaurant confirmation">
      <p role="status">
        {state.isError
          ? "Confirmation could not be loaded. No restaurant acceptance can be inferred. Refresh to retry."
          : message}
      </p>
      {v?.preparationMinutes &&
        v.status === "accepted" &&
        !["cancelled", "delivered"].includes(v.orderStatus) && (
          <p>
            Restaurant preparation estimate: {v.preparationMinutes} minutes
            after payment confirmation. This is an estimate.
          </p>
        )}
      <button
        className="roco-button"
        disabled={state.isFetching}
        onClick={() => void state.refetch()}
      >
        Refresh restaurant confirmation
      </button>
    </section>
  );
}
