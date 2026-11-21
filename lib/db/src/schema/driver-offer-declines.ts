import {
  pgTable,
  uuid,
  timestamp,
  text,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";
import { ordersTable } from "./orders";
export const driverOfferDeclinesTable = pgTable(
  "driver_offer_declines",
  {
    driverProfileId: uuid("driver_profile_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    id: uuid("id").notNull().defaultRandom(),
    reason: text("reason").notNull(),
    declinedAt: timestamp("declined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.driverProfileId, table.orderId] }),
    index("driver_offer_declines_expiry_idx").on(table.expiresAt),
    check(
      "driver_offer_declines_expiry",
      sql`${table.expiresAt}>${table.declinedAt}`,
    ),
    check(
      "driver_offer_declines_reason",
      sql`length(${table.reason}) between 5 and 300`,
    ),
  ],
);
