import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, smallint, time, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { restaurantsTable } from "./restaurants";

export const restaurantHoursTable = pgTable("restaurant_hours", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: "cascade" }),
  weekday: smallint("weekday").notNull(),
  openTime: time("open_time"),
  closeTime: time("close_time"),
  isClosed: boolean("is_closed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRestaurantHoursSchema = createInsertSchema(restaurantHoursTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRestaurantHours = z.infer<typeof insertRestaurantHoursSchema>;
export type RestaurantHours = typeof restaurantHoursTable.$inferSelect;