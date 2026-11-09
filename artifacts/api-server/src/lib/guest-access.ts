import { createHash } from "node:crypto";
import { getAuth } from "@clerk/express";
import type { Request, RequestHandler } from "express";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import {
  db,
  guestSessionsTable,
  profilesTable,
  requestLimitsTable,
} from "@workspace/db";
import { CommerceError } from "./commerce-policy";
export type GuestSession = typeof guestSessionsTable.$inferSelect;
export type GuestRequest = Request & {
  guestSession?: GuestSession;
  authUserId?: string;
};
export function guestTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function guestRateLimit(
  key: string,
  maximum: number,
  seconds = 60,
) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const [row] = await db
    .insert(requestLimitsTable)
    .values({
      bucketKey: guestTokenHash(`guest:${key}:${seconds}:${bucket}`),
      expiresAt: new Date((bucket + 2) * seconds * 1000),
    })
    .onConflictDoUpdate({
      target: requestLimitsTable.bucketKey,
      set: { requests: sql`least(${requestLimitsTable.requests}+1,10001)` },
    })
    .returning();
  if (row.requests > maximum)
    throw new CommerceError(
      429,
      "Too many guest requests. Please retry later.",
    );
}
export async function readGuest(req: Request) {
  await guestRateLimit(`read-ip:${req.ip || req.socket.remoteAddress}`, 600);
  const token = req.header("X-RoCoEats-Guest-Token");
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new CommerceError(
      401,
      "Guest access is missing or expired. Use your saved private tracking link or contact support.",
    );
  await guestRateLimit(`token:${guestTokenHash(token)}`, 180);
  const [session] = await db
    .select()
    .from(guestSessionsTable)
    .where(
      and(
        eq(guestSessionsTable.tokenHash, guestTokenHash(token)),
        isNull(guestSessionsTable.revokedAt),
        gt(guestSessionsTable.expiresAt, sql`now()`),
      ),
    )
    .limit(1);
  if (!session)
    throw new CommerceError(
      401,
      "Guest access is missing or expired. Use your saved private tracking link or contact support.",
    );
  return session;
}
// Applied ONLY to customer endpoints. Admin/restaurant/driver routes retain Clerk auth.
export const requireCustomerAuth: RequestHandler = async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  const userId = getAuth(req).userId;
  if (userId) {
    (req as GuestRequest).authUserId = userId;
    next();
    return;
  }
  const session = await readGuest(req);
  if (req.params.orderId && session.orderId !== req.params.orderId)
    throw new CommerceError(404, "Order not found");
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, session.profileId))
    .limit(1);
  if (
    !profile?.isActive ||
    profile.role !== "customer" ||
    !profile.clerkUserId.startsWith("guest_")
  )
    throw new CommerceError(401, "Guest access is unavailable");
  (req as GuestRequest).guestSession = session;
  (req as GuestRequest).authUserId = profile.clerkUserId;
  next();
};
export function guestStagingPath(method: string, path: string) {
  return (
    (method === "GET" &&
      (/^\/restaurants(?:\/[0-9a-f-]+(?:\/availability)?)?$/.test(path) ||
        path === "/commerce/config" ||
        path === "/healthz")) ||
    /^\/(?:guest\/session|addresses\/me(?:\/[0-9a-f-]+)?|orders(?:\/(?:me|quote|[0-9a-f-]+)(?:\/(?:checkout|payment|cancel|tracking|delivery-code|delivery-proof|financial-operations|confirmation))?)?|support\/cases(?:\/[0-9a-f-]+(?:\/messages)?)?)$/.test(
      path,
    )
  );
}
