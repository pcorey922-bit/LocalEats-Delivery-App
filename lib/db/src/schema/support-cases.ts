import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";
import { ordersTable } from "./orders";
export const supportCasesTable = pgTable("support_cases", {
  id: uuid("id").primaryKey(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profilesTable.id),
  orderId: uuid("order_id").references(() => ordersTable.id),
  category: text("category").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  requestHash: text("request_hash").notNull(),
  status: text("status").notNull().default("open"),
  version: integer("version").notNull().default(1),
  resolution: text("resolution"),
  reviewedBy: uuid("reviewed_by").references(() => profilesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
