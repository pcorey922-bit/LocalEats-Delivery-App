import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";
import { ordersTable } from "./orders";
export const guestSessionsTable = pgTable(
  "guest_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profilesTable.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull().unique(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    orderId: uuid("order_id")
      .unique()
      .references(() => ordersTable.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("guest_sessions_expiry_idx").on(t.expiresAt)],
);
