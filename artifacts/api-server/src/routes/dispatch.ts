import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  db,
  profilesTable,
  driverPresenceTable,
  deliveriesTable,
  deliveryLocationsTable,
  ordersTable,
  restaurantsTable,
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";
import { CommerceError } from "../lib/commerce-policy";
const router: IRouter = Router();
const uuid = z.string().uuid();
export const presenceFreshMs = 90000;
export async function driverDispatchState(profileId: string) {
  const [presence] = await db
    .select()
    .from(driverPresenceTable)
    .where(eq(driverPresenceTable.profileId, profileId))
    .limit(1);
  const [active] = await db
    .select({ orderId: deliveriesTable.orderId })
    .from(deliveriesTable)
    .where(
      and(
        eq(deliveriesTable.driverProfileId, profileId),
        inArray(deliveriesTable.status, ["assigned", "picked_up"]),
      ),
    )
    .limit(1);
  return {
    available: presence?.available ?? false,
    online: Boolean(
      presence?.available &&
      Date.now() - presence.heartbeatAt.getTime() < presenceFreshMs,
    ),
    activeOrderId: active?.orderId ?? null,
  };
}
router.get("/driver/availability", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
  res.json({
    approved: profile.driverApproved,
    ...(await driverDispatchState(profile.id)),
  });
});
router.put("/driver/availability", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
  const { available } = z
    .object({ available: z.boolean() })
    .strict()
    .parse(req.body);
  if (available && !profile.driverApproved) throw new CommerceError(403, "Driver approval and an unexpired license are required");
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, profile.id))
      .for("update")
      .limit(1);
    if (
      available &&
      (!current.driverApproved ||
        !current.isActive ||
        !["driver","admin"].includes(current.role))
    )
      throw new CommerceError(403, "Driver approval is required to go online");
    await tx
      .insert(driverPresenceTable)
      .values({ profileId: profile.id, available })
      .onConflictDoUpdate({
        target: driverPresenceTable.profileId,
        set: { available, heartbeatAt: new Date() },
      });
  });
  res.json(await driverDispatchState(profile.id));
});
router.post(
  "/driver/orders/:orderId/location",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    const orderId = uuid.parse(req.params.orderId);
    const position = z
      .object({
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
        accuracyMeters: z.number().finite().min(0).max(10000),
        observedAt: z.coerce.date(),
      })
      .strict()
      .parse(req.body);
    const age = Date.now() - position.observedAt.getTime();
    if (age > 120000 || age < -30000)
      throw new CommerceError(
        400,
        "Location timestamp is stale or in the future",
      );
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update")
        .limit(1);
      const [delivery] = await tx
        .select()
        .from(deliveriesTable)
        .where(
          and(
            eq(deliveriesTable.orderId, orderId),
            eq(deliveriesTable.driverProfileId, profile.id),
            inArray(deliveriesTable.status, ["assigned", "picked_up"]),
          ),
        )
        .limit(1);
      if (
        !order ||
        !["ready_for_pickup", "out_for_delivery"].includes(order.status) ||
        !delivery
      )
        throw new CommerceError(
          403,
          "Only the assigned driver can share an active delivery location",
        );
      const [previous] = await tx
        .select()
        .from(deliveryLocationsTable)
        .where(eq(deliveryLocationsTable.deliveryId, delivery.id))
        .limit(1);
      if (previous && previous.observedAt >= position.observedAt)
        return { accepted: false, reason: "older_position" };
      if (previous && Date.now() - previous.receivedAt.getTime() < 5000)
        throw new CommerceError(
          429,
          "Location updates are limited to one every five seconds",
        );
      await tx
        .insert(deliveryLocationsTable)
        .values({
          ...position,
          deliveryId: delivery.id,
          driverProfileId: profile.id,
        })
        .onConflictDoUpdate({
          target: deliveryLocationsTable.deliveryId,
          set: {
            ...position,
            driverProfileId: profile.id,
            receivedAt: new Date(),
          },
        });
      return { accepted: true };
    });
    res.status(202).json(result);
  },
);
router.get("/orders/:orderId/tracking", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  const orderId = uuid.parse(req.params.orderId);
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, orderId))
    .limit(1);
  if (!order) throw new CommerceError(404, "Order not found");
  const [delivery] = await db
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.orderId, orderId))
    .limit(1);
  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.id, order.restaurantId))
    .limit(1);
  if (
    profile.role !== "admin" &&
    order.customerProfileId !== profile.id &&
    restaurant?.ownerProfileId !== profile.id &&
    delivery?.driverProfileId !== profile.id
  )
    throw new CommerceError(403, "You cannot view this delivery");
  const [location] = delivery
    ? await db
        .select()
        .from(deliveryLocationsTable)
        .where(eq(deliveryLocationsTable.deliveryId, delivery.id))
        .limit(1)
    : [];
  const active =
    order.status === "ready_for_pickup" || order.status === "out_for_delivery";
  const fresh = Boolean(
    location && Date.now() - location.observedAt.getTime() <= 120000,
  );
  res.json({
    orderId,
    status: order.status,
    driverAssigned: Boolean(delivery?.driverProfileId),
    location:
      active && fresh
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracyMeters: location.accuracyMeters,
            observedAt: location.observedAt,
          }
        : null,
    locationStatus: !active
      ? "not_active"
      : !location
        ? "not_shared"
        : fresh
          ? "current"
          : "stale",
  });
});
router.get("/admin/dispatch", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  const orders = await db
    .select({
      orderId: ordersTable.id,
      status: ordersTable.status,
      placedAt: ordersTable.placedAt,
      restaurantName: restaurantsTable.name,
      driverProfileId: deliveriesTable.driverProfileId,
      assignedAt: deliveriesTable.assignedAt,
    })
    .from(ordersTable)
    .innerJoin(
      restaurantsTable,
      eq(restaurantsTable.id, ordersTable.restaurantId),
    )
    .leftJoin(deliveriesTable, eq(deliveriesTable.orderId, ordersTable.id))
    .where(
      inArray(ordersTable.status, [
        "accepted",
        "preparing",
        "ready_for_pickup",
        "out_for_delivery",
      ]),
    )
    .orderBy(ordersTable.placedAt)
    .limit(200);
  const drivers = await db
    .select({
      profileId: profilesTable.id,
      displayName: profilesTable.displayName,
      approved: profilesTable.driverApproved,
      isActive: profilesTable.isActive,
      available: driverPresenceTable.available,
      heartbeatAt: driverPresenceTable.heartbeatAt,
    })
    .from(profilesTable)
    .leftJoin(
      driverPresenceTable,
      eq(driverPresenceTable.profileId, profilesTable.id),
    )
    .where(inArray(profilesTable.role, ["driver","admin"]))
    .limit(200);
  res.json({
    orders: orders.map((o) => ({
      ...o,
      waitingMinutes: Math.floor((Date.now() - o.placedAt.getTime()) / 60000),
    })),
    drivers: drivers.map((d) => ({
      ...d,
      online: Boolean(
        d.isActive &&
        d.approved &&
        d.available &&
        d.heartbeatAt &&
        Date.now() - d.heartbeatAt.getTime() < presenceFreshMs,
      ),
    })),
  });
});
export default router;
