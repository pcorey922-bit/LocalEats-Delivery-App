export type JoinRole = "customer" | "restaurant" | "driver";

export function joinRole(value: string | null): JoinRole {
  return value === "restaurant" || value === "driver" ? value : "customer";
}

export function accountStatus(error: unknown): number | undefined {
  return (error as { status?: number } | null)?.status;
}

export function accountDestination(role: string, checkout: boolean) {
  if (role === "admin") return "/admin";
  if (role === "restaurant") return "/restaurant";
  if (role === "driver") return "/driver";
  return checkout ? "/cart?restore=1" : "/dashboard";
}

export function nativeAccountReturn(role?: string, checkout = false) {
  if (role === "restaurant" || role === "driver") return `/account/setup?join=${role}`;
  return checkout ? "/account/setup?join=customer&checkout=1" : "/account";
}
