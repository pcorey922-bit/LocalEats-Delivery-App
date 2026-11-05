import assert from "node:assert/strict";
import { test } from "node:test";
import { openAt } from "./opening-hours";
test("opening hours use Eastern time across DST and midnight", () => {
  const hours = [
    { weekday: 0, openTime: "01:00", closeTime: "03:00", isClosed: false },
  ];
  assert.equal(openAt(hours, new Date("2026-11-01T05:30:00Z")), true);
  assert.equal(openAt(hours, new Date("2026-11-01T06:30:00Z")), true);
  assert.equal(openAt(hours, new Date("2026-11-01T08:00:00Z")), false);
  assert.equal(
    openAt(
      [{ weekday: 4, openTime: "00:00", closeTime: "24:00", isClosed: false }],
      new Date("2026-11-06T04:59:00Z"),
    ),
    true,
  );
});
test("unconfigured or closed days cannot accept orders", () => {
  assert.equal(openAt([], new Date()), false);
  assert.equal(
    openAt(
      [{ weekday: 4, openTime: "00:00", closeTime: "24:00", isClosed: true }],
      new Date("2026-11-05T12:00:00Z"),
    ),
    false,
  );
});
