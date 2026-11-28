import { test } from "node:test";
import assert from "node:assert/strict";
import {
  supportRequest,
  supportRecovery,
} from "../../localeats/src/lib/support-request";

test("support timeout covers stalled session/transport and never retries an uncertain write", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0,
    writes = 0,
    release!: () => void;
  const pending = supportRequest(async (signal) => {
    calls++;
    await new Promise<void>((resolve) => (release = resolve));
    signal.throwIfAborted();
    writes++;
    return "saved";
  });
  await Promise.resolve();
  t.mock.timers.tick(20001);
  await assert.rejects(pending, /timed out/);
  assert.equal(calls, 1);
  release();
  await Promise.resolve();
  assert.equal(
    writes,
    0,
    "Late session completion cannot start a timed-out write",
  );
});
test("support cancellation never starts an already-aborted request or repeats a rejected operation", async () => {
  let calls = 0;
  const c = new AbortController();
  c.abort(new Error("Session closed"));
  await assert.rejects(
    supportRequest(
      async () => {
        calls++;
        return true;
      },
      { signal: c.signal },
    ),
    /Session closed/,
  );
  assert.equal(calls, 0);
  await assert.rejects(
    supportRequest(async () => {
      calls++;
      throw new Error("Connection lost");
    }),
    /Connection lost/,
  );
  assert.equal(calls, 1);
});
test("support recovery preserves unknown attempts outside loaded history and releases only confirmed or rejected writes", () => {
  assert.equal(
    supportRecovery(
      "saved",
      [{ id: "other" }],
      new TypeError("Network failed"),
    ),
    "unconfirmed",
  );
  for (const status of [401, 403, 404, 408, 429, 500])
    assert.equal(supportRecovery("saved", [], { status }), "unconfirmed");
  for (const status of [400, 409])
    assert.equal(supportRecovery("saved", [], { status }), "rejected");
  assert.equal(
    supportRecovery("saved", [{ id: "saved" }], { status: 409 }),
    "confirmed",
  );
});
