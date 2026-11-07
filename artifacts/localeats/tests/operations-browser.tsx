// Isolated real-component fixture. No production route, authentication or provider.
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DispatchOperations } from "../src/pages/delivery-tracking";
import { RestaurantInventory } from "../src/pages/inventory";
import { SupportThread } from "../src/pages/support-thread";
import { OrderIncidentConsole } from "../src/pages/order-incidents";
import { PartialRefundControls } from "../src/pages/partial-refunds";
import {
  FinancialHoldConsole,
  PaymentReconciliation,
} from "../src/pages/financial-reconciliation";
const credits: {
  id: string;
  amountCents: number;
  status: string;
  fundingPolicy: string;
}[] = [];
const thread = {
  version: 1,
  messages: [] as {
    id: string;
    authorRole: string;
    kind: string;
    body: string;
    caseVersion: number;
    statusAfter: string;
    createdAt: string;
  }[],
  loseNextReply: true,
  failNextRead: false,
};
let policy = {
  reservationMinutes: 15,
  restaurantResponseMinutes: 5,
  driverAssignmentMinutes: 10,
  driverPickupMinutes: 10,
};
const hold = {
  id: "dispute:dp_fixture",
  orderId: "fixture-order",
  active: true,
  providerStatus: "under_review",
  amountCents: 1000,
  version: 1,
  note: null,
};

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
  if (url === "/api/admin/order-timing") {
    if (method === "PUT") policy = JSON.parse(String(options?.body)).policy;
    return response(policy);
  }
  if (url === "/api/admin/order-incidents") return response([]);
  if (url === "/api/admin/orders/fixture-order/partial-refunds") {
    if (method === "POST") {
      const body = JSON.parse(String(options?.body));
      replies.push({ type: "partial-refund", ...body });
      if (!credits.some((c) => c.id === body.id))
        credits.push({ ...body, status: "pending" });
      return response(
        credits.find((c) => c.id === body.id),
        202,
      );
    }
    return response(credits);
  }
  if (url === "/api/admin/financial-holds") return response([hold]);
  if (
    url.startsWith("/api/admin/financial-holds/") &&
    url.endsWith("/reconcile")
  ) {
    hold.active = false;
    hold.providerStatus = "won";
    return response(hold);
  }
  if (url === "/api/admin/orders/fixture-order/reconcile-payment")
    return response({ feeCents: 100, netCents: 2799 });
  if (url.startsWith("/api/support/cases/fixture-case/messages")) {
    if(method === "GET" && thread.failNextRead){thread.failNextRead=false;throw new TypeError("Conversation refresh failed");}
    if (method === "GET")
      return response({
        case: { id: "fixture-case", status: "open", version: thread.version },
        messages: thread.messages,
        nextBeforeVersion: null,
      });
    const body = JSON.parse(String(options?.body)),
      existing = thread.messages.find((m) => m.id === body.id);
    if (existing) return response(existing, 201);
    if (body.version !== thread.version)
      return response(
        { error: "Conversation changed. Review latest messages" },
        409,
      );
    const message = {
      id: body.id,
      authorRole: "customer",
      kind: "reply",
      body: body.message,
      caseVersion: ++thread.version,
      statusAfter: "open",
      createdAt: new Date().toISOString(),
    };
    thread.messages.push(message);
    if (thread.loseNextReply) {
      thread.loseNextReply = false;
      throw new TypeError("Network response lost after saving reply");
    }
    return response(message, 201);
  }
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
Object.assign(window, {
  operationsFixture: { item, order, replies, credits, thread, hold },
});
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
      <OrderIncidentConsole />
      <PartialRefundControls orderId="fixture-order" />
      <FinancialHoldConsole />
      <PaymentReconciliation orderId="fixture-order" />
      <SupportThread caseId="fixture-case" />
    </main>
  </QueryClientProvider>,
);
