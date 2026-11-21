import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  customFetch,
  setBaseUrl,
  setAuthTokenGetter,
  setGuestTokenGetter,
  ApiError,
} from "../../../lib/api-client-react/src/custom-fetch";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  setBaseUrl(null);
  setAuthTokenGetter(null);
  setGuestTokenGetter(null);
});
test("mobile requests use configured API origin and fresh bearer token", async () => {
  setBaseUrl("https://api.example.test/");
  let token = "first";
  setAuthTokenGetter(() => token);
  const seen: string[] = [];
  globalThis.fetch = async (input, options) => {
    assert.equal(input, "https://api.example.test/api/driver/offers");
    seen.push(new Headers(options?.headers).get("authorization")!);
    return Response.json([]);
  };
  await customFetch("/api/driver/offers");
  token = "refreshed";
  await customFetch("/api/driver/offers");
  assert.deepEqual(seen, ["Bearer first", "Bearer refreshed"]);
});
test("claim conflicts surface the server error instead of reporting success", async () => {
  globalThis.fetch = async () =>
    Response.json(
      { error: "Delivery unavailable or already claimed" },
      { status: 409 },
    );
  await assert.rejects(
    customFetch("/api/driver/orders/id/claim", { method: "POST" }),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.message.includes("already claimed"),
  );
});
test("signed-out requests do not retain the previous bearer token", async () => {
  setAuthTokenGetter(() => null);
  globalThis.fetch = async (_input, options) => {
    assert.equal(new Headers(options?.headers).has("authorization"), false);
    return new Response(null, { status: 204 });
  };
  assert.equal(await customFetch("/api/driver/offers"), null);
});

test("guest capabilities reach only relative customer APIs and never external or privileged destinations",async()=>{
 setGuestTokenGetter(()=>"guest-capability-fixture");
 const seen:Array<string|null>=[];
 globalThis.fetch=async(_input,options)=>{seen.push(new Headers(options?.headers).get("X-RoCoEats-Guest-Token"));return Response.json({});};
 await customFetch("/api/orders/fixture/tracking");
 await customFetch("https://untrusted.example.test/api/orders/fixture/tracking");
 await customFetch("/api/admin/dispatch");
 await customFetch("/api/driver/offers");
 setBaseUrl("https://api.example.test"); await customFetch("/api/guest/session");
 setAuthTokenGetter(()=>"clerk-fixture");await customFetch("/api/orders/me");
 assert.deepEqual(seen,["guest-capability-fixture",null,null,null,"guest-capability-fixture",null]);
});

test("mobile return links contain navigation only and reject malformed or authority-bearing URLs",async()=>{
 const {mobileReturnRoute}=await import("../../localeats/src/lib/mobile-return");
 assert.equal(mobileReturnRoute("rocoeats://orders",true),"/guest/order");assert.equal(mobileReturnRoute("rocoeats://auth"),"/sign-in");
 for(const value of ["bad","https://evil.example.test/orders","rocoeats://orders?token=secret","rocoeats://orders#access=secret","rocoeats://admin","rocoeats://user:pass@orders"])assert.equal(mobileReturnRoute(value),null);
 assert.equal(mobileReturnRoute('rocoeats-driver://auth', false, 'driver'), '/sign-in');
 assert.equal(mobileReturnRoute('rocoeats-driver://earnings', false, 'driver'), '/earnings');
 assert.equal(mobileReturnRoute('rocoeats-driver://orders', false, 'driver'), '/driver');
 assert.equal(mobileReturnRoute('rocoeats-driver://auth'), null);
 assert.equal(mobileReturnRoute('rocoeats://auth', false, 'driver'), null);
 for (const raw of ['rocoeats-driver://auth?ticket=secret', 'rocoeats-driver://auth#token=secret', 'rocoeats-driver://admin', 'rocoeats-driver://user:password@auth']) assert.equal(mobileReturnRoute(raw, false, 'driver'), null);
});

test("native Clerk bearer tokens are never automatically attached to third-party URLs",async()=>{
 setBaseUrl("https://api.example.test");setAuthTokenGetter(()=>"private-session-fixture");
 const seen:Array<string|null>=[];globalThis.fetch=async(_input,options)=>{seen.push(new Headers(options?.headers).get("authorization"));return Response.json({});};
 await customFetch("https://untrusted.example.test/api/orders");await customFetch("/api/orders/me");await customFetch("https://api.example.test/api/orders/me");await customFetch("https://api.example.test/assets/icon.png");
 assert.deepEqual(seen,[null,"Bearer private-session-fixture","Bearer private-session-fixture",null]);
});

test("aborting a stuck session token lookup releases the caller and prevents a late request", async () => {
  const controller = new AbortController();
  let finishToken!: (token: string) => void;
  setAuthTokenGetter(() => new Promise<string>(resolve => { finishToken = resolve; }));
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({});
  };
  const request = customFetch("/api/profiles/me", { signal: controller.signal });
  const reason = new Error("Profile request canceled");
  controller.abort(reason);
  await assert.rejects(request, error => error === reason);
  finishToken("stale-token");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(called, false);
});

