import { lt } from "drizzle-orm";
import { db, driverDutyLocationsTable } from "@workspace/db";
// Latest position only, never a route history. Offline/revoked drivers are cleared
// immediately; this bounds retention for crashes and disconnected devices.
export async function pruneDutyLocations(now = new Date()) {
  await db
    .delete(driverDutyLocationsTable)
    .where(
      lt(
        driverDutyLocationsTable.receivedAt,
        new Date(now.getTime() - 15 * 60 * 1000),
      ),
    );
}
