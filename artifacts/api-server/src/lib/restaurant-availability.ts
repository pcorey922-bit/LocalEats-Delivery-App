import { and, count, eq, inArray } from "drizzle-orm";
import {
  db,
  restaurantHoursTable,
  restaurantsTable,
  profilesTable,
  ordersTable,
} from "@workspace/db";
import { CommerceError } from "./commerce-policy";
import { orderingAvailabilityIssue } from "./opening-hours";
export { openAt } from "./opening-hours";
export async function ensureAccepting(
  restaurant: { id: string; acceptingOrders: boolean },
  executor: Pick<typeof db, "select"> = db,
) {
  const [owner] = await executor
    .select({ isActive: profilesTable.isActive, role: profilesTable.role })
    .from(restaurantsTable)
    .innerJoin(
      profilesTable,
      eq(profilesTable.id, restaurantsTable.ownerProfileId),
    )
    .where(eq(restaurantsTable.id, restaurant.id));
  if (!owner?.isActive || owner.role !== "restaurant")
    throw new CommerceError(
      409,
      "Restaurant account is not available for ordering",
    );
  const hours = await executor
    .select()
    .from(restaurantHoursTable)
    .where(eq(restaurantHoursTable.restaurantId, restaurant.id));
  const issue = orderingAvailabilityIssue(restaurant.acceptingOrders, hours);
  if (issue) throw new CommerceError(409, issue);
}

// Includes pending payment, kitchen work and ready orders until pickup. Cancelling
// or pickup releases capacity without counters that can drift after recovery.
export async function restaurantCapacity(
  restaurant: { id: string; maxOpenOrders: number | null },
  executor: Pick<typeof db, "select"> = db,
) {
  const [load] = await executor
    .select({ count: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.restaurantId, restaurant.id),
        inArray(ordersTable.status, [
          "pending",
          "placed",
          "restaurant_received",
          "accepted",
          "preparing",
          "ready_for_pickup",
        ]),
      ),
    );
  const openOrders = load?.count ?? 0;
  return {
    maxOpenOrders: restaurant.maxOpenOrders,
    openOrders,
    capacityAvailable:
      restaurant.maxOpenOrders === null ||
      openOrders < restaurant.maxOpenOrders,
  };
}
export async function ensureCapacity(
  restaurant: { id: string; maxOpenOrders: number | null },
  executor: Pick<typeof db, "select"> = db,
) {
  if (restaurant.maxOpenOrders === null) return;
  if (!(await restaurantCapacity(restaurant, executor)).capacityAvailable)
    throw new CommerceError(
      409,
      "Restaurant is at capacity. Please try again after an order is picked up or cancelled",
    );
}
