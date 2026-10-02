import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { menuItemsTable } from "./menu-items";
import { ordersTable } from "./orders";

export const orderItemsTable = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id").references(() => menuItemsTable.id, { onDelete: "set null" }),
  itemNameSnapshot: varchar("item_name_snapshot", { length: 140 }).notNull(),
  itemDescriptionSnapshot: text("item_description_snapshot"),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;