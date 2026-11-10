import { readGuest, guestStagingPath } from "../lib/guest-access";
import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export function stagingAdmits(userId: string) {
  return process.env.ROCOEATS_PRIVATE_STAGING !== "true" ||
    [process.env.LOCALEATS_ADMIN_CLERK_USER_IDS, process.env.ROCOEATS_STAGING_TESTER_CLERK_USER_IDS]
      .flatMap(value => (value || "").split(",").map(id => id.trim()).filter(Boolean))
      .includes(userId);
}

// Admission is separate from roles: admitted testers still need ordinary approval.
// Stripe's signed raw webhook is mounted before this middleware intentionally.
export const privateStaging: RequestHandler = async (req, res, next) => {
  // Signed-in users may inspect only their own access, including an identity
  // accidentally omitted from staging. The handler still requires real auth.
  if (req.method === "GET" && req.path === "/session/access") return next();
  if (process.env.ROCOEATS_PRIVATE_STAGING !== "true") return next();
  if(req.method==="GET" && req.path==="/mobile/readiness")return next();
  if(req.method==="POST" && ["/mobile/auth/start","/mobile/auth/redeem"].includes(req.path)) return next();
  const userId = getAuth(req).userId;
  if (!userId && req.header("X-RoCoEats-Guest-Token") && guestStagingPath(req.method,req.path)) { await readGuest(req); next(); return; }
  if (!userId) {
    res.status(401).json({ error: "Sign in to access private RoCoEats staging" });
    return;
  }
  if (!stagingAdmits(userId)) {
    res.status(403).json({ error: "This account has not been invited to RoCoEats staging" });
    return;
  }
  next();
};
