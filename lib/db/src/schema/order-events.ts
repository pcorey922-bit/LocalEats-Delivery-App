import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orderStatusEnum } from "./enums";
import { ordersTable } from "./orders";
import { profilesTable } from "./profiles";

export const orderEventsTable = pgTable("order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  actorProfileId: uuid("actor_profile_id").references(() => profilesTable.id, {
    onDelete: "set null",
  }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OrderEvent = typeof orderEventsTable.$inferSelect;