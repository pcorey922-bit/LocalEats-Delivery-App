import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
export const mobileAuthFlowsTable = pgTable(
  "mobile_auth_flows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challenge: text("challenge").notNull(),
    stateHash: text("state_hash").notNull(),
    clerkUserId: text("clerk_user_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [index("mobile_auth_expiry_idx").on(t.expiresAt)],
);
