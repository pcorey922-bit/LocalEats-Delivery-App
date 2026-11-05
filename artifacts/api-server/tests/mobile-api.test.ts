import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  customFetch,
  setBaseUrl,
  setAuthTokenGetter,
  ApiError,
} from "../../../lib/api-client-react/src/custom-fetch";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  setBaseUrl(null);
  setAuthTokenGetter(null);
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
