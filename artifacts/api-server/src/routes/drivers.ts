import {
  randomInt,
  randomUUID,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { CommerceError } from "../lib/commerce-policy";
import { hasDriverAccess } from "../lib/owner-access";
import { notifyOrder, createEarnings, audit } from "../lib/commerce";
import { driverDispatchState, presenceFreshMs } from "./dispatch";
import { and, eq, isNull, desc, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  deliveriesTable,
  ordersTable,
  orderEventsTable,
  paymentsTable,
  restaurantsTable,
  profilesTable,
  driverPresenceTable,
  deliveryLocationsTable,
  driverApplicationsTable,
  notificationsTable,
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

// Codes are returned only to the order's customer, never to drivers or notifications.
const handoffDigest = (orderId: string, salt: string, code: string) =>
  createHash("sha256").update(`${orderId}:${salt}:${code}`).digest("hex");
router.post("/orders/:orderId/delivery-code", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["customer"], res)) return;
  const orderId = String(req.params.orderId);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderId,
    )
  )
    throw new CommerceError(400, "Invalid order");
  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  const salt = randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.customerProfileId, profile.id),
        ),
      )
      .for("update");
    if (!order) throw new CommerceError(404, "Order not found");
    const [delivery] = await tx
      .select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.orderId, orderId));
    if (order.status !== "out_for_delivery" || delivery?.status !== "picked_up")
      throw new CommerceError(
        409,
        "A handoff code is available after driver pickup",
      );
    await tx
      .update(deliveriesTable)
      .set({
        handoffHash: salt + ":" + handoffDigest(orderId, salt, code),
        handoffExpiresAt: expiresAt,
        handoffAttempts: 0,
      })
      .where(eq(deliveriesTable.id, delivery.id));
    await audit(tx, profile.id, "delivery.handoff_code.issued", orderId);
  });
  res.setHeader("Cache-Control", "no-store");
  res.json({ code, expiresAt });
});
router.get("/orders/:orderId/delivery-proof", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile) return;
  const orderId = String(req.params.orderId);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderId,
    )
  )
    throw new CommerceError(400, "Invalid order");
  const [record] = await db
    .select({
      customerId: ordersTable.customerProfileId,
      driverId: deliveriesTable.driverProfileId,
      confirmedAt: deliveriesTable.proofConfirmedAt,
    })
    .from(ordersTable)
    .innerJoin(deliveriesTable, eq(deliveriesTable.orderId, ordersTable.id))
    .where(eq(ordersTable.id, orderId));
  if (
    !record ||
    (profile.role !== "admin" &&
      record.customerId !== profile.id &&
      record.driverId !== profile.id)
  )
    throw new CommerceError(404, "Delivery proof not found");
  res.setHeader("Cache-Control", "no-store");
  res.json(
    record.confirmedAt
      ? { method: "customer_code", confirmedAt: record.confirmedAt }
      : null,
  );
});

// Drivers can see orders ready for pickup without seeing customer addresses
// until they have successfully claimed a delivery.
router.get("/driver/offers", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
  if (!profile.driverApproved)
    throw new CommerceError(
      403,
      "Driver approval is required before accessing deliveries",
    );
  const state = await driverDispatchState(profile.id);
  if (!state.online)
    throw new CommerceError(409, "Go online to receive delivery offers");
  if (state.activeOrderId) {
    res.json([]);
    return;
  }
  const offers = await db
    .select({
      orderId: ordersTable.id,
      restaurantId: ordersTable.restaurantId,
      status: ordersTable.status,
      restaurantName: restaurantsTable.name,
      pickupStreet: restaurantsTable.street1,
      pickupCity: restaurantsTable.city,
      pickupRegion: restaurantsTable.region,
      pickupPostalCode: restaurantsTable.postalCode,
      deliveryFeeCents: ordersTable.deliveryFeeCents,
      tipCents: ordersTable.tipCents,
    })
    .from(ordersTable)
    .innerJoin(
      restaurantsTable,
      eq(restaurantsTable.id, ordersTable.restaurantId),
    )
    .innerJoin(
      paymentsTable,
      and(
        eq(paymentsTable.orderId, ordersTable.id),
        eq(paymentsTable.status, "succeeded"),
      ),
    )
    .leftJoin(deliveriesTable, eq(deliveriesTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.status, "ready_for_pickup"),
        isNull(deliveriesTable.driverProfileId),
      ),
    )
    .limit(50);
  res.json(offers);
});

