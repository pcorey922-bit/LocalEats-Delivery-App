import { appReturnScheme, type AppAudience } from './app-audience';
export function mobileReturnRoute(
  raw: string,
  hasGuest = false,
  audience: AppAudience = 'customer',
): string | null {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== `${appReturnScheme(audience)}:` ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      !["", "/"].includes(url.pathname)
    )
      return null;
    if (url.hostname === "auth") return "/sign-in";
    if (url.hostname === "orders") return audience === 'driver' ? '/driver' : hasGuest ? "/guest/order" : "/orders";
    if (url.hostname === "earnings") return "/earnings";
  } catch {
    /* Ignore untrusted malformed navigation. */
  }
  return null;
}

// An auth callback is a wake-up, not another authorization request. Preserve an
// in-progress one-use handoff; an already active Clerk session needs no redirect.
export function mobileCallbackRoute(raw: string, hasGuest: boolean, audience: AppAudience, signedIn: boolean, pending: boolean) {
  const route = mobileReturnRoute(raw, hasGuest, audience);
  if (route === '/sign-in' && (signedIn || pending)) return null;
  return route;
}
