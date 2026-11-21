import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, timestamp, uuid, varchar, text, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { payoutStatusEnum } from "./enums";
import { ordersTable } from "./orders";
import { profilesTable } from "./profiles";

export const payoutsTable = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientProfileId: uuid("recipient_profile_id").notNull().references(() => profilesTable.id, { onDelete: "restrict" }),
  orderId: uuid("order_id").references(() => ordersTable.id),
  kind: text("kind"),
  providerTransferId: text("provider_transfer_id").unique(),
  providerReversalId: text("provider_reversal_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: payoutStatusEnum("status").notNull().default("pending"),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, t => [uniqueIndex("payouts_order_kind_key").on(t.orderId, t.kind)]);

export const insertPayoutSchema = createInsertSchema(payoutsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payoutsTable.$inferSelect;