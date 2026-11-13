import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireLaunchDeliveryArea, requireLaunchPostalCodes, rockwoodPostalAddress } from './delivery-area';
const local = { city: 'Rockwood', region: 'TN', postalCode: '37854' };
test('launch coverage is capped at Rockwood/TN/37854 even if saved pricing contains other ZIPs', () => {
  requireLaunchDeliveryArea(local, { ...local, postalCode: '37854-1234' }, ['37854']);
  requireLaunchDeliveryArea(local, { ...local, city: ' ROCKWOOD ', region: ' Tennessee ' }, ['37854', '37763']);
  for (const patch of [{ postalCode: '37763' }, { city: 'Kingston' }, { city: 'Harriman' }, { region: 'KY' }, { postalCode: '378540' }, { postalCode: '37854<script>' }, { postalCode: '37854-12345' }]) {
    assert.throws(() => requireLaunchDeliveryArea(local, { ...local, ...patch }, ['37854', '37763']), /Rockwood/);
    assert.throws(() => requireLaunchDeliveryArea({ ...local, ...patch }, local, ['37854', '37763']), /Rockwood/);
  }
  assert.equal(rockwoodPostalAddress(null), false);
  assert.equal(rockwoodPostalAddress({}), false);
  assert.throws(() => requireLaunchDeliveryArea(local, local, ['37763']), /service policy/);
});
test('pricing updates cannot widen the service territory, and an empty policy fails closed', () => {
  requireLaunchPostalCodes(['37854']);
  for (const codes of [[], ['37763'], ['37854', '37748']]) assert.throws(() => requireLaunchPostalCodes(codes), /37854 only/);
});
