import { test } from "node:test";
import assert from "node:assert/strict";
import { createDutyIntentStore } from "../../localeats/src/lib/duty-intent";
test("GPS requires explicit intent on each device process and remains isolated by account", () => {
  const s = createDutyIntentStore();
  assert.equal(s.get(null), false);
  assert.equal(s.get("owner"), false);
  s.set("owner", true);
  assert.equal(s.get("owner"), true);
  assert.equal(s.get("other"), false);
  assert.equal(createDutyIntentStore().get("owner"), false);
  s.set("owner", false);
  assert.equal(s.get("owner"), false);
  s.set("owner", true);
  s.set("other", true);
  s.clear();
  assert.equal(s.get("owner"), false);
  assert.equal(s.get("other"), false);
});
test("offline intent updates subscribers synchronously before network persistence", () => {
  const s = createDutyIntentStore();
  s.set("driver", true);
  let observed = true;
  const unsubscribe = s.subscribe(() => {
    observed = s.get("driver");
  });
  s.set("driver", false);
  assert.equal(observed, false);
  unsubscribe();
  s.set("driver", true);
  assert.equal(observed, false);
});
