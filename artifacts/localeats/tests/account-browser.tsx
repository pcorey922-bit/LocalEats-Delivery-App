import { SupportDesk, AdminSupport } from '../src/pages/support-desk';
import { FcmPermissionValidation } from '../src/pages/fcm-permission';
import { FirebaseOAuthDiagnostic } from '../src/pages/firebase-oauth';
import { NativeStartupBoundary } from '../src/components/native-startup-boundary';
import { nativeStartup } from '../src/lib/native-startup';
import { PaymentReconciliation } from '../src/pages/financial-reconciliation';
import App from "../src/App";
import { NativeSignIn } from "../src/pages/native-sign-in";
import { ImportGuestLink } from "../src/pages/import-guest-link";
import { NextGuestOrder } from "../src/pages/next-guest-order";
import { TelephoneDispatch } from "../src/pages/telephone-dispatch";
import { RestaurantConfirmation } from "../src/pages/restaurant-confirmation";
import { GuestCheckoutAccess } from "../src/pages/guest-order";
import { CartPage, AdminPage } from "../src/pages/roco-pages";
// Isolated component fixture: simulated auth/API only; never a production route.
import React from "react";
import { createRoot } from "react-dom/client";
import { GeocodioPublicTest } from "../src/pages/geocodio-public-test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccountAccess } from "../src/pages/account-access";
import { AccountSettings } from "../src/pages/account-settings";
import { AdministratorAccessManager } from "../src/pages/administrator-access";
import { CheckoutPanel, PricingSettings, OperationsCommerce } from "../src/pages/commerce-pages";
import { PaymentSetupChecks } from "../src/pages/payment-setup";
import { OrderTracking } from "../src/pages/delivery-tracking";
import { DeclinedOffers } from "../src/pages/declined-offers";
import { useCustomerCart } from '../src/hooks/use-customer-cart';
import { cartLineKey } from '../src/lib/cart-line';
function CartProbe({ name }: { name: string }) {
  const [items, setItems] = useCustomerCart();
  return <section><output data-testid={`${name}-cart`}>{JSON.stringify(items)}</output><button onClick={() => {
    const menuItemId = '11111111-1111-4111-8111-111111111110';
    const lineId = cartLineKey(menuItemId);
    setItems(old => old.some(i => i.lineId === lineId) ? old.map(i => i.lineId === lineId ? { ...i, quantity: i.quantity + 1 } : i) : [...old, {
      lineId, menuItemId, restaurantId: '11111111-1111-4111-8111-111111111111', restaurantName: 'QA kitchen', name: 'French fries', priceCents: 349, quantity: 1,
    }]);
  }}>Add fries {name}</button></section>;
}
declare global {
  interface Window {
    qaEvidenceState: string;
    qaEvidenceAttempts: number;
    qaNativeStart: Record<string, unknown> | null;
    qaNativeTickets: string[];
    qaNativeOpened: string[];
    qaGuestImportHeaders: string[];
    qaNextGuestWrites: unknown[];
    qaTelephoneStatus: string;
    qaTelephoneVersion: number;
    qaTelephoneWrites: unknown[];
    qaSignedIn: boolean;
    qaGuestContacts: unknown[];
    qaGuestAddresses: Record<string, unknown>[];
    qaPricingReady: boolean;
    qaPricingWrites: unknown[];
    qaSignedEventAt: string | null;
    qaAccess: Record<string, string | boolean>;
    qaGeoReady: boolean;
    qaGeoCalls: number;
    qaOAuthCalls: number;
    qaOwnerWrites: string[];
    qaOwnerReads: string[];
    qaOwnerHealth: Record<string,unknown>;
    qaSupportCases: Record<string,unknown>[];
    qaSupportMessages: Record<string,unknown>[];
    qaSupportWrites: Record<string,unknown>[];
    qaSupportHideCases: boolean;
    qaSupportHideMessages: boolean;
    qaFcmValidationCalls: number;
    qaFcmValidationRun: null | Record<string, unknown>;
    qaOAuthRun: null | Record<string, unknown>;
    qaGeoRun: null | Record<string, unknown>;
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
window.qaEvidenceState = 'pending';
window.qaGeoReady = false;
window.qaGeoCalls = 0;
window.qaOAuthCalls = 0;
window.qaSupportCases=[{id:'55555555-5555-4555-8555-555555555555',orderId:null,category:'account',subject:'Support fixture',message:'Existing support history',status:'open',version:1,resolution:null,createdAt:new Date().toISOString()}];
window.qaSupportMessages=[];window.qaSupportWrites=[];window.qaSupportHideCases=false;window.qaSupportHideMessages=false;
window.qaFcmValidationCalls = 0;
window.qaFcmValidationRun = null;
window.qaOAuthRun = null;
window.qaGeoRun = null;
window.qaEvidenceAttempts = 0;
window.qaNativeStart = null;
window.qaNativeTickets = [];
window.qaNativeOpened = [];
window.qaGuestImportHeaders = [];
window.qaNextGuestWrites = [];
window.qaTelephoneStatus = "pending";
window.qaTelephoneVersion = 1;
window.qaTelephoneWrites = [];
const homeFixture = location.pathname === "/home-fixture";
if (homeFixture) {
  sessionStorage.setItem("qa-signup-fixture", "1");
  history.replaceState(null, "", "/");
}
const signupFixture = homeFixture || location.pathname === "/signup-fixture" || sessionStorage.getItem("qa-signup-fixture") === "1";
if (location.pathname === "/signup-fixture") {
  const query = new URLSearchParams(location.search);
  sessionStorage.setItem("qa-signup-fixture", "1");
  if (query.has("deny")) sessionStorage.setItem("qa-signup-deny", "1");
  if (query.has("expired")) sessionStorage.setItem("qa-signup-expired", "1");
  history.replaceState(null, "", "/sign-up" + location.search);
}
window.qaSignedIn = location.search.includes("nativeRestored=true") || (signupFixture ? sessionStorage.getItem("qa-signup-session") === "signed-in" : !["guest=true", "native=true", "importGuest=true"].some(
  (v) => location.search.includes(v),
));
window.qaGuestContacts = [];
window.qaGuestAddresses = [];
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
const ownerFixture = location.search.includes('owner=true') || sessionStorage.getItem('qa-owner-fixture') === 'true';
if (ownerFixture) sessionStorage.setItem('qa-owner-fixture', 'true');
window.qaOwnerWrites=[];window.qaOwnerReads=[];
window.qaOwnerHealth={financial:[],webhooks:[],provisioning:[],pushDeliveries:[],workers:[],pushConfiguration:{android:true,ios:false,deliveryEnabled:false,androidCredentialStatus:'locally_valid'},testPayoutsEnabled:false,webhookRetentionEnabled:false,observedAt:new Date().toISOString()};
window.fetch = async (url, options = {}) => {
  if(ownerFixture){
    const path=String(url);
    if(options.method && !['GET','HEAD'].includes(options.method)){window.qaOwnerWrites.push(path);throw new Error('Unexpected owner fixture mutation');}
    window.qaOwnerReads.push(path);
    if(path==='/api/profiles/me'){
      await new Promise(resolve=>setTimeout(resolve,100));
      if(location.search.includes('accountError=true'))return Response.json({error:'Simulated account unavailable'},{status:503});
      return Response.json({id:'owner-fixture',displayName:'Example owner',role:location.search.includes('denied=true')?'customer':'admin',isActive:true,createdAt:new Date().toISOString()});
    }
    if(path==='/api/admin/overview')return Response.json({totalProfiles:4,totalCustomers:1,totalRestaurants:1,pendingRestaurants:0,approvedRestaurants:1,suspendedRestaurants:0,totalOrders:1,activeOrders:0,completedOrders:1,pendingPayments:0});
    if(path==='/api/admin/finance')return Response.json({paymentProviderConnected:true,succeededPaymentCount:1,succeededPaymentCents:1919,pendingPaymentCount:0,pendingPaymentCents:0,refundedPaymentCount:0,refundedPaymentCents:0,paidOutCents:0,pendingPayoutCents:0,failedPayoutCount:0});
    if(path==='/api/admin/operational-health')return Response.json(window.qaOwnerHealth);
    if(path==='/api/admin/dispatch')return Response.json({orders:[],drivers:[],mapConfig:null});
    if(path==='/api/admin/drivers')return Response.json([{id:'owner-fixture',displayName:'Example owner',driverApproved:true,ownerDriverAccess:true}]);
    if(path==='/api/admin/payouts')return Response.json([{id:'pending-payout-fixture',kind:'driver',amountCents:100,status:'pending',providerReversalId:null}]);
    if(path.startsWith('/api/admin/ledger?'))return Response.json({balanced:true,currency:'USD',notice:'Simulated TEST records only',missingPaymentBaselines:'0',nextCursor:null,balances:[],journals:[]});
    if(path==='/api/admin/order-timing')return Response.json({reservationMinutes:10,restaurantResponseMinutes:10,driverAssignmentMinutes:10,driverPickupMinutes:10});
    if(['/api/orders/me','/api/admin/restaurants','/api/admin/profiles','/api/admin/payouts','/api/admin/refunds','/api/admin/drivers','/api/admin/driver-applications','/api/admin/financial-operations','/api/admin/financial-holds','/api/admin/order-incidents','/api/admin/telephone-orders'].includes(path)||path.startsWith('/api/admin/webhook-inbox?')||path.startsWith('/api/admin/push-deliveries?'))return Response.json([]);
  }

  const supportUrl=String(url),messagePath=supportUrl.match(/^\/api\/support\/cases\/([^/]+)\/messages/),decisionPath=supportUrl.match(/^\/api\/admin\/support\/cases\/([^/]+)$/);
  if(supportUrl==='/api/support/cases'||supportUrl==='/api/admin/support/cases'){
    if(options.method==='POST'){
      const v=JSON.parse(String(options.body));window.qaSupportWrites.push(v);
      let row=window.qaSupportCases.find(c=>c.id===v.id);
      if(!row){row={...v,orderId:v.orderId??null,status:'open',version:1,resolution:null,createdAt:new Date().toISOString()};window.qaSupportCases.unshift(row!);}
      if(location.search.includes('lostSupport=true')&&window.qaSupportWrites.length===1)throw new TypeError('Simulated lost support receipt');
      return Response.json(row);
    }
    return Response.json(window.qaSupportHideCases?[]:window.qaSupportCases);
  }
  if(messagePath){
    const row=window.qaSupportCases.find(c=>c.id===messagePath[1])!;
    if(options.method==='POST'){
      const v=JSON.parse(String(options.body));window.qaSupportWrites.push(v);let message=window.qaSupportMessages.find(m=>m.id===v.id);
      if(!message){message={...v,kind:'reply',authorRole:'customer',caseVersion:Number(row.version)+1,statusAfter:'open',body:v.message,createdAt:new Date().toISOString()};window.qaSupportMessages.push(message!);row.version=Number(row.version)+1;}
      if(location.search.includes('lostSupport=true')&&window.qaSupportWrites.length===1)throw new TypeError('Simulated lost reply receipt');
      return Response.json(message);
    }
    return Response.json({case:{id:row.id,status:row.status,version:row.version},messages:window.qaSupportHideMessages?[]:window.qaSupportMessages,nextBeforeVersion:null});
  }
  if(decisionPath&&options.method==='PATCH'){
    const row=window.qaSupportCases.find(c=>c.id===decisionPath[1])!,v=JSON.parse(String(options.body));window.qaSupportWrites.push(v);
    if(!window.qaSupportMessages.some(m=>m.id===v.id)){row.status=v.status;row.resolution=v.resolution;row.version=Number(row.version)+1;window.qaSupportMessages.push({id:v.id,kind:'decision',body:v.resolution,caseVersion:row.version});}
    if(location.search.includes('lostSupport=true')&&window.qaSupportWrites.length===1)throw new TypeError('Simulated lost decision receipt');
    return Response.json(row);
  }

  if(String(url)==='/api/admin/fcm-permission-validation'){
    if(options.method==='POST'){
      window.qaFcmValidationCalls++;if(String(options.body)!==JSON.stringify({confirmValidationOnly:true}))throw Error('Unexpected validation input');
      window.qaFcmValidationRun={state:'completed',report:{authenticated:true,permissionValidated:true,code:'FCM_PERMISSION_VALIDATED'}};
      if(location.search.includes('lostFcm=true'))throw new TypeError('Simulated lost validation result');
      return Response.json({...window.qaFcmValidationRun.report as object,validationOnly:true,notificationSent:false,deviceDeliveryVerified:false});
    }
    return Response.json({ready:window.qaFcmValidationRun===null,allowanceUsed:window.qaFcmValidationRun!==null,run:window.qaFcmValidationRun});
  }

  if (String(url) === '/api/admin/firebase-oauth') {
    if (options.method === 'POST') {
      window.qaOAuthCalls++;
      if (String(options.body) !== JSON.stringify({confirmOAuthOnly:true})) throw Error('Unexpected OAuth input');
      window.qaOAuthRun={state:'completed',authenticated:true,code:'GOOGLE_OAUTH_AUTHENTICATED',checkedAt:new Date().toISOString()};
      if(location.search.includes('lostOAuth=true'))throw new TypeError('Simulated response interruption');
      return Response.json({...window.qaOAuthRun,notificationSent:false,fcmPermissionVerified:false});
    }
    return Response.json({ready:window.qaOAuthRun===null,retryAfter:window.qaOAuthRun?new Date(Date.now()+600000).toISOString():null,lastRun:window.qaOAuthRun});
  }

  if (String(url) === "/api/admin/geocodio-public-test") {
    if (options.method === "POST") {
      window.qaGeoCalls++;
      if (!window.qaGeoReady || window.qaGeoRun) return Response.json({ error: "Blocked" }, { status: 409 });
      if (String(options.body) !== JSON.stringify({ freeTierConfirmed: true })) throw Error("Unexpected public test payload");
      window.qaGeoRun = { state: "completed", report: { requestsMade: 5, coverageGaps: ["independent_public_building_ground_truth"], cases: [{ id: "city-hall", status: "accepted_by_validator" }] } };
      // Server succeeded, but the phone lost the response. GET must recover the
      // saved report without automatically POSTing again.
      throw new TypeError("Fixture connection interrupted");
    }
    return Response.json({ enabled: window.qaGeoReady, keyConfigured: window.qaGeoReady, ready: window.qaGeoReady, safeguards: { privateStaging: true, publicOrderingOff: true, privateOrderingOff: true, stripeTestOnly: true, municipalEnforcementOff: true }, run: window.qaGeoRun });
  }
  if (location.search.includes('checkoutCsp=true')) {
    const path = String(url);
    if (path === '/api/commerce/config') return Response.json({ mode: 'stripe_test', orderingEnabled: true, testMode: true, liveChargesEnabled: false });
    if (path === '/api/orders/fixture-csp/confirmation') return Response.json({ mode: 'electronic', status: null, orderStatus: 'placed', preparationMinutes: null });
    if (path === '/api/orders/fixture-csp/payment') return Response.json({ reservationExpiresAt: new Date(Date.now()+900000).toISOString() });
    if (path === '/api/orders/fixture-csp/checkout') return Response.json({ mode: 'stripe_test', operationId: 'fixture-csp-operation', url: null }, { status: 202 });
    if (path === '/api/orders/fixture-csp/financial-operations') return Response.json([{ id: 'fixture-csp-operation', state: 'succeeded', result: { url: 'https://checkout.stripe.com/c/pay/cs_test_csp_fixture' }, errorCode: null }]);
  }

  if (String(url) === '/api/admin/orders/fixture-reconciliation/reconcile-payment') {
    window.qaEvidenceAttempts++;
    const state = window.qaEvidenceState;
    if (state === 'available') return Response.json({ feeCents: 86, netCents: 1833 });
    return Response.json({
      error: state === 'pending' ? 'Stripe balance funds are pending.' : state === 'missing' ? 'Stripe has not supplied the charge balance transaction yet.' : 'Stripe balance evidence is invalid or inconsistent.',
      code: state === 'pending' ? 'STRIPE_BALANCE_PENDING' : state === 'missing' ? 'STRIPE_BALANCE_MISSING' : 'STRIPE_BALANCE_INVALID',
      ...(state === 'pending' && { availableOn: '2026-11-16T00:00:00.000Z' }),
    }, { status: 409 });
  }

  const json = (value: unknown) =>
    new Response(JSON.stringify(value), {
      headers: { "content-type": "application/json" },
    });
  if (signupFixture && String(url).startsWith("/api/")) {
    const path = String(url);
    const raw = sessionStorage.getItem("qa-signup-profile");
    const saved = raw ? JSON.parse(raw) : null;
    const denied = sessionStorage.getItem("qa-signup-deny") === "1";
    if (path === "/api/profiles/me") {
      if (sessionStorage.getItem("qa-signup-expired") === "1") return Response.json({ error: "Sign in again" }, { status: 401 });
      if (denied) return Response.json({ error: "Private staging requires an invitation" }, { status: 403 });
      if (options.method === "POST") {
        if (saved) return Response.json({ error: "Profile already exists" }, { status: 409 });
        const profile = { ...JSON.parse(String(options.body)), id: "fixture-profile", createdAt: new Date().toISOString() };
        sessionStorage.setItem("qa-signup-profile", JSON.stringify(profile));
        sessionStorage.setItem("qa-signup-writes", String(Number(sessionStorage.getItem("qa-signup-writes")) + 1));
        return Response.json(profile, { status: 201 });
      }
      return saved ? json(saved) : Response.json({ error: "Profile setup is required" }, { status: 404 });
    }
    if (path === "/api/session/access") return json({
      ...window.qaAccess, privateStaging: true, stagingAdmitted: !denied,
      profileStatus: saved ? "active" : "setup_required", role: saved?.role ?? null,
    });
    if (path === "/api/commerce/config") return json({ orderingEnabled: true, testMode: true, liveChargesEnabled: false });
    if (path === "/api/addresses/me") return json([{ id: "fixture-address", street1: "100 Test Way", city: "Rockwood" }]);
    if (path === "/api/orders/quote") {
      const input = JSON.parse(String(options.body));
      if (sessionStorage.getItem("qa-hold-quote") === "1") {
        await new Promise<void>(resolve => {
          Object.assign(window, { qaReleaseQuote: resolve });
        });
      }
      const subtotalCents = input.items[0].quantity * 899;
      return json({ subtotalCents, deliveryFeeCents: 0, serviceFeeCents: 0, taxCents: 0, tipCents: 0, totalCents: subtotalCents });
    }
    if (path === "/api/orders" && options.method === "POST") {
      const writes = JSON.parse(sessionStorage.getItem("qa-order-writes") ?? "[]");
      writes.push({ body: JSON.parse(String(options.body)), key: new Headers(options.headers).get("idempotency-key") });
      sessionStorage.setItem("qa-order-writes", JSON.stringify(writes));
      return Response.json({ error: "Simulated order retry" }, { status: 503 });
    }
    if (path === "/api/dashboard") return json({ ...saved, sections: [] });
    if (path === "/api/restaurants/me") return Response.json({ error: "No restaurant" }, { status: 404 });
    if (path === "/api/driver/availability") return json({ available: false, approved: false, online: false });
    if (path === "/api/driver/application") return json(null);
    return json([]);
  }
  if (String(url) === "/api/orders/fixture-telephone/guest-contact")
    return json({
      name: "QA telephone guest",
      phone: "8655550199",
      email: "guest-ui@example.test",
    });
  if (String(url) === "/api/guest/session/next") {
    window.qaNextGuestWrites.push(JSON.parse(String(options.body)));
    return json({ token: "B".repeat(43) });
  }
  if (String(url) === "/api/admin/telephone-restaurants") return json([]);
  if (String(url) === "/api/orders/fixture-telephone/confirmation")
    return json({
      mode: "telephone",
      status: window.qaTelephoneStatus,
      orderStatus: "placed",
      preparationMinutes: window.qaTelephoneStatus === "accepted" ? 20 : null,
    });
  if (String(url) === "/api/admin/telephone-orders")
    return json([
      {
        order: {
          id: "fixture-telephone",
          placedAt: new Date().toISOString(),
          reservationExpiresAt: new Date(Date.now() + 600000).toISOString(),
          subtotalCents: 1000,
          totalCents: 1550,
        },
        restaurant: { name: "QA telephone kitchen", phone: "8655550100" },
        confirmation: {
          status: window.qaTelephoneStatus,
          version: window.qaTelephoneVersion,
        },
        items: [
          {
            id: "fixture-line",
            itemNameSnapshot: "QA phone meal",
            quantity: 1,
            unitPriceCents: 1000,
            specialInstructions: "No onions",
            modifierSnapshot: [{ option: "Extra sauce" }],
          },
        ],
        hours: [],
      },
    ]);
  if (
    String(url) === "/api/admin/orders/fixture-telephone/telephone-confirmation"
  ) {
    const input = JSON.parse(String(options.body));
    window.qaTelephoneWrites.push(input);
    window.qaTelephoneVersion++;
    window.qaTelephoneStatus =
      input.action === "accept"
        ? "accepted"
        : input.action === "reject"
          ? "rejected"
          : "contacted";
    return json({});
  }
  if (String(url) === "/api/mobile/auth/start") {
    window.qaNativeStart = JSON.parse(String(options.body));
    return json({
      id: "11111111-1111-4111-8111-111111111115",
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      authorizationUrl:
        "https://qa.onrender.com/mobile/authorize#flow=fixture&state=fixture",
    });
  }
  if (String(url) === "/api/mobile/auth/redeem")
    return json({ ticket: "qa-one-use-ticket" });
  if (String(url) === "/api/guest/session") {
    window.qaGuestImportHeaders.push(
      new Headers(options.headers).get("X-RoCoEats-Guest-Token") || "",
    );
    return json({
      orderId: null,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  }
  if (String(url) === "/api/guest/sessions") {
    window.qaGuestContacts.push(JSON.parse(String(options.body)));
    return json({ token: "A".repeat(43) });
  }
  if (String(url) === "/api/commerce/config")
    return json({
      orderingEnabled: false,
      testMode: true,
      mode: "stripe_test",
      liveChargesEnabled: false,
      pricing: null,
    });
  if (String(url) === "/api/addresses/me") {
    if (options.method === "POST") {
      const value = {
        ...JSON.parse(String(options.body)),
        id: "11111111-1111-4111-8111-111111111112",
      };
      window.qaGuestAddresses.push(value);
      return json(value);
    }
    return json(window.qaGuestAddresses);
  }
  if (String(url) === "/api/orders/quote")
    return json({
      subtotalCents: 1000,
      deliveryFeeCents: 500,
      serviceFeeCents: 50,
      taxCents: 0,
      tipCents: 0,
      totalCents: 1550,
    });

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
(window as unknown as {qaStartupPhase:(phase:any)=>void}).qaStartupPhase = phase => nativeStartup.report(phase);
createRoot(document.getElementById("root")!).render(
  location.search.includes('startupBlocked=true') ? <NativeStartupBoundary enabled><div className="portal-skeleton">Simulated provider withholds app children</div></NativeStartupBoundary> : signupFixture ? <App /> : <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <p>SIMULATED authentication and API: component QA only</p>
    {ownerFixture ? (location.pathname === '/admin' ? <AdminPage/> : <OperationsCommerce/>) : location.search.includes('supportDesk=true') ? <SupportDesk/> : location.search.includes('supportAdmin=true') ? <AdminSupport/> : location.search.includes('fcmValidation=true') ? <FcmPermissionValidation/> : location.search.includes('firebaseOAuth=true') ? <FirebaseOAuthDiagnostic/> : location.search.includes('checkoutCsp=true') ? <CheckoutPanel orderId="fixture-csp"/> : location.search.includes('reconciliation=true') ? <PaymentReconciliation orderId="fixture-reconciliation"/> : location.search.includes('cartSync=true') ? <React.StrictMode><CartProbe name="menu"/><CartProbe name="checkout"/></React.StrictMode> : location.search.includes("native=true") ? (
      <NativeStartupBoundary enabled><NativeSignIn role={location.search.includes("join=restaurant") ? "restaurant" : undefined} /></NativeStartupBoundary>
    ) : location.search.includes("importGuest=true") ? (
      <ImportGuestLink />
    ) : !window.qaSignedIn ? (
      <GuestCheckoutAccess>
        <CartPage />
      </GuestCheckoutAccess>
    ) : (
      <>
        <AccountAccess />
        <AdministratorAccessManager />
        <AccountSettings displayName="QA profile" />
        <PaymentSetupChecks />
        <GeocodioPublicTest />
        <PricingSettings current={null} />
        <OrderTracking orderId="fixture-tracking" />
        <DeclinedOffers />
        <TelephoneDispatch />
        <RestaurantConfirmation orderId="fixture-telephone" />
        <NextGuestOrder token={"A".repeat(43)} />
      </>
    )}
  </QueryClientProvider>,
);
