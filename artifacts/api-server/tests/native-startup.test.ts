import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  nativeStep,
  NativeStepError,
} from "../../localeats/src/lib/native-startup";
import {
  readNativeRequest,
  saveNativeRequest,
  clearNativeRequest,
  runNativeRequest,
} from "../../localeats/src/lib/native-auth-request";
import { mobileCallbackRoute } from "../../localeats/src/lib/mobile-return";
const values = new Map<string, string>();
const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});
afterEach(() => {
  clearNativeRequest();
  values.clear();
});
const pending = () => ({
  id: "11111111-1111-4111-8111-111111111119",
  verifier: "V".repeat(43),
  expiresAt: new Date(Date.now() + 300000).toISOString(),
  phase: "waiting" as const,
});
test("stalled pre-profile SDK work times out; a late ticket cannot start finalization", async () => {
  let finish!: () => void,
    nextCalls = 0;
  const result = nativeStep(
    "NATIVE_TICKET_TIMEOUT",
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    new AbortController().signal,
    15,
  ).then(() => nextCalls++);
  await assert.rejects(
    result,
    (error) =>
      error instanceof NativeStepError &&
      error.code === "NATIVE_TICKET_TIMEOUT",
  );
  finish();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(nextCalls, 0);
});
test("remounts and duplicate callbacks share one in-flight consumption", async () => {
  const request = pending();
  saveNativeRequest(request);
  let calls = 0,
    finish!: () => void;
  const operation = () => {
    calls++;
    saveNativeRequest({ ...request, phase: "activating" });
    return new Promise<void>((resolve) => {
      finish = resolve;
    });
  };
  const first = runNativeRequest(request, operation);
  await new Promise((resolve) => setImmediate(resolve));
  const second = runNativeRequest(readNativeRequest()!, operation);
  assert.equal(first, second);
  assert.equal(calls, 1);
  finish();
  await Promise.all([first, second]);
  await assert.rejects(
    runNativeRequest(readNativeRequest()!, operation),
    (error) =>
      error instanceof NativeStepError &&
      error.code === "NATIVE_HANDOFF_INTERRUPTED",
  );
  assert.equal(
    calls,
    1,
    "A restarted process must not redeem an already consumed request",
  );
});
test("cleanup for an older request never clears or cancels a newer request", () => {
  const older = pending(),
    newer = { ...pending(), id: "11111111-1111-4111-8111-111111111120" };
  saveNativeRequest(newer);
  clearNativeRequest(older.id);
  assert.deepEqual(readNativeRequest(), newer);
});
test("auth callbacks preserve pending handoffs and active sessions without a sign-in redirect", () => {
  const url = "rocoeats-driver://auth";
  assert.equal(
    mobileCallbackRoute(url, false, "driver", false, false),
    "/sign-in",
  );
  assert.equal(mobileCallbackRoute(url, false, "driver", false, true), null);
  assert.equal(mobileCallbackRoute(url, false, "driver", true, false), null);
  assert.equal(mobileCallbackRoute(url, false, "driver", true, true), null);
  assert.equal(
    mobileCallbackRoute(
      url + "?ticket=untrusted",
      false,
      "driver",
      false,
      false,
    ),
    null,
  );
  assert.equal(
    mobileCallbackRoute(
      "rocoeats-driver://orders",
      false,
      "driver",
      true,
      false,
    ),
    "/driver",
  );
});
// Test module is isolated by the existing runner.
process.on("exit", () => {
  if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
  else Reflect.deleteProperty(globalThis, "localStorage");
});
