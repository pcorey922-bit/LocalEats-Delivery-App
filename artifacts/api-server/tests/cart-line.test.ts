import { test } from "node:test";
import assert from "node:assert/strict";
import { cartLineKey } from "../../localeats/src/lib/cart-line";
test("cart identity preserves preparation requests and canonicalizes modifier order without mutation", () => {
  const selected = { extras: ["bacon", "cheese"], side: ["fries"] };
  assert.equal(
    cartLineKey("burger", selected, " no onions "),
    cartLineKey(
      "burger",
      { side: ["fries"], extras: ["cheese", "bacon"] },
      "no onions",
    ),
  );
  assert.notEqual(
    cartLineKey("burger", selected, "no onions"),
    cartLineKey("burger", selected, "extra onions"),
  );
  assert.notEqual(
    cartLineKey("burger", selected),
    cartLineKey("chicken", selected),
  );
  assert.deepEqual(selected.extras, ["bacon", "cheese"]);
  assert.equal(cartLineKey('fries', { extras: [] }), cartLineKey('fries', {}));
});