router.get(
  "/driver/deliveries",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    if (!profile.driverApproved)
      throw new CommerceError(
        403,
        "Driver approval is required before accessing deliveries",
      );
    const deliveries = await db
      .select({
        orderId: ordersTable.id,
        status: deliveriesTable.status,
        orderStatus: ordersTable.status,
        arrivedAt: deliveriesTable.arrivedAt,
        restaurantName: restaurantsTable.name,
        pickupStreet: restaurantsTable.street1,
        pickupCity: restaurantsTable.city,
        pickupRegion: restaurantsTable.region,
        pickupPostalCode: restaurantsTable.postalCode,
        deliveryAddress: ordersTable.addressSnapshot,
      })
      .from(deliveriesTable)
      .innerJoin(ordersTable, eq(ordersTable.id, deliveriesTable.orderId))
      .innerJoin(
        restaurantsTable,
        eq(restaurantsTable.id, ordersTable.restaurantId),
      )
      .where(eq(deliveriesTable.driverProfileId, profile.id))
      .orderBy(desc(deliveriesTable.createdAt))
      .limit(100);
    res.json(deliveries);
  },
);

router.post(
  "/driver/orders/:orderId/claim",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    if (!profile.driverApproved)
      throw new CommerceError(
        403,
        "Driver approval is required before accessing deliveries",
      );
    const { orderId } = req.params;
    if (
      typeof orderId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    ) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }
    const claimed = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(profilesTable)
        .where(eq(profilesTable.id, profile.id))
        .for("update")
        .limit(1);
      if (!hasDriverAccess(current))
        throw new CommerceError(403, "Driver approval is required");
      const [application] = await tx
        .select()
        .from(driverApplicationsTable)
        .where(eq(driverApplicationsTable.profileId, profile.id));
      if (!hasDriverAccess(current, application))
        throw new CommerceError(
          403,
          "An approved, unexpired driver application is required",
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
        throw new CommerceError(409, "Go online before claiming a delivery");
      const [active] = await tx
        .select()
        .from(deliveriesTable)
        .where(
          and(
            eq(deliveriesTable.driverProfileId, profile.id),
            inArray(deliveriesTable.status, ["assigned", "picked_up"]),
          ),
        )
        .limit(1);
      if (active) {
        if (active.orderId === orderId && active.status === "assigned")
          return true;
        throw new CommerceError(
          409,
          "Finish or release the current delivery before claiming another",
        );
      }

      await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update");

      const [order] = await tx
        .select({ id: ordersTable.id })
        .from(ordersTable)
        .innerJoin(
          paymentsTable,
          and(
            eq(paymentsTable.orderId, ordersTable.id),
            eq(paymentsTable.status, "succeeded"),
          ),
        )
        .where(
          and(
            eq(ordersTable.id, orderId),
            eq(ordersTable.status, "ready_for_pickup"),
          ),
        )
        .limit(1);
      if (!order) return false;
      await tx
        .insert(deliveriesTable)
        .values({ orderId, status: "unassigned" })
        .onConflictDoNothing({ target: deliveriesTable.orderId });
      const [updated] = await tx
        .update(deliveriesTable)
        .set({
          driverProfileId: profile.id,
          status: "assigned",
          assignedAt: new Date(),
        })
        .where(
          and(
            eq(deliveriesTable.orderId, orderId),
            eq(deliveriesTable.status, "unassigned"),
            isNull(deliveriesTable.driverProfileId),
          ),
        )
        .returning({ id: deliveriesTable.id });
      if (updated) {
        await notifyOrder(
          tx,
          orderId,
          "driver.assigned",
          "Driver assigned (test)",
          "A driver claimed this delivery.",
        );
        await audit(tx, profile.id, "delivery.claimed", orderId);
      }
      return Boolean(updated);
    });
    if (!claimed) {
      res
        .status(409)
        .json({ error: "Delivery unavailable or already claimed" });
      return;
    }
    res.status(201).json({ orderId, status: "assigned" });
  },
);

