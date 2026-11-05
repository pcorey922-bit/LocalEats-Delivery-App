import { and, eq, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, deliveriesTable, ordersTable, orderEventsTable, paymentsTable } from "@workspace/db";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { requireAuth } from "../middlewares/require-auth";

const router: IRouter = Router();

// Drivers can see orders ready for pickup without seeing customer addresses
// until they have successfully claimed a delivery.
router.get("/driver/offers", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver"], res)) return;
  const offers = await db.select({
    orderId: ordersTable.id,
    restaurantId: ordersTable.restaurantId,
    status: ordersTable.status,
  }).from(ordersTable).innerJoin(
    paymentsTable, and(eq(paymentsTable.orderId, ordersTable.id), eq(paymentsTable.status, "succeeded")),
  ).leftJoin(
    deliveriesTable, eq(deliveriesTable.orderId, ordersTable.id),
  ).where(and(
    eq(ordersTable.status, "ready_for_pickup"),
    isNull(deliveriesTable.driverProfileId),
  )).limit(50);
  res.json(offers);
});

router.post("/driver/orders/:orderId/claim", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver"], res)) return;
  const { orderId } = req.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    res.status(400).json({ error: "Invalid order ID" }); return;
  }
  const claimed = await db.transaction(async tx => {
    const [order] = await tx.select({ id: ordersTable.id }).from(ordersTable)
      .innerJoin(paymentsTable, and(eq(paymentsTable.orderId, ordersTable.id), eq(paymentsTable.status, "succeeded")))
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, "ready_for_pickup"))).limit(1);
    if (!order) return false;
    await tx.insert(deliveriesTable).values({ orderId, status: "unassigned" })
      .onConflictDoNothing({ target: deliveriesTable.orderId });
    const [updated] = await tx.update(deliveriesTable).set({
      driverProfileId: profile.id, status: "assigned", assignedAt: new Date(),
    }).where(and(
      eq(deliveriesTable.orderId, orderId),
      eq(deliveriesTable.status, "unassigned"),
      isNull(deliveriesTable.driverProfileId),
    )).returning({ id: deliveriesTable.id });
    return Boolean(updated);
  });
  if (!claimed) { res.status(409).json({ error: "Delivery unavailable or already claimed" }); return; }
  res.status(201).json({ orderId, status: "assigned" });
});

router.post("/driver/orders/:orderId/:action", requireAuth, async (req, res): Promise<void> => {
  const profile = await getActiveProfile(req, res);
  if (!profile || !requireRole(profile, ["driver"], res)) return;
  const { orderId, action } = req.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
      || !["pickup", "deliver"].includes(action)) {
    res.status(400).json({ error: "Invalid delivery action" }); return;
  }
  const fromDelivery = action === "pickup" ? "assigned" : "picked_up";
  const toDelivery = action === "pickup" ? "picked_up" : "delivered";
  const fromOrder = action === "pickup" ? "ready_for_pickup" : "out_for_delivery";
  const toOrder = action === "pickup" ? "out_for_delivery" : "delivered";
  const result = await db.transaction(async tx => {
    const [delivery] = await tx.select().from(deliveriesTable).where(and(
      eq(deliveriesTable.orderId, orderId),
      eq(deliveriesTable.driverProfileId, profile.id),
      eq(deliveriesTable.status, fromDelivery),
    )).limit(1);
    if (!delivery) return false;
    const [order] = await tx.update(ordersTable).set({ status: toOrder })
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, fromOrder)))
      .returning({ id: ordersTable.id });
    if (!order) return false;
    const [updated] = await tx.update(deliveriesTable).set({
      status: toDelivery,
      ...(action === "pickup" ? { pickedUpAt: new Date() } : { deliveredAt: new Date() }),
    }).where(and(
      eq(deliveriesTable.id, delivery.id),
      eq(deliveriesTable.status, fromDelivery),
      eq(deliveriesTable.driverProfileId, profile.id),
    )).returning({ id: deliveriesTable.id });
    if (!updated) throw new Error("Concurrent delivery update; transaction rolled back");
    await tx.insert(orderEventsTable).values({
      orderId, actorProfileId: profile.id,
      fromStatus: fromOrder, toStatus: toOrder, note: "Driver delivery update",
    });
    return true;
  });
  if (!result) { res.status(409).json({ error: "Delivery cannot be updated" }); return; }
  res.json({ orderId, status: toDelivery });
});

export default router;
