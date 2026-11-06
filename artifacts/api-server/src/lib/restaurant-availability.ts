import { eq } from "drizzle-orm";
import {
  db,
  restaurantHoursTable,
  restaurantsTable,
  profilesTable,
} from "@workspace/db";
import { CommerceError } from "./commerce-policy";
import { openAt } from "./opening-hours";
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
  if (!restaurant.acceptingOrders || !openAt(hours))
    throw new CommerceError(
      409,
      "Restaurant is paused, closed, or has not configured its opening hours",
    );
}
