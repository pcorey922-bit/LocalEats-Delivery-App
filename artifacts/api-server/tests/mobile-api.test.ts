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
});
