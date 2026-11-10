import { requireCustomerAuth } from "../lib/guest-access";
import { randomUUID } from "node:crypto";
import { hasDriverAccess, isOwnerDriver } from "../lib/owner-access";
import { audit, notifyOrder } from "../lib/commerce";
import {
  driverDutyLocationsTable,
  driverApplicationsTable,
  driverOfferDeclinesTable,
} from "@workspace/db";
import { and, desc, eq, inArray, lt, gt, sql } from "drizzle-orm";
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
  paymentsTable,
  notificationsTable,
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
    ownerDriverAccess: isOwnerDriver(profile),
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
  if (available && !profile.driverApproved)
    throw new CommerceError(
      403,
      "Driver approval and an unexpired license are required",
    );
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, profile.id))
      .for("update")
      .limit(1);
    if (available && !hasDriverAccess(current))
      throw new CommerceError(403, "Driver approval is required to go online");
    const [previous] = await tx
      .select()
      .from(driverPresenceTable)
      .where(eq(driverPresenceTable.profileId, profile.id));
    if (!available)
      await tx
        .delete(driverDutyLocationsTable)
        .where(eq(driverDutyLocationsTable.profileId, profile.id));
    if (previous?.available !== available)
      await audit(tx, profile.id, "driver.availability.updated", profile.id, {
        available,
      });
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
router.post("/driver/heartbeat", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
  if (!profile.driverApproved)
    throw new CommerceError(403, "Driver approval is required");
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, profile.id))
      .for("update");
    const [presence] = await tx
      .select()
      .from(driverPresenceTable)
      .where(eq(driverPresenceTable.profileId, profile.id));
    if (
      !hasDriverAccess(current) ||
      !presence?.available ||
      Date.now() - presence.heartbeatAt.getTime() >= presenceFreshMs
    )
      throw new CommerceError(
        409,
        "Reconnect explicitly before returning on duty",
      );
    await tx
      .update(driverPresenceTable)
      .set({ heartbeatAt: new Date() })
      .where(eq(driverPresenceTable.profileId, profile.id));
  });
  res.json({ online: true });
});

router.post("/driver/location", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
  if (!profile.driverApproved)
    throw new CommerceError(403, "Driver approval is required");
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
  const accepted = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, profile.id))
      .for("update");
    const [presence] = await tx
      .select()
      .from(driverPresenceTable)
      .where(eq(driverPresenceTable.profileId, profile.id));
    if (
      !hasDriverAccess(current) ||
      !presence?.available ||
      Date.now() - presence.heartbeatAt.getTime() >= presenceFreshMs
    )
      throw new CommerceError(409, "Go online before sharing duty location");
    const [previous] = await tx
      .select()
      .from(driverDutyLocationsTable)
      .where(eq(driverDutyLocationsTable.profileId, profile.id));
    if (previous && position.observedAt <= previous.observedAt) return false;
    await tx
      .insert(driverDutyLocationsTable)
      .values({ profileId: profile.id, ...position })
      .onConflictDoUpdate({
        target: driverDutyLocationsTable.profileId,
        set: { ...position, receivedAt: new Date() },
      });
    return true;
  });
  res.setHeader("Cache-Control", "no-store");
  res.json({ accepted });
});

