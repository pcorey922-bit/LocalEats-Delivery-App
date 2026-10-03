import { createInsertSchema } from "drizzle-zod";
import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { restaurantStatusEnum } from "./enums";
import { profilesTable } from "./profiles";

export const restaurantsTable = pgTable("restaurants", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerProfileId: uuid("owner_profile_id").notNull().unique().references(() => profilesTable.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  phone: varchar("phone", { length: 30 }),
  street1: varchar("street_1", { length: 180 }).notNull(),
  street2: varchar("street_2", { length: 180 }),
  city: varchar("city", { length: 100 }).notNull(),
  region: varchar("region", { length: 80 }).notNull().default("Tennessee"),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  status: restaurantStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("restaurants_status_city_idx").on(table.status, table.city),
]);

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;