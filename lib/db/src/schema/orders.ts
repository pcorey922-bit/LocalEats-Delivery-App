import { createInsertSchema } from "drizzle-zod";
import { index, integer, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { orderStatusEnum } from "./enums";
import { addressesTable } from "./addresses";
import { profilesTable } from "./profiles";
import { restaurantsTable } from "./restaurants";

export const ordersTable = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerProfileId: uuid("customer_profile_id").notNull().references(() => profilesTable.id, { onDelete: "restrict" }),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurantsTable.id, { onDelete: "restrict" }),
  deliveryAddressId: uuid("delivery_address_id").references(() => addressesTable.id, { onDelete: "set null" }),
  addressSnapshot: jsonb("address_snapshot").$type<Record<string, string | null>>(),
  status: orderStatusEnum("status").notNull().default("pending"),
  subtotalCents: integer("subtotal_cents").notNull(),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  serviceFeeCents: integer("service_fee_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  tipCents: integer("tip_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("orders_customer_created_idx").on(table.customerProfileId, table.createdAt),
  index("orders_restaurant_status_created_idx").on(
    table.restaurantId,
    table.status,
    table.createdAt,
  ),
]);

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;