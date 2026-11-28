import assert from "node:assert/strict";
import { test } from "node:test";
import { openAt, orderingAvailabilityIssue } from "./opening-hours";
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
test('09:00–23:00 Eastern rejects the reported 05:43 visit and honors acceptance and exact boundaries', () => {
  const hours = [{ weekday: 4, openTime: '09:00', closeTime: '23:00', isClosed: false }];
  assert.match(orderingAvailabilityIssue(true, hours, new Date('2026-11-12T10:43:00Z'))!, /closed.*Eastern/);
  assert.match(orderingAvailabilityIssue(false, hours, new Date('2026-11-12T15:00:00Z'))!, /paused order acceptance/);
  assert.match(orderingAvailabilityIssue(true, [])!, /not configured/);
  assert.equal(openAt(hours, new Date('2026-11-12T13:59:00Z')), false);
  assert.equal(openAt(hours, new Date('2026-11-12T14:00:00Z')), true);
  assert.equal(openAt(hours, new Date('2026-11-13T03:59:00Z')), true);
  assert.equal(openAt(hours, new Date('2026-11-13T04:00:00Z')), false);
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
