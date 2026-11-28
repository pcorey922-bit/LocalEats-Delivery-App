import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";
export const driverApplicationsTable = pgTable("driver_applications", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleYear: integer("vehicle_year").notNull(),
  licenseState: text("license_state").notNull(),
  licenseExpiresOn: text("license_expires_on").notNull(),
  eligibilityAttested: boolean("eligibility_attested").notNull(),
  insuranceAttested: boolean("insurance_attested").notNull(),
  status: text("status").notNull().default("pending"),
  version: integer("version").notNull().default(1),
  reviewNote: text("review_note"),
  reviewedBy: uuid("reviewed_by").references(() => profilesTable.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
