import { useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@clerk/react";
import { createCustomerCartRegistry } from "../lib/customer-cart";

// All consumers of an identity share one live store, including the guest cart.
const carts = createCustomerCartRegistry({
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
});
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => carts.reload(event.key));
  window.addEventListener("focus", () => carts.reload());
  window.addEventListener("pageshow", () => carts.reload());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") carts.reload();
  });
}
export function useCustomerCart() {
  const { isLoaded, userId } = useAuth();
  return useCartForOwner(isLoaded ? (userId ?? null) : undefined);
}
export function useCartForOwner(owner: string | null | undefined) {
  const store = useMemo(() => carts.get(owner), [owner]);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return [snapshot.items, store.setItems, snapshot.warning] as const;
}
