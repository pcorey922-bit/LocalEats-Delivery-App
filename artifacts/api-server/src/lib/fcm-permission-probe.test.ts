import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareFcmPermissionProbe } from './fcm-permission-probe';

test('offline FCM permission probe is fixed to the approved project and validation-only', (t) => {
  const outbound = t.mock.method(globalThis, 'fetch', async () => { throw Error('No provider call authorized'); });
  const request = prepareFcmPermissionProbe();
  assert.equal(request.url, 'https://fcm.googleapis.com/v1/projects/rocoeats-3bd55/messages:send');
  assert.equal(request.method, 'POST');
  assert.equal(request.redirect, 'error');
  assert.deepEqual(JSON.parse(request.body), {
    validate_only: true,
    message: { topic: 'rocoeats-staging-permission-probe', data: { rocoeatsProbe: 'permission-validation-only' } },
  });
  assert.equal(outbound.mock.callCount(), 0);
  assert.equal('headers' in request, false, 'No credential or token in prepared request');
});

test('offline probe rejects overrides, remains immutable and cannot become a sending request', () => {
  for (const input of [{validate_only:false},{topic:'other'}, {token:'synthetic_private_device'}, {url:'https://untrusted.invalid'}, null]) {
    assert.throws(() => Reflect.apply(prepareFcmPermissionProbe, undefined, [input]), /Custom FCM validation inputs/);
  }
  const request = prepareFcmPermissionProbe();
  assert.equal(Object.isFrozen(request), true);
  assert.equal(Reflect.set(request, 'body', '{"validate_only":false}'), false);
  assert.equal(JSON.parse(request.body).validate_only, true);
  const parsed = JSON.parse(request.body); parsed.validate_only = false;
  assert.equal(JSON.parse(prepareFcmPermissionProbe().body).validate_only, true);
  assert.equal(Object.hasOwn(JSON.parse(request.body).message, 'token'), false);
  assert.equal(Object.hasOwn(JSON.parse(request.body).message, 'notification'), false);
});
