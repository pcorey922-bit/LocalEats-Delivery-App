import assert from "node:assert/strict";
import test from "node:test";
import { presenceFreshMs, presenceIsFresh } from "./driver-presence";

test("driver freshness rejects future/corrupt heartbeats and closes exactly at the freshness limit", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  for (const age of [0, 1, presenceFreshMs - 1])
    assert.equal(
      presenceIsFresh(
        { available: true, heartbeatAt: new Date(now.getTime() - age) },
        now,
      ),
      true,
    );
  for (const age of [
    -1,
    -3600000,
    presenceFreshMs,
    presenceFreshMs + 1,
    3600000,
  ])
    assert.equal(
      presenceIsFresh(
        { available: true, heartbeatAt: new Date(now.getTime() - age) },
        now,
      ),
      false,
    );
  assert.equal(presenceIsFresh(null, now), false);
  assert.equal(
    presenceIsFresh({ available: false, heartbeatAt: now }, now),
    false,
  );
  assert.equal(
    presenceIsFresh({ available: true, heartbeatAt: null }, now),
    false,
  );
  assert.equal(
    presenceIsFresh({ available: true, heartbeatAt: new Date(NaN) }, now),
    false,
  );
  assert.equal(
    presenceIsFresh({ available: true, heartbeatAt: now }, new Date(NaN)),
    false,
  );
});
