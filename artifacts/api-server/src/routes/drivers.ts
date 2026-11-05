import { CommerceError } from "../lib/commerce-policy";
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
} from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

// Drivers can see orders ready for pickup without seeing customer addresses
// until they have successfully claimed a delivery.
router.get("/driver/offers", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver"], res)) return;
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
    if (!profile || !requireRole(profile, ["driver"], res)) return;
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
        restaurantName: restaurantsTable.name,
        pickupStreet: restaurantsTable.street1,
        pickupCity: restaurantsTable.city,
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
    if (!profile || !requireRole(profile, ["driver"], res)) return;
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
      if (
        !current?.driverApproved ||
        !current.isActive ||
        current.role !== "driver"
      )
        throw new CommerceError(403, "Driver approval is required");
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
    if (!profile || !requireRole(profile, ["driver"], res)) return;
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
        .set({ driverProfileId: null, status: "unassigned", assignedAt: null })
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
      await audit(tx, profile.id, "delivery.released", orderId);
      await notifyOrder(
        tx,
        orderId,
        `released:${profile.id}:${Date.now()}`,
        "Finding another driver (test)",
        "The driver released this delivery before pickup.",
      );
    });
    res.json({ orderId, status: "unassigned" });
  },
);

router.post(
  "/driver/orders/:orderId/:action",
  requireAuth,
  async (req, res): Promise<void> => {
    const profile = await getActiveProfile(req, res);
    if (!profile || !requireRole(profile, ["driver"], res)) return;
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
            eq(deliveriesTable.status, fromDelivery),
          ),
        )
        .limit(1);
      if (!delivery) return false;
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
            : { deliveredAt: new Date() }),
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
      return true;
    });
    if (!result) {
      res.status(409).json({ error: "Delivery cannot be updated" });
      return;
    }
    res.json({ orderId, status: toDelivery });
  },
);

export default router;
