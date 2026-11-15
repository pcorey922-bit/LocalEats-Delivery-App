import { eq } from "drizzle-orm";
import { profilesTable } from "@workspace/db";
import type { Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";

export async function requireLockedAdministrator(
  tx: Transaction,
  profileId: string,
) {
  // Recheck after provider reads, before financial/order locks or writes. This
  // serializes role changes but permits concurrent audit/notification FK checks.
  const [actor] = await tx
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, profileId))
    .for("no key update");
  if (!actor?.isActive || actor.role !== "admin")
    throw new CommerceError(403, "Active administrator access is required");
}
