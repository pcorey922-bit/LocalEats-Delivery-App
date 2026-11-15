import { eq } from "drizzle-orm";
import { profilesTable } from "@workspace/db";
import type { Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";

export async function requireLockedActiveProfile(
  tx: Transaction,
  profileId: string,
) {
  // Recheck at the mutation boundary, before financial/order locks or writes.
  // Provider readers call this only after I/O. The lock serializes role changes
  // but permits concurrent audit/notification FK checks.
  const [actor] = await tx
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, profileId))
    .for("no key update");
  if (!actor?.isActive)
    throw new CommerceError(403, "Active account access is required");
  return actor;
}

export async function requireLockedAdministrator(
  tx: Transaction,
  profileId: string,
) {
  const actor = await requireLockedActiveProfile(tx, profileId);
  if (actor.role !== "admin")
    throw new CommerceError(403, "Active administrator access is required");
}
