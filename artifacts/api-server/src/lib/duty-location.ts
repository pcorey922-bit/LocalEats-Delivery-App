import { lt } from "drizzle-orm";
import { db, deliveryLocationsTable, driverDutyLocationsTable } from "@workspace/db";

// Latest position only. Bound retention for disconnected devices and deliveries
// that ended without the normal handoff or reassignment cleanup.
export async function pruneDriverLocations(now = new Date()) {
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);
  await db.delete(driverDutyLocationsTable).where(lt(driverDutyLocationsTable.receivedAt, cutoff));
  await db.delete(deliveryLocationsTable).where(lt(deliveryLocationsTable.receivedAt, cutoff));
}
