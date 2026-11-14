import {
  pgTable,
  uuid,
  doublePrecision,
  timestamp,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";
export const driverDutyLocationsTable = pgTable(
  "driver_duty_locations",
  {
    profileId: uuid("profile_id")
      .primaryKey()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    accuracyMeters: doublePrecision("accuracy_meters").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "driver_duty_coordinates_valid",
      sql`${t.latitude} >= -90 AND ${t.latitude} <= 90 AND ${t.longitude} >= -180 AND ${t.longitude} <= 180 AND ${t.accuracyMeters} >= 0 AND ${t.accuracyMeters} <= 10000`,
    ),
  ],
);
