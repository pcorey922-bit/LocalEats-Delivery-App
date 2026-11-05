import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "restaurant",
  "driver",
  "admin",
]);

export const restaurantStatusEnum = pgEnum("restaurant_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "cart",
  "placed",
  "restaurant_received",
  "pending",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "unassigned",
  "assigned",
  "picked_up",
  "delivered",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "succeeded",
  "failed",
  "refunded",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "reversed",
  "reversal_pending",
]);

export const ratingSubjectTypeEnum = pgEnum("rating_subject_type", [
  "restaurant",
  "driver",
]);