test("signup intent only accepts member roles and routes existing roles to their own workspace", async () => {
  const { joinRole, accountDestination } = await import("../../localeats/src/lib/account-entry");
  for (const role of ["customer", "restaurant", "driver"]) assert.equal(joinRole(role), role);
  for (const role of [null, "admin", "/admin", "https://example.test"]) {
    assert.equal(joinRole(role), "customer");
  }
  assert.equal(accountDestination("customer", true), "/cart?restore=1");
  assert.equal(accountDestination("restaurant", true), "/restaurant");
  assert.equal(accountDestination("driver", false), "/driver");
  assert.equal(accountDestination("admin", false), "/admin");
});

test("native signup resumes only fixed role and checkout routes after browser sign-in", async () => {
  const { nativeAccountReturn } = await import("../../localeats/src/lib/account-entry");
  assert.equal(nativeAccountReturn("restaurant"), "/account/setup?join=restaurant");
  assert.equal(nativeAccountReturn("driver"), "/account/setup?join=driver");
  assert.equal(nativeAccountReturn("customer", true), "/account/setup?join=customer&checkout=1");
  assert.equal(nativeAccountReturn("https://untrusted.example/admin"), "/account");
  assert.equal(nativeAccountReturn("admin"), "/account");
});

test('native response readers preserve authenticated JSON without an exposed stream or reliable length hint', async () => {
  const profile = {id:'native-driver',role:'driver',displayName:'Driver',createdAt:'2026-11-18T00:00:00Z'};
  setBaseUrl('https://api.example.test');
  setAuthTokenGetter(() => 'local-test-bearer');
  for (const stream of [null, undefined]) {
    for (const declaredLength of [undefined, '0']) {
      let evidence: unknown;
      globalThis.fetch = async (input, init) => {
        assert.equal(String(input),'https://api.example.test/api/profiles/me');
        assert.equal(new Headers(init?.headers).get('authorization'),'Bearer local-test-bearer');
        assert.equal('onResponse' in (init ?? {}),false);
        const response = Response.json(profile);
        if (declaredLength) response.headers.set('content-length',declaredLength);
        Object.defineProperty(response,'body',{value:stream});
        return response;
      };
      assert.deepEqual(await customFetch('/api/profiles/me',{onResponse:value=>{evidence=value}}),profile);
      assert.deepEqual(evidence, {status:200,media:'JSON',stream:stream===null?'NONE':'UNAVAILABLE',redirected:false,declaredLength:declaredLength === undefined ? null : Number(declaredLength),textLength:JSON.stringify(profile).length});
      assert.doesNotMatch(JSON.stringify(evidence),/native-driver|bearer|api\.example|authorization|displayName/);
    }
  }
});
test('native streamless error bodies retain 401 status and do not become empty success', async () => {
  globalThis.fetch = async () => {
    const response = Response.json({error:'Sign-in is required'},{status:401});
    Object.defineProperty(response,'body',{value:null});
    return response;
  };
  await assert.rejects(customFetch('/api/profiles/me'),error=>error instanceof ApiError && error.status===401 && error.message.includes('Sign-in is required'));
});
test('HEAD and no-content semantics remain empty without invoking a response reader', async () => {
  for (const [method,status] of [['HEAD',200],['GET',204],['GET',205]] as const) {
    globalThis.fetch = async () => {
      const response = new Response(null,{status});
      response.text=async()=>{throw Error('Forbidden body read')};
      return response;
    };
    assert.equal(await customFetch('/api/profiles/me',{method}),null);
  }
  globalThis.fetch=async()=>new Response('',{status:200,headers:{'content-type':'application/json'}});
  assert.equal(await customFetch('/api/profiles/me'),null,'A truly empty payload is still empty, never fabricated');
});


test('Customer native presentation does not replace server roles or website staff routing', async () => {
 const {accountDestination,nativeAccountReturn}=await import('../../localeats/src/lib/account-entry');
 for(const role of ['customer','driver','restaurant','admin']) {
  assert.equal(accountDestination(role,false,true),'/restaurants');
  assert.equal(accountDestination(role,true,true),role==='customer'?'/cart?restore=1':'/restaurants');
 }
 assert.equal(accountDestination('admin',false),'/admin');
 assert.equal(accountDestination('driver',false),'/driver');
 assert.equal(accountDestination('restaurant',false),'/restaurant');
 assert.equal(nativeAccountReturn('customer',false,true),'/account/setup?join=customer');
 assert.equal(nativeAccountReturn(undefined,false,true),'/account/setup?join=customer');
 assert.equal(nativeAccountReturn('customer',true,true),'/account/setup?join=customer&checkout=1');
 for(const role of ['restaurant','driver']) assert.equal(nativeAccountReturn(role,false,true),'/account/setup?join='+role);
});
