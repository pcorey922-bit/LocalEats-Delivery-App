import { randomBytes, randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  db,
  guestSessionsTable,
  profilesTable,
  ordersTable,
  supportCasesTable,
  notificationsTable,
} from "@workspace/db";
import {
  guestRateLimit,
  guestTokenHash,
  requireCustomerAuth,
  type GuestRequest,
} from "../lib/guest-access";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { audit } from "../lib/commerce";
import { databaseNow } from "../lib/database-clock";
import { CommerceError } from "../lib/commerce-policy";
const router = Router();
router.post("/guest/sessions", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  await guestRateLimit(
    `create:${req.ip || req.socket.remoteAddress}`,
    30,
    3600,
  );
  const input = z
    .object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(254),
      phone: z
        .string()
        .trim()
        .min(7)
        .max(30)
        .regex(/^[+()0-9 .-]+$/),
    })
    .strict()
    .parse(req.body);
  const token = randomBytes(32).toString("base64url");
  const session = await db.transaction(async (tx) => {
    const now = await databaseNow(tx);
    const [profile] = await tx
      .insert(profilesTable)
      .values({
        clerkUserId: `guest_${randomUUID()}`,
        displayName: input.name,
        role: "customer",
      })
      .returning();
    const [created] = await tx
      .insert(guestSessionsTable)
      .values({
        profileId: profile.id,
        tokenHash: guestTokenHash(token),
        email: input.email,
        phone: input.phone,
        expiresAt: new Date(now.getTime() + 7 * 86400000),
      })
      .returning();
    await audit(tx, profile.id, "guest.session.created", created.id);
    return created;
  });
  res.status(201).json({ token, expiresAt: session.expiresAt });
});
router.get("/guest/session", requireCustomerAuth, async (req, res) => {
  const session = (req as GuestRequest).guestSession;
  if (!session)
    throw new CommerceError(400, "Use guest access to retrieve a guest order");
  res.json({ orderId: session.orderId, expiresAt: session.expiresAt });
});
router.delete("/guest/session", requireCustomerAuth, async (req, res) => {
  const session = (req as GuestRequest).guestSession;
  if (!session) throw new CommerceError(400, "Guest access required");
  await db.transaction(async (tx) => {
    await tx
      .update(guestSessionsTable)
      .set({ revokedAt: await databaseNow(tx) })
      .where(eq(guestSessionsTable.id, session.id));
    await audit(tx, session.profileId, "guest.session.revoked", session.id);
  });
  res.json({ revoked: true });
});
// Possession of the live scoped capability + authenticated customer identity is required.
// Email equality alone NEVER associates guest orders with a registered account.
router.post("/guest/claim", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["customer"], res)) return;
  const { readGuest } = await import("../lib/guest-access");
  const access = await readGuest(req);
  const orderId = await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(guestSessionsTable)
      .where(eq(guestSessionsTable.id, access.id))
      .for("update");
    const now = await databaseNow(tx);
    if (session.revokedAt || session.expiresAt <= now || !session.orderId)
      throw new CommerceError(
        409,
        "Guest order access changed or no order exists",
      );
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, session.orderId))
      .for("update");
    if (order.customerProfileId !== session.profileId)
      throw new CommerceError(409, "Guest order is already associated");
    await tx
      .update(ordersTable)
      .set({ customerProfileId: profile.id })
      .where(
        and(
          eq(ordersTable.id, order.id),
          eq(ordersTable.customerProfileId, session.profileId),
        ),
      );
    await tx
      .update(guestSessionsTable)
      .set({ revokedAt: now })
      .where(eq(guestSessionsTable.id, session.id));
    await tx.update(supportCasesTable).set({createdBy:profile.id}).where(and(eq(supportCasesTable.createdBy,session.profileId),eq(supportCasesTable.orderId,order.id)));
    await tx.update(notificationsTable).set({profileId:profile.id}).where(and(eq(notificationsTable.profileId,session.profileId),eq(notificationsTable.orderId,order.id)));
    await audit(tx, profile.id, "guest.order.claimed", order.id, {
      guestSessionId: session.id,
    });
    return order.id;
  });
  res.json({ orderId });
});
export default router;
