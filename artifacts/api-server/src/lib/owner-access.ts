import type { Profile } from "@workspace/db";
// Server-only bootstrap identities. Never use Clerk client metadata or request
// bodies/headers as role or owner-driver authority.
export function isConfiguredOwner(clerkUserId: string): boolean {
  return (process.env.LOCALEATS_ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(clerkUserId);
}
export function isOwnerDriver(
  profile:
    Pick<Profile, "clerkUserId" | "role" | "isActive"> | null | undefined,
): boolean {
  return (
    !!profile?.isActive &&
    profile.role === "admin" &&
    isConfiguredOwner(profile.clerkUserId) &&
    (process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .includes(profile.clerkUserId)
  );
}
export function hasDriverAccess(
  profile:
    | Pick<Profile, "clerkUserId" | "role" | "isActive" | "driverApproved">
    | null
    | undefined,
  application?: { status: string; licenseExpiresOn: string } | null,
): boolean {
  if (!profile?.isActive || !["driver", "admin"].includes(profile.role))
    return false;
  if (isOwnerDriver(profile))
    return (
      !application ||
      application.licenseExpiresOn >= new Date().toISOString().slice(0, 10)
    );
  return (
    profile.driverApproved &&
    (!application ||
      (application.status === "approved" &&
        application.licenseExpiresOn >= new Date().toISOString().slice(0, 10)))
  );
}
