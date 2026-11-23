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

test('real native configuration protects iOS safe areas without changing audience isolation', async () => {
  const { createRequire } = await import('node:module');
  const { fileURLToPath } = await import('node:url');
  const { spawnSync } = await import('node:child_process');
  const require = createRequire(new URL('../artifacts/api-server/package.json', import.meta.url));
  const { build } = require('esbuild');
  const result = await build({entryPoints:[fileURLToPath(new URL('../artifacts/localeats/capacitor.config.ts',import.meta.url))],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
  const moduleUrl = 'data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64');
  for (const audience of ['customer','driver']) {
    const child = spawnSync(process.execPath,['--input-type=module','-e',`const {default:config}=await import(${JSON.stringify(moduleUrl)});console.log(JSON.stringify(config));`],{encoding:'utf8',timeout:10000,env:{ROCOEATS_NATIVE_AUDIENCE:audience}});
    assert.ifError(child.error);
    assert.equal(child.status,0,child.stderr);
    const config = JSON.parse(child.stdout);
    assert.equal(config.ios?.contentInset,'automatic','Native content must avoid the iOS status bar and home indicator');
    assert.equal(config.appId,nativeAudienceEnvironment(audience).ROCOEATS_NATIVE_APP_ID);
    assert.equal(config.android.webContentsDebuggingEnabled,false);
    assert.equal(config.plugins.CapacitorHttp.enabled,audience==='driver');
    assert.equal(config.includePlugins.includes('@capacitor-community/background-geolocation'),audience==='driver');
  }
});

test('native Driver SDK retains existing ticket callback and removes unused credential-sharing/OAuth/biometric entrypoints',async()=>{
 const android=await readFile(new URL('../artifacts/localeats/android/app/src/main/AndroidManifest.xml',import.meta.url),'utf8');
 const ios=await readFile(new URL('../artifacts/localeats/ios/App/App/Info.plist',import.meta.url),'utf8');
 const driver=driverNativeManifests(android,ios).android;
 assert.match(driver,/USE_BIOMETRIC" tools:node="remove"/);
 assert.match(driver,/SharedSessionSyncProvider[^>]+android:exported="false"[^>]+android:enabled="false"/);
 assert.match(driver,/SSOReceiverActivity" tools:node="remove"/);
 assert.match(driver,/SSOManagerActivity" tools:node="remove"/);
 assert.ok(!android.includes('com.clerk.api'));
 const gradle=await readFile(new URL('../artifacts/localeats/android/app/build.gradle',import.meta.url),'utf8');
 assert.match(gradle,/if \(audience == 'driver'\) \{\s*implementation 'com.clerk:clerk-android-api:1\.5\.0'/);
 assert.match(gradle,/buildConfigField "String", "ROCOEATS_CLERK_KEY"/);
});