router.post(
  "/driver/orders/:orderId/location",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    const orderId = uuid.parse(req.params.orderId);
    if (!profile.driverApproved)
      throw new CommerceError(403, "Driver access is required");
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
router.get("/orders/:orderId/tracking", requireCustomerAuth, async (req, res) => {
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
  const [assignedDriver] = delivery?.driverProfileId
    ? await db.select({displayName:profilesTable.displayName}).from(profilesTable).where(eq(profilesTable.id,delivery.driverProfileId)).limit(1)
    : [];
  const associated = Boolean(location && delivery?.driverProfileId===location.driverProfileId);
  const fresh = Boolean(
    associated && location && Date.now() - location.observedAt.getTime() <= 120000,
  );
  res.setHeader("Cache-Control","no-store");
  res.json({
    orderId,
    status: order.status,
    driverAssigned: Boolean(delivery?.driverProfileId),
    assignedDriver: assignedDriver ?? null,
    deliveryStatus: delivery?.status ?? "unassigned",
    arrivedAt: delivery?.arrivedAt ?? null,
    pickedUpAt: delivery?.pickedUpAt ?? null,
    deliveredAt: delivery?.deliveredAt ?? null,
    location:
      active && delivery?.driverProfileId === location?.driverProfileId && fresh
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracyMeters: location.accuracyMeters,
            observedAt: location.observedAt,
          }
        : null,
    locationStatus: !active
      ? "not_active"
      : !associated
        ? "not_shared"
        : fresh
          ? "current"
          : "stale",
  });
});
// Lock the destination driver before the order, matching driver claim lock order.
// An observed assignment token prevents stale operator actions from replacing newer work.
router.post(
  "/admin/orders/:orderId/assignment",
  requireAuth,
  async (req, res) => {
    const actor = await getActiveProfile(req, res);
    if (!actor || !requireRole(actor, ["admin"], res)) return;
    const orderId = uuid.parse(req.params.orderId);
    const input = z
      .object({
        driverProfileId: uuid.nullable(),
        expectedDriverProfileId: uuid.nullable(),
        expectedAssignedAt: z.string().datetime().nullable(),
        reason: z.string().trim().min(5).max(500),
      })
      .strict()
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      if (input.driverProfileId) {
        const [driver] = await tx
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.id, input.driverProfileId))
          .for("update");
        const [application] = await tx
          .select()
          .from(driverApplicationsTable)
          .where(eq(driverApplicationsTable.profileId, input.driverProfileId));
        const [presence] = await tx
          .select()
          .from(driverPresenceTable)
          .where(eq(driverPresenceTable.profileId, input.driverProfileId));
        if (!hasDriverAccess(driver, application))
          throw new CommerceError(
            409,
            "Select an active, approved driver with an unexpired application",
          );
        if (
          !presence?.available ||
          Date.now() - presence.heartbeatAt.getTime() >= presenceFreshMs
        )
          throw new CommerceError(409, "The selected driver must be online");
        const [decline]=await tx.select({id:driverOfferDeclinesTable.id}).from(driverOfferDeclinesTable).where(and(eq(driverOfferDeclinesTable.driverProfileId,driver.id),eq(driverOfferDeclinesTable.orderId,orderId),gt(driverOfferDeclinesTable.expiresAt,sql`now()`))).limit(1);
        if(decline)throw new CommerceError(409,"This driver declined the offer. Choose another driver or ask them to reconsider.");
        const [busy] = await tx
          .select()
          .from(deliveriesTable)
          .where(
            and(
              eq(deliveriesTable.driverProfileId, driver.id),
              inArray(deliveriesTable.status, ["assigned", "picked_up"]),
            ),
          )
          .limit(1);
        if (busy && busy.orderId !== orderId)
          throw new CommerceError(
            409,
            "The selected driver already has an active delivery",
          );
      }
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update");
      if (!order || order.status !== "ready_for_pickup")
        throw new CommerceError(
          409,
          "Only ready, unpicked orders can be assigned or released",
        );
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.orderId, orderId),
            eq(paymentsTable.status, "succeeded"),
          ),
        );
      if (!payment)
        throw new CommerceError(409, "A confirmed payment is required");
      const [previous] = await tx
        .select()
        .from(deliveriesTable)
        .where(eq(deliveriesTable.orderId, orderId));
      if (
        (previous?.driverProfileId ?? null) !== input.expectedDriverProfileId ||
        (previous?.assignedAt?.toISOString() ?? null) !==
          input.expectedAssignedAt
      )
        throw new CommerceError(
          409,
          "Assignment changed. Refresh dispatch before trying again",
        );
      if (previous && !["unassigned", "assigned"].includes(previous.status))
        throw new CommerceError(409, "This delivery cannot be reassigned");
      if ((previous?.driverProfileId ?? null) === input.driverProfileId)
        return { orderId, status: previous?.status ?? "unassigned" };
      const status = input.driverProfileId ? "assigned" : "unassigned";
      const assignedAt = input.driverProfileId
        ? new Date(
            Math.max(Date.now(), (previous?.assignedAt?.getTime() ?? 0) + 1),
          )
        : null;
      const [delivery] = await tx
        .insert(deliveriesTable)
        .values({
          orderId,
          driverProfileId: input.driverProfileId,
          status,
          assignedAt,
        })
        .onConflictDoUpdate({
          target: deliveriesTable.orderId,
          set: {
            driverProfileId: input.driverProfileId,
            status,
            assignedAt,
            arrivedAt: null,
            handoffHash: null,
            handoffExpiresAt: null,
            handoffAttempts: 0,
          },
        })
        .returning();
      await tx
        .delete(deliveryLocationsTable)
        .where(eq(deliveryLocationsTable.deliveryId, delivery.id));
      const event = `assignment:${randomUUID()}`;
      await notifyOrder(
        tx,
        orderId,
        event,
        input.driverProfileId
          ? "Driver assigned (test)"
          : "Finding another driver (test)",
        "Dispatch updated the delivery assignment. Open the order for current instructions.",
      );
      if (previous?.driverProfileId)
        await tx
          .insert(notificationsTable)
          .values({
            profileId: previous.driverProfileId,
            orderId,
            eventKey: `${orderId}:${event}`,
            title: "Assignment removed (test)",
            body: "Dispatch removed this assignment. Do not pick up this order.",
          })
          .onConflictDoNothing();
      await audit(tx, actor.id, "delivery.assignment.updated", orderId, {
        previousDriverProfileId: previous?.driverProfileId ?? null,
        driverProfileId: input.driverProfileId,
        reason: input.reason,
        previousAssignedAt: input.expectedAssignedAt,
        assignedAt,
      });
      return {
        orderId,
        status,
        driverProfileId: input.driverProfileId,
        assignedAt,
      };
    });
    res.json(result);
  },
);

