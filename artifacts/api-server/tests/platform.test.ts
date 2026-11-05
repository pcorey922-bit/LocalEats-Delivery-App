import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import app from "../src/app";
import {
  engine,
  db,
  profilesTable,
  restaurantsTable,
  menuCategoriesTable,
  menuItemsTable,
  addressesTable,
  restaurantHoursTable,
  ordersTable,
  paymentsTable,
  notificationsTable,
  payoutsTable,
  refundsTable,
  platformSettingsTable,
  financialOperationsTable,
  driverPresenceTable,
  deliveryLocationsTable,
  webhookInboxTable,
  connectedAccountsTable,
  payoutProvisioningTable,
  ledgerTransactionsTable,
  ledgerLinesTable,
} from "./database";
import { testPricing } from "../src/lib/testing/pricing";
import { processWebhookInbox } from "../src/lib/webhook-worker";
import { processPayoutProvisioning } from "../src/lib/payout-onboarding";
import { processFinancialOperation } from "../src/lib/financial-operations";
import { postJournal, journalRefund } from "../src/lib/ledger";
const ids = {
  customer: randomUUID(),
  other: randomUUID(),
  restaurant: randomUUID(),
  driver: randomUUID(),
  driver2: randomUUID(),
  unapproved: randomUUID(),
  admin: randomUUID(),
  business: randomUUID(),
  category: randomUUID(),
  item: randomUUID(),
  address: randomUUID(),
};
let server: ReturnType<typeof app.listen>;
let origin: string;
async function api(
  path: string,
  user: string | null,
  method = "GET",
  data?: unknown,
  key?: string,
) {
  const response = await fetch(`${origin}/api${path}`, {
    method,
    headers: {
      ...(user ? { "x-test-user": user } : {}),
      ...(data ? { "content-type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: response.status, data: await response.json() };
}
const input = () => ({
  restaurantId: ids.business,
  addressId: ids.address,
  items: [{ menuItemId: ids.item, quantity: 2 }],
  tipCents: 300,
});
async function create() {
  const quote = await api("/orders/quote", ids.customer, "POST", input());
  assert.equal(quote.status, 200, JSON.stringify(quote.data));
  const created = await api(
    "/orders",
    ids.customer,
    "POST",
    { ...input(), expectedTotalCents: quote.data.totalCents },
    randomUUID(),
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  return created.data;
}
async function pay(id: string) {
  assert.equal(
    (await api(`/orders/${id}/checkout`, ids.customer, "POST")).status,
    200,
  );
  const result = await api(
    `/orders/${id}/sandbox-payment`,
    ids.customer,
    "POST",
    { outcome: "succeeded" },
  );
  assert.equal(result.status, 200, JSON.stringify(result.data));
}
async function ready(id: string) {
  await pay(id);
  for (const status of ["accepted", "preparing", "ready_for_pickup"]) {
    const result = await api(`/orders/${id}`, ids.restaurant, "PATCH", {
      status,
    });
    assert.equal(result.status, 200, JSON.stringify(result.data));
  }
}
before(async () => {
  process.env.PAYMENT_PROVIDER = "sandbox";
  process.env.NODE_ENV = "test";
  process.env.API_MUTATION_LIMIT_PER_MINUTE = "10000";
  delete process.env.STRIPE_SECRET_KEY;
  for (const file of (await readdir("../../lib/db/drizzle"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await engine.exec(await readFile(`../../lib/db/drizzle/${file}`, "utf8"));
  await db
    .insert(platformSettingsTable)
    .values({ settingKey: "test_pricing", value: testPricing });
  for (const role of [
    "customer",
    "other",
    "restaurant",
    "driver",
    "driver2",
    "unapproved",
    "admin",
  ] as const)
    await db.insert(profilesTable).values({
      id: ids[role],
      clerkUserId: ids[role],
      displayName: `Test ${role}`,
      role:
        role === "other"
          ? "customer"
          : role === "driver2" || role === "unapproved"
            ? "driver"
            : role,
      driverApproved: role === "driver" || role === "driver2",
    });
  for (const profileId of [ids.driver, ids.driver2, ids.unapproved])
    await db.insert(driverPresenceTable).values({ profileId, available: true });
  await db.insert(restaurantsTable).values({
    id: ids.business,
    ownerProfileId: ids.restaurant,
    name: "TEST FIXTURE ONLY",
    street1: "Test pickup",
    city: "Test city",
    postalCode: "37854",
    status: "approved",
    acceptingOrders: true,
  });
  for (let weekday = 0; weekday < 7; weekday++)
    await db.insert(restaurantHoursTable).values({
      restaurantId: ids.business,
      weekday,
      openTime: "00:00",
      closeTime: "24:00",
    });
  await db.insert(menuCategoriesTable).values({
    id: ids.category,
    restaurantId: ids.business,
    name: "Test category",
  });
  await db.insert(menuItemsTable).values({
    id: ids.item,
    restaurantId: ids.business,
    categoryId: ids.category,
    name: "Test item",
    priceCents: 1000,
  });
  await db.insert(addressesTable).values({
    id: ids.address,
    profileId: ids.customer,
    street1: "PRIVATE CUSTOMER STREET",
    city: "Test city",
    region: "TN",
    postalCode: "37854",
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await engine.close();
});
test("real relational HTTP platform flows", { timeout: 120000 }, async (t) => {
  await t.test("anonymous and wrong-role requests are rejected", async () => {
    assert.equal((await api("/driver/offers", null)).status, 401);
    assert.equal(
      (
        await api(
          `/driver/orders/${"-".repeat(36)}/release`,
          ids.driver,
          "POST",
        )
      ).status,
      400,
    );

    assert.equal((await api("/driver/offers", ids.customer)).status, 403);
    assert.equal((await api("/driver/offers", ids.unapproved)).status, 403);
    assert.equal((await api("/admin/payouts", ids.customer)).status, 403);
  });
  await t.test("cross-site cookie mutations are rejected", async () => {
    const response = await fetch(`${origin}/api/orders/quote`, {
      method: "POST",
      headers: {
        "x-test-user": ids.customer,
        "content-type": "application/json",
        cookie: "__session=test",
        origin: "https://untrusted.example",
      },
      body: JSON.stringify(input()),
    });
    assert.equal(response.status, 403);
  });
  await t.test(
    "quotes enforce address ownership, delivery area, and server totals",
    async () => {
      assert.equal(
        (await api("/orders/quote", ids.other, "POST", input())).status,
        404,
      );
      assert.equal(
        (
          await api(
            "/orders",
            ids.customer,
            "POST",
            { ...input(), expectedTotalCents: 1 },
            randomUUID(),
          )
        ).status,
        409,
      );
      const quote = await api("/orders/quote", ids.customer, "POST", input());
      assert.equal(quote.data.totalCents, 2899); // 2000 + 499 delivery + 100 service + 300 tip
    },
  );
  await t.test(
    "paused restaurants, unsupported addresses, and private settings are enforced",
    async () => {
      await db
        .update(restaurantsTable)
        .set({ acceptingOrders: false })
        .where(eq(restaurantsTable.id, ids.business));
      assert.equal(
        (await api("/orders/quote", ids.customer, "POST", input())).status,
        409,
      );
      await db
        .update(restaurantsTable)
        .set({ acceptingOrders: true })
        .where(eq(restaurantsTable.id, ids.business));
      await db
        .update(addressesTable)
        .set({ postalCode: "99999" })
        .where(eq(addressesTable.id, ids.address));
      assert.equal(
        (await api("/orders/quote", ids.customer, "POST", input())).status,
        409,
      );
      await db
        .update(addressesTable)
        .set({ postalCode: "37854" })
        .where(eq(addressesTable.id, ids.address));
      assert.equal(
        (await api("/restaurants/me/availability/settings", ids.customer))
          .status,
        403,
      );
      assert.equal(
        (await api("/admin/pricing", ids.customer, "PUT", {})).status,
        403,
      );
    },
  );
  await t.test(
    "customer cannot grant driver approval and admin revocation takes effect",
    async () => {
      assert.equal(
        (
          await api(
            `/admin/drivers/${ids.unapproved}/approval`,
            ids.customer,
            "PATCH",
            { approved: true },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await api(
            `/admin/drivers/${ids.unapproved}/approval`,
            ids.admin,
            "PATCH",
            { approved: true },
          )
        ).status,
        200,
      );
      assert.equal((await api("/driver/offers", ids.unapproved)).status, 200);
      assert.equal(
        (
          await api(
            `/admin/drivers/${ids.unapproved}/approval`,
            ids.admin,
            "PATCH",
            { approved: false },
          )
        ).status,
        200,
      );
      assert.equal((await api("/driver/offers", ids.unapproved)).status, 403);
    },
  );
  await t.test(
    "checkout creation is idempotent and body conflicts are rejected",
    async () => {
      const quote = await api("/orders/quote", ids.customer, "POST", input());
      const key = randomUUID();
      const data = { ...input(), expectedTotalCents: quote.data.totalCents };
      const first = await api("/orders", ids.customer, "POST", data, key);
      const replay = await api("/orders", ids.customer, "POST", data, key);
      assert.equal(first.status, 201, JSON.stringify(first.data));
      assert.equal(replay.status, 200);
      assert.equal(first.data.id, replay.data.id);
      assert.equal(
        (
          await api(
            "/orders",
            ids.customer,
            "POST",
            { ...data, tipCents: 100 },
            key,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await api(`/orders/${first.data.id}`, ids.restaurant, "PATCH", {
            status: "accepted",
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "concurrent checkout retries create exactly one order",
    async () => {
      const quote = await api("/orders/quote", ids.customer, "POST", input());
      const key = randomUUID();
      const body = { ...input(), expectedTotalCents: quote.data.totalCents };
      const results = await Promise.all([
        api("/orders", ids.customer, "POST", body, key),
        api("/orders", ids.customer, "POST", body, key),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
      assert.equal(results[0].data.id, results[1].data.id);
    },
  );
  await t.test(
    "a driver can release an unpicked delivery for reassignment",
    async () => {
      const order = await create();
      await ready(order.id);
      assert.equal(
        (await api(`/driver/orders/${order.id}/claim`, ids.driver, "POST"))
          .status,
        201,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/release`, ids.driver2, "POST"))
          .status,
        409,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/release`, ids.driver, "POST"))
          .status,
        200,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/claim`, ids.driver2, "POST"))
          .status,
        201,
      );
      assert.equal(
        (
          await api(`/orders/${order.id}/cancel`, ids.admin, "POST", {
            reason: "End reassignment test",
          })
        ).status,
        200,
      );
    },
  );
  await t.test(
    "paid offers protect customer addresses and concurrent claim has one winner",
    async () => {
      const order = await create();
      await ready(order.id);
      const offers = await api("/driver/offers", ids.driver);
      assert.equal(offers.status, 200);
      assert.ok(offers.data.some((x: any) => x.orderId === order.id));
      assert.equal(
        JSON.stringify(offers.data).includes("PRIVATE CUSTOMER STREET"),
        false,
      );
      const results = await Promise.all([
        api(`/driver/orders/${order.id}/claim`, ids.driver, "POST"),
        api(`/driver/orders/${order.id}/claim`, ids.driver2, "POST"),
      ]);
      assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
      const winner = results[0].status === 201 ? ids.driver : ids.driver2;
      const loser = winner === ids.driver ? ids.driver2 : ids.driver;
      assert.equal(
        (await api(`/driver/orders/${order.id}/pickup`, loser, "POST")).status,
        409,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/deliver`, winner, "POST"))
          .status,
        409,
      );
      assert.equal(
        (
          await api(`/orders/${order.id}`, ids.restaurant, "PATCH", {
            status: "delivered",
          })
        ).status,
        403,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/pickup`, winner, "POST")).status,
        200,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/deliver`, winner, "POST"))
          .status,
        200,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/deliver`, winner, "POST"))
          .status,
        409,
      );
      const earnings = await db
        .select()
        .from(payoutsTable)
        .where(eq(payoutsTable.orderId, order.id));
      assert.equal(earnings.length, 2);
      assert.equal(
        earnings.find((x) => x.kind === "restaurant")?.amountCents,
        1800,
      );
      assert.equal(earnings.find((x) => x.kind === "driver")?.amountCents, 699);
      for (const recipient of [ids.restaurant, winner])
        assert.equal(
          (await api("/payout-account/onboard", recipient, "POST")).status,
          200,
        );
      for (const payout of earnings) {
        assert.equal(
          (await api(`/admin/payouts/${payout.id}/transfer`, ids.admin, "POST"))
            .status,
          200,
        );
        assert.equal(
          (await api(`/admin/payouts/${payout.id}/transfer`, ids.admin, "POST"))
            .status,
          200,
        );
      }
      assert.equal(
        (
          await api(`/orders/${order.id}/cancel`, ids.admin, "POST", {
            reason: "Full test refund after delivery",
          })
        ).status,
        200,
      );
      const [fulfilled] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, order.id));
      assert.equal(
        fulfilled.status,
        "delivered",
        "A post-delivery refund must preserve fulfillment history",
      );
      const reversed = await db
        .select()
        .from(payoutsTable)
        .where(eq(payoutsTable.orderId, order.id));
      assert.ok(
        reversed.every((x) => x.providerReversalId && x.status === "reversed"),
      );
      assert.equal(
        (
          await api(
            `/admin/payouts/${earnings[0].id}/transfer`,
            ids.admin,
            "POST",
          )
        ).status,
        409,
      );
    },
  );
  await t.test(
    "full refunds are idempotent and cancellation blocks dispatch",
    async () => {
      const order = await create();
      await pay(order.id);
      assert.equal(
        (await api(`/orders/${order.id}/payment`, ids.other)).status,
        403,
      );
      const cancellations = await Promise.all([
        api(`/orders/${order.id}/cancel`, ids.customer, "POST", {
          reason: "Test customer cancellation",
        }),
        api(`/orders/${order.id}/cancel`, ids.customer, "POST", {
          reason: "Test customer cancellation",
        }),
      ]);
      assert.ok(cancellations.every((r) => r.status === 200));
      const details = await api(`/orders/${order.id}/payment`, ids.customer);
      assert.equal(details.data.payment.status, "refunded");
      assert.equal(details.data.refund.status, "succeeded");
      assert.equal(
        (await api(`/orders/${order.id}/checkout`, ids.customer, "POST"))
          .status,
        409,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/claim`, ids.driver, "POST"))
          .status,
        409,
      );
      assert.equal(
        (
          await db
            .select()
            .from(refundsTable)
            .where(eq(refundsTable.orderId, order.id))
        ).length,
        1,
      );
    },
  );
  await t.test(
    "unpaid cancellation never issues a refund or permits a later charge",
    async () => {
      const order = await create();
      assert.equal(
        (
          await api(`/orders/${order.id}/cancel`, ids.customer, "POST", {
            reason: "Cancel before payment",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await api(
            `/orders/${order.id}/sandbox-payment`,
            ids.customer,
            "POST",
            { outcome: "succeeded" },
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await db
            .select()
            .from(refundsTable)
            .where(eq(refundsTable.orderId, order.id))
        ).length,
        0,
      );
    },
  );
  await t.test(
    "account deletion requests and device records are scoped to the signed-in user",
    async () => {
      assert.equal(
        (await api("/account/deletion-request", ids.other, "POST")).status,
        202,
      );
      assert.equal(
        (await api("/admin/deletion-requests", ids.customer)).status,
        403,
      );
      assert.equal(
        (await api("/admin/deletion-requests", ids.admin)).status,
        200,
      );
      assert.equal(
        (
          await api("/notification-devices", ids.customer, "POST", {
            platform: "ios",
            token: "invalid-but-long-enough",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await api("/notification-devices", ids.customer, "POST", {
            platform: "android",
            token: "test_device_token_1234567890",
          })
        ).status,
        201,
      );
    },
  );
  await t.test(
    "notification reads cannot alter another account inbox",
    async () => {
      const inbox = await api("/notifications", ids.customer);
      assert.equal(inbox.status, 200);
      assert.ok(inbox.data.length > 0);
      assert.equal(
        (
          await api(
            `/notifications/${inbox.data[0].id}/read`,
            ids.other,
            "POST",
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await api(
            `/notifications/${inbox.data[0].id}/read`,
            ids.customer,
            "POST",
          )
        ).status,
        200,
      );
    },
  );
  await t.test(
    "signed Stripe test webhooks enforce session, totals, replay and live rejection",
    async () => {
      const order = await create();
      await db
        .update(paymentsTable)
        .set({ provider: "stripe_test", checkoutSessionId: "cs_test_fixture" })
        .where(eq(paymentsTable.orderId, order.id));
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
      const stripe = new Stripe("sk_test_fixture");
      const send = async (event: any) => {
        const payload = JSON.stringify(event);
        const response = await fetch(`${origin}/api/webhooks/stripe`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "stripe-signature": stripe.webhooks.generateTestHeaderString({
              payload,
              secret: "whsec_fixture",
            }),
          },
          body: payload,
        });
        if (response.status === 202) await processWebhookInbox();
        return response;
      };
      const event = {
        id: "evt_fixture",
        type: "checkout.session.completed",
        livemode: false,
        data: {
          object: {
            id: "cs_test_fixture",
            payment_status: "paid",
            payment_intent: "pi_fixture",
            metadata: { orderId: order.id },
            client_reference_id: order.id,
            amount_total: order.totalCents,
            currency: "usd",
          },
        },
      };
      assert.equal(
        (
          await api(
            `/orders/${order.id}/sandbox-payment`,
            ids.customer,
            "POST",
            { outcome: "succeeded" },
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await send({
            ...event,
            id: "evt_unpaid",
            data: {
              object: { ...event.data.object, payment_status: "unpaid" },
            },
          })
        ).status,
        202,
      );
      const [beforePaid] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, order.id));
      assert.equal(beforePaid.status, "pending");
      assert.equal(
        (
          await send({
            ...event,
            id: "evt_async_failed",
            type: "checkout.session.async_payment_failed",
            data: {
              object: { ...event.data.object, payment_status: "unpaid" },
            },
          })
        ).status,
        202,
      );
      const [failedPayment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, order.id));
      assert.equal(failedPayment.status, "failed");

      assert.equal(
        (
          await send({
            ...event,
            id: "evt_mismatch",
            data: { object: { ...event.data.object, amount_total: 1 } },
          })
        ).status,
        202,
      );
      const [mismatch] = await db
        .select()
        .from(webhookInboxTable)
        .where(eq(webhookInboxTable.id, "evt_mismatch"));
      assert.equal(mismatch.state, "reconciliation");
      assert.equal(
        (await send({ ...event, id: "evt_live", livemode: true })).status,
        400,
      );
      assert.equal((await send(event)).status, 202);
      assert.equal((await send(event)).status, 202);
      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, order.id));
      assert.equal(payment.status, "succeeded");
      const unsigned = await fetch(`${origin}/api/webhooks/stripe`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
      });
      assert.equal(unsigned.status, 400);
      process.env.PAYMENT_PROVIDER = "sandbox";
      delete process.env.STRIPE_SECRET_KEY;
    },
  );
  await t.test(
    "missing pricing fails closed instead of using example fees",
    async () => {
      await db
        .delete(platformSettingsTable)
        .where(eq(platformSettingsTable.settingKey, "test_pricing"));
      try {
        const config = await api("/commerce/config", null);
        assert.equal(config.data.configurationRequired, true);
        assert.equal(config.data.pricing, null);
        assert.equal(
          (await api("/orders/quote", ids.customer, "POST", input())).status,
          503,
        );
      } finally {
        await db
          .insert(platformSettingsTable)
          .values({ settingKey: "test_pricing", value: testPricing });
      }
    },
  );
  await t.test(
    "one driver cannot claim simultaneous orders and stale GPS is rejected",
    async () => {
      const first = await create();
      const second = await create();
      await ready(first.id);
      await ready(second.id);
      const claims = await Promise.all([
        api(`/driver/orders/${first.id}/claim`, ids.driver, "POST"),
        api(`/driver/orders/${second.id}/claim`, ids.driver, "POST"),
      ]);
      assert.deepEqual(claims.map((r) => r.status).sort(), [201, 409]);
      const active = claims[0].status === 201 ? first : second;
      assert.equal(
        (
          await api(
            `/driver/orders/${active.id}/location`,
            ids.driver2,
            "POST",
            {
              latitude: 35,
              longitude: -84,
              accuracyMeters: 10,
              observedAt: new Date().toISOString(),
            },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await api(
            `/driver/orders/${active.id}/location`,
            ids.driver,
            "POST",
            {
              latitude: 35,
              longitude: -84,
              accuracyMeters: 10,
              observedAt: new Date(Date.now() - 300000).toISOString(),
            },
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await api(
            `/driver/orders/${active.id}/location`,
            ids.driver,
            "POST",
            {
              latitude: 35,
              longitude: -84,
              accuracyMeters: 10,
              observedAt: new Date().toISOString(),
            },
          )
        ).status,
        202,
      );
      assert.equal(
        (await api(`/orders/${active.id}/tracking`, ids.other)).status,
        403,
      );
      assert.equal(
        (await api(`/orders/${active.id}/tracking`, ids.customer)).data
          .locationStatus,
        "current",
      );
      await api(`/orders/${first.id}/cancel`, ids.admin, "POST", {
        reason: "End dispatch concurrency check",
      });
      await api(`/orders/${second.id}/cancel`, ids.admin, "POST", {
        reason: "End dispatch concurrency check",
      });
    },
  );
  await t.test(
    "a provider timeout retains its operation and retries the same request",
    async () => {
      const order = await create();
      await db
        .update(paymentsTable)
        .set({ provider: "stripe_test" })
        .where(eq(paymentsTable.orderId, order.id));
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      try {
        const queued = await api(
          `/orders/${order.id}/checkout`,
          ids.customer,
          "POST",
        );
        assert.equal(queued.status, 202);
        const id = queued.data.operationId;
        const receipts = new Map();
        let calls = 0;
        const provider = async (job: any) => {
          assert.equal(job.id, id);
          calls++;
          if (!receipts.has(job.id))
            receipts.set(job.id, {
              id: "cs_recovered_fixture",
              status: "open",
              url: "https://checkout.stripe.com/test-fixture",
            });
          if (calls === 1)
            throw new Error("Timeout after provider created session");
          return receipts.get(job.id);
        };
        await processFinancialOperation(provider);
        const [lost] = await db
          .select()
          .from(financialOperationsTable)
          .where(eq(financialOperationsTable.id, id));
        assert.equal(lost.state, "queued");
        assert.ok(lost.firstAttemptAt);
        assert.equal(lost.attempts, 1);
        await db
          .update(financialOperationsTable)
          .set({ nextAttemptAt: new Date(0) })
          .where(eq(financialOperationsTable.id, id));
        await processFinancialOperation(provider);
        const [recovered] = await db
          .select()
          .from(financialOperationsTable)
          .where(eq(financialOperationsTable.id, id));
        assert.equal(recovered.state, "succeeded");
        assert.equal(recovered.attempts, 2);
        assert.equal(receipts.size, 1);
        const [payment] = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.orderId, order.id));
        assert.equal(payment.checkoutSessionId, "cs_recovered_fixture");
        assert.equal(
          payment.status,
          "pending",
          "Preparing checkout must not invent payment success",
        );
        assert.equal(
          (await api(`/orders/${order.id}/financial-operations`, ids.other))
            .status,
          403,
        );
        await db
          .update(financialOperationsTable)
          .set({
            state: "queued",
            firstAttemptAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            nextAttemptAt: new Date(0),
          })
          .where(eq(financialOperationsTable.id, id));
        let unsafeCalls = 0;
        await processFinancialOperation(async () => {
          unsafeCalls++;
          throw new Error("Must not call provider");
        });
        assert.equal(unsafeCalls, 0);
        const [held] = await db
          .select()
          .from(financialOperationsTable)
          .where(eq(financialOperationsTable.id, id));
        assert.equal(held.state, "reconciliation");
        assert.equal(
          (
            await api(
              `/admin/financial-operations/${encodeURIComponent(id)}/reconcile`,
              ids.customer,
              "POST",
            )
          ).status,
          403,
        );
      } finally {
        process.env.PAYMENT_PROVIDER = "sandbox";
        delete process.env.STRIPE_SECRET_KEY;
      }
    },
  );
  await t.test(
    "cancellation persists while transfer I/O is blocked; refund and recovery remain separate",
    async () => {
      const order = await create();
      await ready(order.id);
      await api(`/driver/orders/${order.id}/claim`, ids.driver, "POST");
      await api(`/driver/orders/${order.id}/pickup`, ids.driver, "POST");
      await api(`/driver/orders/${order.id}/deliver`, ids.driver, "POST");
      await db
        .update(paymentsTable)
        .set({ provider: "stripe_test", providerPaymentId: `pi_${order.id}` })
        .where(eq(paymentsTable.orderId, order.id));
      await db
        .insert(connectedAccountsTable)
        .values({
          profileId: ids.restaurant,
          provider: "stripe_test",
          providerAccountId: "acct_test_recovery",
          ready: true,
        })
        .onConflictDoUpdate({
          target: connectedAccountsTable.profileId,
          set: {
            provider: "stripe_test",
            providerAccountId: "acct_test_recovery",
            ready: true,
          },
        });
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      let release!: () => void;
      let began!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      const started = new Promise<void>((r) => (began = r));
      try {
        const payouts = await db
          .select()
          .from(payoutsTable)
          .where(eq(payoutsTable.orderId, order.id));
        const restaurant = payouts.find((p) => p.kind === "restaurant")!;
        const queued = await api(
          `/admin/payouts/${restaurant.id}/transfer`,
          ids.admin,
          "POST",
        );
        assert.equal(queued.status, 202);
        const worker = processFinancialOperation(async (job) => {
          assert.equal(job.id, `transfer:${restaurant.id}`);
          began();
          await gate;
          return { id: "tr_inflight_fixture", status: "succeeded" };
        });
        await started;
        const cancel = await api(
          `/orders/${order.id}/cancel`,
          ids.admin,
          "POST",
          { reason: "Restaurant support cancellation during transfer" },
        );
        assert.equal(cancel.status, 200);
        const [savedRefund] = await db
          .select()
          .from(refundsTable)
          .where(eq(refundsTable.orderId, order.id));
        assert.equal(savedRefund.status, "pending");
        release();
        await worker;
        await processFinancialOperation(async (job) => {
          assert.equal(job.kind, "refund");
          return { id: "re_inflight_fixture", status: "succeeded" };
        });
        const [refunded] = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.orderId, order.id));
        assert.equal(refunded.status, "refunded");
        await processFinancialOperation(async (job) => {
          assert.equal(job.kind, "reversal");
          throw new Error("Recipient recovery temporarily unavailable");
        });
        const [stillRefunded] = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.orderId, order.id));
        assert.equal(stillRefunded.status, "refunded");
        const [recovery] = await db
          .select()
          .from(financialOperationsTable)
          .where(eq(financialOperationsTable.id, `reversal:${restaurant.id}`));
        assert.equal(recovery.state, "queued");
        await db
          .update(financialOperationsTable)
          .set({ nextAttemptAt: new Date(0) })
          .where(eq(financialOperationsTable.id, recovery.id));
        await processFinancialOperation(async () => ({
          id: "trr_recovered_fixture",
          status: "succeeded",
        }));
        const [paid] = await db
          .select()
          .from(payoutsTable)
          .where(eq(payoutsTable.id, restaurant.id));
        assert.equal(paid.status, "reversed");
        await db.transaction((tx) =>
          journalRefund(tx, order.id, order.totalCents),
        );
        const report = await api(
          `/admin/ledger?orderId=${order.id}`,
          ids.admin,
        );
        assert.equal(report.status, 200, JSON.stringify(report.data));
        assert.equal(report.data.balanced, true);
        assert.ok(
          report.data.balances.every(
            (row: { balanceCents: string }) => row.balanceCents === "0",
          ),
          JSON.stringify(report.data.balances),
        );
      } finally {
        release?.();
        process.env.PAYMENT_PROVIDER = "sandbox";
        delete process.env.STRIPE_SECRET_KEY;
      }
    },
  );
  await t.test(
    "a refund webhook arriving before the worker response is monotonic and replay-safe",
    async () => {
      const order = await create();
      await pay(order.id);
      await db
        .update(paymentsTable)
        .set({ provider: "stripe_test", providerPaymentId: `pi_${order.id}` })
        .where(eq(paymentsTable.orderId, order.id));
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
      let release!: () => void;
      let began!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      const started = new Promise<void>((r) => (began = r));
      try {
        await api(`/orders/${order.id}/cancel`, ids.customer, "POST", {
          reason: "Refund webhook race check",
        });
        const worker = processFinancialOperation(async (job) => {
          assert.equal(job.kind, "refund");
          began();
          await gate;
          return { id: "re_webhook_race", status: "pending" };
        });
        await started;
        const stripe = new Stripe("sk_test_fixture");
        const send = async (status: string, id: string) => {
          const payload = JSON.stringify({
            id,
            type: "refund.updated",
            livemode: false,
            data: {
              object: {
                id: "re_webhook_race",
                payment_intent: `pi_${order.id}`,
                amount: order.totalCents,
                currency: "usd",
                status,
                metadata: { operationId: `refund:${order.id}` },
              },
            },
          });
          const response = await fetch(`${origin}/api/webhooks/stripe`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "stripe-signature": stripe.webhooks.generateTestHeaderString({
                payload,
                secret: "whsec_fixture",
              }),
            },
            body: payload,
          });
          assert.equal(response.status, 202);
          await processWebhookInbox();
        };
        await send("succeeded", "evt_refund_before_response");
        release();
        await worker;
        await send("pending", "evt_refund_old_pending");
        await send("succeeded", "evt_refund_before_response");
        const [payment] = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.orderId, order.id));
        const [refund] = await db
          .select()
          .from(refundsTable)
          .where(eq(refundsTable.orderId, order.id));
        const [op] = await db
          .select()
          .from(financialOperationsTable)
          .where(eq(financialOperationsTable.id, `refund:${order.id}`));
        assert.equal(payment.status, "refunded");
        assert.equal(refund.status, "succeeded");
        assert.equal(op.state, "succeeded");
      } finally {
        release?.();
        process.env.PAYMENT_PROVIDER = "sandbox";
        delete process.env.STRIPE_SECRET_KEY;
      }
    },
  );
  await t.test(
    "Connect provisioning survives a timeout without holding a database transaction",
    async () => {
      const profileId = randomUUID();
      await db.insert(profilesTable).values({
        id: profileId,
        clerkUserId: profileId,
        role: "restaurant",
        displayName: "Provisioning test fixture",
      });
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      try {
        assert.equal(
          (await api("/payout-account/onboard", profileId, "POST")).status,
          202,
        );
        assert.equal(
          (await api("/payout-account/onboard", profileId, "POST")).status,
          202,
        );
        const receipts = new Map();
        let calls = 0;
        const provider = async (id: string) => {
          assert.equal(id, profileId);
          await db.select().from(profilesTable).where(eq(profilesTable.id, id));
          calls++;
          if (!receipts.has(id)) receipts.set(id, "acct_provisioned_fixture");
          if (calls === 1)
            throw new Error("Provider created account but response was lost");
          return receipts.get(id);
        };
        await processPayoutProvisioning(provider);
        const [first] = await db
          .select()
          .from(payoutProvisioningTable)
          .where(eq(payoutProvisioningTable.profileId, profileId));
        assert.equal(first.state, "queued");
        assert.ok(first.firstAttemptAt);
        await db
          .update(payoutProvisioningTable)
          .set({ nextAttemptAt: new Date(0) })
          .where(eq(payoutProvisioningTable.profileId, profileId));
        await processPayoutProvisioning(provider);
        const [account] = await db
          .select()
          .from(connectedAccountsTable)
          .where(eq(connectedAccountsTable.profileId, profileId));
        assert.equal(account.providerAccountId, "acct_provisioned_fixture");
        assert.equal(account.ready, false);
        assert.equal(receipts.size, 1);
      } finally {
        process.env.PAYMENT_PROVIDER = "sandbox";
        delete process.env.STRIPE_SECRET_KEY;
      }
    },
  );
  await t.test(
    "webhook recovery is restricted, audited and does not expose signed payloads",
    async () => {
      assert.equal(
        (await api("/admin/webhook-inbox", ids.customer)).status,
        403,
      );
      const events = await api("/admin/webhook-inbox", ids.admin);
      assert.equal(events.status, 200);
      assert.equal(JSON.stringify(events.data).includes("payload"), false);
      const held = events.data.find((e: any) => e.id === "evt_mismatch");
      assert.equal(held.state, "reconciliation");
      assert.equal(
        (
          await api(
            "/admin/webhook-inbox/evt_mismatch/retry",
            ids.customer,
            "POST",
            { reason: "Investigating provider amount mismatch" },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await api(
            "/admin/webhook-inbox/evt_mismatch/retry",
            ids.admin,
            "POST",
            { reason: "Investigating provider amount mismatch" },
          )
        ).status,
        202,
      );
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      await processWebhookInbox();
      process.env.PAYMENT_PROVIDER = "sandbox";
      delete process.env.STRIPE_SECRET_KEY;
      const [again] = await db
        .select()
        .from(webhookInboxTable)
        .where(eq(webhookInboxTable.id, "evt_mismatch"));
      assert.equal(again.state, "reconciliation");
      assert.equal(
        (await api("/admin/operational-health", ids.admin)).status,
        200,
      );
    },
  );
  await t.test(
    "distributed mutation limits apply atomically across concurrent requests",
    async () => {
      const actor = randomUUID();
      await db.insert(profilesTable).values({
        id: actor,
        clerkUserId: actor,
        role: "customer",
        displayName: "Rate-limit test fixture",
      });
      process.env.API_MUTATION_LIMIT_PER_MINUTE = "2";
      try {
        const responses = await Promise.all(
          Array.from({ length: 3 }, () =>
            api("/account/deletion-request", actor, "POST"),
          ),
        );
        assert.deepEqual(
          responses.map((r) => r.status).sort(),
          [202, 202, 429],
        );
      } finally {
        process.env.API_MUTATION_LIMIT_PER_MINUTE = "10000";
      }
    },
  );
  await t.test(
    "competing workers respect leases and stale owners cannot overwrite takeover results",
    async () => {
      const order = await create();
      await db
        .update(paymentsTable)
        .set({ provider: "stripe_test" })
        .where(eq(paymentsTable.orderId, order.id));
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      let release!: () => void;
      let began!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      const started = new Promise<void>((r) => (began = r));
      try {
        const queued = await api(
          `/orders/${order.id}/checkout`,
          ids.customer,
          "POST",
        );
        const id = queued.data.operationId;
        let firstToken: string | null = null;
        const first = processFinancialOperation(async (job) => {
          firstToken = job.leaseToken;
          began();
          await gate;
          return { id: "cs_original_worker", status: "open" };
        });
        await started;
        let duplicateCalls = 0;
        assert.equal(
          await processFinancialOperation(async () => {
            duplicateCalls++;
            throw new Error("A current lease must not be taken");
          }),
          false,
        );
        assert.equal(duplicateCalls, 0);
        await db
          .update(financialOperationsTable)
          .set({ leaseExpiresAt: new Date(0), nextAttemptAt: new Date(0) })
          .where(eq(financialOperationsTable.id, id));
        await processFinancialOperation(async (job) => {
          assert.notEqual(job.leaseToken, firstToken);
          assert.equal(job.id, id);
          return { id: "cs_takeover_receipt", status: "open" };
        });
        release();
        await first;
        const [saved] = await db
          .select()
          .from(paymentsTable)
          .where(eq(paymentsTable.orderId, order.id));
        const [op] = await db
          .select()
          .from(financialOperationsTable)
          .where(eq(financialOperationsTable.id, id));
        assert.equal(saved.checkoutSessionId, "cs_takeover_receipt");
        assert.equal(op.state, "succeeded");
        assert.equal(op.attempts, 2);
      } finally {
        release?.();
        process.env.PAYMENT_PROVIDER = "sandbox";
        delete process.env.STRIPE_SECRET_KEY;
      }
    },
  );
  await t.test(
    "held orders cannot starve executable financial work",
    async () => {
      const order = await create();
      const [template] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, order.id));
      const heldIds = Array.from({ length: 40 }, () => randomUUID());
      await db
        .insert(ordersTable)
        .values(
          heldIds.map((id) => ({
            ...template,
            id,
            requestKey: null,
            requestHash: null,
            createdAt: new Date(0),
          })),
        );
      await db.insert(financialOperationsTable).values(
        heldIds.flatMap((id) => [
          {
            id: `held:${id}`,
            orderId: id,
            kind: "refund",
            resourceId: id,
            provider: "stripe_test",
            payload: {},
            state: "reconciliation",
            createdAt: new Date(0),
          },
          {
            id: `queued:${id}`,
            orderId: id,
            kind: "checkout",
            resourceId: id,
            provider: "stripe_test",
            payload: {},
            state: "queued",
            createdAt: new Date(0),
          },
        ]),
      );
      await db
        .update(paymentsTable)
        .set({ provider: "stripe_test" })
        .where(eq(paymentsTable.orderId, order.id));
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      try {
        const queued = await api(
          `/orders/${order.id}/checkout`,
          ids.customer,
          "POST",
        );
        let called = 0;
        await processFinancialOperation(async (job) => {
          called++;
          assert.equal(job.id, queued.data.operationId);
          return { id: "cs_fair_queue", status: "open" };
        });
        assert.equal(called, 1);
      } finally {
        process.env.PAYMENT_PROVIDER = "sandbox";
        delete process.env.STRIPE_SECRET_KEY;
      }
    },
  );
  await t.test(
    "transient webhook failures back off and dead-letter rather than spinning",
    async () => {
      const id = `evt_backoff_${randomUUID()}`;
      await db
        .insert(webhookInboxTable)
        .values({
          id,
          eventType: "test.fixture",
          payload: {
            id,
            type: "test.fixture",
            livemode: false,
            data: { object: {} },
          },
        });
      let calls = 0;
      const failing = async () => {
        calls++;
        throw new Error("Transient processing failure");
      };
      await processWebhookInbox(failing);
      assert.equal(calls, 1);
      assert.equal(await processWebhookInbox(failing), false);
      await db
        .update(webhookInboxTable)
        .set({ attempts: 9, nextAttemptAt: new Date(0) })
        .where(eq(webhookInboxTable.id, id));
      await processWebhookInbox(failing);
      const [held] = await db
        .select()
        .from(webhookInboxTable)
        .where(eq(webhookInboxTable.id, id));
      assert.equal(held.state, "dead_letter");
      assert.equal(held.attempts, 10);
      await api(`/admin/webhook-inbox/${id}/retry`, ids.admin, "POST", {
        reason: "Processing dependency repaired; safe event replay",
      });
      await processWebhookInbox();
      const [recovered] = await db
        .select()
        .from(webhookInboxTable)
        .where(eq(webhookInboxTable.id, id));
      assert.equal(recovered.state, "processed");
    },
  );
  await t.test(
    "ledger writes are balanced, idempotent and protected by database constraints",
    async () => {
      const order = await create();
      const event = {
        id: `ledger_test:${order.id}`,
        orderId: order.id,
        kind: "test_fixture",
        lines: [
          { account: "platform_cash" as const, amountCents: 25 },
          { account: "customer_funds" as const, amountCents: -25 },
        ],
      };
      await db.transaction((tx) => postJournal(tx, event));
      await db.transaction((tx) => postJournal(tx, event));
      assert.equal(
        (
          await db
            .select()
            .from(ledgerTransactionsTable)
            .where(eq(ledgerTransactionsTable.id, event.id))
        ).length,
        1,
      );
      await assert.rejects(
        db.transaction((tx) =>
          postJournal(tx, {
            ...event,
            lines: [
              { account: "platform_cash", amountCents: 26 },
              { account: "customer_funds", amountCents: -26 },
            ],
          }),
        ),
      );
      await assert.rejects(
        db
          .update(ledgerTransactionsTable)
          .set({ kind: "tampered" })
          .where(eq(ledgerTransactionsTable.id, event.id)),
      );
      await assert.rejects(
        db
          .delete(ledgerLinesTable)
          .where(eq(ledgerLinesTable.transactionId, event.id)),
      );
      await assert.rejects(
        db.transaction((tx) =>
          tx
            .insert(ledgerLinesTable)
            .values(
              event.lines.map((line) => ({ ...line, transactionId: event.id })),
            ),
        ),
      );
      await assert.rejects(
        db.transaction(async (tx) => {
          const id = `unbalanced:${order.id}`;
          await tx
            .insert(ledgerTransactionsTable)
            .values({
              id,
              orderId: order.id,
              kind: "invalid_fixture",
              fingerprint: "invalid_fixture",
            });
          await tx.insert(ledgerLinesTable).values([
            { transactionId: id, account: "platform_cash", amountCents: 10 },
            { transactionId: id, account: "customer_funds", amountCents: -9 },
          ]);
        }),
      );
      const bad = await db
        .select({
          id: ledgerLinesTable.transactionId,
          balance: sql<string>`sum(${ledgerLinesTable.amountCents})`,
        })
        .from(ledgerLinesTable)
        .groupBy(ledgerLinesTable.transactionId)
        .having(sql`sum(${ledgerLinesTable.amountCents})<>0`);
      assert.equal(bad.length, 0);
    },
  );

  await t.test(
    "ledger reports enforce roles, exact totals, scoped dates and stable journal pagination",
    async () => {
      assert.equal((await api("/admin/ledger", null)).status, 401);
      for (const role of [ids.customer, ids.restaurant, ids.driver])
        assert.equal((await api("/admin/ledger", role)).status, 403);
      assert.equal(
        (await api("/admin/ledger?cursor=invalid", ids.admin)).status,
        400,
      );
      assert.equal(
        (
          await api(
            "/admin/ledger?from=2030-01-01T00:00:00Z&to=2020-01-01T00:00:00Z",
            ids.admin,
          )
        ).status,
        400,
      );
      const order = await create();
      await db.transaction(async (tx) => {
        for (let i = 0; i < 3; i++)
          await postJournal(tx, {
            id: `report:${order.id}:${i}`,
            orderId: order.id,
            kind: "test_fixture",
            lines: [
              { account: "platform_cash", amountCents: 100 + i },
              { account: "customer_funds", amountCents: -100 - i },
            ],
          });
      });
      const first = await api(
        `/admin/ledger?orderId=${order.id}&limit=1`,
        ids.admin,
      );
      assert.equal(first.status, 200, JSON.stringify(first.data));
      assert.equal(first.data.balanced, true);
      assert.equal(
        first.data.balances.find(
          (b: { account: string }) => b.account === "platform_cash",
        ).balanceCents,
        "303",
      );
      const seen = [first.data.journals[0].id];
      let cursor = first.data.nextCursor;
      while (cursor) {
        const page = await api(
          `/admin/ledger?orderId=${order.id}&limit=1&cursor=${encodeURIComponent(cursor)}`,
          ids.admin,
        );
        assert.equal(page.status, 200, JSON.stringify(page.data));
        seen.push(...page.data.journals.map((j: { id: string }) => j.id));
        cursor = page.data.nextCursor;
      }
      assert.equal(seen.length, 3);
      assert.equal(new Set(seen).size, 3);
      const none = await api(
        `/admin/ledger?orderId=${order.id}&to=2000-01-01T00:00:00Z`,
        ids.admin,
      );
      assert.equal(none.data.journals.length, 0);
      assert.equal(none.data.balances.length, 0);
    },
  );
  await t.test(
    "historical paid orders without a verified baseline cannot execute financial writes",
    async () => {
      const order = await create();
      await db
        .update(paymentsTable)
        .set({
          provider: "stripe_test",
          status: "succeeded",
          providerPaymentId: `pi_legacy_${order.id}`,
        })
        .where(eq(paymentsTable.orderId, order.id));
      process.env.PAYMENT_PROVIDER = "stripe_test";
      process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
      try {
        const canceled = await api(
          `/orders/${order.id}/cancel`,
          ids.customer,
          "POST",
          { reason: "Legacy verified baseline is required" },
        );
        assert.equal(canceled.status, 200, JSON.stringify(canceled.data));
        let calls = 0;
        await processFinancialOperation(async () => {
          calls++;
          throw new Error("Unverified baseline must block financial execution");
        });
        assert.equal(calls, 0);
        const [op] = await db
          .select()
          .from(financialOperationsTable)
          .where(eq(financialOperationsTable.orderId, order.id));
        assert.equal(op.state, "reconciliation");
        assert.equal(op.errorCode, "LEDGER_BASELINE_MISSING");
        const report = await api(
          `/admin/ledger?orderId=${order.id}`,
          ids.admin,
        );
        assert.equal(report.data.missingPaymentBaselines, "1");
      } finally {
        process.env.PAYMENT_PROVIDER = "sandbox";
        delete process.env.STRIPE_SECRET_KEY;
      }
    },
  );
});
