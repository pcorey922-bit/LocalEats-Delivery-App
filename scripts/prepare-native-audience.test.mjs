import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeAudienceEnvironment, driverNativeManifests } from './prepare-native-audience.mjs';
import { readFile } from 'node:fs/promises';
test('customer identity remains stable and dedicated driver installs without sharing callback or app storage identity', () => {
  const customer = nativeAudienceEnvironment(), driver = nativeAudienceEnvironment('driver');
  assert.deepEqual(customer, { ROCOEATS_NATIVE_APP_ID: 'com.rocoeats.app', ROCOEATS_NATIVE_APP_NAME: 'RoCoEats', ROCOEATS_NATIVE_SCHEME: 'rocoeats', ROCOEATS_NATIVE_INFO_PLIST: 'App/Info.plist' });
  assert.deepEqual(driver, { ROCOEATS_NATIVE_APP_ID: 'com.rocoeats.driver', ROCOEATS_NATIVE_APP_NAME: 'RoCoEats Driver', ROCOEATS_NATIVE_SCHEME: 'rocoeats-driver', ROCOEATS_NATIVE_INFO_PLIST: 'App/Driver-Info.plist' });
  for (const key of Object.keys(customer)) assert.notEqual(driver[key], customer[key]);
  for (const unsafe of ['', 'admin', '../driver', 'driver\nSECRET=1', 'https://untrusted.example']) assert.throws(() => nativeAudienceEnvironment(unsafe));
});
test('driver-only permissions preserve the customer manifests and make the upstream service private', async () => {
  const android = await readFile(new URL('../artifacts/localeats/android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  const ios = await readFile(new URL('../artifacts/localeats/ios/App/App/Info.plist', import.meta.url), 'utf8');
  const driver = driverNativeManifests(android, ios);
  assert.ok(driver.android.includes('android:exported="false" tools:replace="android:exported"'));
  assert.ok(driver.ios.includes('<string>location</string>') && driver.ios.includes('NSLocationAlwaysAndWhenInUseUsageDescription'));
  assert.ok(!android.includes('BackgroundGeolocationService') && !ios.includes('NSLocationAlwaysAndWhenInUseUsageDescription'));
  assert.equal((driver.ios.match(/<key>UIBackgroundModes<\/key>/g) || []).length, 1);
  assert.throws(() => driverNativeManifests(android, driver.ios), /Review existing/);
});
