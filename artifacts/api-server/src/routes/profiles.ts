import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMyProfileBody,
  CreateMyProfileResponse,
  GetMyProfileResponse,
} from "@workspace/api-zod";
import { db, profilesTable, type Profile as ProfileRecord } from "@workspace/db";
import {
  getAuthenticatedUserId,
  requireAuth,
} from "../middlewares/require-auth";

const router: IRouter = Router();

function isConfiguredAdmin(clerkUserId: string): boolean {
  const configuredIds = process.env.LOCALEATS_ADMIN_CLERK_USER_IDS ?? "";
  return configuredIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(clerkUserId);
}

function toApiProfile(profile: ProfileRecord) {
  return {
    id: profile.id,
    role: profile.role,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
  };
}

router.get("/profiles/me", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = getAuthenticatedUserId(req);
  let [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile setup is required" });
    return;
  }

  // The owner can designate the first administrator through a server-only
  // Clerk user ID allowlist. No public profile input can grant this role.
  if (isConfiguredAdmin(clerkUserId) && profile.role !== "admin") {
    [profile] = await db
      .update(profilesTable)
      .set({ role: "admin" })
      .where(eq(profilesTable.id, profile.id))
      .returning();
  }

  if (!profile.isActive) {
    res.status(403).json({ error: "This account is not active" });
    return;
  }

  res.json(GetMyProfileResponse.parse(toApiProfile(profile)));
});

router.post("/profiles/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a valid account type and display name" });
    return;
  }

  const displayName = parsed.data.displayName.trim();
  if (!displayName) {
    res.status(400).json({ error: "A display name is required" });
    return;
  }

  const clerkUserId = getAuthenticatedUserId(req);
  const role = isConfiguredAdmin(clerkUserId) ? "admin" : parsed.data.role;
  const [profile] = await db
    .insert(profilesTable)
    .values({
      clerkUserId,
      role,
      displayName,
    })
    .onConflictDoNothing({ target: profilesTable.clerkUserId })
    .returning();

  if (!profile) {
    res.status(409).json({ error: "A LocalEats profile already exists for this account" });
    return;
  }

  res.status(201).json(CreateMyProfileResponse.parse(toApiProfile(profile)));
});

export default router;