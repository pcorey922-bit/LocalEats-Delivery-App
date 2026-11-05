import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canTransitionOrderStatus, orderStatuses } from './order-lifecycle';
test('fulfillment requires pickup before delivery', () => {
  assert.equal(canTransitionOrderStatus('ready_for_pickup', 'delivered'), false);
  assert.equal(canTransitionOrderStatus('ready_for_pickup', 'out_for_delivery'), true);
  assert.equal(canTransitionOrderStatus('out_for_delivery', 'delivered'), true);
});
test('terminal orders cannot be reopened', () => {
  for (const next of orderStatuses) {
    assert.equal(canTransitionOrderStatus('cancelled', next), false);
    assert.equal(canTransitionOrderStatus('delivered', next), false);
  }
});
test('orders cannot skip preparation or move backwards', () => {
  assert.equal(canTransitionOrderStatus('placed', 'ready_for_pickup'), false);
  assert.equal(canTransitionOrderStatus('preparing', 'accepted'), false);
  assert.equal(canTransitionOrderStatus('placed', 'cancelled'), true);
});
