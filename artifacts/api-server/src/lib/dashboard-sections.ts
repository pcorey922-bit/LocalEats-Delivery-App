import type { Profile } from "@workspace/db";

export type DashboardRole = Profile["role"];

const sectionsByRole: Record<DashboardRole, readonly string[]> = {
  customer: ["Account", "Saved addresses", "Order history", "Ratings"],
  restaurant: [
    "Restaurant profile",
    "Opening hours",
    "Menu categories",
    "Menu items",
    "Incoming orders",
    "Ratings",
  ],
  driver: [
    "Driver profile",
    "Availability",
    "Delivery opportunities",
    "Delivery history",
    "Earnings",
  ],
  admin: [
    "Restaurant approvals",
    "Driver accounts",
    "Orders",
    "Payments",
    "Payouts",
    "Platform settings",
  ],
};

export function getDashboardSections(role: DashboardRole): string[] {
  return [...sectionsByRole[role]];
}