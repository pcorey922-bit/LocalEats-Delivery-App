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
