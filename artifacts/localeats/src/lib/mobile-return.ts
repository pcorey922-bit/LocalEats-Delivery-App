export function mobileReturnRoute(
  raw: string,
  hasGuest = false,
): string | null {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "rocoeats:" ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      !["", "/"].includes(url.pathname)
    )
      return null;
    if (url.hostname === "auth") return "/sign-in";
    if (url.hostname === "orders") return hasGuest ? "/guest/order" : "/orders";
    if (url.hostname === "earnings") return "/earnings";
  } catch {
    /* Ignore untrusted malformed navigation. */
  }
  return null;
}
