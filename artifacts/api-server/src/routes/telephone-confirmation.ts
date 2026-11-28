import { Router } from "express";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { and, eq, inArray, asc } from "drizzle-orm";
import {
  db,
  restaurantsTable,
  ordersTable,
  telephoneConfirmationsTable,
  orderItemsTable,
  restaurantHoursTable,
  paymentsTable,
  orderEventsTable,
  deliveriesTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/require-auth";
import { requireCustomerAuth } from "../lib/guest-access";
import { getActiveProfile, requireRole } from "../lib/current-profile";
import { CommerceError } from "../lib/commerce-policy";
import { audit, notifyOrder } from "../lib/commerce";
import { databaseNow } from "../lib/database-clock";
import { expireReservation } from "../lib/reservation-expiry";
import { restoreUnacceptedInventory } from "../lib/inventory";
const router = Router();
router.get("/admin/telephone-restaurants", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  res.setHeader("Cache-Control", "no-store");
  res.json(
    await db
      .select({
        id: restaurantsTable.id,
        name: restaurantsTable.name,
        phone: restaurantsTable.phone,
        receiptMode: restaurantsTable.receiptMode,
      })
      .from(restaurantsTable)
      .orderBy(asc(restaurantsTable.name))
      .limit(1000),
  );
});
router.put(
  "/admin/restaurants/:restaurantId/receipt-mode",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const id = z.string().uuid().parse(req.params.restaurantId);
    const v = z
      .object({
        mode: z.enum(["electronic", "telephone"]),
        expectedMode: z.enum(["electronic", "telephone"]),
      })
      .strict()
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const [restaurant] = await tx
        .select()
        .from(restaurantsTable)
        .where(eq(restaurantsTable.id, id))
        .for("update");
      if (!restaurant) throw new CommerceError(404, "Restaurant not found");
      if (restaurant.receiptMode === v.mode) return { mode: v.mode };
      if (restaurant.receiptMode !== v.expectedMode)
        throw new CommerceError(
          409,
          "Receipt mode changed; refresh before updating",
        );
      if (v.mode === "telephone" && !restaurant.phone?.trim())
        throw new CommerceError(
          409,
          "Save a restaurant contact phone before enabling telephone confirmation",
        );
      await tx
        .update(restaurantsTable)
        .set({ receiptMode: v.mode })
        .where(eq(restaurantsTable.id, id));
      await audit(tx, p.id, "restaurant.receipt_mode", id, {
        from: restaurant.receiptMode,
        to: v.mode,
      });
      return { mode: v.mode };
    });
    res.json(result);
  },
);
router.get("/admin/telephone-orders", requireAuth, async (req, res) => {
  const p = await getActiveProfile(req, res);
  if (!p || !requireRole(p, ["admin"], res)) return;
  res.setHeader("Cache-Control", "no-store");
  const rows = await db
    .select({
      order: ordersTable,
      confirmation: telephoneConfirmationsTable,
      restaurant: {
        id: restaurantsTable.id,
        name: restaurantsTable.name,
        phone: restaurantsTable.phone,
      },
    })
    .from(ordersTable)
    .innerJoin(
      telephoneConfirmationsTable,
      eq(telephoneConfirmationsTable.orderId, ordersTable.id),
    )
    .innerJoin(
      restaurantsTable,
      eq(restaurantsTable.id, ordersTable.restaurantId),
    )
    .where(
      and(
        eq(ordersTable.status, "placed"),
        inArray(telephoneConfirmationsTable.status, [
          "pending",
          "contacted",
          "accepted",
        ]),
      ),
    )
    .orderBy(asc(ordersTable.placedAt))
    .limit(100);
  res.json(
    await Promise.all(
      rows.map(async (row) => ({
        ...row,
        items: await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, row.order.id)),
        hours: await db
          .select()
          .from(restaurantHoursTable)
          .where(eq(restaurantHoursTable.restaurantId, row.restaurant.id)),
      })),
    ),
  );
});
router.get(
  "/orders/:orderId/confirmation",
  requireCustomerAuth,
  async (req, res) => {
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
    if (
      p.role !== "admin" &&
      order.customerProfileId !== p.id &&
      restaurant?.ownerProfileId !== p.id &&
      delivery?.driverProfileId !== p.id
    )
      throw new CommerceError(404, "Order not found");
    const [confirmation] = await db
      .select()
      .from(telephoneConfirmationsTable)
      .where(eq(telephoneConfirmationsTable.orderId, id));
    res.setHeader("Cache-Control", "no-store");
    res.json({
      mode: order.confirmationMode,
      status: confirmation?.status ?? null,
      contactedAt: confirmation?.contactedAt ?? null,
      confirmedAt: confirmation?.confirmedAt ?? null,
      preparationMinutes: confirmation?.preparationMinutes ?? null,
      orderStatus: order.status,
    });
  },
);
const base = {
  requestId: z.string().uuid(),
  version: z.number().int().positive(),
  note: z.string().trim().min(5).max(2000),
};
const command = z.discriminatedUnion("action", [
  z.object({ ...base, action: z.literal("contact") }).strict(),
  z
    .object({
      ...base,
      action: z.literal("accept"),
      preparationMinutes: z.number().int().min(1).max(240),
      confirmedSubtotalCents: z.number().int().nonnegative(),
      allItemsAvailable: z.literal(true),
    })
    .strict(),
  z.object({ ...base, action: z.literal("reject") }).strict(),
]);
router.post(
  "/admin/orders/:orderId/telephone-confirmation",
  requireAuth,
  async (req, res) => {
    const p = await getActiveProfile(req, res);
    if (!p || !requireRole(p, ["admin"], res)) return;
    const id = z.string().uuid().parse(req.params.orderId),
      v = command.parse(req.body),
      hash = createHash("sha256").update(JSON.stringify(v)).digest("hex");
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, id))
        .for("update");
      const [confirmation] = await tx
        .select()
        .from(telephoneConfirmationsTable)
        .where(eq(telephoneConfirmationsTable.orderId, id));
      if (!order || order.confirmationMode !== "telephone" || !confirmation)
        throw new CommerceError(404, "Telephone order not found");
      if (confirmation.lastRequestId === v.requestId) {
        if (confirmation.requestHash !== hash)
          throw new CommerceError(409, "Confirmation request was changed");
        return { confirmation };
      }
      if (
        order.status !== "placed" ||
        confirmation.version !== v.version ||
        ["accepted", "rejected"].includes(confirmation.status)
      )
        throw new CommerceError(
          409,
          "Order or confirmation changed; refresh before acting",
        );
      if (await expireReservation(tx, order)) return { expired: true };
      const [payment] = await tx
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, id));
      if (
        !payment ||
        !["pending", "failed"].includes(payment.status) ||
        payment.checkoutSessionId
      )
        throw new CommerceError(
          409,
          "Payment requires existing cancellation/reconciliation controls",
        );
      if (
        v.action === "accept" &&
        (confirmation.status !== "contacted" ||
          v.confirmedSubtotalCents !== order.subtotalCents)
      )
        throw new CommerceError(
          409,
          "Contact the restaurant first and verify the exact approved food subtotal. Price/item changes require cancellation and a new customer-approved quote.",
        );
      const now = await databaseNow(tx),
        status =
          v.action === "contact"
            ? "contacted"
            : v.action === "accept"
              ? "accepted"
              : "rejected";
      const [updated] = await tx
        .update(telephoneConfirmationsTable)
        .set({
          status,
          version: confirmation.version + 1,
          dispatcherId: p.id,
          note: v.note,
          lastRequestId: v.requestId,
          requestHash: hash,
          ...(v.action === "contact"
            ? { contactedAt: now }
            : { confirmedAt: now }),
          ...(v.action === "accept"
            ? {
                preparationMinutes: v.preparationMinutes,
                confirmedSubtotalCents: v.confirmedSubtotalCents,
              }
            : {}),
        })
        .where(eq(telephoneConfirmationsTable.orderId, id))
        .returning();
      if (v.action === "reject") {
        await restoreUnacceptedInventory(tx, order);
        await tx
          .update(ordersTable)
          .set({ status: "cancelled" })
          .where(eq(ordersTable.id, id));
        await tx
          .update(paymentsTable)
          .set({ status: "failed" })
          .where(eq(paymentsTable.id, payment.id));
        await tx
          .insert(orderEventsTable)
          .values({
            orderId: id,
            actorProfileId: p.id,
            fromStatus: order.status,
            toStatus: "cancelled",
            note: "Restaurant rejected by telephone; no payment requested",
          });
      }
      await audit(tx, p.id, `telephone.${status}`, id, {
        version: updated.version,
        note: v.note,
        preparationMinutes: updated.preparationMinutes,
        confirmedSubtotalCents: updated.confirmedSubtotalCents,
      });
      await notifyOrder(
        tx,
        id,
        `telephone.${status}`,
        status === "accepted"
          ? "Restaurant confirmed — complete test payment"
          : status === "rejected"
            ? "Restaurant could not confirm your order"
            : "Contacting restaurant",
        status === "accepted"
          ? "Dispatch confirmed the approved food total and availability. Complete payment before preparation begins."
          : status === "rejected"
            ? "Your unpaid order was cancelled. No payment was requested."
            : "We're confirming your order with the restaurant.",
      );
      return { confirmation: updated };
    });
    res.status("expired" in result ? 410 : 200).json(result);
  },
);
export default router;
