import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  db,
  ordersTable,
  guestSessionsTable,
  restaurantsTable,
  deliveriesTable,
  profilesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { getActiveProfile } from "../lib/current-profile";
import { CommerceError } from "../lib/commerce-policy";
import { audit } from "../lib/commerce";
const router = Router();
router.get("/orders/:orderId/guest-contact", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p) return;
  const id = z.string().uuid().parse(req.params.orderId);
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id));
  if (!order) throw new CommerceError(404, "Order not found");
  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, order.restaurantId));
  const [delivery] = await db
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.orderId, id));
  const active = [
    "accepted",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
  ].includes(order.status);
  const participant =
    (p.role === "restaurant" && restaurant?.ownerProfileId === p.id) ||
    (["driver", "admin"].includes(p.role) &&
      delivery?.driverProfileId === p.id &&
      ["assigned", "picked_up"].includes(delivery.status));
  if (p.role !== "admin" && (!active || !participant))
    throw new CommerceError(
      403,
      "Customer contact is limited to dispatch and active fulfillment participants",
    );
  const [contact] = await db
    .select({
      name: profilesTable.displayName,
      email: guestSessionsTable.email,
      phone: guestSessionsTable.phone,
    })
    .from(guestSessionsTable)
    .innerJoin(
      profilesTable,
      eq(profilesTable.id, guestSessionsTable.profileId),
    )
    .where(eq(guestSessionsTable.orderId, id));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (contact)
    await db.transaction((tx) =>
      audit(tx, p.id, "guest.contact.viewed", id, {
        purpose: p.role === "admin" ? "dispatch_support" : "active_fulfillment",
      }),
    );
  res.json(
    contact
      ? {
          name: contact.name,
          phone: contact.phone,
          ...(p.role === "admin" ? { email: contact.email } : {}),
        }
      : null,
  );
});
export default router;
