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
  '@clerk/react': `export const useAuth=()=>({isLoaded:true,isSignedIn:true,userId:'driver-fixture',getToken:async()=>null});`,
  '@capacitor/core': `export const Capacitor={isNativePlatform:()=>true,getPlatform:()=>'android'};export const registerPlugin=()=>({addWatcher:async(options,callback)=>{window.emitFix=fix=>callback(fix);return 'watch-'+(++window.bgStarts)},removeWatcher:async({id})=>{window.bgRemovals.push(id)}});`,
  '@capacitor/browser': `export const Browser={close:async()=>{},open:async()=>{}};`,
  '@capacitor/app': `export const App={getInfo:async()=>({id:'com.rocoeats.driver.staging'}),addListener:async()=>({remove:async()=>{}})};`,
  '@capacitor/geolocation': `export const Geolocation={watchPosition:async()=> 'foreground-fixture',clearWatch:async()=>{}};`,
  '@capacitor/push-notifications': `const listeners={};export const PushNotifications={checkPermissions:async()=>({receive:window.bgPermission?'granted':'denied'}),requestPermissions:async()=>({receive:window.bgPermission?'granted':'denied'}),addListener:async(name,callback)=>{listeners[name]=callback;return{remove:async()=>{delete listeners[name]}}},register:async()=>listeners.registration({value:'mock_push_token_not_real_123456'}),unregister:async()=>{window.pushUnregisterCalls=(window.pushUnregisterCalls||0)+1}};`,
};
await build({ entryPoints: [path.join(root, 'artifacts/localeats/tests/background-browser.tsx')], outfile: path.join(target, 'app.js'), bundle: true, format: 'esm', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env.VITE_APP_AUDIENCE': '"driver"', 'import.meta.env.VITE_API_ORIGIN': 'undefined' }, plugins: [{ name: 'native-fixture', setup(b) { b.onResolve({ filter: /^(@capacitor\/(core|app|browser|geolocation|push-notifications)|@clerk\/react)$/ }, args => ({ path: args.path, namespace: 'qa-native' })); b.onLoad({ filter: /.*/, namespace: 'qa-native' }, args => ({ contents: modules[args.path], loader: 'js' })); } }] });
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
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(target, 'background-consent.png'), fullPage: true });
  console.log('PASS: driver background consent defaults OFF, orphan watcher cleanup, upload, explicit stop/reset, no late upload and revoked-access shutdown. Simulated native bridge/API only; no real GPS, permission or provider operation.');
  await page.goto(`http://127.0.0.1:${server.address().port}/?push=true`);
  await page.getByRole('button', { name: 'Enable mobile push notifications', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'This device is registered to your current account' }).waitFor();
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
  assert.deepEqual(errors, []);
  console.log('PASS: native push permission/configuration/current-account registration are distinguished; server-confirmed enrollment survives reload, failed removal stays retryable with native opt-out attempted, provider-unconfigured state is clear. All push/native APIs simulated; no vendor request.');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
