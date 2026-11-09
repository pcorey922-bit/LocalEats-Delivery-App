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
async function mintGuest(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  input: { name: string; email: string; phone: string },
) {
  const token = randomBytes(32).toString("base64url"),
    now = await databaseNow(tx);
  const [profile] = await tx
    .insert(profilesTable)
    .values({
      clerkUserId: `guest_${randomUUID()}`,
      displayName: input.name,
      role: "customer",
    })
    .returning();
  const [session] = await tx
    .insert(guestSessionsTable)
    .values({
      profileId: profile.id,
      tokenHash: guestTokenHash(token),
      email: input.email,
      phone: input.phone,
      expiresAt: new Date(now.getTime() + 7 * 86400000),
    })
    .returning();
  await audit(tx, profile.id, "guest.session.created", session.id);
  return { token, expiresAt: session.expiresAt };
}

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
        .regex(/^[+()0-9 .-]+$/)
        .refine((value) => {
          const n = value.replace(/\D/g, "").length;
          return n >= 10 && n <= 15;
        }, "Enter a delivery phone with area code"),
    })
    .strict()
    .parse(req.body);
  const result = await db.transaction((tx) => mintGuest(tx, input));
  res.status(201).json(result);
});
router.post("/guest/session/next", requireCustomerAuth, async (req, res) => {
  const guest = (req as GuestRequest).guestSession;
  if (!guest)
    throw new CommerceError(
      400,
      "Use guest access to start another guest checkout",
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
        .regex(/^[+()0-9 .-]+$/)
        .refine((value) => {
          const n = value.replace(/\D/g, "").length;
          return n >= 10 && n <= 15;
        }, "Enter a delivery phone with area code"),
      previousLinkSaved: z.literal(true),
    })
    .strict()
    .parse(req.body);
  await guestRateLimit(`next:${guest.id}`, 20, 3600);
  const result = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(guestSessionsTable)
      .where(eq(guestSessionsTable.id, guest.id))
      .for("update");
    if (
      current.revokedAt ||
      current.expiresAt <= (await databaseNow(tx)) ||
      !current.orderId
    )
      throw new CommerceError(
        409,
        "Guest order access changed or no completed/cancelled order exists",
      );
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, current.orderId))
      .for("update");
    if (!["cancelled", "delivered"].includes(order.status))
      throw new CommerceError(
        409,
        "Complete or cancel this order before starting another guest checkout",
      );
    const next = await mintGuest(tx, input);
    await audit(tx, guest.profileId, "guest.next_checkout.created", order.id);
    return next;
  });
  res.status(201).json(result);
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
    await tx
      .update(supportCasesTable)
      .set({ createdBy: profile.id })
      .where(
        and(
          eq(supportCasesTable.createdBy, session.profileId),
          eq(supportCasesTable.orderId, order.id),
        ),
      );
    await tx
      .update(notificationsTable)
      .set({ profileId: profile.id })
      .where(
        and(
          eq(notificationsTable.profileId, session.profileId),
          eq(notificationsTable.orderId, order.id),
        ),
      );
    await audit(tx, profile.id, "guest.order.claimed", order.id, {
      guestSessionId: session.id,
    });
    return order.id;
  });
  res.json({ orderId });
});
export default router;