router.post(
  "/driver/orders/:orderId/release",
  requireAuth,
  async (req, res) => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    if (!profile.driverApproved)
      throw new CommerceError(403, "Driver approval is required");
    const orderId = req.params.orderId;
    if (
      typeof orderId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    )
      throw new CommerceError(400, "Invalid order ID");
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update")
        .limit(1);
      if (order?.status !== "ready_for_pickup")
        throw new CommerceError(
          409,
          "Only unpicked deliveries may be released",
        );
      const [delivery] = await tx
        .update(deliveriesTable)
        .set({
          driverProfileId: null,
          status: "unassigned",
          assignedAt: null,
          arrivedAt: null,
        })
        .where(
          and(
            eq(deliveriesTable.orderId, orderId),
            eq(deliveriesTable.driverProfileId, profile.id),
            eq(deliveriesTable.status, "assigned"),
          ),
        )
        .returning();
      if (!delivery)
        throw new CommerceError(
          409,
          "Delivery cannot be released by this driver",
        );
      await tx
        .delete(deliveryLocationsTable)
        .where(eq(deliveryLocationsTable.deliveryId, delivery.id));
      const eventKey = `released:${randomUUID()}`;
      await tx.insert(notificationsTable).values({
        profileId: profile.id,
        orderId,
        eventKey: `${orderId}:${eventKey}`,
        title: "Delivery released (test)",
        body: "You released this delivery before pickup.",
      });
      await audit(tx, profile.id, "delivery.released", orderId);
      await notifyOrder(
        tx,
        orderId,
        eventKey,
        "Finding another driver (test)",
        "The driver released this delivery before pickup.",
      );
    });
    res.json({ orderId, status: "unassigned" });
  },
);

router.post("/driver/orders/:orderId/arrive", requireAuth, async (req, res) => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
  if (!profile.driverApproved)
    throw new CommerceError(403, "Driver approval is required");
  const orderId = String(req.params.orderId);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderId,
    )
  )
    throw new CommerceError(400, "Invalid order ID");
  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .for("update");
    const [delivery] = await tx
      .select()
      .from(deliveriesTable)
      .where(
        and(
          eq(deliveriesTable.orderId, orderId),
          eq(deliveriesTable.driverProfileId, profile.id),
        ),
      );
    if (
      !order ||
      order.status !== "ready_for_pickup" ||
      delivery?.status !== "assigned"
    )
      throw new CommerceError(
        409,
        "Only the assigned driver can confirm arrival before pickup",
      );
    if (delivery.arrivedAt) return { orderId, arrivedAt: delivery.arrivedAt };
    const arrivedAt = new Date();
    await tx
      .update(deliveriesTable)
      .set({ arrivedAt })
      .where(eq(deliveriesTable.id, delivery.id));
    await notifyOrder(
      tx,
      orderId,
      `arrival:${randomUUID()}`,
      "Driver at restaurant (test)",
      "The assigned driver reported arrival at the restaurant. Coordinate pickup in the order.",
    );
    await audit(tx, profile.id, "delivery.arrived", orderId, {
      assignedAt: delivery.assignedAt,
      method: "driver_attestation",
    });
    return { orderId, arrivedAt };
  });
  res.json(result);
});

