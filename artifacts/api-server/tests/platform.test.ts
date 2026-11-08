import { reconcileDispute, reconcilePayment } from "../src/lib/financial-holds";
import { processStripeEvent } from "../src/routes/payment-webhook";
import { processOrderTiming } from "../src/lib/order-timing";
import { processReservationExpiry } from "../src/lib/reservation-expiry";
import { recordPayment } from "../src/lib/commerce";
import { pruneDutyLocations } from "../src/lib/duty-location";
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
  orderEventsTable,
  orderIncidentsTable,
  partialRefundsTable,
  financialHoldsTable,
  providerBalanceEntriesTable,
  supportMessagesTable,
  supportCasesTable,
  orderItemsTable,
  paymentsTable,
  notificationsTable,
  auditLogsTable,
  payoutsTable,
  refundsTable,
  platformSettingsTable,
  financialOperationsTable,
  driverPresenceTable,
  driverApplicationsTable,
  driverDutyLocationsTable,
  deliveryLocationsTable,
  deliveriesTable,
  webhookInboxTable,
  connectedAccountsTable,
  payoutProvisioningTable,
  ledgerTransactionsTable,
  ledgerLinesTable,
  notificationDevicesTable,
  pushDeliveriesTable,
} from "./database";
import { testPricing } from "../src/lib/testing/pricing";
import { fanOutPushNotifications, processPushDelivery } from "../src/lib/push";
import { processWebhookInbox } from "../src/lib/webhook-worker";
import { processPayoutProvisioning } from "../src/lib/payout-onboarding";
import { processFinancialOperation, reconcileFinancialOperation } from "../src/lib/financial-operations";
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
  process.env.ROCOEATS_ORDERING_ENABLED="true";
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
  t.afterEach(() => {
    delete process.env.ROCOEATS_PRIVATE_STAGING;
    delete process.env.ROCOEATS_STAGING_TESTER_CLERK_USER_IDS;
    process.env.ROCOEATS_ORDERING_ENABLED="true";
    process.env.PAYMENT_PROVIDER = "sandbox";
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.API_MUTATION_LIMIT_PER_MINUTE = "10000";
  });
  await t.test("private staging admits only server-listed identities and preserves role checks and signed webhooks", async () => {
    const previousOwners = process.env.LOCALEATS_ADMIN_CLERK_USER_IDS;
    try {
      process.env.ROCOEATS_PRIVATE_STAGING = "true";
      delete process.env.LOCALEATS_ADMIN_CLERK_USER_IDS;
      assert.equal((await api("/restaurants", null)).status, 401);
      assert.equal((await api("/restaurants", ids.admin)).status, 403);
      const forged = await fetch(`${origin}/api/restaurants`, {headers: {"x-test-user": ids.other, "x-role": "admin", "x-staging-access": "true"}});
      assert.equal(forged.status, 403);
      process.env.LOCALEATS_ADMIN_CLERK_USER_IDS = ids.admin;
      assert.equal((await api("/restaurants", ids.admin)).status, 200);
      process.env.ROCOEATS_STAGING_TESTER_CLERK_USER_IDS = ` ${ids.customer} `;
      assert.equal((await api("/restaurants", ids.customer)).status, 200);
      assert.equal((await api("/admin/profiles", ids.customer)).status, 403);
      const webhook = await fetch(`${origin}/api/webhooks/stripe`, {method: "POST", headers: {"content-type":"application/json"}, body:"{}"});
      assert.equal(webhook.status, 503); // Reached signature configuration check, not staging authentication.
      assert.equal((await fetch(`${origin}/livez`)).status, 200);
    } finally {
      if (previousOwners === undefined) delete process.env.LOCALEATS_ADMIN_CLERK_USER_IDS;
      else process.env.LOCALEATS_ADMIN_CLERK_USER_IDS = previousOwners;
    }
  });
  await t.test("Stripe checkout refuses provider I/O until a test webhook is configured", async () => {
    const { createTestCheckout } = await import("../src/lib/payment-provider");
    const order = await create();
    process.env.PAYMENT_PROVIDER = "stripe_test";
    process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
    await assert.rejects(createTestCheckout({id: randomUUID(), totalCents: 100}, 1), /webhook before checkout/);
    assert.equal((await api(`/orders/${order.id}/checkout`, ids.customer, "POST")).status, 503);
  });
  await t.test("ordering defaults closed; receipts and cancellations recover while new orders and checkout are blocked",async()=>{
    const order=await create();const quote=await api('/orders/quote',ids.customer,'POST',input());
    const [saved]=await db.select().from(ordersTable).where(eq(ordersTable.id,order.id));
    try{for(const value of [undefined,'false','TRUE','1']){if(value===undefined)delete process.env.ROCOEATS_ORDERING_ENABLED;else process.env.ROCOEATS_ORDERING_ENABLED=value;
      assert.equal((await api('/commerce/config',null)).data.orderingEnabled,false);
      assert.equal((await api('/orders/quote',ids.customer,'POST',input())).status,200);
      assert.equal((await api('/orders',ids.customer,'POST',{...input(),expectedTotalCents:quote.data.totalCents},randomUUID())).status,503);
      assert.equal((await api(`/orders/${order.id}/checkout`,ids.customer,'POST')).status,503);
      assert.equal((await api(`/orders/${order.id}/sandbox-payment`,ids.customer,'POST',{success:true})).status,503);
    }
    assert.equal((await api('/orders',ids.customer,'POST',{...input(),expectedTotalCents:quote.data.totalCents},saved.requestKey!.split(':').at(-1))).status,200);
    assert.equal((await api(`/orders/${order.id}`,ids.customer)).status,200);
    assert.equal((await api(`/orders/${order.id}/cancel`,ids.customer,'POST',{reason:'Ordering is closed'})).status,200);
    }finally{process.env.ROCOEATS_ORDERING_ENABLED='true';}
  });
  await t.test("account suspension pauses restaurants and audited role changes cannot strand orders",async()=>{
    const path=`/admin/profiles/${ids.restaurant}`;
    assert.equal((await api(path,ids.customer,'PATCH',{isActive:false})).status,403);
    try{assert.equal((await api(path,ids.admin,'PATCH',{isActive:false})).status,200);
      const [restaurant]=await db.select().from(restaurantsTable).where(eq(restaurantsTable.id,ids.business));assert.equal(restaurant.acceptingOrders,false);
      assert.equal((await api('/orders/quote',ids.customer,'POST',input())).status,409);
      assert.equal((await api(path,ids.admin,'PATCH',{isActive:true})).status,200);
      const [stillPaused]=await db.select().from(restaurantsTable).where(eq(restaurantsTable.id,ids.business));assert.equal(stillPaused.acceptingOrders,false);
      const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,ids.restaurant));assert.ok(audits.filter(a=>a.action==='profile.updated').length>=2);
    }finally{await db.update(profilesTable).set({isActive:true}).where(eq(profilesTable.id,ids.restaurant));await db.update(restaurantsTable).set({acceptingOrders:true}).where(eq(restaurantsTable.id,ids.business));}
    try{
      const driverPath=`/admin/profiles/${ids.driver}`;
      assert.equal((await api(driverPath,ids.admin,'PATCH',{isActive:false})).status,200);
      const [presence]=await db.select().from(driverPresenceTable).where(eq(driverPresenceTable.profileId,ids.driver));assert.equal(presence.available,false);
      assert.equal((await api('/driver/offers',ids.driver)).status,403);
      assert.equal((await api(driverPath,ids.admin,'PATCH',{isActive:true})).status,200);
      const [reactivated]=await db.select().from(profilesTable).where(eq(profilesTable.id,ids.driver));assert.equal(reactivated.driverApproved,false);
      const statusPath=`/admin/restaurants/${ids.business}/status`;
      assert.equal((await api(statusPath,ids.admin,'PATCH',{status:'suspended'})).status,200);
      assert.equal((await api(statusPath,ids.admin,'PATCH',{status:'approved'})).status,200);
      const [paused]=await db.select().from(restaurantsTable).where(eq(restaurantsTable.id,ids.business));assert.equal(paused.acceptingOrders,false);
      const audit=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,ids.business));assert.ok(audit.some(a=>a.action==='restaurant.status.updated'));
    }finally{await db.update(profilesTable).set({isActive:true,driverApproved:true}).where(eq(profilesTable.id,ids.driver));await db.update(driverPresenceTable).set({available:true,heartbeatAt:new Date()}).where(eq(driverPresenceTable.profileId,ids.driver));await db.update(restaurantsTable).set({status:'approved',acceptingOrders:true}).where(eq(restaurantsTable.id,ids.business));}
    const order=await create();
    assert.equal((await api(`/admin/profiles/${ids.customer}`,ids.admin,'PATCH',{role:'driver'})).status,409);
    assert.equal((await api(`/orders/${order.id}/cancel`,ids.customer,'POST',{reason:'End role-change safety check'})).status,200);
    assert.equal((await api(`/admin/profiles/${ids.admin}`,ids.admin,'PATCH',{isActive:false})).status,403);
  });
  await t.test("owner can onboard and deliver without losing admin access or granting admin to drivers",async()=>{
    assert.equal((await api('/driver/offers',ids.admin)).status,403);
    const application={phone:'+1 865 555 0199',vehicleMake:'Toyota',vehicleModel:'Corolla',vehicleYear:2022,licenseState:'TN',licenseExpiresOn:'2030-12-31',eligibilityAttested:true,insuranceAttested:true};
    const applied=await api('/driver/application',ids.admin,'PUT',application);assert.equal(applied.status,200);
    assert.equal((await api('/admin/profiles',ids.admin)).status,200);
    assert.equal((await api('/driver/availability',ids.admin,'PUT',{available:true})).status,403);
    const reviewed=await api(`/admin/driver-applications/${ids.admin}/review`,ids.admin,'POST',{version:applied.data.version,approved:true,identityChecked:true,screeningChecked:true,insuranceChecked:true,note:'Owner external verification evidence TEST-OWNER'});assert.equal(reviewed.status,200);
    assert.equal((await api('/driver/availability',ids.admin,'PUT',{available:true})).status,200);
    const order=await create();await ready(order.id);
    assert.equal((await api(`/driver/orders/${order.id}/claim`,ids.admin,'POST')).status,201);
    const ownDelivery=(await api('/driver/deliveries',ids.admin)).data.find((d:any)=>d.orderId===order.id);assert.match(ownDelivery.pickupRegion,/^(TN|Tennessee)$/);assert.ok(ownDelivery.pickupPostalCode);
    assert.equal((await api('/admin/dispatch',ids.admin)).data.drivers.some((d:any)=>d.profileId===ids.admin),true);
    assert.equal((await api(`/driver/orders/${order.id}/pickup`,ids.admin,'POST')).status,200);
    const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST');
    assert.equal((await api(`/driver/orders/${order.id}/deliver`,ids.admin,'POST',{code:code.data.code})).status,200);
    const earnings=await db.select().from(payoutsTable).where(eq(payoutsTable.orderId,order.id));assert.equal(earnings.find(p=>p.kind==='driver')?.recipientProfileId,ids.admin);
    assert.equal((await api('/profiles/me',ids.admin)).data.role,'admin');
    assert.equal((await api('/admin/profiles',ids.driver)).status,403);
    assert.equal((await api('/payouts/me',ids.admin)).status,200);
    assert.equal((await api('/driver/availability',ids.admin,'PUT',{available:false})).status,200);
    assert.equal((await api(`/admin/drivers/${ids.admin}/approval`,ids.admin,'PATCH',{approved:false})).status,200);
    assert.equal((await api('/admin/profiles',ids.admin)).status,200);
  });
  await t.test("on-duty GPS is private, monotonic, freshness-aware and cleared on offline or revocation",async()=>{
    const position={latitude:35.88,longitude:-84.69,accuracyMeters:8,observedAt:new Date(Date.now()-1000).toISOString()};
    assert.equal((await api('/driver/location',ids.customer,'POST',position)).status,403);
    assert.equal((await api('/driver/location',ids.admin,'POST',position)).status,403);
    assert.equal((await api('/admin/dispatch',ids.driver)).status,403);
    try{
      assert.equal((await api('/driver/availability',ids.driver,'PUT',{available:true})).status,200);
      assert.equal((await api('/driver/heartbeat',ids.driver,'POST')).status,200);
      assert.equal((await api('/driver/location',ids.driver,'POST',position)).data.accepted,true);
      assert.equal((await api('/driver/location',ids.driver,'POST',{...position,latitude:36,observedAt:new Date(Date.now()-5000).toISOString()})).data.accepted,false);
      for(const invalid of [{...position,latitude:91},{...position,accuracyMeters:-1},{...position,observedAt:new Date(Date.now()-180000).toISOString()},{...position,observedAt:new Date(Date.now()+60000).toISOString()}])assert.equal((await api('/driver/location',ids.driver,'POST',invalid)).status,400);
      let dispatch=await api('/admin/dispatch',ids.admin);let driver=dispatch.data.drivers.find((d:any)=>d.profileId===ids.driver);assert.equal(driver.status,'available');assert.equal(driver.locationStatus,'fresh');assert.equal(driver.location.latitude,position.latitude);
      await db.update(driverDutyLocationsTable).set({observedAt:new Date(Date.now()-180000)}).where(eq(driverDutyLocationsTable.profileId,ids.driver));
      dispatch=await api('/admin/dispatch',ids.admin);assert.equal(dispatch.data.drivers.find((d:any)=>d.profileId===ids.driver).locationStatus,'stale');
      await db.update(driverPresenceTable).set({heartbeatAt:new Date(Date.now()-100000)}).where(eq(driverPresenceTable.profileId,ids.driver));
      dispatch=await api('/admin/dispatch',ids.admin);driver=dispatch.data.drivers.find((d:any)=>d.profileId===ids.driver);assert.equal(driver.status,'disconnected');assert.equal(driver.location,null);
      assert.equal((await api('/driver/heartbeat',ids.driver,'POST')).status,409);
      await api('/driver/availability',ids.driver,'PUT',{available:true});
      const concurrent=await Promise.all([api('/driver/location',ids.driver,'POST',{...position,observedAt:new Date().toISOString()}),api('/driver/availability',ids.driver,'PUT',{available:false})]);assert.ok(concurrent.every(r=>[200,409].includes(r.status)));
      assert.equal((await db.select().from(driverDutyLocationsTable).where(eq(driverDutyLocationsTable.profileId,ids.driver))).length,0);
      assert.equal((await api('/driver/location',ids.driver,'POST',position)).status,409);
      assert.equal((await api('/driver/heartbeat',ids.driver,'POST')).status,409);
      await api('/driver/availability',ids.driver,'PUT',{available:true});await api('/driver/location',ids.driver,'POST',position);
      await db.update(driverDutyLocationsTable).set({receivedAt:new Date(Date.now()-16*60*1000)}).where(eq(driverDutyLocationsTable.profileId,ids.driver));await pruneDutyLocations();
      assert.equal((await db.select().from(driverDutyLocationsTable).where(eq(driverDutyLocationsTable.profileId,ids.driver))).length,0);
      await api('/driver/location',ids.driver,'POST',position);await api(`/admin/drivers/${ids.driver}/approval`,ids.admin,'PATCH',{approved:false});
      assert.equal((await db.select().from(driverDutyLocationsTable).where(eq(driverDutyLocationsTable.profileId,ids.driver))).length,0);
      assert.equal((await api('/driver/location',ids.driver,'POST',position)).status,403);
    }finally{await db.update(profilesTable).set({driverApproved:true}).where(eq(profilesTable.id,ids.driver));await db.update(driverPresenceTable).set({available:true,heartbeatAt:new Date()}).where(eq(driverPresenceTable.profileId,ids.driver));await db.delete(driverDutyLocationsTable).where(eq(driverDutyLocationsTable.profileId,ids.driver));}
  });
  await t.test("restaurant capacity is owner-controlled and concurrent checkout cannot overbook",async()=>{
    const path='/restaurants/me/availability/settings';
    const settings=(await api(path,ids.restaurant)).data;
    const value={acceptingOrders:settings.acceptingOrders,hours:settings.hours.map((h:any)=>({weekday:h.weekday,isClosed:h.isClosed,openTime:h.openTime.slice(0,5),closeTime:h.closeTime.slice(0,5)}))};
    assert.equal(settings.maxOpenOrders,null);
    assert.equal(typeof settings.openOrders,'number');
    const limit=settings.openOrders+1;
    assert.equal((await api(path,ids.customer,'PUT',{...value,maxOpenOrders:limit})).status,403);
    for(const maxOpenOrders of [0,-1,1001,1.5,'2']) assert.equal((await api(path,ids.restaurant,'PUT',{...value,maxOpenOrders})).status,400);
    const created:string[]=[];
    try{
      assert.equal((await api(path,ids.restaurant,'PUT',{...value,maxOpenOrders:limit})).status,200);
      // Legacy clients changing hours do not silently remove the capacity limit.
      await api(path,ids.restaurant,'PUT',value);
      assert.equal((await api(path,ids.restaurant)).data.maxOpenOrders,limit);
      const quote=await api('/orders/quote',ids.customer,'POST',input());assert.equal(quote.status,200);
      const body={...input(),expectedTotalCents:quote.data.totalCents};
      const keys=[randomUUID(),randomUUID()];
      const results=await Promise.all(keys.map(key=>api('/orders',ids.customer,'POST',body,key)));
      assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
      const index=results.findIndex(r=>r.status===201),order=results[index].data;created.push(order.id);
      const replay=await api('/orders',ids.customer,'POST',body,keys[index]);assert.equal(replay.status,200);assert.equal(replay.data.id,order.id);
      assert.equal((await api('/orders/quote',ids.customer,'POST',input())).status,409);
      const availability=(await api(`/restaurants/${ids.business}/availability`,null)).data;
      assert.equal(availability.capacityAvailable,false);assert.equal(availability.isOpen,false);
      assert.equal((await api(path,ids.restaurant)).data.openOrders,limit);
      await ready(order.id);
      await api('/driver/availability',ids.driver,'PUT',{available:true});
      assert.equal((await api(`/driver/orders/${order.id}/claim`,ids.driver,'POST')).status,201);
      assert.equal((await api(`/driver/orders/${order.id}/pickup`,ids.driver,'POST')).status,200);
      assert.equal((await api('/orders/quote',ids.customer,'POST',input())).status,200);
      const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST');
      assert.equal((await api(`/driver/orders/${order.id}/deliver`,ids.driver,'POST',{code:code.data.code})).status,200);
      created.splice(created.indexOf(order.id),1);
      const nextKey=randomUUID();
      const duplicates=await Promise.all([api('/orders',ids.customer,'POST',body,nextKey),api('/orders',ids.customer,'POST',body,nextKey)]);
      assert.deepEqual(duplicates.map(r=>r.status).sort(),[200,201]);
      assert.equal(duplicates[0].data.id,duplicates[1].data.id);created.push(duplicates[0].data.id);
      await api(path,ids.restaurant,'PUT',{...value,maxOpenOrders:1});
      const stillExisting=await api(`/orders/${created[0]}`,ids.customer);assert.equal(stillExisting.data.status,'placed');
      assert.equal((await api(`/orders/${created[0]}/cancel`,ids.customer,'POST',{reason:'Release capacity reservation'})).status,200);created.length=0;
      await api(path,ids.restaurant,'PUT',{...value,maxOpenOrders:limit});
      assert.equal((await api('/orders/quote',ids.customer,'POST',input())).status,200);
      const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,ids.business));
      assert.ok(audits.some(a=>a.action==='restaurant.availability' && a.details.maxOpenOrders===limit));
      await assert.rejects(engine.exec(`UPDATE restaurants SET max_open_orders=-1 WHERE id='${ids.business}'`));
    }finally{
      await db.update(restaurantsTable).set({maxOpenOrders:null}).where(eq(restaurantsTable.id,ids.business));
      for(const id of created) await api(`/orders/${id}/cancel`,ids.admin,'POST',{reason:'Clean up capacity verification'});
    }
  });
  await t.test("owners manage modifiers; checkout validates choices and snapshots server pricing", async () => {
    const groups=[{id:"size",name:"Size",minSelections:1,maxSelections:1,options:[{id:"large",name:"Large",priceCents:250},{id:"small",name:"Small",priceCents:0}]},{id:"extras",name:"Extras",minSelections:0,maxSelections:2,options:[{id:"cheese",name:"Cheese",priceCents:100},{id:"sauce",name:"Sauce",priceCents:50}]}];
    const path=`/restaurants/me/menu-items/${ids.item}`;
    assert.equal((await api(path,ids.customer,"PATCH",{modifierGroups:groups})).status,403);
    assert.equal((await api(path,ids.restaurant,"PATCH",{modifierGroups:[{...groups[0],minSelections:3}]})).status,400);
    assert.equal((await api(path,ids.restaurant,"PATCH",{modifierGroups:groups})).status,200);
    for(const [endpoint,user] of [[`/restaurants/${ids.business}`,null],['/restaurants/me',ids.restaurant]] as const){
      const menu=await api(endpoint,user);assert.equal(menu.status,200);
      assert.deepEqual(menu.data.categories.flatMap((c:any)=>c.items).find((i:any)=>i.id===ids.item).modifierGroups,groups);
    }

    const body={...input(),items:[{menuItemId:ids.item,quantity:2,modifiers:{size:["large"],extras:["cheese"]},priceCents:1}]};
    for(const modifiers of [{},{size:["large","small"]},{size:["large","large"]},{size:["bogus"]},{size:["large"],foreign:["cheese"]}]) {
      assert.equal((await api("/orders/quote",ids.customer,"POST",{...body,items:[{...body.items[0],modifiers}]})).status,400);
    }
    const quote=await api("/orders/quote",ids.customer,"POST",body);
    assert.equal(quote.status,200,JSON.stringify(quote.data));assert.equal(quote.data.subtotalCents,2700);
    const created=await api("/orders",ids.customer,"POST",{...body,expectedTotalCents:quote.data.totalCents},randomUUID());
    assert.equal(created.status,201,JSON.stringify(created.data));
    const [line]=await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId,created.data.id));
    assert.equal(line.unitPriceCents,1350);assert.deepEqual(line.modifierSnapshot,[{group:"Size",option:"Large",priceCents:250},{group:"Extras",option:"Cheese",priceCents:100}]);
    await api(path,ids.restaurant,"PATCH",{modifierGroups:[]});
    const [preserved]=await db.select().from(orderItemsTable).where(eq(orderItemsTable.id,line.id));
    assert.deepEqual(preserved.modifierSnapshot,line.modifierSnapshot);
  });
  await t.test("inventory aggregates customizations, prevents overselling and restores only unaccepted cancellations",async()=>{
    const list='/restaurants/me/inventory',path=`${list}/${ids.item}`;
    const stock=async()=>(await api(list,ids.restaurant)).data.find((i:any)=>i.id===ids.item);
    const adjust=async(stockOnHand:number|null)=>{const item=await stock();const result=await api(path,ids.restaurant,'PUT',{stockOnHand,expectedRevision:item.revision,reason:'Test stock receipt adjustment'});assert.equal(result.status,200,JSON.stringify(result.data));return result.data;};
    assert.equal((await api(list,ids.customer)).status,403);
    assert.equal((await api(path,ids.customer,'PUT',{stockOnHand:3,expectedRevision:0,reason:'Forbidden adjustment'})).status,403);
    const initial=await stock();assert.equal(initial.stockOnHand,null);
    for(const stockOnHand of [-1,1.5,1000001,'2'])assert.equal((await api(path,ids.restaurant,'PUT',{stockOnHand,expectedRevision:initial.revision,reason:'Invalid stock range'})).status,400);
    assert.equal((await api(`${list}/${randomUUID()}`,ids.restaurant,'PUT',{stockOnHand:3,expectedRevision:0,reason:'Missing item inventory'})).status,404);
    const orders:string[]=[];
    try{
      const adjusted=await adjust(3);
      await engine.exec(`CREATE FUNCTION inventory_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected inventory rollback'; END $$; CREATE TRIGGER inventory_test_failure BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION inventory_test_failure();`);
      try {
        const quote=await api('/orders/quote',ids.customer,'POST',input());
        const failed=await api('/orders',ids.customer,'POST',{...input(),expectedTotalCents:quote.data.totalCents},randomUUID());
        assert.equal(failed.status,500);assert.equal((await stock()).stockOnHand,3);
        assert.equal((await stock()).revision,adjusted.revision);
      } finally { await engine.exec('DROP TRIGGER inventory_test_failure ON order_items; DROP FUNCTION inventory_test_failure();'); }

      assert.equal((await api(path,ids.restaurant,'PUT',{stockOnHand:20,expectedRevision:initial.revision,reason:'Stale stock adjustment'})).status,409);
      const duplicateLines={...input(),items:[{menuItemId:ids.item,quantity:2,specialInstructions:'First customization'},{menuItemId:ids.item,quantity:2,specialInstructions:'Second customization'}]};
      assert.equal((await api('/orders/quote',ids.customer,'POST',duplicateLines)).status,409);
      const quote=await api('/orders/quote',ids.customer,'POST',input());assert.equal(quote.status,200);
      const body={...input(),expectedTotalCents:quote.data.totalCents},keys=[randomUUID(),randomUUID()];
      const results=await Promise.all(keys.map(key=>api('/orders',ids.customer,'POST',body,key)));
      assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
      const winner=results.findIndex(r=>r.status===201),order=results[winner].data;orders.push(order.id);
      assert.equal((await stock()).stockOnHand,1);
      const lines=await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId,order.id));assert.equal(lines[0].inventoryDeducted,2);
      assert.equal((await api('/orders',ids.customer,'POST',body,keys[winner])).status,200);assert.equal((await stock()).stockOnHand,1);
      assert.equal((await api(path,ids.restaurant,'PUT',{stockOnHand:10,expectedRevision:adjusted.revision,reason:'Cannot overwrite new reservation'})).status,409);
      const cancellations=await Promise.all([api(`/orders/${order.id}/cancel`,ids.customer,'POST',{reason:'Return stock before acceptance'}),api(`/orders/${order.id}/cancel`,ids.customer,'POST',{reason:'Return stock before acceptance'})]);
      assert.deepEqual(cancellations.map(r=>r.status),[200,200]);assert.equal((await stock()).stockOnHand,3);orders.length=0;
      const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,order.id));assert.equal(audits.filter(a=>a.action==='inventory.released').length,1);
      const sameKey=randomUUID();
      const repeats=await Promise.all([api('/orders',ids.customer,'POST',body,sameKey),api('/orders',ids.customer,'POST',body,sameKey)]);
      assert.deepEqual(repeats.map(r=>r.status).sort(),[200,201]);assert.equal((await stock()).stockOnHand,1);
      orders.push(repeats[0].data.id);
      await pay(orders[0]);assert.equal((await api(`/orders/${orders[0]}`,ids.restaurant,'PATCH',{status:'accepted'})).status,200);
      assert.equal((await api(`/orders/${orders[0]}/cancel`,ids.restaurant,'POST',{reason:'Prepared ingredients cannot be automatically returned'})).status,200);
      assert.equal((await stock()).stockOnHand,1);orders.length=0;
      await adjust(0);
      const menu=(await api(`/restaurants/${ids.business}`,null)).data;
      assert.equal(menu.categories.flatMap((c:any)=>c.items).find((i:any)=>i.id===ids.item).isAvailable,false);
      assert.equal((await api('/orders/quote',ids.customer,'POST',input())).status,409);
      await adjust(null);
      const unlimited=await create();orders.push(unlimited.id);
      assert.equal((await stock()).stockOnHand,null);
      await adjust(5);
      await api(`/orders/${unlimited.id}/cancel`,ids.customer,'POST',{reason:'Untracked original order has no stock deduction'});orders.length=0;
      assert.equal((await stock()).stockOnHand,5);
      const providerOrder=await create();orders.push(providerOrder.id);assert.equal((await stock()).stockOnHand,3);
      await db.update(paymentsTable).set({provider:'stripe_test'}).where(eq(paymentsTable.orderId,providerOrder.id));
      const actor=(await db.select().from(profilesTable).where(eq(profilesTable.id,ids.customer)))[0];
      const {requestProviderCancellation}=await import('../src/lib/financial-operations');
      await requestProviderCancellation(providerOrder.id,actor,'Durable provider cancellation returns reserved inventory');
      await requestProviderCancellation(providerOrder.id,actor,'Idempotent provider cancellation');
      assert.equal((await stock()).stockOnHand,5);orders.length=0;
      await processFinancialOperation(async(job:any)=>{assert.equal(job.id,`expire:${providerOrder.id}`);return {status:'expired'};});
      await assert.rejects(engine.exec(`UPDATE menu_items SET stock_on_hand=-1 WHERE id='${ids.item}'`));
    }finally{
      for(const id of orders)await api(`/orders/${id}/cancel`,ids.admin,'POST',{reason:'End inventory verification'});
      await adjust(null);
    }
  });
  await t.test("anonymous and wrong-role requests are rejected", async () => {
    assert.equal((await api('/restaurants/me',null)).status,401);
    assert.equal((await api('/restaurants/me',ids.customer)).status,403);

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
  await t.test("driver application privacy, approval checklist, resubmission and stale reviews",async()=>{
    const application={phone:"+1 865 555 0100",vehicleMake:"Toyota",vehicleModel:"Corolla",vehicleYear:2021,licenseState:"TN",licenseExpiresOn:"2030-12-31",eligibilityAttested:true,insuranceAttested:true};
    assert.equal((await api('/driver/application',ids.customer,'PUT',application)).status,403);
    assert.equal((await api('/admin/driver-applications',ids.driver)).status,403);
    assert.equal((await api(`/admin/drivers/${ids.unapproved}/approval`,ids.admin,'PATCH',{approved:true})).status,409);
    assert.equal((await api('/driver/application',ids.unapproved,'PUT',{...application,licenseExpiresOn:"2020-02-30"})).status,400);
    const saved=await api('/driver/application',ids.unapproved,'PUT',application);assert.equal(saved.status,200);assert.equal(saved.data.status,'pending');
    assert.equal((await api('/driver/application',ids.driver)).data,null);
    assert.equal((await api('/driver/offers',ids.unapproved)).status,403);
    const review={version:saved.data.version,approved:true,identityChecked:true,screeningChecked:true,insuranceChecked:true,note:"External verification evidence reference TEST-123"};
    const path=`/admin/driver-applications/${ids.unapproved}/review`;
    assert.equal((await api(path,ids.unapproved,'POST',review)).status,403);
    assert.equal((await api(path,ids.admin,'POST',{...review,screeningChecked:false})).status,400);
    assert.equal((await api(path,ids.admin,'POST',review)).status,200);
    assert.equal((await api(path,ids.admin,'POST',review)).status,409);
    const next=await api('/driver/application',ids.unapproved,'PUT',{...application,vehicleModel:"Prius"});assert.equal(next.data.status,'pending');
    assert.equal((await api('/driver/offers',ids.unapproved)).status,403);
    assert.equal((await api(path,ids.admin,'POST',review)).status,409);
    assert.equal((await api(path,ids.admin,'POST',{...review,version:next.data.version})).status,200);
    assert.equal((await api("/driver/offers",ids.unapproved)).status,409);
    assert.equal((await api("/driver/availability",ids.unapproved,"PUT",{available:true})).status,200);
    const listing=await api('/admin/driver-applications',ids.admin);assert.equal(listing.status,200);assert.ok(listing.data.some((r:any)=>r.application.profileId===ids.unapproved));
  });
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
  await t.test("checkout rejects inputs changed between price calculation and transaction commit",async()=>{
    const [originalItem]=await db.select().from(menuItemsTable).where(eq(menuItemsTable.id,ids.item));
    const [originalAddress]=await db.select().from(addressesTable).where(eq(addressesTable.id,ids.address));
    const [originalSetting]=await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.settingKey,'test_pricing'));
    const scenarios=[
      {change:()=>db.update(profilesTable).set({isActive:false}).where(eq(profilesTable.id,ids.restaurant)),reset:()=>db.update(profilesTable).set({isActive:true}).where(eq(profilesTable.id,ids.restaurant))},
      {change:()=>db.update(platformSettingsTable).set({value:{...originalSetting.value,deliveryFeeCents:799}}).where(eq(platformSettingsTable.settingKey,'test_pricing')),reset:()=>db.update(platformSettingsTable).set({value:originalSetting.value}).where(eq(platformSettingsTable.settingKey,'test_pricing'))},
      {change:()=>db.update(menuItemsTable).set({priceCents:originalItem.priceCents+100}).where(eq(menuItemsTable.id,ids.item)),reset:()=>db.update(menuItemsTable).set({priceCents:originalItem.priceCents}).where(eq(menuItemsTable.id,ids.item))},
      {change:()=>db.update(menuItemsTable).set({isAvailable:false}).where(eq(menuItemsTable.id,ids.item)),reset:()=>db.update(menuItemsTable).set({isAvailable:true}).where(eq(menuItemsTable.id,ids.item))},
      {change:()=>db.update(addressesTable).set({deliveryInstructions:'Changed after price calculation'}).where(eq(addressesTable.id,ids.address)),reset:()=>db.update(addressesTable).set({deliveryInstructions:originalAddress.deliveryInstructions}).where(eq(addressesTable.id,ids.address))},
      {change:()=>db.update(restaurantsTable).set({acceptingOrders:false}).where(eq(restaurantsTable.id,ids.business)),reset:()=>db.update(restaurantsTable).set({acceptingOrders:true}).where(eq(restaurantsTable.id,ids.business))},
    ];
    for(const scenario of scenarios){
      const quote=await api('/orders/quote',ids.customer,'POST',input());assert.equal(quote.status,200);
      const original=db.transaction.bind(db);let release!:()=>void,arrived!:()=>void;const gate=new Promise<void>(r=>release=r),entered=new Promise<void>(r=>arrived=r);let caught=false;
      (db as any).transaction=async(...args:any[])=>{if(!caught){caught=true;arrived();await gate;}return (original as any)(...args);};
      const key=randomUUID();const pending=api('/orders',ids.customer,'POST',{...input(),expectedTotalCents:quote.data.totalCents},key);
      try{await entered;await scenario.change();(db as any).transaction=original;release();const result=await pending;assert.equal(result.status,409,JSON.stringify(result.data));
        const rows=await db.select().from(ordersTable).where(eq(ordersTable.requestKey,`${ids.customer}:${key}`));assert.equal(rows.length,0);
      }finally{(db as any).transaction=original;release();await pending;await scenario.reset();}
    }
  });
  await t.test("preparation instructions persist as separate order lines and delivery instructions stay immutable",async()=>{
    const body={...input(),items:[{menuItemId:ids.item,quantity:1,specialInstructions:'No onions'},{menuItemId:ids.item,quantity:1,specialInstructions:'Extra onions'}]};
    const [address]=await db.select().from(addressesTable).where(eq(addressesTable.id,ids.address));
    await db.update(addressesTable).set({deliveryInstructions:'Use side entrance'}).where(eq(addressesTable.id,ids.address));
    try{const quote=await api('/orders/quote',ids.customer,'POST',body);const order=await api('/orders',ids.customer,'POST',{...body,expectedTotalCents:quote.data.totalCents},randomUUID());assert.equal(order.status,201);
      assert.deepEqual(order.data.items.map((i:any)=>i.specialInstructions).sort(),['Extra onions','No onions']);
      await db.update(addressesTable).set({deliveryInstructions:'New instructions for a future order'}).where(eq(addressesTable.id,ids.address));
      const loaded=await api(`/orders/${order.data.id}`,ids.customer);assert.equal(loaded.data.deliveryAddress.deliveryInstructions,'Use side entrance');
    }finally{await db.update(addressesTable).set({deliveryInstructions:address.deliveryInstructions}).where(eq(addressesTable.id,ids.address));}
  });
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
  await t.test("support cases protect order privacy and deduplicate requests with auditable versioned resolution",async()=>{
    const order=await create();const body={id:randomUUID(),orderId:order.id,category:'delivery',subject:'Help with delivery',message:'Please check this order and contact me in the app.'};
    assert.equal((await api('/support/cases',null,'POST',body)).status,401);
    assert.equal((await api('/support/cases',ids.other,'POST',body)).status,404);
    const created=await Promise.all([api('/support/cases',ids.customer,'POST',body),api('/support/cases',ids.customer,'POST',body)]);assert.deepEqual(created.map(r=>r.status).sort(),[200,201]);
    assert.equal((await api('/support/cases',ids.customer,'POST',{...body,subject:'Changed subject'})).status,409);
    const own=await api('/support/cases',ids.customer);assert.equal(own.data.filter((c:any)=>c.id===body.id).length,1);
    assert.equal((await api('/support/cases',ids.other)).data.some((c:any)=>c.id===body.id),false);
    assert.equal((await api('/admin/support/cases',ids.customer)).status,403);
    const path=`/admin/support/cases/${body.id}`;const change={version:1,status:'resolved',resolution:'Customer contacted; delivery instructions clarified.'};
    assert.equal((await api(path,ids.customer,'PATCH',change)).status,403);
    const reviewed=await Promise.all([api(path,ids.admin,'PATCH',change),api(path,ids.admin,'PATCH',change)]);assert.deepEqual(reviewed.map(r=>r.status).sort(),[200,409]);
    const after=await api('/support/cases',ids.customer);assert.equal(after.data.find((c:any)=>c.id===body.id).status,'resolved');
    const notices=await db.select().from(notificationsTable).where(eq(notificationsTable.eventKey,`support:${body.id}:2`));assert.equal(notices.length,1);assert.equal(notices[0].profileId,ids.customer);
    const [unchanged]=await db.select().from(ordersTable).where(eq(ordersTable.id,order.id));assert.equal(unchanged.status,order.status);
  });
  await t.test("handoff proof is private, rate limited, atomic and safe under concurrent retries",async()=>{
    const order=await create();await ready(order.id);
    assert.equal((await api(`/driver/orders/${order.id}/claim`,ids.driver,'POST')).status,201);
    assert.equal((await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST')).status,409);
    assert.equal((await api(`/driver/orders/${order.id}/pickup`,ids.driver,'POST')).status,200);
    assert.equal((await api(`/driver/orders/${order.id}/pickup`,ids.driver,'POST')).status,200);
    const codePath=`/orders/${order.id}/delivery-code`,deliverPath=`/driver/orders/${order.id}/deliver`;
    assert.equal((await api(codePath,ids.driver,'POST')).status,403);
    assert.equal((await api(codePath,ids.other,'POST')).status,404);
    assert.equal((await api(`/orders/${order.id}/delivery-proof`,ids.other)).status,404);
    const first=await api(codePath,ids.customer,'POST');assert.equal(first.status,200);
    const wrong=first.data.code==='000000'?'000001':'000000';
    for(let i=0;i<5;i++)assert.equal((await api(deliverPath,ids.driver,'POST',{code:wrong})).status,400);
    assert.equal((await api(deliverPath,ids.driver,'POST',{code:first.data.code})).status,400);
    const expired=await api(codePath,ids.customer,'POST');
    await db.update(deliveriesTable).set({handoffExpiresAt:new Date(Date.now()-1000)}).where(eq(deliveriesTable.orderId,order.id));
    assert.equal((await api(deliverPath,ids.driver,'POST',{code:expired.data.code})).status,400);
    const fresh=await api(codePath,ids.customer,'POST');assert.equal(fresh.status,200);
    await engine.exec("CREATE FUNCTION test_fail_delivery_earnings() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected settlement failure'; END $$; CREATE TRIGGER test_delivery_failure BEFORE INSERT ON payouts FOR EACH ROW EXECUTE FUNCTION test_fail_delivery_earnings();");
    try {assert.equal((await api(deliverPath,ids.driver,'POST',{code:fresh.data.code})).status,500);}finally{await engine.exec('DROP TRIGGER test_delivery_failure ON payouts; DROP FUNCTION test_fail_delivery_earnings();');}
    const [pending]=await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId,order.id));assert.equal(pending.status,'picked_up');assert.equal(pending.proofConfirmedAt,null);assert.ok(pending.handoffHash);
    assert.equal((await db.select().from(payoutsTable).where(eq(payoutsTable.orderId,order.id))).length,0);
    const results=await Promise.all([api(deliverPath,ids.driver,'POST',{code:fresh.data.code}),api(deliverPath,ids.driver,'POST',{code:fresh.data.code})]);assert.deepEqual(results.map(x=>x.status),[200,200]);
    const [delivered]=await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId,order.id));assert.equal(delivered.status,'delivered');assert.ok(delivered.proofConfirmedAt);assert.equal(delivered.handoffHash,null);
    const proof=await api(`/orders/${order.id}/delivery-proof`,ids.customer);assert.equal(proof.data.method,'customer_code');assert.equal(JSON.stringify(proof.data).includes(fresh.data.code),false);
    assert.equal((await db.select().from(payoutsTable).where(eq(payoutsTable.orderId,order.id))).length,2);
    const [saved]=await db.select().from(ordersTable).where(eq(ordersTable.id,order.id));assert.equal(saved.status,'delivered');
    const events=await db.select().from(orderEventsTable).where(eq(orderEventsTable.orderId,order.id));assert.equal(events.filter(e=>e.toStatus==='delivered').length,1);
    const notices=await db.select().from(notificationsTable).where(eq(notificationsTable.orderId,order.id));assert.equal(notices.filter(n=>n.eventKey===`${order.id}:delivered`).length,3);
    const journals=await db.select().from(ledgerTransactionsTable).where(eq(ledgerTransactionsTable.orderId,order.id));assert.equal(journals.filter(j=>j.kind==='allocation').length,1);
    const lines=await db.select().from(ledgerLinesTable).where(eq(ledgerLinesTable.transactionId,`allocation:${order.id}`));assert.equal(lines.reduce((n,l)=>n+l.amountCents,0),0);
  });
  await t.test("admin assignments enforce eligibility, optimistic concurrency, notifications and GPS privacy", async () => {
    for (const driver of [ids.driver, ids.driver2])
      assert.equal((await api("/driver/availability", driver, "PUT", {available:true})).status, 200);
    const order = await create(); await ready(order.id);
    const path = `/admin/orders/${order.id}/assignment`;
    const initial = {driverProfileId:ids.driver, expectedDriverProfileId:null, expectedAssignedAt:null, reason:"Assign verified online driver"};
    assert.equal((await api(path, null, "POST", initial)).status, 401);
    assert.equal((await api(path, ids.driver, "POST", initial)).status, 403);
    assert.equal((await api(path, ids.admin, "POST", {...initial, reason:""})).status, 400);
    for (const driver of [ids.unapproved, ids.customer, randomUUID()])
      assert.equal((await api(path, ids.admin, "POST", {...initial, driverProfileId:driver})).status, 409);
    await api("/driver/availability", ids.driver, "PUT", {available:false});
    assert.equal((await api(path, ids.admin, "POST", initial)).status, 409);
    await api("/driver/availability", ids.driver, "PUT", {available:true});
    await db.update(driverPresenceTable).set({heartbeatAt:new Date(Date.now()-100000)}).where(eq(driverPresenceTable.profileId,ids.driver));
    assert.equal((await api(path, ids.admin, "POST", initial)).status, 409);
    await api("/driver/availability", ids.driver, "PUT", {available:true});
    const assigned = await api(path, ids.admin, "POST", initial);
    assert.equal(assigned.status, 200, JSON.stringify(assigned.data));
    assert.equal((await api(path, ids.admin, "POST", initial)).status, 409);
    const arrivalPath = `/driver/orders/${order.id}/arrive`;
    assert.equal((await api(arrivalPath,ids.customer,'POST')).status,403);
    assert.equal((await api(arrivalPath,ids.driver2,'POST')).status,409);
    assert.equal((await api('/driver/orders/not-a-uuid/arrive',ids.driver,'POST')).status,400);
    const arrivals=await Promise.all([api(arrivalPath,ids.driver,'POST'),api(arrivalPath,ids.driver,'POST')]);
    assert.deepEqual(arrivals.map(r=>r.status),[200,200]);
    assert.equal(arrivals[0].data.arrivedAt,arrivals[1].data.arrivedAt);
    const arrivalNotices=await db.select().from(notificationsTable).where(eq(notificationsTable.orderId,order.id));
    assert.equal(arrivalNotices.filter(n=>n.eventKey.includes(':arrival:')).length,3);
    assert.ok(arrivalNotices.some(n=>n.profileId===ids.restaurant && n.eventKey.includes(':arrival:')));
    const arrivalAudits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,order.id));
    assert.equal(arrivalAudits.filter(a=>a.action==='delivery.arrived').length,1);
    assert.ok((await api('/driver/deliveries',ids.driver)).data.find((d:any)=>d.orderId===order.id).arrivedAt);
    const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId,order.id));
    await db.insert(deliveryLocationsTable).values({deliveryId:delivery.id,driverProfileId:ids.driver,latitude:35,longitude:-84,accuracyMeters:8,observedAt:new Date()});
    assert.ok((await api(`/orders/${order.id}/tracking`,ids.customer)).data.location);
    const reassigned = await api(path,ids.admin,"POST",{...initial,driverProfileId:ids.driver2,expectedDriverProfileId:ids.driver,expectedAssignedAt:assigned.data.assignedAt,reason:"Reassign before pickup due to driver issue"});
    assert.equal(reassigned.status,200,JSON.stringify(reassigned.data));
    assert.equal((await api(arrivalPath,ids.driver,'POST')).status,409);
    assert.equal((await api('/driver/deliveries',ids.driver2)).data.find((d:any)=>d.orderId===order.id).arrivedAt,null);
    assert.equal((await api(arrivalPath,ids.driver2,'POST')).status,200);

    assert.equal((await api(`/orders/${order.id}/tracking`,ids.customer)).data.location,null);
    assert.equal((await api(`/driver/orders/${order.id}/pickup`,ids.driver,"POST")).status,409);
    assert.equal((await api(`/driver/orders/${order.id}/location`,ids.driver,"POST",{latitude:35,longitude:-84,accuracyMeters:8,observedAt:new Date()})).status,403);
    const notices=await db.select().from(notificationsTable).where(eq(notificationsTable.orderId,order.id));
    const assignmentNotices=notices.filter(n=>n.eventKey.includes(":assignment:"));
    assert.equal(assignmentNotices.length,7); // three initial recipients, four on reassignment
    assert.ok(assignmentNotices.some(n=>n.profileId===ids.driver && n.title.includes("removed")));
    const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,order.id));
    assert.equal(audits.filter(a=>a.action==='delivery.assignment.updated').length,2);
    const released=await api(path,ids.admin,"POST",{...initial,driverProfileId:null,expectedDriverProfileId:ids.driver2,expectedAssignedAt:reassigned.data.assignedAt,reason:"Return delivery to dispatch queue"});
    assert.equal(released.status,200);
    assert.equal((await api(`/driver/orders/${order.id}/claim`,ids.driver,"POST")).status,201);
    const [claimed]=await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId,order.id));
    await db.insert(deliveryLocationsTable).values({deliveryId:claimed.id,driverProfileId:ids.driver,latitude:36,longitude:-84,accuracyMeters:8,observedAt:new Date()});
    assert.equal((await api(`/driver/orders/${order.id}/release`,ids.driver,"POST")).status,200);
    assert.equal((await api(`/orders/${order.id}/tracking`,ids.customer)).data.location,null);
    assert.equal((await db.select().from(deliveryLocationsTable).where(eq(deliveryLocationsTable.deliveryId,claimed.id))).length,0);
    assert.equal((await api(`/driver/orders/${order.id}/claim`,ids.driver2,"POST")).status,201);
    const [current]=await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId,order.id));
    await api(`/driver/orders/${order.id}/pickup`,ids.driver2,"POST");
    assert.equal((await api(arrivalPath,ids.driver2,'POST')).status,409);
    assert.equal((await api(path,ids.admin,"POST",{...initial,expectedDriverProfileId:ids.driver2,expectedAssignedAt:current.assignedAt?.toISOString()})).status,409);
    const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,"POST");
    assert.equal((await api(`/driver/orders/${order.id}/deliver`,ids.driver2,"POST",{code:code.data.code})).status,200);
  });
  await t.test("admin assignments race safely with driver claims and reject busy or expired drivers", async () => {
    for (const driver of [ids.driver,ids.driver2]) await api('/driver/availability',driver,'PUT',{available:true});
    const first=await create(), second=await create(); await ready(first.id);await ready(second.id);
    const assign=(orderId:string,driverProfileId:string)=>api(`/admin/orders/${orderId}/assignment`,ids.admin,'POST',{driverProfileId,expectedDriverProfileId:null,expectedAssignedAt:null,reason:'Concurrency safety verification'});
    const race=await Promise.all([assign(first.id,ids.driver),api(`/driver/orders/${first.id}/claim`,ids.driver2,'POST')]);
    assert.equal(race.filter(r=>[200,201].includes(r.status)).length,1);
    assert.equal(race.filter(r=>r.status===409).length,1);
    const [delivery]=await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId,first.id));
    assert.equal((await assign(second.id,delivery.driverProfileId!)).status,409);
    const free=delivery.driverProfileId===ids.driver?ids.driver2:ids.driver;
    const concurrent=await Promise.all([assign(second.id,free),assign(second.id,free)]);
    assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
    for(const order of [first,second]) assert.equal((await api(`/orders/${order.id}/cancel`,ids.admin,'POST',{reason:'End assignment concurrency verification'})).status,200);
    const unpaid=await create();
    assert.equal((await assign(unpaid.id,ids.driver)).status,409);
    await api(`/orders/${unpaid.id}/cancel`,ids.customer,'POST',{reason:'End unpaid assignment test'});
    const expired=await create();await ready(expired.id);
    const [previousApplication]=await db.select().from(driverApplicationsTable).where(eq(driverApplicationsTable.profileId,ids.driver));
    const application=await api('/driver/application',ids.driver,'PUT',{phone:'+1 865 555 0199',vehicleMake:'Toyota',vehicleModel:'Corolla',vehicleYear:2022,licenseState:'TN',licenseExpiresOn:'2030-12-31',eligibilityAttested:true,insuranceAttested:true});
    assert.equal(application.status,200);
    await db.update(driverApplicationsTable).set({status:'approved',licenseExpiresOn:'2020-01-01'}).where(eq(driverApplicationsTable.profileId,ids.driver));
    await db.update(profilesTable).set({driverApproved:true}).where(eq(profilesTable.id,ids.driver));
    await db.update(driverPresenceTable).set({available:true,heartbeatAt:new Date()}).where(eq(driverPresenceTable.profileId,ids.driver));
    assert.equal((await assign(expired.id,ids.driver)).status,409);
    assert.equal((await api(`/driver/orders/${expired.id}/claim`,ids.driver,'POST')).status,403);
    await db.delete(driverApplicationsTable).where(eq(driverApplicationsTable.profileId,ids.driver));
    if(previousApplication) await db.insert(driverApplicationsTable).values(previousApplication);
    await api(`/orders/${expired.id}/cancel`,ids.admin,'POST',{reason:'End expired application verification'});
  });
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
      const handoff=await api(`/orders/${order.id}/delivery-code`,ids.customer,"POST");assert.equal(handoff.status,200);

      assert.equal(
        (await api(`/driver/orders/${order.id}/deliver`, winner, "POST", {code:handoff.data.code}))
          .status,
        200,
      );
      assert.equal(
        (await api(`/driver/orders/${order.id}/deliver`, winner, "POST", {code:handoff.data.code}))
          .status,
        200,
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
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
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
      const handoff=await api(`/orders/${order.id}/delivery-code`,ids.customer,"POST");
      await api(`/driver/orders/${order.id}/deliver`, ids.driver, "POST",{code:handoff.data.code});
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
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
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
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
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
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
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
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
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
      await db.insert(ordersTable).values(
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
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
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
      await db.insert(webhookInboxTable).values({
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
          await tx.insert(ledgerTransactionsTable).values({
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
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_fixture";
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
  await t.test(
    "push fan-out retains individual receipts and retries only unsuccessful devices",
    async () => {
      // Existing order fixtures have not enrolled for delivery in this test window.
      await db
        .update(notificationsTable)
        .set({ pushNextAttemptAt: new Date(Date.now() + 86400000) })
        .where(eq(notificationsTable.pushState, "pending"));
      const owner = randomUUID();
      await db.insert(profilesTable).values({
        id: owner,
        clerkUserId: owner,
        role: "customer",
        displayName: "Push test fixture",
      });
      const [notification] = await db
        .insert(notificationsTable)
        .values({
          profileId: owner,
          eventKey: randomUUID(),
          title: "Test notification",
          body: "Test fixture",
        })
        .returning();
      for (const token of [
        "push_good_fixture_token",
        "push_retry_fixture_token",
      ])
        await db
          .insert(notificationDevicesTable)
          .values({ profileId: owner, platform: "android", token });
      assert.equal(await fanOutPushNotifications(), 1);
      assert.equal(await fanOutPushNotifications(), 0);
      const counts = new Map<string, number>();
      const send = async (_platform: string, token: string) => {
        counts.set(token, (counts.get(token) ?? 0) + 1);
        if (token.includes("retry"))
          throw new Error("Provider temporarily unavailable");
      };
      while (
        await processPushDelivery(send, {
          android: true,
          ios: false,
          testMode: true,
        })
      ) {}
      assert.equal(counts.get("push_good_fixture_token"), 1);
      assert.equal(counts.get("push_retry_fixture_token"), 1);
      const [queued] = await db
        .select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, notification.id));
      assert.equal(queued.pushState, "queued");
      const tasks = await db
        .select()
        .from(pushDeliveriesTable)
        .where(eq(pushDeliveriesTable.notificationId, notification.id));
      assert.equal(tasks.length, 2);
      const pending = tasks.find((task) => task.state === "pending")!;
      assert.equal(pending.attempts, 1);
      await db
        .update(pushDeliveriesTable)
        .set({ nextAttemptAt: new Date(0) })
        .where(eq(pushDeliveriesTable.id, pending.id));
      await processPushDelivery(
        async (_platform, token) => {
          counts.set(token, (counts.get(token) ?? 0) + 1);
        },
        { android: true, ios: false, testMode: true },
      );
      assert.equal(counts.get("push_good_fixture_token"), 1);
      assert.equal(counts.get("push_retry_fixture_token"), 2);
      const [accepted] = await db
        .select()
        .from(notificationsTable)
        .where(eq(notificationsTable.id, notification.id));
      assert.equal(accepted.pushState, "provider_accepted");
    },
  );
  await t.test(
    "push lease takeover fences stale results and invalid tokens stop retrying",
    async () => {
      const owner = randomUUID();
      await db.insert(profilesTable).values({
        id: owner,
        clerkUserId: owner,
        role: "customer",
        displayName: "Push lease fixture",
      });
      const [notification] = await db
        .insert(notificationsTable)
        .values({
          profileId: owner,
          eventKey: randomUUID(),
          title: "Test notification",
          body: "Test fixture",
        })
        .returning();
      const [device] = await db
        .insert(notificationDevicesTable)
        .values({
          profileId: owner,
          platform: "android",
          token: "push_lease_fixture_token",
        })
        .returning();
      await fanOutPushNotifications();
      let release!: () => void, began!: () => void;
      const gate = new Promise<void>((r) => (release = r)),
        started = new Promise<void>((r) => (began = r));
      const config = { android: true, ios: false, testMode: true as const };
      const first = processPushDelivery(async () => {
        began();
        await gate;
      }, config);
      await started;
      try {
        assert.equal(
          await processPushDelivery(async () => {
            throw new Error("Current lease cannot be claimed");
          }, config),
          false,
        );
        const [task] = await db
          .select()
          .from(pushDeliveriesTable)
          .where(eq(pushDeliveriesTable.notificationId, notification.id));
        await db
          .update(pushDeliveriesTable)
          .set({ leaseExpiresAt: new Date(0) })
          .where(eq(pushDeliveriesTable.id, task.id));
        await processPushDelivery(async () => {
          throw Object.assign(new Error("Invalid token fixture"), {
            code: "messaging/registration-token-not-registered",
          });
        }, config);
        release();
        await first;
        const [saved] = await db
          .select()
          .from(pushDeliveriesTable)
          .where(eq(pushDeliveriesTable.id, task.id));
        assert.equal(saved.state, "invalid_token");
        assert.equal(saved.acceptedAt, null);
        assert.equal(saved.attempts, 2);
        assert.equal(
          (
            await db
              .select()
              .from(notificationDevicesTable)
              .where(eq(notificationDevicesTable.id, device.id))
          ).length,
          0,
        );
        assert.equal(
          await processPushDelivery(async () => {
            throw new Error("Permanent failure cannot resend");
          }, config),
          false,
        );
      } finally {
        release?.();
        await first;
      }
    },
  );
  await t.test(
    "missing push configuration does not consume attempts or block configured devices",
    async () => {
      const owners = [randomUUID(), randomUUID()];
      for (const owner of owners)
        await db.insert(profilesTable).values({
          id: owner,
          clerkUserId: owner,
          role: "customer",
          displayName: "Push configuration fixture",
        });
      const notices = [];
      for (const owner of owners) {
        const [n] = await db
          .insert(notificationsTable)
          .values({
            profileId: owner,
            eventKey: randomUUID(),
            title: "Test notification",
            body: "Test fixture",
          })
          .returning();
        notices.push(n);
      }
      const [ios] = await db
        .insert(notificationDevicesTable)
        .values({
          profileId: owners[0],
          platform: "ios",
          token: "a".repeat(64),
        })
        .returning();
      await db.insert(notificationDevicesTable).values({
        profileId: owners[1],
        platform: "android",
        token: "push_configured_fixture_token",
      });
      await fanOutPushNotifications();
      let called = 0;
      assert.equal(
        await processPushDelivery(
          async () => {
            called++;
          },
          { android: false, ios: false, testMode: true },
        ),
        false,
      );
      assert.equal(called, 0);
      assert.equal(
        await processPushDelivery(
          async (platform) => {
            called++;
            assert.equal(platform, "android");
          },
          { android: true, ios: false, testMode: true },
        ),
        true,
      );
      assert.equal(called, 1);
      const [waiting] = await db
        .select()
        .from(pushDeliveriesTable)
        .where(eq(pushDeliveriesTable.notificationId, notices[0].id));
      assert.equal(waiting.attempts, 0);
      assert.equal(waiting.state, "pending");
      await db
        .update(notificationDevicesTable)
        .set({ profileId: owners[1] })
        .where(eq(notificationDevicesTable.id, ios.id));
      await processPushDelivery(
        async () => {
          throw new Error(
            "Reassigned device must not receive old account notification",
          );
        },
        { android: true, ios: false, testMode: true },
      );
      const [removed] = await db
        .select()
        .from(pushDeliveriesTable)
        .where(eq(pushDeliveriesTable.id, waiting.id));
      assert.equal(removed.state, "unregistered");
    },
  );
  await t.test(
    "exhausted push retries require an audited admin recovery without exposing device tokens",
    async () => {
      const owner = randomUUID();
      await db.insert(profilesTable).values({
        id: owner,
        clerkUserId: owner,
        role: "customer",
        displayName: "Push exhaustion fixture",
      });
      const [notification] = await db
        .insert(notificationsTable)
        .values({
          profileId: owner,
          eventKey: randomUUID(),
          title: "Test notification",
          body: "Test fixture",
        })
        .returning();
      const token = "push_exhaustion_fixture_secret";
      await db
        .insert(notificationDevicesTable)
        .values({ profileId: owner, platform: "android", token });
      await fanOutPushNotifications();
      const [task] = await db
        .select()
        .from(pushDeliveriesTable)
        .where(eq(pushDeliveriesTable.notificationId, notification.id));
      await db
        .update(pushDeliveriesTable)
        .set({ attempts: 4 })
        .where(eq(pushDeliveriesTable.id, task.id));
      await processPushDelivery(
        async () => {
          throw new Error("Provider unavailable fixture");
        },
        { android: true, ios: false, testMode: true },
      );
      const listing = await api(
        "/admin/push-deliveries?state=failed",
        ids.admin,
      );
      assert.equal(listing.status, 200);
      assert.equal(
        listing.data.find((row: { id: string }) => row.id === task.id).attempts,
        5,
      );
      assert.ok(!JSON.stringify(listing.data).includes(token));
      const path = `/admin/push-deliveries/${task.id}/retry`;
      assert.equal(
        (await api("/admin/push-deliveries", ids.driver)).status,
        403,
      );
      assert.equal(
        (
          await api(path, ids.customer, "POST", {
            reason: "Retry repaired provider connection",
          })
        ).status,
        403,
      );
      assert.equal(
        (await api(path, ids.admin, "POST", { reason: "short" })).status,
        400,
      );
      assert.equal(
        (
          await api(path, ids.admin, "POST", {
            reason: "Retry repaired provider connection",
          })
        ).status,
        202,
      );
      await processPushDelivery(async () => {}, {
        android: true,
        ios: false,
        testMode: true,
      });
      const [saved] = await db
        .select()
        .from(pushDeliveriesTable)
        .where(eq(pushDeliveriesTable.id, task.id));
      assert.equal(saved.state, "provider_accepted");
      assert.equal(saved.attempts, 1);
      assert.equal(
        (
          await api(path, ids.admin, "POST", {
            reason: "Must not repeat accepted delivery",
          })
        ).status,
        409,
      );
      const audit = await db.execute(
        sql`select action,details from audit_logs where resource_id=${task.id}`,
      );
      assert.equal(audit.rows.length, 1);
      assert.equal(audit.rows[0].action, "push.retry_requested");
    },
  );
  await t.test(
    "database clock controls job eligibility and leases despite application clock skew",
    async () => {
      const originalNow = Date.now;
      // PGlite's WASM clock is implemented by the same JavaScript runtime.
      // Independent host/database skew is exercised by the PostgreSQL CI lane.
      Date.now = process.env.TEST_DATABASE_URL
        ? () => originalNow() + 3600000
        : originalNow;
      try {
        for (let i = 0; i < 10; i++) {
          const id = `evt_clock_${randomUUID()}`;
          await db.insert(webhookInboxTable).values({
            id,
            eventType: "clock.fixture",
            payload: {
              id,
              type: "clock.fixture",
              livemode: false,
              data: { object: {} },
            },
          });
          const processed = await processWebhookInbox(async () => {
            const [saved] = await db
              .select()
              .from(webhookInboxTable)
              .where(eq(webhookInboxTable.id, id));
            const difference = saved.leaseExpiresAt!.getTime() - originalNow();
            assert.ok(
              difference > 45000 && difference < 75000,
              `Lease skewed by ${difference}ms`,
            );
          });
          assert.equal(processed, true);
          const [saved] = await db
            .select()
            .from(webhookInboxTable)
            .where(eq(webhookInboxTable.id, id));
          assert.equal(saved.state, "processed");
        }
      } finally {
        Date.now = originalNow;
      }
    },
  );
  await t.test("restorable GPS constraints still reject invalid coordinates and accuracy",async()=>{
    const [delivery]=await db.select().from(deliveriesTable).limit(1);assert.ok(delivery);
    for(const invalid of [{latitude:91,longitude:0,accuracyMeters:1},{latitude:0,longitude:181,accuracyMeters:1},{latitude:0,longitude:0,accuracyMeters:-1}]){
      await assert.rejects(()=>db.insert(deliveryLocationsTable).values({deliveryId:delivery.id,driverProfileId:ids.driver,observedAt:new Date(),...invalid}).onConflictDoNothing());
    }
  });
  await t.test("recovery fingerprint is deterministic and detects changed database contents",async()=>{
    const script=await readFile('../../scripts/recovery-fingerprint.sql','utf8');
    async function fingerprint(mutation=''){const raw=await engine.exec(script.replace('BEGIN;\n','BEGIN;\n'+mutation+'\n'));const chunks=Array.isArray(raw)?raw:[raw];const rows=chunks.flatMap((c:any)=>c.rows??[]).filter((r:any)=>typeof r.fingerprint==='string');assert.equal(rows.length,1);assert.match(rows[0].fingerprint,/^[a-f0-9]{32}$/);return rows[0].fingerprint;}
    const before=await fingerprint();assert.equal(await fingerprint(),before);
    // Roll back the probe inside PostgreSQL; restoring JS Dates would truncate
    // native timestamp microseconds and invalidate a legitimate byte-level check.
    assert.notEqual(await fingerprint(`UPDATE profiles SET display_name='Recovery fingerprint probe' WHERE id='${ids.other}';`),before);
    assert.equal(await fingerprint(),before);
  });

  await t.test("unpaid reservations release stock once under competing workers, checkout and cancellation",async()=>{
    await db.update(menuItemsTable).set({stockOnHand:4}).where(eq(menuItemsTable.id,ids.item));
    const order=await create();
    try{
      await db.update(ordersTable).set({reservationExpiresAt:new Date(0)}).where(eq(ordersTable.id,order.id));
      const outcomes=await Promise.all([processReservationExpiry(),processReservationExpiry()]);
      assert.equal(outcomes.filter(Boolean).length,1);
      const [item]=await db.select().from(menuItemsTable).where(eq(menuItemsTable.id,ids.item));assert.equal(item.stockOnHand,4);
      const [current]=await db.select().from(ordersTable).where(eq(ordersTable.id,order.id));assert.equal(current.status,'cancelled');
      assert.equal((await api(`/orders/${order.id}/checkout`,ids.customer,'POST')).status,409);
      assert.equal((await api(`/orders/${order.id}/cancel`,ids.customer,'POST',{reason:'Repeated expiry cancellation'})).status,200);
      const after=(await db.select().from(menuItemsTable).where(eq(menuItemsTable.id,ids.item)))[0];assert.equal(after.stockOnHand,4);
      const events=await db.select().from(orderEventsTable).where(eq(orderEventsTable.orderId,order.id));assert.equal(events.filter(e=>e.note==='Unpaid reservation expired').length,1);
      const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,order.id));assert.equal(audits.filter(a=>a.action==='order.reservation_expired').length,1);
      const second=await create();await db.update(ordersTable).set({reservationExpiresAt:new Date(0)}).where(eq(ordersTable.id,second.id));
      assert.equal((await api(`/orders/${second.id}/checkout`,ids.customer,'POST')).status,410);
      assert.equal((await db.select().from(menuItemsTable).where(eq(menuItemsTable.id,ids.item)))[0].stockOnHand,4);
    }finally{await db.update(menuItemsTable).set({stockOnHand:null}).where(eq(menuItemsTable.id,ids.item));}
  });
  await t.test("confirmed payments survive reservation expiry; late Stripe payment stays cancelled and queues refund",async()=>{
    const paid=await create();await pay(paid.id);
    await db.update(ordersTable).set({reservationExpiresAt:new Date(0)}).where(eq(ordersTable.id,paid.id));
    await processReservationExpiry();
    assert.equal((await db.select().from(ordersTable).where(eq(ordersTable.id,paid.id)))[0].status,'placed');
    await api(`/orders/${paid.id}/cancel`,ids.customer,'POST',{reason:'End paid reservation check'});
    await db.update(menuItemsTable).set({stockOnHand:4}).where(eq(menuItemsTable.id,ids.item));
    const late=await create();
    try{
      await db.update(paymentsTable).set({provider:'stripe_test'}).where(eq(paymentsTable.orderId,late.id));
      await db.update(ordersTable).set({reservationExpiresAt:new Date(0)}).where(eq(ordersTable.id,late.id));
      process.env.PAYMENT_PROVIDER='stripe_test';process.env.STRIPE_SECRET_KEY='sk_test_fixture';
      await Promise.all([processReservationExpiry(),db.transaction(tx=>recordPayment(tx,late.id,`pi_late_${late.id}`,late.totalCents,'usd'))]);
      const [current]=await db.select().from(ordersTable).where(eq(ordersTable.id,late.id));assert.equal(current.status,'cancelled');
      assert.equal((await db.select().from(menuItemsTable).where(eq(menuItemsTable.id,ids.item)))[0].stockOnHand,4);
      const refunds=await db.select().from(refundsTable).where(eq(refundsTable.orderId,late.id));assert.equal(refunds.length,1);assert.equal(refunds[0].amountCents,late.totalCents);
      const ops=await db.select().from(financialOperationsTable).where(eq(financialOperationsTable.orderId,late.id));assert.equal(ops.filter(o=>o.kind==='refund').length,1);
      const events=await db.select().from(orderEventsTable).where(eq(orderEventsTable.orderId,late.id));assert.equal(events.filter(e=>e.toStatus==='cancelled').length,1);
      await db.transaction(tx=>recordPayment(tx,late.id,`pi_late_${late.id}`,late.totalCents,'usd'));
      assert.equal((await db.select().from(menuItemsTable).where(eq(menuItemsTable.id,ids.item)))[0].stockOnHand,4);
    }finally{process.env.PAYMENT_PROVIDER='sandbox';delete process.env.STRIPE_SECRET_KEY;await db.update(menuItemsTable).set({stockOnHand:null}).where(eq(menuItemsTable.id,ids.item));}
  });

  await t.test("timeout policy snapshots, restaurant escalation, operator acknowledgement and recovery",async()=>{
    const path='/admin/order-timing',policy={reservationMinutes:20,restaurantResponseMinutes:2,driverAssignmentMinutes:2,driverPickupMinutes:2};
    assert.equal((await api(path,null)).status,401);assert.equal((await api(path,ids.customer,'PUT',{policy,reason:'Cannot configure owner timings'})).status,403);
    assert.equal((await api(path,ids.admin,'PUT',{policy:{...policy,reservationMinutes:0},reason:'Invalid deadline range'})).status,400);
    assert.equal((await api(path,ids.admin,'PUT',{policy,reason:'Configure staged operational timing policy'})).status,200);
    const order=await create();
    try{
      const [snapshot]=await db.select().from(ordersTable).where(eq(ordersTable.id,order.id));assert.deepEqual(snapshot.timingPolicy,policy);assert.ok(snapshot.reservationExpiresAt.getTime()-Date.now()>19*60000);
      await api(path,ids.admin,'PUT',{policy:{...policy,reservationMinutes:30},reason:'Future orders use new timing only'});
      assert.equal((await db.select().from(ordersTable).where(eq(ordersTable.id,order.id)))[0].timingPolicy.reservationMinutes,20);
      await pay(order.id);await db.update(paymentsTable).set({processedAt:new Date(0)}).where(eq(paymentsTable.orderId,order.id));
      await db.update(ordersTable).set({timingReviewAt:new Date(0)}).where(eq(ordersTable.id,order.id));
      await Promise.all([processOrderTiming(),processOrderTiming()]);
      const incidents=await db.select().from(orderIncidentsTable).where(eq(orderIncidentsTable.orderId,order.id));assert.equal(incidents.length,1);assert.equal(incidents[0].kind,'restaurant_response');
      const notices=await db.select().from(notificationsTable).where(eq(notificationsTable.orderId,order.id));assert.equal(notices.filter(n=>n.eventKey.startsWith('incident:')).length,1);
      const ack=`/admin/order-incidents/${incidents[0].id}/acknowledge`,body={version:incidents[0].version,note:'Operator contacted restaurant for recovery'};
      assert.equal((await api(ack,ids.driver,'POST',body)).status,403);assert.equal((await api(ack,ids.admin,'POST',body)).status,200);assert.equal((await api(ack,ids.admin,'POST',body)).status,409);
      assert.equal((await api(`/orders/${order.id}`,ids.restaurant,'PATCH',{status:'accepted'})).status,200);
      await db.update(ordersTable).set({timingReviewAt:new Date(0)}).where(eq(ordersTable.id,order.id));await processOrderTiming();
      const [recovered]=await db.select().from(orderIncidentsTable).where(eq(orderIncidentsTable.id,incidents[0].id));assert.equal(recovered.status,'resolved');assert.ok(recovered.resolvedAt);
      assert.equal((await api(ack,ids.admin,'POST',{...body,version:recovered.version})).status,409);
    }finally{await db.delete(platformSettingsTable).where(eq(platformSettingsTable.settingKey,'order_timing_policy'));await api(`/orders/${order.id}/cancel`,ids.admin,'POST',{reason:'End response timeout verification'});}
  });
  await t.test("driver timeouts release only before arrival and recover without duplicate assignment or alerts",async()=>{
    const driver=randomUUID();await db.insert(profilesTable).values({id:driver,clerkUserId:driver,displayName:'Timeout driver fixture',role:'driver',driverApproved:true});
    await api('/driver/availability',driver,'PUT',{available:true});
    const order=await create();await ready(order.id);
    const review=async()=>{await db.update(ordersTable).set({timingReviewAt:new Date(0)}).where(eq(ordersTable.id,order.id));await processOrderTiming();};
    try{
      await db.update(orderEventsTable).set({createdAt:new Date(0)}).where(sql`${orderEventsTable.orderId}=${order.id} AND ${orderEventsTable.toStatus}='ready_for_pickup'`);
      await review();
      let incidents=await db.select().from(orderIncidentsTable).where(eq(orderIncidentsTable.orderId,order.id));assert.equal(incidents.find(i=>i.kind==='driver_unassigned')?.status,'open');
      assert.equal((await api(`/driver/orders/${order.id}/claim`,driver,'POST')).status,201);
      await review();incidents=await db.select().from(orderIncidentsTable).where(eq(orderIncidentsTable.orderId,order.id));assert.equal(incidents.find(i=>i.kind==='driver_unassigned')?.status,'resolved');
      const [delivery]=await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId,order.id));
      await db.update(deliveriesTable).set({assignedAt:new Date(0)}).where(eq(deliveriesTable.id,delivery.id));
      await db.insert(deliveryLocationsTable).values({deliveryId:delivery.id,driverProfileId:driver,latitude:35,longitude:-84,accuracyMeters:8,observedAt:new Date()});
      await review();
      const [released]=await db.select().from(deliveriesTable).where(eq(deliveriesTable.id,delivery.id));assert.equal(released.driverProfileId,null);assert.equal(released.status,'unassigned');
      assert.equal((await db.select().from(deliveryLocationsTable).where(eq(deliveryLocationsTable.deliveryId,delivery.id))).length,0);
      assert.equal((await api(`/driver/orders/${order.id}/pickup`,driver,'POST')).status,409);
      const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,order.id));assert.equal(audits.filter(a=>a.action==='delivery.assignment_expired').length,1);
      await review();const again=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,order.id));assert.equal(again.filter(a=>a.action==='delivery.assignment_expired').length,1);
      assert.equal((await api(`/driver/orders/${order.id}/claim`,driver,'POST')).status,201);
      assert.equal((await api(`/driver/orders/${order.id}/arrive`,driver,'POST')).status,200);
      await db.update(deliveriesTable).set({assignedAt:new Date(1)}).where(eq(deliveriesTable.id,delivery.id));
      await review();
      assert.equal((await db.select().from(deliveriesTable).where(eq(deliveriesTable.id,delivery.id)))[0].driverProfileId,driver);
      incidents=await db.select().from(orderIncidentsTable).where(eq(orderIncidentsTable.orderId,order.id));assert.ok(incidents.some(i=>i.kind==='driver_pickup'&&i.status==='open'));
      assert.equal((await api(`/driver/orders/${order.id}/pickup`,driver,'POST')).status,200);
      await review();incidents=await db.select().from(orderIncidentsTable).where(eq(orderIncidentsTable.orderId,order.id));assert.ok(incidents.every(i=>i.status==='resolved'));
      const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST');assert.equal((await api(`/driver/orders/${order.id}/deliver`,driver,'POST',{code:code.data.code})).status,200);
    }finally{await api(`/orders/${order.id}/cancel`,ids.admin,'POST',{reason:'End timeout recovery verification'});await api('/driver/availability',driver,'PUT',{available:false});}
  });

  await t.test("partial refunds are durable, cumulative, webhook-monotonic and combine with a remaining full refund",async()=>{
    const driver=randomUUID();await db.insert(profilesTable).values({id:driver,clerkUserId:driver,displayName:'Refund delivery fixture',role:'driver',driverApproved:true});await api('/driver/availability',driver,'PUT',{available:true});
    const order=await create();await ready(order.id);await api(`/driver/orders/${order.id}/claim`,driver,'POST');await api(`/driver/orders/${order.id}/pickup`,driver,'POST');const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST');assert.equal((await api(`/driver/orders/${order.id}/deliver`,driver,'POST',{code:code.data.code})).status,200);
    const pi=`pi_partial_${order.id}`;await db.update(paymentsTable).set({provider:'stripe_test',providerPaymentId:pi}).where(eq(paymentsTable.orderId,order.id));
    process.env.PAYMENT_PROVIDER='stripe_test';process.env.STRIPE_SECRET_KEY='sk_test_fixture';
    const path=`/admin/orders/${order.id}/partial-refunds`,request={id:randomUUID(),amountCents:501,fundingPolicy:'platform_goodwill_v1',reason:'Platform funded service recovery credit'};
    const run=async(id:string,execute:(job:any)=>Promise<any>)=>{await db.update(financialOperationsTable).set({createdAt:new Date(0),nextAttemptAt:new Date(0)}).where(eq(financialOperationsTable.id,id));assert.equal(await processFinancialOperation(async(job)=>{assert.equal(job.id,id);return execute(job);}),true);};
    try{
      assert.equal((await api(path,ids.customer,'POST',request)).status,403);
      const retries=await Promise.all([api(path,ids.admin,'POST',request),api(path,ids.admin,'POST',request)]);assert.deepEqual(retries.map(r=>r.status),[202,202]);
      assert.equal((await api(path,ids.admin,'POST',{...request,amountCents:502})).status,409);
      assert.equal((await db.select().from(partialRefundsTable).where(eq(partialRefundsTable.orderId,order.id))).length,1);
      assert.equal((await api(`/orders/${order.id}/cancel`,ids.admin,'POST',{reason:'Must wait for pending partial refund'})).status,409);
      const opId=`partial_refund:${request.id}`,remoteId=`re_partial_${request.id}`;
      const event=(id:string,status:string,amount=501)=>({id,type:'refund.updated',livemode:false,data:{object:{id:remoteId,object:'refund',payment_intent:pi,amount,currency:'usd',status,metadata:{operationId:opId}}}} as any);
      await run(opId,async()=>{
        await processStripeEvent(event('evt_partial_success','succeeded'));
        return {id:remoteId,status:'pending'};
      });
      await processStripeEvent(event('evt_partial_success','succeeded'));
      await processStripeEvent(event('evt_partial_stale','failed'));
      const [saved]=await db.select().from(partialRefundsTable).where(eq(partialRefundsTable.id,request.id));assert.equal(saved.status,'succeeded');
      assert.equal((await db.select().from(financialOperationsTable).where(eq(financialOperationsTable.id,opId)))[0].state,'succeeded');
      await assert.rejects(()=>processStripeEvent(event('evt_partial_mismatch','succeeded',500)));
      await assert.rejects(engine.exec(`UPDATE partial_refunds SET amount_cents=1 WHERE id='${request.id}'`));
      await assert.rejects(engine.exec(`UPDATE partial_refunds SET status='pending' WHERE id='${request.id}'`));
      await assert.rejects(engine.exec(`DELETE FROM partial_refunds WHERE id='${request.id}'`));
      await assert.rejects(engine.exec('TRUNCATE partial_refunds'));
      const second={...request,id:randomUUID(),amountCents:99};assert.equal((await api(path,ids.admin,'POST',second)).status,202);
      await run(`partial_refund:${second.id}`,async()=>({id:`re_partial_${second.id}`,status:'succeeded'}));
      const earnings=await db.select().from(payoutsTable).where(eq(payoutsTable.orderId,order.id));assert.equal(earnings.find(p=>p.kind==='driver')?.amountCents,699);assert.equal(earnings.find(p=>p.kind==='restaurant')?.amountCents,1800);
      const details=await api(`/orders/${order.id}/payment`,ids.customer);assert.equal(details.data.partialRefunds.length,2);
      assert.equal((await api(`/orders/${order.id}/cancel`,ids.admin,'POST',{reason:'Refund remaining amount after goodwill credits'})).status,200);
      const [full]=await db.select().from(refundsTable).where(eq(refundsTable.orderId,order.id));assert.equal(full.amountCents,order.totalCents-600);
      const [job]=await db.select().from(financialOperationsTable).where(eq(financialOperationsTable.id,`refund:${order.id}`));assert.equal(job.payload.amount,order.totalCents-600);
      await run(job.id,async()=>({id:`re_remaining_${order.id}`,status:'succeeded'}));
      assert.equal((await db.select().from(paymentsTable).where(eq(paymentsTable.orderId,order.id)))[0].status,'refunded');
      assert.equal((await api(path,ids.admin,'POST',{...request,id:randomUUID()})).status,409);
      const journals=await db.select({line:ledgerLinesTable}).from(ledgerLinesTable).innerJoin(ledgerTransactionsTable,eq(ledgerTransactionsTable.id,ledgerLinesTable.transactionId)).where(eq(ledgerTransactionsTable.orderId,order.id));
      const balances=new Map<string,number>();for(const {line} of journals)balances.set(line.account,(balances.get(line.account)??0)+line.amountCents);assert.ok([...balances.values()].every(n=>n===0));
      await db.transaction(tx=>journalRefund(tx,order.id,order.totalCents));
    }finally{process.env.PAYMENT_PROVIDER='sandbox';delete process.env.STRIPE_SECRET_KEY;await api('/driver/availability',driver,'PUT',{available:false});}
  });
  await t.test("concurrent partial refunds reserve the cumulative budget and retain unknown provider outcomes",async()=>{
    const driver=randomUUID();await db.insert(profilesTable).values({id:driver,clerkUserId:driver,displayName:'Refund budget fixture',role:'driver',driverApproved:true});await api('/driver/availability',driver,'PUT',{available:true});
    const order=await create();await ready(order.id);await api(`/driver/orders/${order.id}/claim`,driver,'POST');await api(`/driver/orders/${order.id}/pickup`,driver,'POST');const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST');await api(`/driver/orders/${order.id}/deliver`,driver,'POST',{code:code.data.code});
    await db.update(paymentsTable).set({provider:'stripe_test',providerPaymentId:`pi_budget_${order.id}`}).where(eq(paymentsTable.orderId,order.id));process.env.PAYMENT_PROVIDER='stripe_test';process.env.STRIPE_SECRET_KEY='sk_test_fixture';
    const path=`/admin/orders/${order.id}/partial-refunds`,requests=[0,1].map(()=>({id:randomUUID(),amountCents:order.totalCents-1,fundingPolicy:'platform_goodwill_v1',reason:'Concurrent credit budget verification'}));
    try{
      const results=await Promise.all(requests.map(r=>api(path,ids.admin,'POST',r)));assert.deepEqual(results.map(r=>r.status).sort(),[202,409]);
      const accepted=requests[results.findIndex(r=>r.status===202)],id=`partial_refund:${accepted.id}`;
      await db.update(financialOperationsTable).set({createdAt:new Date(0),nextAttemptAt:new Date(0)}).where(eq(financialOperationsTable.id,id));
      await processFinancialOperation(async(job)=>{assert.equal(job.id,id);throw new Error('Provider accepted request but response was lost');});
      const [unknown]=await db.select().from(financialOperationsTable).where(eq(financialOperationsTable.id,id));assert.equal(unknown.state,'queued');assert.equal(unknown.attempts,1);
      assert.equal((await api(path,ids.admin,'POST',accepted)).status,202);
      assert.equal((await api(path,ids.admin,'POST',{...accepted,id:randomUUID(),amountCents:1})).status,409);
      assert.equal((await api(`/orders/${order.id}/cancel`,ids.admin,'POST',{reason:'Unknown credit must remain reserved'})).status,409);
      await db.update(financialOperationsTable).set({nextAttemptAt:new Date(0)}).where(eq(financialOperationsTable.id,id));
      await processFinancialOperation(async(job)=>{assert.equal(job.id,id);return {id:`re_budget_${accepted.id}`,status:'failed'};});
      assert.equal((await api(path,ids.admin,'POST',{...accepted,id:randomUUID(),amountCents:200})).status,202);
    }finally{process.env.PAYMENT_PROVIDER='sandbox';delete process.env.STRIPE_SECRET_KEY;await api('/driver/availability',driver,'PUT',{available:false});}
  });

  await t.test("signed disputes hold outgoing funds; provider reconciliation fences stale reads and releases only verified recovery",async()=>{
    const driver=randomUUID();await db.insert(profilesTable).values({id:driver,clerkUserId:driver,displayName:'Dispute fixture driver',role:'driver',driverApproved:true});await api('/driver/availability',driver,'PUT',{available:true});
    const order=await create();await ready(order.id);await api(`/driver/orders/${order.id}/claim`,driver,'POST');await api(`/driver/orders/${order.id}/pickup`,driver,'POST');const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST');await api(`/driver/orders/${order.id}/deliver`,driver,'POST',{code:code.data.code});
    const pi=`pi_dispute_${order.id}`,dp=`dp_${order.id}`,holdId=`dispute:${dp}`;await db.update(paymentsTable).set({provider:'stripe_test',providerPaymentId:pi}).where(eq(paymentsTable.orderId,order.id));
    process.env.PAYMENT_PROVIDER='stripe_test';process.env.STRIPE_SECRET_KEY='sk_test_fixture';process.env.STRIPE_WEBHOOK_SECRET='whsec_fixture';
    const [actor]=await db.select().from(profilesTable).where(eq(profilesTable.id,ids.admin));
    const request={id:randomUUID(),amountCents:250,fundingPolicy:'platform_goodwill_v1',reason:'Pending credit before dispute receipt'},path=`/admin/orders/${order.id}/partial-refunds`;
    const event=(id:string,status:string,created:number)=>({id,type:'charge.dispute.updated',created,livemode:false,data:{object:{id:dp,object:'dispute',payment_intent:pi,amount:1000,currency:'usd',livemode:false,status}}} as any);
    const now=Math.floor(Date.now()/1000),received=event(`evt_${dp}`,'needs_response',now),stripe=new Stripe('sk_test_fixture');
    const withdrawal={id:`txn_withdraw_${dp}`,sourceId:dp,kind:'adjustment',amountCents:-1000,feeCents:15,netCents:-1015,currency:'usd' as const,status:'available' as const},reinstatement={id:`txn_return_${dp}`,sourceId:dp,kind:'adjustment',amountCents:1000,feeCents:0,netCents:1000,currency:'usd' as const,status:'available' as const};
    const proof={id:dp,paymentId:pi,amountCents:1000,currency:'usd',status:'won',livemode:false,balances:[withdrawal,reinstatement]};
    try{
      assert.equal((await api(path,ids.admin,'POST',request)).status,202);
      const payload=JSON.stringify(received),response=await fetch(`${origin}/api/webhooks/stripe`,{method:'POST',headers:{'content-type':'application/json','stripe-signature':stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_fixture'})},body:payload});assert.equal(response.status,202);await processWebhookInbox();
      assert.equal((await api('/admin/financial-holds',ids.driver)).status,403);
      let hold=(await db.select().from(financialHoldsTable).where(eq(financialHoldsTable.id,holdId)))[0];assert.equal(hold.active,true);
      await processStripeEvent(received);await processStripeEvent(event('evt_dispute_old','under_review',now-10));
      assert.equal((await db.select().from(financialHoldsTable).where(eq(financialHoldsTable.id,holdId)))[0].version,hold.version);
      assert.equal((await api(path,ids.admin,'POST',{...request,id:randomUUID()})).status,409);
      const [payout]=await db.select().from(payoutsTable).where(eq(payoutsTable.orderId,order.id));assert.equal((await api(`/admin/payouts/${payout.id}/transfer`,ids.admin,'POST')).status,409);
      let attemptedHeld=false;await processFinancialOperation(async job=>{if(job.id===`partial_refund:${request.id}`)attemptedHeld=true;throw new Error('Unrelated fixture work retains retry state');});assert.equal(attemptedHeld,false);
      assert.equal((await db.select().from(financialOperationsTable).where(eq(financialOperationsTable.id,`partial_refund:${request.id}`)))[0].attempts,0);
      const heldJobId=`partial_refund:${request.id}`;
      await db.update(financialOperationsTable).set({state:'processing',firstAttemptAt:new Date(Date.now()-1000),leaseExpiresAt:new Date(0),leaseToken:randomUUID(),attempts:1}).where(eq(financialOperationsTable.id,heldJobId));
      await reconcileFinancialOperation(heldJobId,actor,async job=>{assert.equal(job.id,heldJobId);return {id:`re_after_hold_${request.id}`,status:'pending'};});
      assert.equal((await db.select().from(financialOperationsTable).where(eq(financialOperationsTable.id,heldJobId)))[0].state,'pending');
      assert.equal((await db.select().from(financialHoldsTable).where(eq(financialHoldsTable.id,holdId)))[0].active,true);

      let release!:()=>void,started!:()=>void;const gate=new Promise<void>(r=>release=r),reading=new Promise<void>(r=>started=r);
      const pending=reconcileDispute(holdId,actor,'Provider evidence review with concurrent update',async()=>{started();await gate;return proof;});await reading;
      await processStripeEvent(event('evt_dispute_new','under_review',now+1));release();await assert.rejects(()=>pending,/changed during/);
      assert.equal((await db.select().from(providerBalanceEntriesTable).where(eq(providerBalanceEntriesTable.orderId,order.id))).length,0);
      await assert.rejects(()=>reconcileDispute(holdId,actor,'Reject mismatched evidence',async()=>({...proof,currency:'eur'})));
      const lost=await reconcileDispute(holdId,actor,'Record settled loss while owner reviews',async()=>({...proof,status:'lost',balances:[withdrawal]}));assert.equal(lost.active,true);
      const won=await reconcileDispute(holdId,actor,'Verify settled withdrawal and reinstatement',async()=>proof);assert.equal(won.active,false);assert.ok(won.releasedAt);
      await reconcileDispute(holdId,actor,'Idempotent provider evidence review',async()=>proof);
      const balances=await db.select().from(providerBalanceEntriesTable).where(eq(providerBalanceEntriesTable.orderId,order.id));assert.equal(balances.length,2);
      const journals=await db.select().from(ledgerTransactionsTable).where(eq(ledgerTransactionsTable.orderId,order.id));assert.equal(journals.filter(j=>j.kind==='dispute').length,2);
      const id=`partial_refund:${request.id}`;await db.update(financialOperationsTable).set({createdAt:new Date(0),nextAttemptAt:new Date(0)}).where(eq(financialOperationsTable.id,id));
      await processFinancialOperation(async job=>{assert.equal(job.id,id);return{id:`re_after_hold_${request.id}`,status:'succeeded'};});assert.equal((await db.select().from(partialRefundsTable).where(eq(partialRefundsTable.id,request.id)))[0].status,'succeeded');
    }finally{process.env.PAYMENT_PROVIDER='sandbox';delete process.env.STRIPE_SECRET_KEY;delete process.env.STRIPE_WEBHOOK_SECRET;await api('/driver/availability',driver,'PUT',{available:false});}
  });
  await t.test("verified charge reconciliation records exact immutable fee/net evidence without provider I/O locks",async()=>{
    const order=await create();await pay(order.id);const pi=`pi_reconcile_${order.id}`,ch=`ch_${order.id}`,id=`txn_charge_${order.id}`;
    await db.update(paymentsTable).set({provider:'stripe_test',providerPaymentId:pi}).where(eq(paymentsTable.orderId,order.id));
    const [actor]=await db.select().from(profilesTable).where(eq(profilesTable.id,ids.admin));
    const proof={id:pi,amountReceived:order.totalCents,currency:'usd',livemode:false,status:'succeeded',chargeId:ch,chargePaymentId:pi,chargeAmount:order.totalCents,chargePaid:true,balance:{id,sourceId:ch,kind:'charge',amountCents:order.totalCents,feeCents:100,netCents:order.totalCents-100,currency:'usd' as const,status:'available' as const}};
    assert.equal((await api(`/admin/orders/${order.id}/reconcile-payment`,ids.customer,'POST',{reason:'Unauthorized provider reconciliation'})).status,403);
    for(const invalid of [{...proof,livemode:true},{...proof,amountReceived:1},{...proof,chargePaymentId:'pi_wrong'},{...proof,balance:{...proof.balance,netCents:1}},{...proof,balance:{...proof.balance,status:'pending'}}])await assert.rejects(()=>reconcilePayment(order.id,actor,'Reject inconsistent provider data',async()=>invalid as any));
    const first=await reconcilePayment(order.id,actor,'Verify original settled charge and fees',async()=>proof);assert.equal(first.feeCents,100);assert.equal(first.netCents,order.totalCents-100);
    await reconcilePayment(order.id,actor,'Replay original settled charge evidence',async()=>proof);
    const entries=await db.select().from(providerBalanceEntriesTable).where(eq(providerBalanceEntriesTable.orderId,order.id));assert.equal(entries.length,1);
    const journals=await db.select().from(ledgerTransactionsTable).where(eq(ledgerTransactionsTable.orderId,order.id));assert.equal(journals.filter(j=>j.kind==='provider_fee').length,1);
    await assert.rejects(()=>reconcilePayment(order.id,actor,'Reject conflicting immutable fee evidence',async()=>({...proof,balance:{...proof.balance,feeCents:101,netCents:order.totalCents-101}})));
    await assert.rejects(engine.exec(`UPDATE provider_balance_entries SET fee_cents=1 WHERE id='${id}'`));await assert.rejects(engine.exec(`DELETE FROM provider_balance_entries WHERE id='${id}'`));await assert.rejects(engine.exec('TRUNCATE provider_balance_entries'));
  });

  await t.test("support conversations preserve private append-only history, safe retries, reopening and stable pagination",async()=>{
    const id=randomUUID(),created=await api('/support/cases',ids.customer,'POST',{id,category:'delivery',subject:'Delivery support follow up',message:'Initial private delivery issue details'});assert.equal(created.status,201);
    const path=`/support/cases/${id}/messages`,reply={id:randomUUID(),version:1,message:'Please update the recovery plan'};
    assert.equal((await api(path,null)).status,401);assert.equal((await api(path,ids.other)).status,404);assert.equal((await api(path,ids.driver,'POST',reply)).status,404);
    const retries=await Promise.all([api(path,ids.customer,'POST',reply),api(path,ids.customer,'POST',reply)]);assert.deepEqual(retries.map(r=>r.status),[201,201]);
    assert.equal((await api(path,ids.customer,'POST',{...reply,message:'Conflicting content'})).status,409);
    const races=await Promise.all([api(path,ids.customer,'POST',{id:randomUUID(),version:2,message:'First concurrent follow up'}),api(path,ids.admin,'POST',{id:randomUUID(),version:2,message:'Operator concurrent follow up'})]);assert.deepEqual(races.map(r=>r.status).sort(),[201,409]);
    assert.equal((await api(`/admin/support/cases/${id}`,ids.admin,'PATCH',{version:3,status:'resolved',resolution:'Operations recorded the full recovery decision'})).status,200);
    let page=await api(path,ids.customer);assert.equal(page.data.case.status,'resolved');assert.ok(page.data.messages.some((m:any)=>m.kind==='decision'&&m.body.includes('full recovery decision')));
    const reopened=await api(path,ids.customer,'POST',{id:randomUUID(),version:4,message:'The issue remains unresolved; please reopen'});assert.equal(reopened.status,201);
    const [entry]=await db.select().from(supportCasesTable).where(eq(supportCasesTable.id,id));assert.equal(entry.status,'open');assert.equal(entry.resolution,null);
    let version=reopened.data.caseVersion;
    for(let i=0;i<31;i++){const sent=await api(path,ids.customer,'POST',{id:randomUUID(),version,message:`Pagination follow up message ${i}`});assert.equal(sent.status,201);version=sent.data.caseVersion;}
    page=await api(path,ids.admin);assert.equal(page.status,200);assert.equal(page.data.messages.length,30);assert.ok(page.data.nextBeforeVersion);
    const older=await api(`${path}?beforeVersion=${page.data.nextBeforeVersion}`,ids.customer);assert.equal(older.data.nextBeforeVersion,null);
    const messages=[...older.data.messages,...page.data.messages];assert.equal(messages.length,35);assert.equal(new Set(messages.map((m:any)=>m.id)).size,35);
    for(let i=1;i<messages.length;i++)assert.ok(messages[i].caseVersion>messages[i-1].caseVersion);
    assert.ok(messages.some((m:any)=>m.kind==='decision'&&m.body.includes('full recovery decision')));
    const notices=await db.select().from(notificationsTable).where(eq(notificationsTable.eventKey,`support.reply:${reply.id}`));assert.equal(notices.length,1);
    await assert.rejects(engine.exec(`UPDATE support_messages SET body='rewritten' WHERE id='${reply.id}'`));await assert.rejects(engine.exec(`DELETE FROM support_messages WHERE id='${reply.id}'`));await assert.rejects(engine.exec('TRUNCATE support_messages'));
  });

  await t.test("first owner sign-in bootstraps once and self-only access diagnostics work across private admission", async () => {
    const previous = process.env.LOCALEATS_ADMIN_CLERK_USER_IDS;
    const previousDriver = process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS;
    const owner = `user_QAFirst${randomUUID().replaceAll('-','')}`;
    try {
      process.env.ROCOEATS_PRIVATE_STAGING = "true";
      process.env.LOCALEATS_ADMIN_CLERK_USER_IDS = owner;
      process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS = owner;
      assert.equal((await api('/session/access',null)).status,401);
      const member = await api('/session/access',ids.customer);
      assert.equal(member.status,200); assert.equal(member.data.ownerConfigured,true);
      assert.equal(member.data.ownerMatched,false); assert.equal(member.data.administrator,false);
      assert.equal((await api('/admin/profiles',ids.customer)).status,403);
      assert.equal((await api('/session/access',ids.customer,'POST',{})).status,403);
      assert.equal(JSON.stringify(member.data).includes(owner),false);
      assert.equal(JSON.stringify(member.data).includes(ids.customer),false);
      const visits = await Promise.all([api('/dashboard',owner),api('/profiles/me',owner)]);
      assert.ok(visits.every(result => result.status===200 && result.data.role==='admin'));
      const access = await api('/session/access',owner);
      assert.equal(access.data.superAdministrator,true);assert.equal(access.data.driver,true);
      assert.equal(access.data.ownerDriverMatched,true);
      assert.equal(access.data.profileStatus,'active');
      const [saved] = await db.select().from(profilesTable).where(eq(profilesTable.clerkUserId,owner));
      const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,saved.id));
      assert.equal(audits.filter(row=>row.action==='owner.bootstrap.granted').length,1);
      assert.equal((await api('/admin/profiles',owner)).status,200);
      assert.equal((await api('/driver/availability',owner)).data.ownerDriverAccess,true);
      await db.update(profilesTable).set({isActive:false}).where(eq(profilesTable.id,saved.id));
      const suspended = await api('/session/access',owner);
      assert.equal(suspended.data.profileStatus,'suspended');assert.equal(suspended.data.administrator,false);
      assert.equal(suspended.data.driver,false);
      assert.equal((await api('/dashboard',owner)).status,403);
    } finally {
      delete process.env.ROCOEATS_PRIVATE_STAGING;
      if(previous===undefined)delete process.env.LOCALEATS_ADMIN_CLERK_USER_IDS;else process.env.LOCALEATS_ADMIN_CLERK_USER_IDS=previous;
      if(previousDriver===undefined)delete process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS;else process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS=previousDriver;
    }
  });
  await t.test("server-configured owners bootstrap securely and deliver without self-approval; other admins and drivers cannot borrow access",async()=>{
    const previousDriver=process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS;
    const previous=process.env.LOCALEATS_ADMIN_CLERK_USER_IDS,ownerClerk=`user_QAOwner${randomUUID().replaceAll('-','')}`,otherClerk=`user_QAMember${randomUUID().replaceAll('-','')}`;
    process.env.LOCALEATS_ADMIN_CLERK_USER_IDS=`  ${ownerClerk}  `;
    process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS=ownerClerk;
    let ownerId='';
    try{
      assert.equal((await api('/admin/profiles',null)).status,401);
      assert.equal((await api('/profiles/me',otherClerk,'POST',{displayName:'Fake client owner',role:'admin',ownerDriverAccess:true,clerkUserId:ownerClerk})).status,400);
      const ordinary=await api('/profiles/me',otherClerk,'POST',{displayName:'Ordinary member',role:'customer',driverApproved:true,isOwner:true,clerkUserId:ownerClerk});assert.equal(ordinary.status,201);assert.equal(ordinary.data.role,'customer');
      assert.equal((await api('/admin/profiles',otherClerk)).status,403);assert.equal((await api('/driver/availability',otherClerk,'PUT',{available:true})).status,403);
      const created=await api('/profiles/me',ownerClerk,'POST',{displayName:'Configured owner fixture',role:'customer'});assert.equal(created.status,201);assert.equal(created.data.role,'admin');ownerId=created.data.id;
      assert.equal((await api('/admin/profiles',ownerClerk)).status,200);
      let access=await api('/driver/availability',ownerClerk);assert.equal(access.data.ownerDriverAccess,true);assert.equal(access.data.approved,true);
      assert.equal((await api('/driver/application',ownerClerk)).data,null);
      assert.equal((await api('/driver/availability',ownerClerk,'PUT',{available:true})).status,200);
      assert.equal((await api('/driver/heartbeat',ownerClerk,'POST')).status,200);
      assert.equal((await api('/driver/location',ownerClerk,'POST',{latitude:35.8,longitude:-84.7,accuracyMeters:8,observedAt:new Date()})).status,200);
      const order=await create();await ready(order.id);
      assert.equal((await api(`/driver/orders/${order.id}/claim`,ownerClerk,'POST')).status,201);
      const second=await create();await ready(second.id);assert.equal((await api(`/driver/orders/${second.id}/claim`,ownerClerk,'POST')).status,409);
      const dispatch=await api('/admin/dispatch',ownerClerk);const ownerDriver=dispatch.data.drivers.find((d:any)=>d.profileId===ownerId);assert.equal(ownerDriver.approved,true);assert.equal(ownerDriver.status,'delivering');assert.equal('clerkUserId' in ownerDriver,false);
      assert.equal((await api(`/driver/orders/${order.id}/pickup`,ownerClerk,'POST')).status,200);
      assert.equal((await api(`/driver/orders/${order.id}/deliver`,ownerClerk,'POST')).status,400);
      const code=await api(`/orders/${order.id}/delivery-code`,ids.customer,'POST');assert.equal((await api(`/driver/orders/${order.id}/deliver`,ownerClerk,'POST',{code:code.data.code})).status,200);
      const earnings=await db.select().from(payoutsTable).where(eq(payoutsTable.orderId,order.id));assert.equal(earnings.find(p=>p.kind==='driver')?.recipientProfileId,ownerId);
      const assigned=await api(`/admin/orders/${second.id}/assignment`,ownerClerk,'POST',{driverProfileId:ownerId,expectedDriverProfileId:null,expectedAssignedAt:null,reason:'Owner delivery assignment without self review'});assert.equal(assigned.status,200);
      assert.equal((await api(`/driver/orders/${second.id}/release`,ownerClerk,'POST')).status,200);
      await api(`/orders/${second.id}/cancel`,ownerClerk,'POST',{reason:'End owner dispatch verification'});
      const application={phone:'+1 865 555 0199',vehicleMake:'Toyota',vehicleModel:'Corolla',vehicleYear:2022,licenseState:'TN',licenseExpiresOn:'2030-12-31',eligibilityAttested:true,insuranceAttested:true};
      const submitted=await api('/driver/application',ownerClerk,'PUT',application);assert.equal(submitted.status,200);assert.equal(submitted.data.status,'pending');assert.equal(submitted.data.reviewedBy,null);
      assert.equal((await api('/driver/availability',ownerClerk)).data.approved,true);
      await db.update(driverApplicationsTable).set({licenseExpiresOn:'2020-01-01'}).where(eq(driverApplicationsTable.profileId,ownerId));
      assert.equal((await api('/driver/availability',ownerClerk)).data.approved,false);assert.equal((await api('/driver/availability',ownerClerk,'PUT',{available:true})).status,403);
      await api('/driver/application',ownerClerk,'PUT',application);assert.equal((await api('/driver/availability',ownerClerk,'PUT',{available:true})).status,200);
      const [stored]=await db.select().from(profilesTable).where(eq(profilesTable.id,ownerId));assert.equal(stored.driverApproved,false);assert.equal(stored.role,'admin');
      const adminQueue=(await api('/admin/drivers',ownerClerk)).data.find((d:any)=>d.id===ownerId);assert.equal(adminQueue.ownerDriverAccess,true);
      const ownerDriverIds=process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS;process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS=ids.admin;
      assert.equal((await api('/driver/availability',ids.admin)).data.ownerDriverAccess,false);process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS=ownerDriverIds;
      assert.equal((await api('/driver/offers',ids.admin)).status,403);
      assert.equal((await api('/driver/availability',ids.unapproved,'PUT',{available:true,ownerDriverAccess:true})).status,400);
      const bootstrapAudits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,ownerId));assert.equal(bootstrapAudits.filter(a=>a.action==='owner.bootstrap.granted').length,1);
      process.env.LOCALEATS_ADMIN_CLERK_USER_IDS='';access=await api('/driver/availability',ownerClerk);assert.equal(access.data.ownerDriverAccess,false);assert.equal(access.data.approved,false);
      assert.equal((await api('/driver/heartbeat',ownerClerk,'POST')).status,403);assert.equal((await api('/admin/profiles',ownerClerk)).status,200);
    }finally{if(previousDriver===undefined)delete process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS;else process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS=previousDriver;if(previous===undefined)delete process.env.LOCALEATS_ADMIN_CLERK_USER_IDS;else process.env.LOCALEATS_ADMIN_CLERK_USER_IDS=previous;if(ownerId)await db.update(driverPresenceTable).set({available:false}).where(eq(driverPresenceTable.profileId,ownerId));}
  });
  await t.test("owner bootstrap applies on protected APIs, serializes grants and does not reactivate suspended accounts",async()=>{
    const previous=process.env.LOCALEATS_ADMIN_CLERK_USER_IDS,activeClerk=`user_QABootstrap${randomUUID().replaceAll('-','')}`,inactiveClerk=`user_QASuspended${randomUUID().replaceAll('-','')}`,activeId=randomUUID(),inactiveId=randomUUID();
    await db.insert(profilesTable).values([{id:activeId,clerkUserId:activeClerk,displayName:'Existing owner fixture',role:'customer'},{id:inactiveId,clerkUserId:inactiveClerk,displayName:'Suspended owner fixture',role:'customer',isActive:false}]);
    process.env.LOCALEATS_ADMIN_CLERK_USER_IDS=`${activeClerk},${inactiveClerk}`;
    try{
      const results=await Promise.all([api('/admin/profiles',activeClerk),api('/admin/profiles',activeClerk)]);assert.deepEqual(results.map(r=>r.status),[200,200]);
      assert.equal((await api('/profiles/me',activeClerk)).data.role,'admin');
      assert.equal((await api('/driver/availability',activeClerk)).data.approved,false);
      const audits=await db.select().from(auditLogsTable).where(eq(auditLogsTable.resourceId,activeId));assert.equal(audits.filter(a=>a.action==='owner.bootstrap.granted').length,1);
      assert.equal((await api('/admin/profiles',inactiveClerk)).status,403);assert.equal((await api('/driver/availability',inactiveClerk)).status,403);
      const [suspended]=await db.select().from(profilesTable).where(eq(profilesTable.id,inactiveId));assert.equal(suspended.role,'customer');assert.equal(suspended.isActive,false);
    }finally{if(previous===undefined)delete process.env.LOCALEATS_ADMIN_CLERK_USER_IDS;else process.env.LOCALEATS_ADMIN_CLERK_USER_IDS=previous;}
  });

});
