import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, text, pgTable, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { deliveryStatusEnum } from "./enums";
import { ordersTable } from "./orders";
import { profilesTable } from "./profiles";

export const deliveriesTable = pgTable("deliveries", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => ordersTable.id, { onDelete: "cascade" }),
  driverProfileId: uuid("driver_profile_id").references(() => profilesTable.id, { onDelete: "set null" }),
  status: deliveryStatusEnum("status").notNull().default("unassigned"),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  tipCents: integer("tip_cents").notNull().default(0),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  arrivedAt: timestamp("arrived_at", { withTimezone: true }),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
  handoffHash: text("handoff_hash"),
  handoffExpiresAt: timestamp("handoff_expires_at", { withTimezone: true }),
  handoffAttempts: integer("handoff_attempts").notNull().default(0),
  proofConfirmedAt: timestamp("proof_confirmed_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, t=>[uniqueIndex("deliveries_one_active_per_driver").on(t.driverProfileId).where(sql`${t.status} in ('assigned','picked_up')`)]);

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;