// Isolated component fixture: simulated auth/API only; never a production route.
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccountAccess } from "../src/pages/account-access";
import { AccountSettings } from "../src/pages/account-settings";
import { AdministratorAccessManager } from "../src/pages/administrator-access";
import { PricingSettings } from "../src/pages/commerce-pages";
import { PaymentSetupChecks } from "../src/pages/payment-setup";
import { OrderTracking } from "../src/pages/delivery-tracking";
import { DeclinedOffers } from "../src/pages/declined-offers";
declare global {
  interface Window {
    qaPricingReady: boolean;
    qaPricingWrites: unknown[];
    qaSignedEventAt: string | null;
    qaAccess: Record<string, string | boolean>;
    qaWrites: unknown[];
    qaAdminWrites: unknown[];
    qaStaff: {
      id: string;
      displayName: string;
      role: string;
      isActive: boolean;
      accessVersion: string;
    };
    qaTracking: Record<string, unknown>;
    qaDeclinedOffers: {
      orderId: string;
      restaurantName: string;
      declineId: string;
      declinedUntil: string;
    }[];
    qaReconsiderRequests: unknown[];
  }
}
window.qaAccess = {
  ownerConfigured: true,
  ownerMatched: true,
  ownerDriverConfigured: true,
  ownerDriverMatched: true,
  profileStatus: "active",
  role: "admin",
  administrator: true,
  superAdministrator: true,
  driver: true,
};
window.qaPricingReady = false;
window.qaPricingWrites = [];
window.qaSignedEventAt = null;
window.qaWrites = [];
window.qaAdminWrites = [];
window.qaReconsiderRequests = [];
window.qaDeclinedOffers = [
  {
    orderId: "fixture-offer",
    restaurantName: "QA kitchen",
    declineId: "11111111-1111-4111-8111-111111111111",
    declinedUntil: new Date(Date.now() + 15 * 60000).toISOString(),
  },
];
window.qaTracking = {
  status: "ready_for_pickup",
  driverAssigned: true,
  assignedDriver: { displayName: "QA courier" },
  deliveryStatus: "assigned",
  arrivedAt: "2026-11-08T12:00:00Z",
  pickedUpAt: null,
  deliveredAt: null,
  locationStatus: "not_shared",
  location: null,
};
window.qaStaff = {
  id: "staff-fixture",
  displayName: "QA staff",
  role: "customer",
  isActive: true,
  accessVersion: "v1",
};
window.fetch = async (url, options = {}) => {
  if (String(url) === "/api/admin/pricing" && options.method === "PUT") {
    window.qaPricingWrites.push(JSON.parse(String(options.body)));
    window.qaPricingReady = true;
    return new Response("{}", {
      headers: { "content-type": "application/json" },
    });
  }
  if (String(url) === "/api/driver/offers?declined=true")
    return new Response(JSON.stringify(window.qaDeclinedOffers), {
      headers: { "content-type": "application/json" },
    });
  if (
    String(url) === "/api/driver/orders/fixture-offer/decline-offer" &&
    options.method === "DELETE"
  ) {
    window.qaReconsiderRequests.push(JSON.parse(String(options.body)));
    window.qaDeclinedOffers = [];
    return new Response(JSON.stringify({ reconsidered: true }), {
      headers: { "content-type": "application/json" },
    });
  }
  if (String(url) === "/api/orders/fixture-tracking/tracking")
    return new Response(JSON.stringify(window.qaTracking), {
      headers: { "content-type": "application/json" },
    });
  if (
    String(url) === "/api/admin/payment-setup" ||
    String(url) === "/api/admin/payment-setup/verify"
  ) {
    const state = {
      pricingReady: window.qaPricingReady,
      testProviderConfigured: true,
      expectedWebhookUrl: "https://qa.onrender.com/api/webhooks/stripe",
      apiVersion: "fixture-version",
      requiredEvents: ["checkout.session.completed"],
      webhookSecretPresent: false,
      lastAcceptedSignedEventAt: window.qaSignedEventAt,
      orderingEnabled: false,
    };
    return new Response(
      JSON.stringify(
        options.method === "POST"
          ? {
              ...state,
              provider: {
                testModeConfirmed: true,
                balanceError: null,
                endpointError: null,
                endpointFound: true,
                endpointEnabled: true,
                apiVersionMatches: true,
                missingEvents: [],
                endpointConfigurationVerified: true,
                endpointSearchComplete: true,
              },
            }
          : state,
      ),
      { headers: { "content-type": "application/json" } },
    );
  }
  if (String(url) === "/api/session/access")
    return new Response(JSON.stringify(window.qaAccess), {
      headers: { "content-type": "application/json" },
    });
  if (String(url) === "/api/profiles/me" && options.method === "PATCH") {
    window.qaWrites.push(JSON.parse(String(options.body)));
    return new Response("{}", {
      headers: { "content-type": "application/json" },
    });
  }
  if (String(url) === "/api/admin/administrator-access")
    return new Response(JSON.stringify([window.qaStaff]), {
      headers: { "content-type": "application/json" },
    });
  if (String(url) === "/api/admin/administrator-access/staff-fixture") {
    const input = JSON.parse(String(options.body));
    window.qaAdminWrites.push(input);
    window.qaStaff.role = input.enabled ? "admin" : "customer";
    window.qaStaff.accessVersion = input.enabled ? "v2" : "v3";
    return new Response(JSON.stringify(window.qaStaff), {
      headers: { "content-type": "application/json" },
    });
  }
  throw Error("Unexpected QA request " + url);
};
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <p>SIMULATED authentication and API: component QA only</p>
    <AccountAccess />
    <AdministratorAccessManager />
    <AccountSettings displayName="QA profile" />
    <PaymentSetupChecks />
    <PricingSettings current={null} />
    <OrderTracking orderId="fixture-tracking" />
    <DeclinedOffers />
  </QueryClientProvider>,
);
