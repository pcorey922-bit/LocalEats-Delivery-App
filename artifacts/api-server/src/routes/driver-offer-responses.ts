import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  profilesTable,
  ordersTable,
  paymentsTable,
  deliveriesTable,
  driverApplicationsTable,
  driverPresenceTable,
  driverOfferDeclinesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { hasDriverAccess } from "../lib/owner-access";
import { CommerceError } from "../lib/commerce-policy";
import { databaseNow } from "../lib/database-clock";
import { audit } from "../lib/commerce";
import { presenceFreshMs } from "./dispatch";
const router = Router();
router.post(
  "/driver/orders/:orderId/decline-offer",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    if (!profile.driverApproved)
      throw new CommerceError(403, "Driver approval is required");
    const orderId = z.string().uuid().parse(req.params.orderId);
    const input = z
      .object({
        reason: z
          .string()
          .trim()
          .min(5)
          .max(300)
          .default("Driver declined this unassigned offer"),
      })
      .strict()
      .parse(req.body ?? {});
    const declined = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, profile.id))
        .for("update")
        .limit(1);
      const [application] = await tx
        .select()
        .from(driverApplicationsTable)
        .where(eq(driverApplicationsTable.profileId, profile.id))
        .limit(1);
      if (!hasDriverAccess(current, application))
        throw new CommerceError(
          403,
          "Driver approval and an unexpired license are required",
        );
      const [presence] = await tx
        .select()
        .from(driverPresenceTable)
        .where(eq(driverPresenceTable.profileId, profile.id))
        .limit(1);
      if (
        !presence?.available ||
        Date.now() - presence.heartbeatAt.getTime() > presenceFreshMs
      )
        throw new CommerceError(409, "Go online before responding to offers");
      const [busy] = await tx
        .select({ id: deliveriesTable.id })
        .from(deliveriesTable)
        .where(
          and(
            eq(deliveriesTable.driverProfileId, profile.id),
            inArray(deliveriesTable.status, ["assigned", "picked_up"]),
          ),
        )
        .limit(1);
      if (busy)
        throw new CommerceError(
          409,
          "Finish or release your assigned delivery first",
        );
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update")
        .limit(1);
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, orderId))
        .limit(1);
      const [delivery] = await tx
        .select()
        .from(deliveriesTable)
        .where(eq(deliveriesTable.orderId, orderId))
        .limit(1);
      if (
        order?.status !== "ready_for_pickup" ||
        payment?.status !== "succeeded" ||
        delivery?.driverProfileId
      )
        throw new CommerceError(
          409,
          "This offer is no longer unassigned and ready for pickup",
        );
      const now = await databaseNow(tx);
      const [existing] = await tx
        .select()
        .from(driverOfferDeclinesTable)
        .where(
          and(
            eq(driverOfferDeclinesTable.driverProfileId, profile.id),
            eq(driverOfferDeclinesTable.orderId, orderId),
          ),
        )
        .limit(1);
      if (existing && existing.expiresAt > now) return existing;
      const values = {
        id: randomUUID(),
        driverProfileId: profile.id,
        orderId,
        reason: input.reason,
        declinedAt: now,
        expiresAt: new Date(now.getTime() + 15 * 60000),
      };
      const [saved] = await tx
        .insert(driverOfferDeclinesTable)
        .values(values)
        .onConflictDoUpdate({
          target: [
            driverOfferDeclinesTable.driverProfileId,
            driverOfferDeclinesTable.orderId,
          ],
          set: values,
        })
        .returning();
      await audit(tx, profile.id, "delivery.offer_declined", orderId, {
        declineId: saved.id,
        expiresAt: saved.expiresAt,
        reason: input.reason,
      });
      return saved;
    });
    res.json({
      orderId,
      declineId: declined.id,
      expiresAt: declined.expiresAt,
    });
  },
);
router.delete(
  "/driver/orders/:orderId/decline-offer",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    if (!profile.driverApproved)
      throw new CommerceError(403, "Driver approval is required");
    const orderId = z.string().uuid().parse(req.params.orderId);
    const { expectedDeclineId } = z
      .object({ expectedDeclineId: z.string().uuid() })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, profile.id))
        .for("update")
        .limit(1);
      const [application] = await tx
        .select()
        .from(driverApplicationsTable)
        .where(eq(driverApplicationsTable.profileId, profile.id))
        .limit(1);
      if (!hasDriverAccess(current, application))
        throw new CommerceError(403, "Driver approval is required");
      const [existing] = await tx
        .select()
        .from(driverOfferDeclinesTable)
        .where(
          and(
            eq(driverOfferDeclinesTable.driverProfileId, profile.id),
            eq(driverOfferDeclinesTable.orderId, orderId),
          ),
        )
        .limit(1);
      if (!existing) return;
      if (existing.id !== expectedDeclineId)
        throw new CommerceError(
          409,
          "Offer response changed. Refresh before reconsidering.",
        );
      await tx
        .delete(driverOfferDeclinesTable)
        .where(
          and(
            eq(driverOfferDeclinesTable.driverProfileId, profile.id),
            eq(driverOfferDeclinesTable.orderId, orderId),
          ),
        );
      await audit(tx, profile.id, "delivery.offer_reconsidered", orderId, {
        declineId: existing.id,
      });
    });
    res.json({ orderId, reconsidered: true });
  },
);
export default router;
