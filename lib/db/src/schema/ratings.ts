import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { ratingSubjectTypeEnum } from "./enums";
import { ordersTable } from "./orders";
import { profilesTable } from "./profiles";
import { restaurantsTable } from "./restaurants";

export const ratingsTable = pgTable("ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  reviewerProfileId: uuid("reviewer_profile_id").notNull().references(() => profilesTable.id, { onDelete: "restrict" }),
  subjectType: ratingSubjectTypeEnum("subject_type").notNull(),
  restaurantId: uuid("restaurant_id").references(() => restaurantsTable.id, { onDelete: "cascade" }),
  driverProfileId: uuid("driver_profile_id").references(() => profilesTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;