import { eq } from "drizzle-orm";
import { profilesTable, driverApplicationsTable } from "@workspace/db";
import type { Transaction } from "./commerce";
import { CommerceError } from "./commerce-policy";
import { hasDriverAccess } from "./owner-access";

export async function requireLockedDriverAccess(
  tx: Transaction,
  profileId: string,
) {
  // Serialize permission changes before locking the order, matching claim and
  // dispatch. NO KEY UPDATE permits notification FK checks while still blocking
  // approval/profile updates; it never changes the profile's primary key.
  const [current] = await tx
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, profileId))
    .for("no key update");
  const [application] = await tx
    .select()
    .from(driverApplicationsTable)
    .where(eq(driverApplicationsTable.profileId, profileId));
  if (!hasDriverAccess(current, application))
    throw new CommerceError(
      403,
      "Active driver approval and an unexpired license are required",
    );
}
