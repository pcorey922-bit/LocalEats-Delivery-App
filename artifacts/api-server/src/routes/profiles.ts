import { isConfiguredOwner } from "../lib/owner-access";
import { getActiveProfile } from "../lib/current-profile";
import { audit } from "../lib/commerce";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateMyProfileBody,
  CreateMyProfileResponse,
  GetMyProfileResponse,
} from "@workspace/api-zod";
import {
  db,
  profilesTable,
  type Profile as ProfileRecord,
} from "@workspace/db";
import {
  getAuthenticatedUserId,
  requireAuth,
} from "../middlewares/require-auth";

const router: IRouter = Router();

router.get("/session/access", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const subject = getAuthenticatedUserId(req);
  const ownerMatched = isConfiguredOwner(subject);
  const [saved] = await db.select().from(profilesTable).where(eq(profilesTable.clerkUserId, subject)).limit(1);
  const profile = saved?.isActive || (!saved && ownerMatched)
    ? await getActiveProfile(req, res) : saved;
  if (res.headersSent) return;
  const configured = (value: string | undefined) => Boolean(value?.split(",").some(id => id.trim()));
  const driverMatched = (process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS || "").split(",").map(id => id.trim()).includes(subject);
  res.json({
    ownerConfigured: configured(process.env.LOCALEATS_ADMIN_CLERK_USER_IDS),
    ownerMatched,
    ownerDriverConfigured: configured(process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS),
    ownerDriverMatched: ownerMatched && driverMatched,
    profileStatus: !profile ? "setup_required" : profile.isActive ? "active" : "suspended",
    role: profile?.role ?? null,
    administrator: Boolean(profile?.isActive && profile.role === "admin"),
    superAdministrator: Boolean(profile?.isActive && profile.role === "admin" && ownerMatched),
    driver: Boolean(profile?.isActive && ["driver", "admin"].includes(profile.role) && profile.driverApproved),
    privateStaging: process.env.ROCOEATS_PRIVATE_STAGING === "true",
  });
});

function toApiProfile(profile: ProfileRecord) {
  return {
    id: profile.id,
    role: profile.role,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
  };
}

router.get("/profiles/me", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  res.json(GetMyProfileResponse.parse(toApiProfile(profile)));
});

router.post("/profiles/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Choose a valid account type and display name" });
    return;
  }

  const displayName = parsed.data.displayName.trim();
  if (!displayName) {
    res.status(400).json({ error: "A display name is required" });
    return;
  }

  const clerkUserId = getAuthenticatedUserId(req);
  const role = isConfiguredOwner(clerkUserId) ? "admin" : parsed.data.role;
  const profile = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(profilesTable)
      .values({
        clerkUserId,
        role,
        displayName,
      })
      .onConflictDoNothing({ target: profilesTable.clerkUserId })
      .returning();
    if (created && role === "admin")
      await audit(tx, created.id, "owner.bootstrap.granted", created.id, {
        source: "server_allowlist",
      });
    return created;
  });

  if (!profile) {
    res
      .status(409)
      .json({ error: "A LocalEats profile already exists for this account" });
    return;
  }

  res.status(201).json(CreateMyProfileResponse.parse(toApiProfile(profile)));
});

export default router;