router.get("/admin/dispatch", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["admin"], res)) return;
  const orders = await db
    .select({
      orderId: ordersTable.id,
      status: ordersTable.status,
      placedAt: ordersTable.placedAt,
      restaurantName: restaurantsTable.name,
      pickupStreet: restaurantsTable.street1,
      pickupCity: restaurantsTable.city,
      pickupRegion: restaurantsTable.region,
      pickupPostalCode: restaurantsTable.postalCode,
      deliveryAddress: ordersTable.addressSnapshot,
      driverProfileId: deliveriesTable.driverProfileId,
      assignedAt: deliveriesTable.assignedAt,
      arrivedAt: deliveriesTable.arrivedAt,
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
      clerkUserId: profilesTable.clerkUserId,
      role: profilesTable.role,
      displayName: profilesTable.displayName,
      approved: profilesTable.driverApproved,
      isActive: profilesTable.isActive,
      available: driverPresenceTable.available,
      heartbeatAt: driverPresenceTable.heartbeatAt,
      dutyLocation: driverDutyLocationsTable,
      applicationStatus: driverApplicationsTable.status,
      licenseExpiresOn: driverApplicationsTable.licenseExpiresOn,
    })
    .from(profilesTable)
    .leftJoin(
      driverPresenceTable,
      eq(driverPresenceTable.profileId, profilesTable.id),
    )
    .leftJoin(
      driverDutyLocationsTable,
      eq(driverDutyLocationsTable.profileId, profilesTable.id),
    )
    .leftJoin(
      driverApplicationsTable,
      eq(driverApplicationsTable.profileId, profilesTable.id),
    )
    .where(inArray(profilesTable.role, ["driver", "admin"]))
    .limit(200);
  const activeAssignments = drivers.length
    ? await db
        .select({
          driverProfileId: deliveriesTable.driverProfileId,
          orderId: deliveriesTable.orderId,
        })
        .from(deliveriesTable)
        .where(
          and(
            inArray(
              deliveriesTable.driverProfileId,
              drivers.map((d) => d.profileId),
            ),
            inArray(deliveriesTable.status, ["assigned", "picked_up"]),
          ),
        )
    : [];
  const mapKey = process.env.ROCOEATS_GOOGLE_MAPS_BROWSER_KEY?.trim();
  const mapId = process.env.ROCOEATS_GOOGLE_MAPS_MAP_ID?.trim();
  // Only the browser-restricted key and map ID belong in this admin response.
  // Omit when unset so previously configured web bundles keep working.
  const mapConfig =
    mapKey === undefined && mapId === undefined
      ? undefined
      : mapKey && mapId && mapId !== "DEMO_MAP_ID"
        ? { browserKey: mapKey, mapId }
        : null;
  res.setHeader("Cache-Control", "no-store");
  res.json({
    mapConfig,
    orders: orders.map((o) => ({
      ...o,
      waitingMinutes: Math.floor((Date.now() - o.placedAt.getTime()) / 60000),
    })),
    drivers: drivers.map(
      ({
        dutyLocation,
        applicationStatus,
        licenseExpiresOn,
        clerkUserId,
        role,
        ...d
      }) => {
        const approved = hasDriverAccess(
          {
            clerkUserId,
            role,
            isActive: d.isActive,
            driverApproved: d.approved,
          },
          applicationStatus
            ? {
                status: applicationStatus,
                licenseExpiresOn: licenseExpiresOn ?? "",
              }
            : null,
        );
        const online = Boolean(
          d.isActive &&
          approved &&
          d.available &&
          d.heartbeatAt &&
          Date.now() - d.heartbeatAt.getTime() < presenceFreshMs,
        );
        const activeOrder = activeAssignments.find(
          (o) => o.driverProfileId === d.profileId,
        );
        const location =
          online &&
          dutyLocation &&
          Date.now() - dutyLocation.receivedAt.getTime() < 15 * 60 * 1000
            ? {
                latitude: dutyLocation.latitude,
                longitude: dutyLocation.longitude,
                accuracyMeters: dutyLocation.accuracyMeters,
                observedAt: dutyLocation.observedAt,
                receivedAt: dutyLocation.receivedAt,
              }
            : null;
        return {
          ...d,
          approved,
          online,
          activeOrderId: activeOrder?.orderId ?? null,
          status: !d.isActive
            ? "suspended"
            : !approved
              ? "unapproved"
              : !d.available
                ? "offline"
                : !online
                  ? "disconnected"
                  : activeOrder
                    ? "delivering"
                    : "available",
          location,
          locationStatus: !online
            ? "not_sharing"
            : !location
              ? "missing"
              : Date.now() - location.observedAt.getTime() > 120000
                ? "stale"
                : "fresh",
        };
      },
    ),
  });
});
export default router;
