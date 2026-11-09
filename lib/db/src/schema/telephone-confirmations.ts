import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { profilesTable } from "./profiles";
export const telephoneConfirmationsTable = pgTable("telephone_confirmations", {
  orderId: uuid("order_id")
    .primaryKey()
    .references(() => ordersTable.id, { onDelete: "restrict" }),
  status: text("status")
    .$type<"pending" | "contacted" | "accepted" | "rejected">()
    .notNull()
    .default("pending"),
  version: integer("version").notNull().default(1),
  contactedAt: timestamp("contacted_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  dispatcherId: uuid("dispatcher_id").references(() => profilesTable.id, {
    onDelete: "restrict",
  }),
  preparationMinutes: integer("preparation_minutes"),
  confirmedSubtotalCents: integer("confirmed_subtotal_cents"),
  note: text("note"),
  lastRequestId: uuid("last_request_id"),
  requestHash: text("request_hash"),
});
