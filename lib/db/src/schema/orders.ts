import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, timestamp, uuid, text } from "drizzle-orm/pg-core";
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
  confirmationMode: text("confirmation_mode").$type<"electronic"|"telephone">().notNull().default("electronic"),
  requestKey: text("request_key").unique(),
  requestHash: text("request_hash"),
  pricingSnapshot: jsonb("pricing_snapshot").$type<{ restaurantCommissionBps: number; driverShareBps: number; taxBps: number; testMode: true }>(),
  status: orderStatusEnum("status").notNull().default("pending"),
  reservationExpiresAt: timestamp("reservation_expires_at", { withTimezone: true }).notNull().default(sql`now() + interval '15 minutes'`),
  timingPolicy: jsonb("timing_policy").$type<{reservationMinutes:number;restaurantResponseMinutes:number;driverAssignmentMinutes:number;driverPickupMinutes:number}>().notNull().default({reservationMinutes:15,restaurantResponseMinutes:5,driverAssignmentMinutes:10,driverPickupMinutes:10}),
  timingReviewAt: timestamp("timing_review_at",{withTimezone:true}).notNull().defaultNow(),
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
  index("orders_reservation_expiry_idx").on(table.status,table.reservationExpiresAt),
  index("orders_timing_review_idx").on(table.timingReviewAt,table.id),
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
