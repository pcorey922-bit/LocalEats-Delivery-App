import { createInsertSchema } from "drizzle-zod";
import { boolean, jsonb, index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { menuCategoriesTable } from "./menu-categories";
import { restaurantsTable } from "./restaurants";

export const menuItemsTable = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => menuCategoriesTable.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 140 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  modifierGroups: jsonb("modifier_groups").$type<{id:string;name:string;minSelections:number;maxSelections:number;options:{id:string;name:string;priceCents:number}[]}[]>().notNull().default([]),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("menu_items_restaurant_category_available_idx").on(
    table.restaurantId,
    table.categoryId,
    table.isAvailable,
  ),
]);

export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItemsTable.$inferSelect;