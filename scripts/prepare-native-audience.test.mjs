import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeAudienceEnvironment } from './prepare-native-audience.mjs';
test('customer identity remains stable and dedicated driver installs without sharing callback or app storage identity', () => {
  const customer = nativeAudienceEnvironment(), driver = nativeAudienceEnvironment('driver');
  assert.deepEqual(customer, { ROCOEATS_NATIVE_APP_ID: 'com.rocoeats.app', ROCOEATS_NATIVE_APP_NAME: 'RoCoEats', ROCOEATS_NATIVE_SCHEME: 'rocoeats' });
  assert.deepEqual(driver, { ROCOEATS_NATIVE_APP_ID: 'com.rocoeats.driver', ROCOEATS_NATIVE_APP_NAME: 'RoCoEats Driver', ROCOEATS_NATIVE_SCHEME: 'rocoeats-driver' });
  for (const key of Object.keys(customer)) assert.notEqual(driver[key], customer[key]);
  for (const unsafe of ['', 'admin', '../driver', 'driver\nSECRET=1', 'https://untrusted.example']) assert.throws(() => nativeAudienceEnvironment(unsafe));
});
