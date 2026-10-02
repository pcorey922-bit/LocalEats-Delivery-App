import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { GetMyDashboardResponse } from "@workspace/api-zod";
import { db, profilesTable } from "@workspace/db";
import {
  getAuthenticatedUserId,
  requireAuth,
} from "../middlewares/require-auth";
import { getDashboardSections } from "../lib/dashboard-sections";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = getAuthenticatedUserId(req);
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile setup is required" });
    return;
  }

  if (!profile.isActive) {
    res.status(403).json({ error: "This account is not active" });
    return;
  }

  res.json(
    GetMyDashboardResponse.parse({
      role: profile.role,
      displayName: profile.displayName,
      sections: getDashboardSections(profile.role),
    }),
  );
});

export default router;