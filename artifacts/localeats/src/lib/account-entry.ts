export type JoinRole = "customer" | "restaurant" | "driver";

export function joinRole(value: string | null): JoinRole {
  return value === "restaurant" || value === "driver" ? value : "customer";
}

// Registration intent is a URL hint, never authority to change an existing role.
// Keep recovery in the current tab/URL rather than sharing it between accounts.
export function accountEntryLinks(search: string) {
  const params = new URLSearchParams(search);
  const requested = params.get("join");
  const role = joinRole(requested);
  const checkout = role === "customer" && params.get("checkout") === "1";
  const hasIntent = requested === "customer" || requested === "restaurant" || requested === "driver" || (!params.has("join") && checkout);
  const query = hasIntent ? `?join=${role}${checkout ? "&checkout=1" : ""}` : "";
  return {
    role, checkout, hasIntent, query,
    setup: `/account/setup${query}`,
    access: `/account/access${query}`,
    signIn: `/sign-in${query}`,
  };
}

export function accountStatus(error: unknown): number | undefined {
  return (error as { status?: number } | null)?.status;
}

export function accountDestination(role: string, checkout: boolean, customerApp = false) {
  // App audience chooses presentation, never account permissions.
  if (customerApp) return role === "customer" && checkout ? "/cart?restore=1" : "/restaurants";
  if (role === "admin") return "/admin";
  if (role === "restaurant") return "/restaurant";
  if (role === "driver") return "/driver";
  return checkout ? "/cart?restore=1" : "/dashboard";
}

export function nativeAccountReturn(role?: string, checkout = false, customerApp = false) {
  if (role === "restaurant" || role === "driver") return `/account/setup?join=${role}`;
  if (customerApp) return `/account/setup?join=customer${checkout ? "&checkout=1" : ""}`;
  return checkout ? "/account/setup?join=customer&checkout=1" : "/account";
}
