import {
  boolean,
  index,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profilesTable } from "./profiles";
import { ordersTable } from "./orders";

export const refundsTable = pgTable("refunds", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => ordersTable.id),
  amountCents: integer("amount_cents").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  providerRefundId: text("provider_refund_id").unique(),
  reason: text("reason").notNull(),
  actorProfileId: uuid("actor_profile_id").references(() => profilesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const connectedAccountsTable = pgTable("connected_accounts", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profilesTable.id),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull().unique(),
  ready: boolean("ready").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profilesTable.id),
    orderId: uuid("order_id").references(() => ordersTable.id),
    eventKey: text("event_key").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    pushState: text("push_state").notNull().default("pending"),
    pushAttempts: integer("push_attempts").notNull().default(0),
    pushNextAttemptAt: timestamp("push_next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("notifications_event_recipient_key").on(
      t.eventKey,
      t.profileId,
    ),
    index("notifications_push_due_idx").on(t.pushState, t.pushNextAttemptAt),
  ],
);
export const providerEventsTable = pgTable("provider_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorProfileId: uuid("actor_profile_id").references(() => profilesTable.id),
  action: text("action").notNull(),
  resourceId: text("resource_id").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const notificationDevicesTable = pgTable("notification_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profilesTable.id),
  token: text("token").notNull().unique(),
  platform: varchar("platform", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pushDeliveriesTable = pgTable(
  "push_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notificationsTable.id),
    // Retain the outcome after device removal, without retaining its token.
    deviceId: uuid("device_id").notNull(),
    state: text("state").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    leaseToken: uuid("lease_token"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    errorCode: text("error_code"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("push_delivery_notification_device_key").on(
      t.notificationId,
      t.deviceId,
    ),
    index("push_delivery_due_idx").on(t.state, t.nextAttemptAt),
    check(
      "push_delivery_state_valid",
      sql`${t.state} in ('pending','processing','provider_accepted','unregistered','invalid_token','failed')`,
    ),
    check("push_delivery_attempts_valid", sql`${t.attempts} between 0 and 5`),
  ],
);

export const accountDeletionRequestsTable = pgTable(
  "account_deletion_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profilesTable.id),
    status: text("status").notNull().default("requested"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);
