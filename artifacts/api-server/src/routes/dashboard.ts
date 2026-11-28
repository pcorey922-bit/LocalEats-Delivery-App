import { Router, type IRouter } from "express";
import { GetMyDashboardResponse } from "@workspace/api-zod";
import { getActiveProfile } from "../lib/current-profile";
import {
  requireAuth,
} from "../middlewares/require-auth";
import { getDashboardSections } from "../lib/dashboard-sections";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;

  res.json(
    GetMyDashboardResponse.parse({
      role: profile.role,
      displayName: profile.displayName,
      sections: getDashboardSections(profile.role),
    }),
  );
});

export default router;
