import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import {
  db,
  profilesTable,
  driverApplicationsTable,
  type Profile,
} from "@workspace/db";
import { getAuthenticatedUserId } from "../middlewares/require-auth";
import { isConfiguredOwner, hasDriverAccess } from "./owner-access";
import { audit } from "./commerce";
export async function getActiveProfile(
  req: Request,
  res: Response,
): Promise<Profile | null> {
  const clerkUserId = getAuthenticatedUserId(req);
  let [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, clerkUserId))
    .limit(1);
  if (!profile) {
    if (isConfiguredOwner(clerkUserId)) {
      await db.transaction(async (tx) => {
        const [created] = await tx.insert(profilesTable).values({
          clerkUserId, role: "admin", displayName: "RoCoEats owner",
        }).onConflictDoNothing({ target: profilesTable.clerkUserId }).returning();
        if (created) await audit(tx, created.id, "owner.bootstrap.granted", created.id, { source: "server_allowlist" });
      });
      [profile] = await db.select().from(profilesTable).where(eq(profilesTable.clerkUserId, clerkUserId)).limit(1);
    }
  }
  if (!profile) {
    res.status(404).json({ error: "Profile setup is required" });
    return null;
  }
  if (!profile.isActive) {
    res.status(403).json({ error: "This account is not active" });
    return null;
  }
  if (isConfiguredOwner(clerkUserId) && profile.role !== "admin") {
    profile = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, profile.id))
        .for("update");
      if (!current.isActive || current.role === "admin") return current;
      const [updated] = await tx
        .update(profilesTable)
        .set({ role: "admin" })
        .where(eq(profilesTable.id, current.id))
        .returning();
      await audit(tx, current.id, "owner.bootstrap.granted", current.id, {
        source: "server_allowlist",
      });
      return updated;
    });
    if (!profile.isActive) {
      res.status(403).json({ error: "This account is not active" });
      return null;
    }
  }
  if (["driver", "admin"].includes(profile.role)) {
    const [application] = await db
      .select()
      .from(driverApplicationsTable)
      .where(eq(driverApplicationsTable.profileId, profile.id));
    // Effective permission only. Do not invent application approval/check results.
    profile = {
      ...profile,
      driverApproved: hasDriverAccess(profile, application),
    };
  }
  return profile;
}
export function requireRole(
  profile: Profile,
  allowedRoles: Profile["role"][],
  res: Response,
): boolean {
  if (!allowedRoles.includes(profile.role)) {
    res
      .status(403)
      .json({ error: "Your account role cannot access this resource" });
    return false;
  }
  return true;
}
