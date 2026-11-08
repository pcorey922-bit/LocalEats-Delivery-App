import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

// Admission is separate from roles: admitted testers still need ordinary approval.
// Stripe's signed raw webhook is mounted before this middleware intentionally.
export const privateStaging: RequestHandler = (req, res, next) => {
  if (process.env.ROCOEATS_PRIVATE_STAGING !== "true") return next();
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to access private RoCoEats staging" });
    return;
  }
  const allowed = [process.env.LOCALEATS_ADMIN_CLERK_USER_IDS,
    process.env.ROCOEATS_STAGING_TESTER_CLERK_USER_IDS]
    .flatMap(value => (value || "").split(",").map(id => id.trim()).filter(Boolean));
  if (!allowed.includes(userId)) {
    res.status(403).json({ error: "This account has not been invited to RoCoEats staging" });
    return;
  }
  next();
};
