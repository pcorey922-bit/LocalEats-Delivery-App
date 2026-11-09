// A native webview's localhost origin is never a usable customer tracking website.
export function guestAccessLink({
  token,
  pageOrigin,
  apiOrigin,
  basePath = "/",
  native = false,
}: {
  token: string;
  pageOrigin: string;
  apiOrigin?: string;
  basePath?: string;
  native?: boolean;
}) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new Error("Guest access is invalid");
  if (native && !apiOrigin)
    throw new Error(
      "Configure the native HTTPS staging API before sharing guest access",
    );
  const origin = new URL(apiOrigin || pageOrigin);
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error(
      "Configure an HTTPS website origin without credentials or paths",
    );
  const local = !native && ["localhost", "127.0.0.1"].includes(origin.hostname);
  if (origin.protocol !== "https:" && !(local && origin.protocol === "http:"))
    throw new Error("Guest tracking requires HTTPS");
  const path = basePath.replace(/\/$/, "");
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*$/.test(path || "/"))
    throw new Error("Invalid application base path");
  const link = new URL(`${path}/guest/order`, origin.origin);
  link.hash = `access=${token}`;
  return link.toString();
}
