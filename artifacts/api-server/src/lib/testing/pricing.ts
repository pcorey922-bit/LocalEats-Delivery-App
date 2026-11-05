import type { Pricing } from '../commerce-policy';
// Automated test fixture only. Never imported by production workflows.
// Illustrative test configuration, not an approved tax rate or business policy.
export const testPricing: Pricing = {
  deliveryFeeCents: 499,
  serviceFeeBps: 500,
  taxBps: 0,
  taxDeliveryAndService: false,
  restaurantCommissionBps: 1000,
  driverShareBps: 8000,
  allowedPostalCodes: ["37854", "37748", "37763"],
  testMode: true,
};
