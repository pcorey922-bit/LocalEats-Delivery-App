import assert from "node:assert/strict";
import { test } from "node:test";
import { CreateMyProfileBody } from "@workspace/api-zod";
import { getDashboardSections } from "./dashboard-sections";

test("each saved role receives only its own dashboard sections", () => {
  assert.deepEqual(getDashboardSections("customer"), [
    "Account",
    "Saved addresses",
    "Order history",
    "Ratings",
  ]);
  assert.deepEqual(getDashboardSections("restaurant"), [
    "Restaurant profile",
    "Opening hours",
    "Menu categories",
    "Menu items",
    "Incoming orders",
    "Ratings",
  ]);
  assert.deepEqual(getDashboardSections("driver"), [
    "Driver profile",
    "Availability",
    "Delivery opportunities",
    "Delivery history",
    "Earnings",
  ]);
  assert.deepEqual(getDashboardSections("admin"), [
    "Restaurant approvals",
    "Driver accounts",
    "Orders",
    "Payments",
    "Payouts",
    "Platform settings",
  ]);
});

test("public profile setup accepts the three member roles but rejects admin", () => {
  for (const role of ["customer", "restaurant", "driver"] as const) {
    assert.equal(
      CreateMyProfileBody.safeParse({ role, displayName: "Local neighbor" }).success,
      true,
    );
  }
  assert.equal(
    CreateMyProfileBody.safeParse({ role: "admin", displayName: "Local neighbor" }).success,
    false,
  );
});