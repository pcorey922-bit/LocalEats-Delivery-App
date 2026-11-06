import { useMemo, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@clerk/react";
import { createCustomerCart } from "../lib/customer-cart";
// Replacing the store when Clerk's user changes prevents even one render of the
// previous customer's cart or a persistence effect writing it into a new account.
export function useCustomerCart() {
  const { userId } = useAuth();
  return useCartForOwner(userId ?? null);
}

export function useCartForOwner(userId: string | null) {
  const store = useMemo(
    () =>
      createCustomerCart(userId ?? null, {
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
      }),
    [userId],
  );
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === store.key || event.key === null) store.reload();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [store]);
  return [snapshot.items, store.setItems, snapshot.warning] as const;
}
