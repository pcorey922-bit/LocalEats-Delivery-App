import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { profilesTable } from "./profiles";
import { deliveriesTable } from "./deliveries";
export const financialOperationsTable = pgTable(
  "financial_operations",
  {
    id: text("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id),
    kind: text("kind").notNull(),
    resourceId: text("resource_id").notNull(),
    provider: text("provider").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    state: text("state").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    firstAttemptAt: timestamp("first_attempt_at", { withTimezone: true }),
    leaseToken: uuid("lease_token"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    result: jsonb("result").$type<Record<string, unknown>>(),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("financial_operations_due_idx").on(t.state, t.nextAttemptAt),
    index("financial_operations_order_idx").on(t.orderId, t.createdAt),
    uniqueIndex("financial_operations_one_running_per_order")
      .on(t.orderId)
      .where(sql`${t.state} = 'processing'`),
    check(
      "financial_operations_state_check",
      sql`${t.state} in ('queued','processing','pending','succeeded','failed','reconciliation','cancelled')`,
    ),
    check(
      "financial_operations_kind_check",
      sql`${t.kind} in ('checkout','refund','transfer','reversal','expire_checkout')`,
    ),
  ],
);
export const driverPresenceTable = pgTable("driver_presence", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profilesTable.id),
  available: boolean("available").notNull().default(false),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const deliveryLocationsTable = pgTable(
  "delivery_locations",
  {
    deliveryId: uuid("delivery_id")
      .primaryKey()
      .references(() => deliveriesTable.id, { onDelete: "cascade" }),
    driverProfileId: uuid("driver_profile_id")
      .notNull()
      .references(() => profilesTable.id),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    accuracyMeters: doublePrecision("accuracy_meters").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "delivery_locations_valid_coordinates",
      sql`${t.latitude} >= -90 and ${t.latitude} <= 90 and ${t.longitude} >= -180 and ${t.longitude} <= 180 and ${t.accuracyMeters} >= 0`,
    ),
  ],
);
export const webhookInboxTable = pgTable(
  "webhook_inbox",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    state: text("state").notNull().default("received"),
    attempts: integer("attempts").notNull().default(0),
    leaseToken: uuid("lease_token"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    errorCode: text("error_code"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [index("webhook_inbox_state_received_idx").on(t.state, t.receivedAt)],
);
export const payoutProvisioningTable = pgTable(
  "payout_provisioning",
  {
    profileId: uuid("profile_id")
      .primaryKey()
      .references(() => profilesTable.id),
    state: text("state").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    firstAttemptAt: timestamp("first_attempt_at", { withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leaseToken: uuid("lease_token"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    providerAccountId: text("provider_account_id").unique(),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("payout_provisioning_due_idx").on(t.state, t.nextAttemptAt)],
);
export const workerHeartbeatsTable = pgTable(
  "worker_heartbeats",
  {
    workerId: text("worker_id").primaryKey(),
    component: text("component").notNull(),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("worker_heartbeats_component_idx").on(t.component, t.lastSuccessAt),
  ],
);
export const requestLimitsTable = pgTable(
  "request_limits",
  {
    bucketKey: text("bucket_key").primaryKey(),
    requests: integer("requests").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("request_limits_expiry_idx").on(t.expiresAt)],
);
