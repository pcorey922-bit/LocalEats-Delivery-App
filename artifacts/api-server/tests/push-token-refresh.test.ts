import test from "node:test";
import assert from "node:assert/strict";
import { createPushTokenRefresh } from "../../localeats/src/lib/push-token-refresh";
const id = "11111111-1111-4111-8111-111111111119",
  appId = "com.rocoeats.driver.staging",
  token = "new_synthetic_device_token";
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};
const flush = async () => {
  for (let n = 0; n < 15; n++) await new Promise<void>((r) => setImmediate(r));
};
function fixture(overrides: Record<string, unknown> = {}) {
  const state = {
    id: id as string | null,
    optedOut: false,
    active: true,
    manual: false,
    permitted: true,
    configured: true,
    registers: 0,
    reads: 0,
    writes: [] as unknown[],
    saved: [] as string[],
    failures: [] as boolean[],
  };
  const controller = createPushTokenRefresh({
    active: () => state.active,
    manual: () => state.manual,
    saved: () => state,
    permission: async () => state.permitted,
    configured: async () => state.configured,
    platform: "android",
    appId: async () => appId,
    lookup: async () => {
      state.reads++;
      return { registered: true, platform: "android", appId };
    },
    rotate: async (...args: unknown[]) => {
      state.writes.push(args);
      return { registered: true, deviceId: id };
    },
    register: async () => {
      state.registers++;
    },
    save: (v) => state.saved.push(v),
    changed: (v) => state.failures.push(v),
    ...overrides,
  });
  return { state, controller };
}
test("rotation updates only a current server-confirmed enrollment without requesting permission or creating devices", async () => {
  const f = fixture();
  await f.controller.recover();
  assert.equal(f.state.registers, 1);
  f.controller.receive(token);
  await flush();
  assert.equal(f.state.writes.length, 1);
  assert.equal((f.state.writes[0] as unknown[])[0], id);
  assert.deepEqual(f.state.saved, [token]);
  assert.deepEqual(f.state.failures, [false]);
  f.controller.stop();
});
test("no consent, sign-out, manual enrollment or native permission/config denial cannot auto-register", async () => {
  for (const flag of [
    "none",
    "optedOut",
    "inactive",
    "manual",
    "permission",
    "configuration",
  ]) {
    const f = fixture();
    if (flag === "none") f.state.id = null;
    if (flag === "optedOut") f.state.optedOut = true;
    if (flag === "inactive") f.state.active = false;
    if (flag === "manual") f.state.manual = true;
    if (flag === "permission") f.state.permitted = false;
    if (flag === "configuration") f.state.configured = false;
    await f.controller.recover();
    f.controller.receive(token);
    await flush();
    assert.equal(f.state.registers, 0);
    assert.equal(f.state.writes.length, 0);
    f.controller.stop();
  }
});
test("a different account/app/platform or an absent server registration cannot refresh or enroll", async () => {
  for (const lookup of [
    async () => ({
      registered: true,
      platform: "android",
      appId: "com.rocoeats.app.staging",
    }),
    async () => ({ registered: true, platform: "ios", appId }),
    async () => ({ registered: false }),
    async () => {
      throw Error("404");
    },
  ]) {
    const f = fixture({ lookup });
    await f.controller.recover();
    f.controller.receive(token);
    await flush();
    assert.equal(f.state.registers, 0);
    assert.equal(f.state.writes.length, 0);
    f.controller.stop();
  }
});
test("opt-out and identity loss fence delayed server acknowledgements", async () => {
  for (const mode of ["stop", "cancel", "optedOut", "identity"]) {
    const reply = deferred<unknown>();
    const f = fixture({ rotate: () => reply.promise });
    f.controller.receive(token);
    await flush();
    if (mode === "stop") f.controller.stop();
    if (mode === "cancel") f.controller.cancel();
    if (mode === "optedOut") f.state.optedOut = true;
    if (mode === "identity") f.state.active = false;
    reply.resolve({ registered: true, deviceId: id });
    await flush();
    assert.deepEqual(f.state.saved, []);
    f.controller.stop();
  }
});
test("burst refresh events serialize and preserve the latest provider token", async () => {
  const reply = deferred<unknown>();
  let calls = 0;
  const f = fixture({
    rotate: async () => {
      calls++;
      if (calls === 1) return reply.promise;
      return { registered: true, deviceId: id };
    },
  });
  f.controller.receive(token);
  await flush();
  f.controller.receive(token + "2");
  f.controller.receive(token + "3");
  reply.resolve({ registered: true, deviceId: id });
  await flush();
  assert.equal(calls, 2);
  assert.deepEqual(f.state.saved, [token, token + "3"]);
  f.controller.stop();
});
test("pending preflight timeout cannot register late and explicit opt-out blocks its later events", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const permit = deferred<boolean>();
  const f = fixture({ permission: () => permit.promise });
  const pending = f.controller.recover();
  t.mock.timers.tick(15000);
  await pending;
  permit.resolve(true);
  await flush();
  assert.equal(f.state.registers, 0);
  assert.equal(f.state.writes.length, 0);
  assert.deepEqual(f.state.failures, [true]);
  f.state.optedOut = true;
  f.controller.receive(token);
  await flush();
  assert.equal(f.state.writes.length, 0);
  f.controller.stop();
});
test("malformed token or acknowledgement never changes saved enrollment evidence", async () => {
  const f = fixture({
    rotate: async () => ({ registered: true, deviceId: "other-device" }),
  });
  for (const value of ["", "bad", "token with whitespace"])
    f.controller.receive(value);
  await flush();
  assert.equal(f.state.writes.length, 0);
  f.controller.receive(token);
  await flush();
  assert.deepEqual(f.state.saved, []);
  assert.deepEqual(f.state.failures, [true]);
  f.controller.stop();
});
test("iOS refresh accepts only the existing owned APNs enrollment and64hex token", async () => {
  const apple = "com.rocoeats.driver";
  const f = fixture({
    platform: "ios",
    appId: async () => apple,
    lookup: async () => ({ registered: true, platform: "ios", appId: apple }),
  });
  f.controller.receive(token);
  await flush();
  assert.equal(f.state.writes.length, 0);
  f.controller.receive("a".repeat(64));
  await flush();
  assert.deepEqual(f.state.saved, ["a".repeat(64)]);
  f.controller.stop();
});

test("native token errors remain actionable and cannot undo an opt-out", () => {
  const f = fixture();
  f.controller.failed();
  assert.deepEqual(f.state.failures, [true]);
  f.state.optedOut = true;
  f.controller.failed();
  assert.deepEqual(f.state.failures, [true]);
  f.controller.stop();
});
