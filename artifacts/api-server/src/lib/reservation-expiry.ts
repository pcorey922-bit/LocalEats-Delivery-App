import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  paymentsTable,
  orderEventsTable,
  financialOperationsTable,
} from "@workspace/db";
import { audit, notifyOrder, type Transaction } from "./commerce";
import { databaseNow } from "./database-clock";
import { enqueueFinancialOperation } from "./finance-queue";
import { restoreUnacceptedInventory } from "./inventory";

const unpaidStatuses = ["placed", "pending", "restaurant_received"] as const;
// Caller holds the order lock. Payment writes, expiry and restaurant transitions
// serialize on this same row; provider calls never run inside this transaction.
export async function expireReservation(
  tx: Transaction,
  order: typeof ordersTable.$inferSelect,
) {
  if (!(unpaidStatuses as readonly string[]).includes(order.status))
    return false;
  const now = await databaseNow(tx);
  if (order.reservationExpiresAt > now) return false;
  const [payment] = await tx
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, order.id));
  if (!payment || !["pending", "failed"].includes(payment.status)) return false;
  const restored = await restoreUnacceptedInventory(tx, order);
  await tx
    .update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, order.id));
  await tx
    .insert(orderEventsTable)
    .values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: "cancelled",
      note: "Unpaid reservation expired",
    });
  await tx
    .update(financialOperationsTable)
    .set({ state: "cancelled", completedAt: now })
    .where(
      and(
        eq(financialOperationsTable.orderId, order.id),
        eq(financialOperationsTable.kind, "checkout"),
        eq(financialOperationsTable.state, "queued"),
        eq(financialOperationsTable.attempts, 0),
      ),
    );
  if (payment.provider === "stripe_test")
    await enqueueFinancialOperation(tx, {
      id: `expire:${order.id}`,
      orderId: order.id,
      kind: "expire_checkout",
      resourceId: payment.id,
      payload: {},
    });
  else
    await tx
      .update(paymentsTable)
      .set({ status: "failed" })
      .where(eq(paymentsTable.id, payment.id));
  await audit(tx, null, "order.reservation_expired", order.id, {
    deadline: order.reservationExpiresAt,
    restored,
  });
  await notifyOrder(
    tx,
    order.id,
    "reservation.expired",
    "Reservation expired (test)",
    "The unpaid reservation expired. Reserved stock has been released. Any late payment requires a refund; this order cannot resume.",
  );
  order.status = "cancelled";
  return true;
}
export async function processReservationExpiry() {
  return db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({ order: ordersTable })
      .from(ordersTable)
      .innerJoin(paymentsTable, eq(paymentsTable.orderId, ordersTable.id))
      .where(
        and(
          inArray(ordersTable.status, [...unpaidStatuses]),
          inArray(paymentsTable.status, ["pending", "failed"]),
          lte(ordersTable.reservationExpiresAt, sql`clock_timestamp()`),
        ),
      )
      .orderBy(asc(ordersTable.reservationExpiresAt), asc(ordersTable.id))
      .limit(1)
      .for("update", { of: ordersTable, skipLocked: true });
    if (!candidate) return false;
    return expireReservation(tx, candidate.order);
  });
}
