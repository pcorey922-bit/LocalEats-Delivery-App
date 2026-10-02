import { getAuth } from "@clerk/express";
import type { Request, RequestHandler } from "express";

type RequestWithAuthUser = Request & { authUserId?: string };

export const requireAuth: RequestHandler = (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign-in is required" });
    return;
  }

  (req as RequestWithAuthUser).authUserId = userId;
  next();
};

export function getAuthenticatedUserId(req: Request): string {
  const userId = (req as RequestWithAuthUser).authUserId;
  if (!userId) {
    throw new Error("Authenticated route is missing the Clerk user id");
  }
  return userId;
}