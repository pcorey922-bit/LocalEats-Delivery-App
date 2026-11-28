import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, timestamp, uuid, varchar, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { paymentStatusEnum } from "./enums";
import { ordersTable } from "./orders";

export const paymentsTable = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => ordersTable.id, { onDelete: "restrict" }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  provider: varchar("provider", { length: 60 }),
  providerPaymentId: varchar("provider_payment_id", { length: 180 }).unique(),
  checkoutSessionId: text("checkout_session_id").unique(),
  checkoutAttempt: integer("checkout_attempt").notNull().default(0),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;