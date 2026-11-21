// Real consent/controller components; native bridge/auth/API explicitly mocked.
import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url)), require = createRequire(path.join(root, 'artifacts/api-server/package.json'));
const { build } = require('esbuild'), { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const target = await mkdtemp(path.join(tmpdir(), 'rocoeats-background-ui-'));
const modules = {
  '@clerk/react': `import {useSyncExternalStore} from 'react';const subscribe=cb=>{window.addEventListener('qa-push-account',cb);return()=>window.removeEventListener('qa-push-account',cb)};export const useAuth=()=>{const userId=useSyncExternalStore(subscribe,()=>window.pushUserId||'driver-fixture');return{isLoaded:true,isSignedIn:true,userId,getToken:async()=>null}};`,
  '@capacitor/core': `export const Capacitor={isNativePlatform:()=>true,getPlatform:()=>location.search.includes('ios=true')?'ios':'android'};export const registerPlugin=()=>({addWatcher:async(options,callback)=>{window.emitFix=fix=>callback(fix);return 'watch-'+(++window.bgStarts)},removeWatcher:async({id})=>{window.bgRemovals.push(id)}});`,
  '@capacitor/browser': `export const Browser={close:async()=>{},open:async()=>{}};`,
  '@capacitor/app': `export const App={getInfo:async()=>{if(window.pushInfoDelay)await new Promise(resolve=>{window.finishPushInfo=resolve});return{id:location.search.includes('ios=true')?'com.rocoeats.driver':'com.rocoeats.driver.staging'}},addListener:async()=>({remove:async()=>{}})};`,
  '@capacitor/geolocation': `export const Geolocation={watchPosition:async()=> 'foreground-fixture',clearWatch:async()=>{}};`,
  '@capacitor/push-notifications': `const listeners={};export const PushNotifications={createChannel:async channel=>{if(window.pushChannelDelay)await new Promise(resolve=>{window.finishPushChannel=resolve});if(!window.bgPermission)throw Error('Channel before consent');window.pushChannel=channel;},checkPermissions:async()=>{if(window.pushPermissionReadDelay)await new Promise(resolve=>{window.finishPushPermissionRead=resolve});return{receive:window.bgPermission?'granted':'denied'}},requestPermissions:async()=>{window.pushPermissionRequests=(window.pushPermissionRequests||0)+1;if(window.pushPermissionDelay)await new Promise(resolve=>{window.finishPushPermission=resolve});return{receive:window.bgPermission?'granted':'denied'}},addListener:async(name,callback)=>{if(name==='registration'&&window.pushListenerDelay)await new Promise(resolve=>{window.finishPushListener=resolve});listeners[name]=callback;window.pushListenersFinished=(window.pushListenersFinished||0)+1;return{remove:async()=>{if(listeners[name]===callback)delete listeners[name]}}},register:async()=>{window.pushRegisterCalls=(window.pushRegisterCalls||0)+1;listeners.registration({value:location.search.includes('ios=true')?'a'.repeat(64):'mock_push_token_not_real_123456'})},unregister:async()=>{window.pushUnregisterCalls=(window.pushUnregisterCalls||0)+1;if(window.pushNativeRemoveDelay)await new Promise(resolve=>{window.finishPushNativeRemove=resolve})}};`,
};
await build({ entryPoints: [path.join(root, 'artifacts/localeats/tests/background-browser.tsx')], outfile: path.join(target, 'app.js'), bundle: true, format: 'esm', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env.VITE_APP_AUDIENCE': '"driver"', 'import.meta.env.VITE_API_ORIGIN': 'undefined' }, plugins: [{ name: 'native-fixture', setup(b) { b.onResolve({ filter: /^(@capacitor\/(core|app|browser|geolocation|push-notifications)|@clerk\/react)$/ }, args => ({ path: args.path, namespace: 'qa-native' })); b.onLoad({ filter: /.*/, namespace: 'qa-native' }, args => ({ contents: modules[args.path], loader: 'js', resolveDir: path.join(root,'artifacts/localeats') })); } }] });
const assets = path.join(root, 'artifacts/localeats/dist/public/assets');
await writeFile(path.join(target, 'app.css'), await readFile(path.join(assets, (await readdir(assets)).find(f => f.endsWith('.css')))));
const server = http.createServer(async (req, res) => { res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : req.url === '/app.css' ? 'text/css' : 'text/html'); res.end(req.url === '/app.js' || req.url === '/app.css' ? await readFile(path.join(target, req.url.slice(1))) : '<html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div class="roco-page"><div id="root" class="roco-main"></div></div><script type="module" src="/app.js"></script></html>'); });
let browser;
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('rocoeats-background-watch:v1', 'orphaned-prior-watch'));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const enable = page.getByRole('button', { name: 'Enable background location for this session', exact: true });
  await enable.waitFor();
  assert.equal(await enable.isDisabled(), true);
  await page.waitForFunction(() => window.bgRemovals.includes('orphaned-prior-watch'));
  assert.equal(await page.evaluate(() => window.bgStarts), 0);
  await page.getByRole('checkbox').check(); await enable.click();
  await page.waitForFunction(() => window.bgStarts === 1);
  await page.evaluate(() => window.emitFix({ latitude: 35.8, longitude: -84.7, accuracy: 5, time: Date.now(), simulated: false }));
  await page.getByRole('status').filter({ hasText: 'Background location uploaded' }).waitFor();
  await page.getByRole('button', { name: 'Stop background sharing; use foreground only', exact: true }).click();
  await page.waitForFunction(() => window.bgRemovals.includes('watch-1'));
  assert.equal(await enable.isDisabled(), true);
  const uploads = await page.evaluate(() => window.bgUploads);
  await page.evaluate(() => window.emitFix({ latitude: 35.8, longitude: -84.7, accuracy: 5, time: Date.now() + 30000 }));
  assert.equal(await page.evaluate(() => window.bgUploads), uploads);
  await page.getByRole('checkbox').check(); await enable.click();
  await page.waitForFunction(() => window.bgStarts === 2);
  await page.evaluate(() => { window.bgDenied = true; window.emitFix({ latitude: 35.8, longitude: -84.7, accuracy: 5, time: Date.now(), simulated: false }); });
  await page.getByRole('alert').filter({ hasText: 'Background sharing stopped.' }).waitFor();
  await page.waitForFunction(() => window.bgRemovals.includes('watch-2'));
  assert.equal(await page.getByRole('complementary', { name: 'On-duty location status', exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  for(const [flag,finish,message] of [
   ['pushConfigDelay','finishPushConfig','Push configuration could not be checked'],
   ['pushPermissionReadDelay','finishPushPermissionRead','Device notification permission could not be checked.'],
   ['pushInfoDelay','finishPushInfo','App identity could not be checked.'],
   ['pushStatusDelay','finishPushStatus','Device registration could not be checked.'],
  ]) {
   const read=await browser.newPage();
   await read.addInitScript(flag=>{window[flag]=true;localStorage.setItem('rocoeats-push-device-id','11111111-1111-4111-8111-111111111119');localStorage.setItem('qa-server-push','true');},flag);
   await read.clock.install();await read.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
   await read.waitForFunction(finish=>typeof window[finish]==='function',finish);
   await read.clock.fastForward(16000);await read.getByText(message,{exact:false}).first().waitFor({timeout:3000});
   assert.equal(await read.getByRole('button',{name:'Refresh notification status',exact:true}).isEnabled(),true);
   if(flag==='pushConfigDelay')assert.equal(await read.evaluate(()=>window.pushConfigReadAborted),true);
   await read.evaluate(([flag,finish])=>{window[flag]=false;window[finish]();},[flag,finish]);await read.waitForTimeout(30);
   await read.getByRole('button',{name:'Refresh notification status',exact:true}).click();
   await read.getByRole('status').filter({hasText:'This device is registered to your current account'}).waitFor();
   assert.equal(await read.evaluate(()=>window.pushRegisterCalls||0),0);await read.close();
  }
  console.log('PASS: hung push configuration/permission/app identity/device reads become actionable and refresh recovers without enrollment. Native/API simulated.');
  for(const [flag,finish] of [['pushDeleteDelay','finishPushDelete'],['pushNativeRemoveDelay','finishPushNativeRemove']]) {
   const revoke=await browser.newPage();
   await revoke.addInitScript(()=>{localStorage.setItem('rocoeats-push-device-id','11111111-1111-4111-8111-111111111119');localStorage.setItem('qa-server-push','true');});
   await revoke.clock.install();await revoke.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
   await revoke.getByRole('status').filter({hasText:'This device is registered to your current account'}).waitFor();
   await revoke.evaluate(flag=>{window[flag]=true;},flag);
   await revoke.getByRole('button',{name:'Disable push for this device',exact:true}).click();
   await revoke.waitForFunction(finish=>typeof window[finish]==='function',finish);
   await revoke.clock.fastForward(16000);await revoke.getByRole('alert').filter({hasText:'Could not confirm push removal'}).waitFor({timeout:3000});
   assert.equal(await revoke.evaluate(()=>window.pushUnregisterCalls),1,'Native opt-out is attempted despite a hung server');
   if(flag==='pushDeleteDelay')assert.equal(await revoke.evaluate(()=>window.pushDeleteAborted),true);
   assert.ok(await revoke.evaluate(()=>localStorage.getItem('rocoeats-push-device-id')));
   await revoke.evaluate(([flag,finish])=>{window[flag]=false;window[finish]();},[flag,finish]);await revoke.waitForTimeout(30);
   assert.ok(await revoke.evaluate(()=>localStorage.getItem('rocoeats-push-device-id')),'Late removal cannot fabricate confirmed opt-out');
   await revoke.getByRole('button',{name:'Disable push for this device',exact:true}).click();
   await revoke.getByRole('status').filter({hasText:'Push registration removed'}).waitFor();await revoke.close();
  }
  const changed=await browser.newPage();
  await changed.addInitScript(()=>{localStorage.setItem('rocoeats-push-token','mock_push_token_not_real_123456');localStorage.setItem('rocoeats-push-device-id','11111111-1111-4111-8111-111111111119');localStorage.setItem('qa-server-push','true');});
  await changed.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
  await changed.getByRole('status').filter({hasText:'This device is registered to your current account'}).waitFor();
  await changed.evaluate(()=>{window.pushNativeRemoveDelay=true;});await changed.getByRole('button',{name:'Disable push for this device',exact:true}).click();
  await changed.waitForFunction(()=>typeof window.finishPushNativeRemove==='function');
  await changed.evaluate(()=>window.directRegisterPush());
  await changed.evaluate(()=>window.finishPushNativeRemove());
  await changed.getByRole('alert').filter({hasText:'Could not confirm push removal'}).waitFor();
  assert.equal(await changed.evaluate(()=>localStorage.getItem('rocoeats-push-token')),'mock_push_token_not_real_123456');
  assert.ok(await changed.evaluate(()=>localStorage.getItem('rocoeats-push-device-id')));await changed.close();
  console.log('PASS: hung server/native opt-out is bounded and retryable; native opt-out attempted, revocation handles retained, late old cleanup cannot erase a newer registration. All simulated.');
  const ios=await browser.newPage();
  await ios.goto(`http://127.0.0.1:${server.address().port}/?push=true&ios=true`);
  await ios.getByRole('button',{name:'Enable mobile push notifications',exact:true}).click();
  await ios.getByRole('status').filter({hasText:'This device is registered to your current account'}).waitFor();
  assert.deepEqual(await ios.evaluate(()=>({platform:window.pushRegistration.platform,appId:window.pushRegistration.appId,channel:!!window.pushChannel})),{platform:'ios',appId:'com.rocoeats.driver',channel:false});
  await ios.reload();await ios.getByRole('status').filter({hasText:'This device is registered to your current account'}).waitFor();
  await ios.getByRole('button',{name:'Disable push for this device',exact:true}).click();
  await ios.getByRole('status').filter({hasText:'Push registration removed'}).waitFor();
  await ios.clock.install();await ios.evaluate(()=>{window.pushInfoDelay=true;});
  await ios.getByRole('button',{name:'Enable mobile push notifications',exact:true}).click();
  await ios.waitForFunction(()=>typeof window.finishPushInfo==='function');await ios.clock.fastForward(16000);
  await ios.getByRole('alert').filter({hasText:'registration timed out'}).waitFor();
  const iosRegistrations=await ios.evaluate(()=>window.pushRegisterCalls);await ios.evaluate(()=>window.finishPushInfo());await ios.waitForTimeout(30);
  assert.equal(await ios.evaluate(()=>window.pushRegisterCalls),iosRegistrations);await ios.close();
  console.log('PASS: simulated iOS enrollment uses its owned APNs topic with no Android channel, restores server-confirmed status, opts out, and fences late setup after timeout. No real APNs/device evidence.');
  // Every pre-token phase is bounded; a late result must not enroll a device.
  for(const [flag,finish] of [['pushConfigDelay','finishPushConfig'],['pushPermissionDelay','finishPushPermission'],['pushChannelDelay','finishPushChannel'],['pushInfoDelay','finishPushInfo']]) {
   await page.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
   await page.clock.install();
   await page.getByRole('button',{name:'Enable mobile push notifications',exact:true}).waitFor();
   await page.evaluate(flag=>{window[flag]=true;},flag);
   await page.getByRole('button',{name:'Enable mobile push notifications',exact:true}).click();
   await page.waitForFunction(finish=>typeof window[finish]==='function',finish);
   await page.clock.fastForward(16000);
   await page.getByRole('alert').filter({hasText:'registration timed out'}).waitFor({timeout:3000});
   await page.evaluate(finish=>window[finish](),finish);await page.waitForTimeout(30);
   assert.equal(await page.evaluate(()=>window.pushRegisterCalls||0),0);
   assert.equal(await page.evaluate(()=>window.pushPosts||0),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('rocoeats-push-device-id')),null);
  }
  console.log('PASS: stalled push configuration, permission, channel and app identity time out before enrollment; late native/API results cannot register or save a device. All simulated.');
  // A timed-out enrollment must never save a late success in this/new session.
  await page.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
  await page.clock.install();
  await page.evaluate(()=>{window.pushPostDelay=true;});
  await page.getByRole('button',{name:'Enable mobile push notifications',exact:true}).click();
  await page.waitForFunction(()=>typeof window.finishPushEnrollment==='function');
  await page.clock.fastForward(16000);
  await page.getByRole('alert').filter({hasText:'registration timed out'}).waitFor();
  await page.evaluate(()=>window.finishPushEnrollment());
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>localStorage.getItem('rocoeats-push-device-id')),null,'A late registration acknowledgement cannot overwrite timeout/account state');
  assert.equal(await page.evaluate(()=>window.pushPostAborted),true,'Deadline cancels the authenticated enrollment request');
  await page.getByRole('button',{name:'Disable push for this device',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Push registration removed'}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('rocoeats-push-pending-token')),null);
  // A late native listener must be removed instead of registering after timeout.
  await page.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
  await page.evaluate(()=>{window.pushListenerDelay=true;});
  await page.getByRole('button',{name:'Enable mobile push notifications',exact:true}).click();
  await page.waitForFunction(()=>typeof window.finishPushListener==='function');
  await page.clock.fastForward(16000);
  await page.getByRole('alert').filter({hasText:'registration timed out'}).waitFor();
  await page.evaluate(()=>window.finishPushListener());
  await page.waitForFunction(()=>window.pushListenersFinished===1);
  assert.equal(await page.evaluate(()=>window.pushRegisterCalls||0),0,'Expired listeners cannot start native registration');
  // Changing the active account cancels old enrollment before it can save state.
  await page.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
  await page.evaluate(()=>{window.pushPostDelay=true;});
  await page.getByRole('button',{name:'Enable mobile push notifications',exact:true}).click();
  await page.waitForFunction(()=>typeof window.finishPushEnrollment==='function');
  await page.evaluate(()=>{window.pushUserId='other-account-fixture';window.dispatchEvent(new Event('qa-push-account'));});
  await page.waitForFunction(()=>window.pushPostAborted===true);
  await page.evaluate(()=>window.finishPushEnrollment());
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(()=>localStorage.getItem('rocoeats-push-device-id')),null,'Old-account acknowledgement cannot attach to a new session');
  console.log('PASS: enrollment deadlines and account changes abort pending requests, fence late responses/listeners, retain explicit unconfirmed opt-out and never fabricate registration success. Native/provider APIs mocked.');
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(target, 'background-consent.png'), fullPage: true });
  console.log('PASS: driver background consent defaults OFF, orphan watcher cleanup, upload, explicit stop/reset, no late upload and revoked-access shutdown. Simulated native bridge/API only; no real GPS, permission or provider operation.');
  await page.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
  await page.getByRole('button', { name: 'Enable mobile push notifications', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'This device is registered to your current account' }).waitFor();
  assert.deepEqual(await page.evaluate(()=>({id:window.pushChannel.id,importance:window.pushChannel.importance,visibility:window.pushChannel.visibility})),{id:'rocoeats-delivery-updates',importance:4,visibility:0});
  await page.reload();
  await page.getByRole('status').filter({ hasText: 'This device is registered to your current account' }).waitFor();
  await page.evaluate(() => { window.pushDeleteFails = true; });
  await page.getByRole('button', { name: 'Disable push for this device', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Could not confirm push removal' }).waitFor();
  assert.ok(await page.evaluate(() => localStorage.getItem('rocoeats-push-device-id')));
  assert.equal(await page.evaluate(() => window.pushUnregisterCalls), 1, 'Native opt-out is still attempted during a server outage');
  await page.evaluate(() => { window.pushDeleteFails = false; });
  await page.getByRole('button', { name: 'Disable push for this device', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Push registration removed' }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('rocoeats-push-device-id')), null);
  await page.evaluate(() => { window.pushConfigured = false; });
  await page.getByRole('button', { name: 'Refresh notification status', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Push delivery is not configured' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Enable mobile push notifications', exact: true }).count(), 0);
  // Upgraded installations can revoke legacy token-only enrollment without
  // granting permission again or first registering with the new status API.
  await page.evaluate(() => {
    localStorage.setItem('rocoeats-push-token', 'legacy_fixture_token_not_real');
    localStorage.setItem('qa-server-push', 'true');
  });
  await page.reload();
  await page.evaluate(() => { window.bgPermission = false; });
  await page.getByRole('button', { name: 'Refresh notification status', exact: true }).click();
  await page.getByText('Notifications are blocked in device settings.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Disable push for this device', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Push registration removed' }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.pushRevocation), { token: 'legacy_fixture_token_not_real' });
  assert.equal(await page.evaluate(() => localStorage.getItem('rocoeats-push-token')), null);
  assert.equal(await page.getByRole('button', { name: 'Disable push for this device', exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: native push permission/configuration/current-account registration are distinguished; server-confirmed enrollment survives reload, failed removal stays retryable with native opt-out attempted, provider-unconfigured state is clear; legacy token-only devices can opt out with permission denied. All push/native APIs simulated; no vendor request.');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
