import { eq } from "drizzle-orm";
import { db, restaurantHoursTable } from "@workspace/db";
import { CommerceError } from "./commerce-policy";
import { openAt } from "./opening-hours";
export { openAt } from "./opening-hours";
export async function ensureAccepting(
  restaurant: { id: string; acceptingOrders: boolean },
  executor: Pick<typeof db, "select"> = db,
) {
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
