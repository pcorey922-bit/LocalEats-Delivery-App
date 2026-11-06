import { test } from "node:test";
import assert from "node:assert/strict";
import {
  navigationLinks,
  navigationDestination,
} from "../../localeats/src/lib/navigation";
const address = {
  street1: "123 Main & Oak St",
  street2: "Suite #2",
  city: "Rockwood",
  region: "TN",
  postalCode: "37854",
};
test("map links encode the full destination and driving intent without leaking delivery notes", () => {
  const links = navigationLinks({
    ...address,
    deliveryInstructions: "SECRET ENTRY CODE",
  } as typeof address)!;
  assert.ok(links);
  const google = new URL(links.google);
  assert.equal(google.origin, "https://www.google.com");
  assert.equal(google.searchParams.get("api"), "1");
  assert.equal(google.searchParams.get("travelmode"), "driving");
  assert.equal(google.searchParams.get("dir_action"), "navigate");
  assert.equal(
    google.searchParams.get("destination"),
    "123 Main & Oak St, Suite #2, Rockwood, TN, 37854, USA",
  );
  assert.equal(google.searchParams.has("origin"), false);
  const apple = new URL(links.apple);
  assert.equal(apple.origin, "https://maps.apple.com");
  assert.equal(apple.searchParams.get("daddr"), links.destination);
  assert.equal(apple.searchParams.get("dirflg"), "d");
  assert.equal(JSON.stringify(links).includes("SECRET"), false);
});
test("missing, partial, oversized and control-character destinations fail closed", () => {
  for (const a of [
    {},
    { ...address, street1: "" },
    { ...address, postalCode: null },
    { ...address, city: "Rockwood\u0000" },
    { ...address, street1: "x".repeat(301) },
  ])
    assert.equal(navigationLinks(a), null);
  assert.equal(
    navigationDestination({ ...address, street1: "  123   Main St  " }),
    "123 Main St, Suite #2, Rockwood, TN, 37854, USA",
  );
});
