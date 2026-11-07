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
