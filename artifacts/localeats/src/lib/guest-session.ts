import { Capacitor } from "@capacitor/core";
import { guestAccessLink } from "./guest-access-link";
import { useSyncExternalStore } from "react";
import { setGuestTokenGetter } from "../../../../lib/api-client-react/src/custom-fetch";
const key = "rocoeats-guest-access:v1";
const listeners = new Set<() => void>();
export function readGuestToken(): string | null {
  try {
    const value = localStorage.getItem(key);
    return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}
export function saveGuestToken(token: string | null) {
  if (token && !/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new Error("Invalid guest access");
  if (token) localStorage.setItem(key, token);
  else localStorage.removeItem(key);
  listeners.forEach((fn) => fn());
}
export function useGuestToken() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      const h = () => fn();
      window.addEventListener("storage", h);
      return () => {
        listeners.delete(fn);
        window.removeEventListener("storage", h);
      };
    },
    readGuestToken,
    () => null,
  );
}
// Import before customer queries mount. Fragments are stripped before HTTP/API calls.
if (typeof window !== "undefined") {
  if (
    window.location.pathname.endsWith("/guest/order") &&
    window.location.hash.startsWith("#access=")
  ) {
    const token = window.location.hash.slice(8);
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    if (/^[A-Za-z0-9_-]{43}$/.test(token)) {
      try {
        saveGuestToken(token);
      } catch {
        /* Page explains unavailable storage. */
      }
    }
  }
  setGuestTokenGetter(readGuestToken);
}

export function privateGuestLink(token: string) {
  return guestAccessLink({
    token,
    pageOrigin: location.origin,
    apiOrigin: import.meta.env.VITE_API_ORIGIN,
    basePath: import.meta.env.BASE_URL,
    native: Capacitor.isNativePlatform(),
  });
}
