import { createInsertSchema } from "drizzle-zod";
import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const addressesTable = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 60 }).notNull().default("Home"),
  street1: varchar("street_1", { length: 180 }).notNull(),
  street2: varchar("street_2", { length: 180 }),
  city: varchar("city", { length: 100 }).notNull(),
  region: varchar("region", { length: 80 }).notNull().default("Tennessee"),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  deliveryInstructions: text("delivery_instructions"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("addresses_profile_idx").on(table.profileId),
]);

export const insertAddressSchema = createInsertSchema(addressesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addressesTable.$inferSelect;