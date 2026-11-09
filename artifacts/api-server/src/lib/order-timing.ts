import { telephoneConfirmationsTable } from "@workspace/db";
import { and, asc, desc, eq, exists, inArray, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  ordersTable,
  paymentsTable,
  deliveriesTable,
  deliveryLocationsTable,
  orderEventsTable,
  platformSettingsTable,
  orderIncidentsTable,
  profilesTable,
  notificationsTable,
} from "@workspace/db";
import { audit, notifyOrder, type Transaction } from "./commerce";
import { databaseNow } from "./database-clock";
export const timingSchema = z
  .object({
    reservationMinutes: z.number().int().min(1).max(120),
    restaurantResponseMinutes: z.number().int().min(1).max(120),
    driverAssignmentMinutes: z.number().int().min(1).max(240),
    driverPickupMinutes: z.number().int().min(1).max(240),
  })
  .strict();
export const defaultTiming = {
  reservationMinutes: 15,
  restaurantResponseMinutes: 5,
  driverAssignmentMinutes: 10,
  driverPickupMinutes: 10,
};
export async function readTimingPolicy(
  executor: Pick<typeof db, "select"> = db,
) {
  const [row] = await executor
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.settingKey, "order_timing_policy"));
  return timingSchema.parse(row?.value ?? defaultTiming);
}
type Kind = "restaurant_response" | "driver_unassigned" | "driver_pickup";
async function openIncident(
  tx: Transaction,
  orderId: string,
  kind: Kind,
  phaseKey: string,
  now: Date,
) {
  const [previous] = await tx
    .select()
    .from(orderIncidentsTable)
    .where(
      and(
        eq(orderIncidentsTable.orderId, orderId),
        eq(orderIncidentsTable.kind, kind),
        eq(orderIncidentsTable.phaseKey, phaseKey),
      ),
    );
  if (previous && previous.status !== "resolved") return;
  const [incident] = previous
    ? await tx
        .update(orderIncidentsTable)
        .set({
          status: "open",
          version: previous.version + 1,
          note: null,
          reviewedBy: null,
          openedAt: now,
          resolvedAt: null,
        })
        .where(eq(orderIncidentsTable.id, previous.id))
        .returning()
    : await tx
        .insert(orderIncidentsTable)
        .values({ orderId, kind, phaseKey, openedAt: now })
        .returning();
  const admins = await tx
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(
      and(eq(profilesTable.role, "admin"), eq(profilesTable.isActive, true)),
    );
  for (const admin of admins)
    await tx
      .insert(notificationsTable)
      .values({
        profileId: admin.id,
        orderId,
        eventKey: `incident:${incident.id}:${incident.version}`,
        title: "Order needs operational attention (test)",
        body: `${kind.replaceAll("_", " ")} timeout. Open dispatch and the incident queue.`,
      })
      .onConflictDoNothing();
  await audit(tx, null, "order.incident.opened", orderId, {
    incidentId: incident.id,
    kind,
    phaseKey,
    version: incident.version,
  });
}
export async function processOrderTiming() {
  return db.transaction(async (tx) => {
    const unresolved = tx
      .select({ id: orderIncidentsTable.id })
      .from(orderIncidentsTable)
      .where(
        and(
          eq(orderIncidentsTable.orderId, ordersTable.id),
          inArray(orderIncidentsTable.status, ["open", "acknowledged"]),
        ),
      );
    const [candidate] = await tx
      .select({ order: ordersTable })
      .from(ordersTable)
      .innerJoin(paymentsTable, eq(paymentsTable.orderId, ordersTable.id))
      .where(
        and(
          lte(ordersTable.timingReviewAt, sql`clock_timestamp()`),
          or(
            and(
              eq(paymentsTable.status, "succeeded"),
              inArray(ordersTable.status, [
                "placed",
                "pending",
                "restaurant_received",
                "accepted",
                "preparing",
                "ready_for_pickup",
              ]),
            ),
            and(eq(ordersTable.confirmationMode,"telephone"),eq(ordersTable.status,"placed")),
            exists(unresolved),
          ),
        ),
      )
      .orderBy(asc(ordersTable.timingReviewAt), asc(ordersTable.id))
      .limit(1)
      .for("update", { of: ordersTable, skipLocked: true });
    if (!candidate) return false;
    const order = candidate.order,
      now = await databaseNow(tx),
      policy = timingSchema.parse(order.timingPolicy);
    await tx
      .update(ordersTable)
      .set({ timingReviewAt: new Date(now.getTime() + 60000) })
      .where(eq(ordersTable.id, order.id));
    const [payment] = await tx
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, order.id));
    const [delivery] = await tx
      .select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.orderId, order.id));
    const [telephone]=order.confirmationMode==="telephone" ? await tx.select().from(telephoneConfirmationsTable).where(eq(telephoneConfirmationsTable.orderId,order.id)) : [];
    const activeKeys = new Set<string>();
    const overdue = (time: Date | null | undefined, minutes: number) =>
      !!time && now.getTime() - time.getTime() >= minutes * 60000;
    if (
      (payment?.status === "succeeded" || (telephone && ["pending","contacted"].includes(telephone.status))) &&
      ["placed", "pending", "restaurant_received"].includes(order.status) &&
      overdue(telephone ? order.placedAt : payment?.processedAt, policy.restaurantResponseMinutes)
    ) {
      activeKeys.add("restaurant_response:acceptance");
      await openIncident(
        tx,
        order.id,
        "restaurant_response",
        "acceptance",
        now,
      );
    }
    if (
      payment?.status === "succeeded" &&
      order.status === "ready_for_pickup"
    ) {
      if (
        delivery?.driverProfileId &&
        delivery.status === "assigned" &&
        overdue(delivery.assignedAt, policy.driverPickupMinutes)
      ) {
        const phase = `${delivery.driverProfileId}:${delivery.assignedAt!.toISOString()}`;
        activeKeys.add(`driver_pickup:${phase}`);
        await openIncident(tx, order.id, "driver_pickup", phase, now);
        // Arrival indicates possible handoff activity: retain custody and escalate.
        if (!delivery.arrivedAt) {
          const formerDriver = delivery.driverProfileId;
          await tx
            .update(deliveriesTable)
            .set({
              driverProfileId: null,
              status: "unassigned",
              assignedAt: null,
              arrivedAt: null,
              handoffHash: null,
              handoffExpiresAt: null,
              handoffAttempts: 0,
            })
            .where(eq(deliveriesTable.id, delivery.id));
          await tx
            .delete(deliveryLocationsTable)
            .where(eq(deliveryLocationsTable.deliveryId, delivery.id));
          await tx
            .insert(notificationsTable)
            .values({
              profileId: formerDriver,
              orderId: order.id,
              eventKey: `assignment.expired:${delivery.id}:${phase}`,
              title: "Assignment expired (test)",
              body: "Your assignment expired before arrival. Do not pick up this order. Refresh available deliveries.",
            })
            .onConflictDoNothing();
          await notifyOrder(
            tx,
            order.id,
            `assignment.expired:${phase}`,
            "Finding another driver (test)",
            "The previous assignment expired before arrival. Dispatch is finding another driver.",
          );
          await audit(tx, null, "delivery.assignment_expired", order.id, {
            formerDriver,
            assignedAt: delivery.assignedAt,
          });
          activeKeys.delete(`driver_pickup:${phase}`);
          delivery.driverProfileId = null;
        }
      }
      if (!delivery?.driverProfileId) {
        const [ready] = await tx
          .select()
          .from(orderEventsTable)
          .where(
            and(
              eq(orderEventsTable.orderId, order.id),
              eq(orderEventsTable.toStatus, "ready_for_pickup"),
            ),
          )
          .orderBy(desc(orderEventsTable.createdAt))
          .limit(1);
        if (
          overdue(
            ready?.createdAt ?? order.updatedAt,
            policy.driverAssignmentMinutes,
          )
        ) {
          activeKeys.add("driver_unassigned:dispatch");
          await openIncident(
            tx,
            order.id,
            "driver_unassigned",
            "dispatch",
            now,
          );
        }
      }
    }
    const incidents = await tx
      .select()
      .from(orderIncidentsTable)
      .where(
        and(
          eq(orderIncidentsTable.orderId, order.id),
          inArray(orderIncidentsTable.status, ["open", "acknowledged"]),
        ),
      );
    for (const incident of incidents)
      if (!activeKeys.has(`${incident.kind}:${incident.phaseKey}`)) {
        await tx
          .update(orderIncidentsTable)
          .set({
            status: "resolved",
            resolvedAt: now,
            version: incident.version + 1,
            note: "Recovered by current order or assignment state",
          })
          .where(eq(orderIncidentsTable.id, incident.id));
        await audit(tx, null, "order.incident.recovered", order.id, {
          incidentId: incident.id,
          kind: incident.kind,
        });
      }
    return true;
  });
}
