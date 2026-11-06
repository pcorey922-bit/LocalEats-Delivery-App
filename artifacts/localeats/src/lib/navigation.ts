export type NavigationAddress = {
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
};
export function navigationDestination(address: NavigationAddress) {
  const required = [
    address.street1,
    address.city,
    address.region,
    address.postalCode,
  ];
  if (required.some((p) => typeof p !== "string" || !p.trim())) return null;
  const parts = [
    address.street1,
    address.street2,
    address.city,
    address.region,
    address.postalCode,
  ].filter((p): p is string => typeof p === "string" && !!p.trim());
  if (parts.some((p) => p.length > 300 || /[\x00-\x1f\x7f]/.test(p)))
    return null;
  return [...parts.map((p) => p.trim().replace(/\s+/g, " ")), "USA"].join(", ");
}
export function navigationLinks(address: NavigationAddress) {
  const destination = navigationDestination(address);
  if (!destination) return null;
  const google = new URL("https://www.google.com/maps/dir/");
  google.search = new URLSearchParams({
    api: "1",
    destination,
    travelmode: "driving",
    dir_action: "navigate",
  }).toString();
  // The legacy HTTPS map link also supports iOS versions before unified URLs (18.4).
  const apple = new URL("https://maps.apple.com/");
  apple.search = new URLSearchParams({
    daddr: destination,
    dirflg: "d",
  }).toString();
  if (google.href.length > 2048 || apple.href.length > 2048) return null;
  return { destination, google: google.href, apple: apple.href };
}
