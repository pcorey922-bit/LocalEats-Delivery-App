import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db, profilesTable, type Profile } from "@workspace/db";
import { getAuthenticatedUserId } from "../middlewares/require-auth";

export async function getActiveProfile(
  req: Request,
  res: Response,
): Promise<Profile | null> {
  const clerkUserId = getAuthenticatedUserId(req);
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile setup is required" });
    return null;
  }

  if (!profile.isActive) {
    res.status(403).json({ error: "This account is not active" });
    return null;
  }

  return profile;
}

export function requireRole(
  profile: Profile,
  allowedRoles: Profile["role"][],
  res: Response,
): boolean {
  if (!allowedRoles.includes(profile.role)) {
    res.status(403).json({ error: "Your account role cannot access this resource" });
    return false;
  }

  return true;
}