router.post(
  "/driver/orders/:orderId/:action",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver", "admin"], res)) return;
    if (!profile.driverApproved)
      throw new CommerceError(
        403,
        "Driver approval is required before accessing deliveries",
      );
    const { orderId, action } = req.params;
    if (
      typeof orderId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId,
      ) ||
      typeof action !== "string" ||
      !["pickup", "deliver"].includes(action)
    ) {
      res.status(400).json({ error: "Invalid delivery action" });
      return;
    }
    const fromDelivery = action === "pickup" ? "assigned" : "picked_up";
    const toDelivery = action === "pickup" ? "picked_up" : "delivered";
    const fromOrder =
      action === "pickup" ? "ready_for_pickup" : "out_for_delivery";
    const toOrder = action === "pickup" ? "out_for_delivery" : "delivered";
    const result = await db.transaction(async (tx) => {
      await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .for("update");
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.orderId, orderId),
            eq(paymentsTable.status, "succeeded"),
          ),
        )
        .limit(1);
      if (!payment) return false;

      const [delivery] = await tx
        .select()
        .from(deliveriesTable)
        .where(
          and(
            eq(deliveriesTable.orderId, orderId),
            eq(deliveriesTable.driverProfileId, profile.id),
          ),
        )
        .limit(1);
      if (!delivery) return false;
      // A lost response can be retried without repeating the transition or earnings.
      if (delivery.status === "delivered" && delivery.proofConfirmedAt)
        return "delivered";
      if (action === "pickup" && delivery.status === "picked_up")
        return "picked_up";
      if (delivery.status !== fromDelivery) return false;
      if (action === "deliver") {
        const code = req.body?.code;
        if (typeof code !== "string" || !/^\d{6}$/.test(code))
          return "invalid_proof";
        if (
          !delivery.handoffHash ||
          !delivery.handoffExpiresAt ||
          delivery.handoffExpiresAt.getTime() <= Date.now() ||
          delivery.handoffAttempts >= 5
        )
          return "invalid_proof";
        const [salt, digest] = delivery.handoffHash.split(":");
        const valid =
          digest &&
          timingSafeEqual(
            Buffer.from(handoffDigest(orderId, salt, code), "hex"),
            Buffer.from(digest, "hex"),
          );
        if (!valid) {
          await tx
            .update(deliveriesTable)
            .set({ handoffAttempts: delivery.handoffAttempts + 1 })
            .where(eq(deliveriesTable.id, delivery.id));
          return "invalid_proof";
        }
      }
      const [order] = await tx
        .update(ordersTable)
        .set({ status: toOrder })
        .where(
          and(eq(ordersTable.id, orderId), eq(ordersTable.status, fromOrder)),
        )
        .returning({ id: ordersTable.id });
      if (!order) return false;
      const [updated] = await tx
        .update(deliveriesTable)
        .set({
          status: toDelivery,
          ...(action === "pickup"
            ? { pickedUpAt: new Date() }
            : {
                deliveredAt: new Date(),
                proofConfirmedAt: new Date(),
                handoffHash: null,
                handoffExpiresAt: null,
              }),
        })
        .where(
          and(
            eq(deliveriesTable.id, delivery.id),
            eq(deliveriesTable.status, fromDelivery),
            eq(deliveriesTable.driverProfileId, profile.id),
          ),
        )
        .returning({ id: deliveriesTable.id });
      if (!updated)
        throw new Error("Concurrent delivery update; transaction rolled back");
      await tx.insert(orderEventsTable).values({
        orderId,
        actorProfileId: profile.id,
        fromStatus: fromOrder,
        toStatus: toOrder,
        note: "Driver delivery update",
      });
      if (action === "deliver") {
        await createEarnings(tx, orderId);
        await tx
          .delete(deliveryLocationsTable)
          .where(eq(deliveryLocationsTable.deliveryId, delivery.id));
      }
      await notifyOrder(
        tx,
        orderId,
        toOrder,
        `Order ${toOrder.replaceAll("_", " ")} (test)`,
        "Your delivery status has changed.",
      );
      await audit(tx, profile.id, `delivery.${action}`, orderId);
      return toDelivery;
    });
    if (result === "invalid_proof") {
      res.status(400).json({
        error:
          "Enter the customer’s valid handoff code. After five failed attempts or expiry, ask the customer to generate a new code.",
      });
      return;
    }
    if (!result) {
      res.status(409).json({ error: "Delivery cannot be updated" });
      return;
    }
    res.json({ orderId, status: result });
  },
);

export default router;
