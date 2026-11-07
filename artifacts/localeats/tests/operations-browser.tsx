// Isolated real-component fixture. No production route, authentication or provider.
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DispatchOperations } from "../src/pages/delivery-tracking";
import { RestaurantInventory } from "../src/pages/inventory";
const item = {
  id: "fixture-item",
  name: "Fixture stock item",
  stockOnHand: 3 as number | null,
  revision: 0,
};
const order = {
  orderId: "fixture-order",
  status: "ready_for_pickup",
  restaurantName: "Fixture kitchen",
  driverProfileId: null as string | null,
  assignedAt: null as string | null,
  arrivedAt: null,
  waitingMinutes: 4,
  pickupStreet: "Fixture pickup",
  pickupCity: "Fixture city",
  pickupRegion: "TN",
  pickupPostalCode: "37854",
  deliveryAddress: {
    street1: "Fixture destination",
    city: "Fixture city",
    region: "TN",
    postalCode: "37854",
  },
};
const drivers = [
  {
    profileId: "eligible",
    displayName: "Eligible driver",
    online: true,
    approved: true,
    status: "available",
    activeOrderId: null as string | null,
    locationStatus: "missing",
    location: null,
  },
  {
    profileId: "busy",
    displayName: "Busy driver",
    online: true,
    approved: true,
    status: "delivering",
    activeOrderId: "other-order",
    locationStatus: "missing",
    location: null,
  },
  {
    profileId: "offline",
    displayName: "Offline driver",
    online: false,
    approved: true,
    status: "offline",
    activeOrderId: null,
    locationStatus: "not_sharing",
    location: null,
  },
];
const replies: unknown[] = [];
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
window.fetch = async (input, options) => {
  const url = String(input),
    method = options?.method ?? "GET";
  if (url === "/api/restaurants/me/inventory" && method === "GET")
    return response([item]);
  if (
    url === "/api/restaurants/me/inventory/fixture-item" &&
    method === "PUT"
  ) {
    const body = JSON.parse(String(options?.body));
    replies.push({ type: "stock", ...body });
    if (body.expectedRevision !== item.revision)
      return response(
        { error: "Inventory changed. Refresh before adjusting stock" },
        409,
      );
    item.stockOnHand = body.stockOnHand;
    item.revision++;
    return response(item);
  }
  if (url === "/api/admin/dispatch")
    return response({ orders: [order], drivers });
  if (
    url === "/api/admin/orders/fixture-order/assignment" &&
    method === "POST"
  ) {
    const body = JSON.parse(String(options?.body));
    replies.push({ type: "assignment", ...body });
    if (
      body.expectedDriverProfileId !== order.driverProfileId ||
      body.expectedAssignedAt !== order.assignedAt
    )
      return response(
        { error: "Assignment changed. Refresh dispatch before trying again" },
        409,
      );
    order.driverProfileId = body.driverProfileId;
    order.assignedAt = body.driverProfileId ? new Date().toISOString() : null;
    drivers[0].activeOrderId = body.driverProfileId ? "fixture-order" : null;
    return response(order);
  }
  if (url === "/api/orders/fixture-order/tracking")
    return response({
      orderId: order.orderId,
      status: order.status,
      driverAssigned: !!order.driverProfileId,
      location: null,
      locationStatus: "not_shared",
    });
  throw new Error(`Unexpected fixture request: ${method} ${url}`);
};
Object.assign(window, { operationsFixture: { item, order, replies } });
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider
    client={
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
    }
  >
    <main>
      <h1>RoCoEats operational component verification</h1>
      <p>
        Simulated API and accounts · no business operations or provider
        connections
      </p>
      <RestaurantInventory />
      <DispatchOperations />
    </main>
  </QueryClientProvider>,
);
