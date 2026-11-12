import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCustomerCart,
  createCustomerCartRegistry,
  type CartEntry,
} from "../../localeats/src/lib/customer-cart";
const line: CartEntry = {
  menuItemId: "00000000-0000-4000-8000-000000000001",
  restaurantId: "00000000-0000-4000-8000-000000000002",
  restaurantName: "Sample",
  name: "Burger",
  priceCents: 1000,
  quantity: 1,
  specialInstructions: "No onions",
};
function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
}
test("carts remain isolated across account switching and ignore legacy unscoped data", () => {
  const s = storage();
  s.setItem("rocoeats-cart", JSON.stringify([line]));
  const a = createCustomerCart("customer-A", s),
    b = createCustomerCart("customer-B", s),
    guest = createCustomerCart(null, s);
  assert.deepEqual(a.getSnapshot().items, []);
  a.setItems([line]);
  assert.equal(a.getSnapshot().items.length, 1);
  assert.deepEqual(b.getSnapshot().items, []);
  guest.setItems([line]);
  assert.equal(guest.getSnapshot().items.length, 1);
  assert.equal(createCustomerCart(null,s).getSnapshot().items.length,1);
  assert.equal(
    createCustomerCart("customer-A", s).getSnapshot().items[0]
      .specialInstructions,
    "No onions",
  );
  assert.deepEqual(createCustomerCart("customer-B", s).getSnapshot().items, []);
});
test("corrupt saved carts cannot crash rendering or restore invalid checkout quantities", () => {
  for (const raw of [
    "null",
    "{}",
    "invalid",
    JSON.stringify([{ ...line, quantity: Infinity }]),
    JSON.stringify([{ ...line, quantity: 51 }]),
  ]) {
    const s = storage();
    s.setItem("rocoeats-cart:v2:a", raw);
    const c = createCustomerCart("a", s);
    assert.deepEqual(c.getSnapshot().items, []);
    assert.ok(c.getSnapshot().warning);
  }
});
test("quota failures preserve in-memory carts and invalid updates preserve existing items", () => {
  const c = createCustomerCart("a", {
    getItem: () => null,
    setItem: () => {
      throw new Error("Quota exceeded");
    },
  });
  let changes = 0;
  const stop = c.subscribe(() => changes++);
  c.setItems([line]);
  assert.equal(c.getSnapshot().items.length, 1);
  assert.match(c.getSnapshot().warning, /could not be saved/);
  c.setItems([{ ...line, quantity: 51 }]);
  assert.equal(c.getSnapshot().items[0].quantity, 1);
  assert.match(c.getSnapshot().warning, /limit/);
  assert.equal(changes, 2);
  stop();
  c.setItems([]);
  assert.equal(changes, 2);
});
test("storage refresh receives other-tab updates without sharing other account data", () => {
  const s = storage();
  const first = createCustomerCart("a", s),
    otherTab = createCustomerCart("a", s);
  first.setItems([line]);
  otherTab.reload();
  assert.equal(otherTab.getSnapshot().items.length, 1);
  first.setItems([]);
  otherTab.reload();
  assert.deepEqual(otherTab.getSnapshot().items, []);
});

test('same-tab consumers share a live cart and unresolved authentication never reads guest data', () => {
  const s = storage();
  s.setItem('rocoeats-guest-cart:v1', JSON.stringify([line]));
  const carts = createCustomerCartRegistry(s);
  const menu = carts.get('a'), checkout = carts.get('a');
  assert.equal(menu, checkout);
  menu.setItems([line]);
  checkout.setItems(items => items.map(item => ({ ...item, quantity: item.quantity + 1 })));
  assert.equal(menu.getSnapshot().items[0].quantity, 2);
  const unresolved = carts.get(undefined);
  assert.deepEqual(unresolved.getSnapshot().items, []);
  unresolved.setItems([line]);
  assert.equal(carts.get(null).getSnapshot().items[0].quantity, 1);
  assert.deepEqual(carts.get('b').getSnapshot().items, []);
});

test('canonical hydration combines identical selections but retains distinct preparation and modifier choices', () => {
  const s = storage();
  s.setItem('rocoeats-cart:v2:a', JSON.stringify([
    { ...line, modifiers: {}, specialInstructions: ' No onions ' },
    { ...line, modifiers: { optional: [] } },
    { ...line, specialInstructions: 'Extra onions' },
    { ...line, modifiers: { sauce: ['hot'] } },
  ]));
  const cart = createCustomerCart('a', s);
  assert.equal(cart.getSnapshot().items.length, 3);
  assert.equal(cart.getSnapshot().items[0].quantity, 2);
  assert.match(cart.getSnapshot().warning, /combined/);
  for (let i = 0; i < 3; i++) cart.reload();
  assert.equal(cart.getSnapshot().items[0].quantity, 2);
  assert.equal(cart.getSnapshot().items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0), 4000);
});

test('resume retains unsaved session edits and updates from another tab precede a new addition', () => {
  let raw: string | null = null, fail = false;
  const s = { getItem: () => raw, setItem: (_key: string, value: string) => { if (fail) throw Error('quota'); raw = value; } };
  const carts = createCustomerCartRegistry(s), first = carts.get('a');
  first.setItems([line]);
  fail = true;
  first.setItems(items => items.map(item => ({ ...item, quantity: 2 })));
  carts.reload();
  assert.equal(first.getSnapshot().items[0].quantity, 2);
  assert.match(first.getSnapshot().warning, /could not be saved/);
  fail = false;
  raw = JSON.stringify([{ ...line, quantity: 3 }]);
  first.setItems(items => items.map(item => ({ ...item, quantity: item.quantity + 1 })));
  assert.equal(first.getSnapshot().items[0].quantity, 4);
});
