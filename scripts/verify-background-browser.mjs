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
  '@clerk/react': `import {useSyncExternalStore} from 'react';const subscribe=cb=>{window.addEventListener('qa-push-account',cb);return()=>window.removeEventListener('qa-push-account',cb)};export const useAuth=()=>{const userId=useSyncExternalStore(subscribe,()=>window.pushUserId||'driver-fixture');return{isLoaded:true,isSignedIn:true,userId,getToken:async()=>"simulated-fixture-token"}};`,
  '@capacitor/core': `export const Capacitor={isNativePlatform:()=>true,getPlatform:()=>location.search.includes('ios=true')?'ios':'android'};export const registerPlugin=()=>({addWatcher:async(options,callback)=>{window.emitFix=fix=>callback(fix);window.emitDutyPulse=sequence=>callback({dutyPulse:true,sequence});window.emitDutyError=code=>callback(undefined,{code});const id='watch-'+(++window.bgStarts);if(window.bgStartDelay)await new Promise(resolve=>{window.finishBgStart=resolve});return id},acknowledgeDuty:async({id,sequence})=>{window.nativeDutyAcks??=[];window.nativeDutyAcks.push({id,sequence});},requestDuty:async request=>{window.dutyNativeRequests=(window.dutyNativeRequests||0)+1;const controller=new AbortController();window.dutyControllers??=new Map();window.dutyControllers.set(request.requestId,controller);try{const r=await window.fetch(new URL(request.url).pathname,{method:request.method,headers:request.headers,body:request.data===undefined?undefined:JSON.stringify(request.data),signal:controller.signal});const data=r.nativeFixtureData;let acknowledged=false;if(request.sequence&&r.status===200&&data?.online===true){window.nativeDutyAcks??=[];window.nativeDutyAcks.push({id:request.id,sequence:request.sequence});acknowledged=true;}return{status:r.status,data,nativeAcknowledged:acknowledged};}finally{window.dutyControllers.delete(request.requestId)}},cancelDutyRequest:async({requestId})=>{window.dutyControllers?.get(requestId)?.abort();},getDutyDiagnostics:async()=>{window.traceReads=(window.traceReads||0)+1;if(window.traceDelay)await new Promise(resolve=>{window.finishTraceRead=resolve});return {schema:1,state:'EXPIRED',active:false,elapsedMs:180000,nativeFixAgeMs:0,token:'DO_NOT_LEAK',events:[{ms:1000,stage:'NATIVE_HTTP_RESULT',kind:'HEARTBEAT',status:200,body:'DO_NOT_LEAK'}],counters:{'NATIVE_HTTP_RESULT.HEARTBEAT':{count:1,lastMs:1000,status:200}},power:{transport:'WIFI',deviceIdle:true,wakeHeld:false,ssid:'DO_NOT_LEAK'}}},recordDutyStage:async event=>{window.traceStages??=[];window.traceStages.push(event.stage)},clearDutyDiagnostics:async()=>{window.traceClears=(window.traceClears||0)+1},removeWatcher:async({id})=>{window.bgRemovals.push(id)}});`,
  '@capacitor/browser': `export const Browser={close:async()=>{},open:async()=>{}};`,
  '@capacitor/app': `const appListeners=new Set();window.setAppActive=isActive=>{for(const callback of appListeners)callback({isActive})};export const App={getInfo:async()=>{if(window.pushInfoDelay)await new Promise(resolve=>{window.finishPushInfo=resolve});return{id:location.search.includes('ios=true')?'com.rocoeats.driver':'com.rocoeats.driver.staging'}},addListener:async(name,callback)=>{if(name==='appStateChange')appListeners.add(callback);return{remove:async()=>{appListeners.delete(callback)}}}};`,
  '@capacitor/geolocation': `export const Geolocation={watchPosition:async(options,callback)=>{window.emitForegroundFix=fix=>callback(fix);return 'foreground-fixture'},clearWatch:async()=>{window.foregroundRemovals=(window.foregroundRemovals||0)+1}};`,
  '@capacitor/push-notifications': `const listeners={};export const PushNotifications={createChannel:async channel=>{if(window.pushChannelDelay)await new Promise(resolve=>{window.finishPushChannel=resolve});if(!window.bgPermission)throw Error('Channel before consent');window.pushChannel=channel;},checkPermissions:async()=>{if(window.pushPermissionReadDelay)await new Promise(resolve=>{window.finishPushPermissionRead=resolve});return{receive:window.bgPermission?'granted':'denied'}},requestPermissions:async()=>{window.pushPermissionRequests=(window.pushPermissionRequests||0)+1;if(window.pushPermissionDelay)await new Promise(resolve=>{window.finishPushPermission=resolve});return{receive:window.bgPermission?'granted':'denied'}},addListener:async(name,callback)=>{if(name==='registration'&&window.pushListenerDelay)await new Promise(resolve=>{window.finishPushListener=resolve});listeners[name]=callback;window.pushListenersFinished=(window.pushListenersFinished||0)+1;return{remove:async()=>{if(listeners[name]===callback)delete listeners[name]}}},register:async()=>{window.pushRegisterCalls=(window.pushRegisterCalls||0)+1;listeners.registration({value:location.search.includes('ios=true')?'a'.repeat(64):'mock_push_token_not_real_123456'})},unregister:async()=>{window.pushUnregisterCalls=(window.pushUnregisterCalls||0)+1;if(window.pushNativeRemoveDelay)await new Promise(resolve=>{window.finishPushNativeRemove=resolve})}};`,
};
await build({ entryPoints: [path.join(root, 'artifacts/localeats/tests/background-browser.tsx')], outfile: path.join(target, 'app.js'), bundle: true, format: 'esm', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env.VITE_APP_AUDIENCE': '"driver"', 'import.meta.env.VITE_API_ORIGIN': '"https://localeats-delivery-app.onrender.com"' }, plugins: [{ name: 'native-fixture', setup(b) { b.onResolve({ filter: /^(@capacitor\/(core|app|browser|geolocation|push-notifications)|@clerk\/react)$/ }, args => ({ path: args.path, namespace: 'qa-native' })); b.onLoad({ filter: /.*/, namespace: 'qa-native' }, args => ({ contents: modules[args.path], loader: 'js', resolveDir: path.join(root,'artifacts/localeats') })); } }] });
const assets = path.join(root, 'artifacts/localeats/dist/public/assets');
await writeFile(path.join(target, 'app.css'), await readFile(path.join(assets, (await readdir(assets)).find(f => f.endsWith('.css')))));
const server = http.createServer(async (req, res) => { res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : req.url === '/app.css' ? 'text/css' : 'text/html'); res.end(req.url === '/app.js' || req.url === '/app.css' ? await readFile(path.join(target, req.url.slice(1))) : '<html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div class="roco-page"><div id="root" class="roco-main"></div></div><script type="module" src="/app.js"></script></html>'); });
let browser;
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const diagnostic=await browser.newPage({viewport:{width:393,height:851}});await diagnostic.clock.install();
  await diagnostic.goto(`http://127.0.0.1:${server.address().port}/?reconnect=true`);
  await diagnostic.getByRole('button',{name:'Reconnect on this device',exact:true}).waitFor();
  const beforeTrace=await diagnostic.evaluate(()=>({writes:window.dutyReconnectWrites||0,gps:window.bgUploads,heartbeats:window.dutyHeartbeats||0}));
  await diagnostic.getByRole('button',{name:'Read screen-lock diagnostics',exact:true}).click();
  const report=diagnostic.getByRole('textbox',{name:'Sanitized native duty report',exact:true});await report.waitFor();
  assert.equal((await report.inputValue()).includes('DO_NOT_LEAK'),false);assert.equal(JSON.parse(await report.inputValue()).state,'EXPIRED');
  assert.deepEqual(await diagnostic.evaluate(()=>({writes:window.dutyReconnectWrites||0,gps:window.bgUploads,heartbeats:window.dutyHeartbeats||0})),beforeTrace,'Reading diagnostics cannot mutate duty or send GPS/heartbeat');
  await diagnostic.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copiedDutyReport=value;}}}));
  await diagnostic.getByRole('button',{name:'Copy sanitized diagnostics',exact:true}).click();
  await diagnostic.waitForFunction(()=>typeof window.copiedDutyReport==='string');
  assert.equal(await diagnostic.evaluate(()=>window.copiedDutyReport),await report.inputValue());
  await diagnostic.evaluate(()=>{window.traceDelay=true;});await diagnostic.getByRole('button',{name:'Read screen-lock diagnostics',exact:true}).click();
  await diagnostic.waitForFunction(()=>typeof window.finishTraceRead==='function');await diagnostic.clock.fastForward(16000);
  await diagnostic.getByText('Native diagnostics could not be read.',{exact:false}).waitFor({timeout:3000});
  assert.equal(await report.count(),0);await diagnostic.evaluate(()=>{window.traceDelay=false;window.finishTraceRead();});
  await diagnostic.getByRole('button',{name:'Read screen-lock diagnostics',exact:true}).click();await report.waitFor();
  assert.equal(await diagnostic.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await diagnostic.close();
  console.log('PASS: native report survives expired duty, whitelists safe fields, reads/copies without API mutation, and a hung read is bounded/retryable with late results fenced. Native API simulated.');
  const reconnect=await browser.newPage({viewport:{width:393,height:851}});
  await reconnect.goto(`http://127.0.0.1:${server.address().port}/?reconnect=true&permissions=true`);
  await reconnect.getByText('Reconnect below to show background-sharing controls. Background sharing is off until you explicitly enable it.',{exact:true}).waitFor({timeout:3000});
  assert.equal(await reconnect.getByRole('checkbox').count(),0,'No tracking consent controls until explicit reconnect');
  assert.equal(await reconnect.evaluate(()=>window.pushPermissionRequests||0),0);
  await reconnect.evaluate(()=>{window.dutyReconnectFails=true;});
  await reconnect.getByRole('button',{name:'Reconnect on this device',exact:true}).click();
  await reconnect.getByRole('alert').filter({hasText:'Reconnect rejected by server'}).waitFor();
  assert.equal(await reconnect.getByRole('checkbox').count(),0);
  await reconnect.evaluate(()=>{window.dutyReconnectFails=false;});
  await reconnect.getByRole('button',{name:'Reconnect on this device',exact:true}).click();
  const reconnectEnable=reconnect.getByRole('button',{name:'Enable background location for this session',exact:true});await reconnectEnable.waitFor();
  await reconnect.getByRole('link',{name:'Set up background sharing',exact:true}).click();
  assert.equal(await reconnectEnable.isDisabled(),true);
  assert.equal(await reconnect.evaluate(()=>window.pushPermissionRequests||0),0,'Denied notification permission does not hide consent');
  await reconnect.getByRole('checkbox').check();await reconnectEnable.click();
  await reconnect.getByRole('alert').filter({hasText:'Android notification permission is required for background sharing.'}).waitFor();
  assert.equal(await reconnect.evaluate(()=>window.bgStarts),0,'Denied notification cannot start a background watcher');
  assert.equal(await reconnect.evaluate(()=>window.pushRegisterCalls||0),0,'Background notification permission must not enroll provider push');
  await reconnect.getByRole('button',{name:'Reconnect on this device',exact:true}).click();
  await reconnectEnable.waitFor();await reconnect.evaluate(()=>{window.bgPermission=true;});
  await reconnect.getByRole('checkbox').check();await reconnectEnable.click();
  await reconnect.waitForFunction(()=>window.bgStarts===1);
  await reconnect.getByText('Device notification permission is granted.',{exact:true}).waitFor();
  assert.equal(await reconnect.evaluate(()=>window.pushRegisterCalls||0),0);await reconnect.close();
  console.log('PASS: fresh-process reconnect explains hidden controls; server denial preserves authorization; explicit reconnect reveals setup with notification denied, permission failure is actionable, grant starts only consented GPS with no push enrollment. Simulated native/API.');
  const ownerDuty=await browser.newPage();
  await ownerDuty.goto(`http://127.0.0.1:${server.address().port}/?reconnect=true&owner=true`);
  await ownerDuty.getByText('Location session: DRIVER_DEVICE_RECONNECT_REQUIRED',{exact:true}).waitFor();
  await ownerDuty.getByRole('button',{name:'Reconnect on this device',exact:true}).click();
  await ownerDuty.getByRole('button',{name:'Enable background location for this session',exact:true}).waitFor();
  await ownerDuty.getByText('Location session: DRIVER_READY_NATIVE',{exact:true}).waitFor();
  await ownerDuty.reload();
  await ownerDuty.getByText('Location session: DRIVER_DEVICE_RECONNECT_REQUIRED',{exact:true}).waitFor();
  assert.equal(await ownerDuty.getByRole('checkbox').count(),0,'A new app process must explicitly reconnect');
  await ownerDuty.evaluate(()=>{window.dutyApproved=false;return window.refreshDuty();});
  await ownerDuty.getByText('Location session: DRIVER_APPROVAL_REQUIRED',{exact:true}).waitFor();
  assert.equal(await ownerDuty.getByRole('checkbox').count(),0);
  await ownerDuty.evaluate(()=>{window.dutyAvailabilityInvalid=true;return window.refreshDuty();});
  await ownerDuty.getByText('Location session: DRIVER_AVAILABILITY_RESPONSE_INVALID',{exact:true}).waitFor();
  assert.equal(await ownerDuty.getByRole('checkbox').count(),0);await ownerDuty.close();
  const pendingDuty=await browser.newPage();await pendingDuty.clock.install();
  await pendingDuty.addInitScript(()=>{window.dutyAvailabilityDelay=true;});
  await pendingDuty.goto(`http://127.0.0.1:${server.address().port}/?reconnect=true`);
  await pendingDuty.waitForFunction(()=>typeof window.finishDutyAvailability==='function');
  await pendingDuty.clock.fastForward(21000);
  await pendingDuty.getByRole('complementary',{name:'Driver connection status',exact:true}).getByText(/ACCOUNT_API_TIMEOUT/).waitFor({timeout:3000});
  assert.equal(await pendingDuty.evaluate(()=>window.dutyAvailabilityAborted),true);
  assert.equal(await pendingDuty.getByRole('checkbox').count(),0);await pendingDuty.close();
  console.log('PASS: administrator-driver reconnect and process restart preserve explicit intent; server approval denial cannot reveal tracking; hung availability is bounded and actionable. Native/API simulated.');
  const noGps=await browser.newPage();noGps.setDefaultTimeout(10000);noGps.on('pageerror',e=>console.error('GPS fixture error:',e.message));await noGps.clock.install();
  await noGps.goto(`http://127.0.0.1:${server.address().port}/?reconnect=true`);
  await noGps.getByRole('button',{name:'Reconnect on this device',exact:true}).click();
  await noGps.getByRole('checkbox').check();await noGps.evaluate(()=>{window.bgPermission=true;});
  await noGps.getByRole('button',{name:'Enable background location for this session',exact:true}).click();
  await noGps.waitForFunction(()=>window.bgStarts===1);
  await noGps.evaluate(()=>{
    window.setAppActive(false);
    // Reproduce screen-lock synthetic body scheduling stall; direct native JSON
    // must not consume this reader for pulse ACKs or telemetry.
    window.originalBodyText=Response.prototype.text;
    Response.prototype.text=function(){if(this.nativeFixtureData?.online===true&&Object.keys(this.nativeFixtureData).length===1){window.blockedBodyReads=(window.blockedBodyReads||0)+1;return new Promise(()=>{});}return window.originalBodyText.call(this);};
  });
  for(let sequence=1;sequence<=8;sequence++) {
    await noGps.clock.fastForward(20000);await noGps.evaluate(sequence=>window.emitDutyPulse(String(sequence)),sequence);
    await noGps.waitForFunction(sequence=>window.nativeDutyAcks?.length===sequence,sequence);
  }
  await noGps.evaluate(()=>{Response.prototype.text=window.originalBodyText;});
  await noGps.evaluate(()=>window.refreshDuty());
  assert.ok(await noGps.evaluate(()=>window.dutyNativeRequests>=8),'Pulses use native JSON without a Fetch body promise');
  assert.equal(await noGps.evaluate(()=>window.bgUploads),0,'Native keepalive cannot fabricate GPS');
  assert.equal(await noGps.getByRole('button',{name:'Reconnect on this device',exact:true}).count(),0);
  await noGps.getByText('Last server heartbeat acknowledgement:',{exact:false}).waitFor();
  await noGps.evaluate(()=>window.emitDutyError('DUTY_ACK_EXPIRED'));
  await noGps.getByText('Location session: DRIVER_DEVICE_RECONNECT_REQUIRED',{exact:true}).waitFor();
  await noGps.waitForFunction(()=>window.bgRemovals.includes('watch-1'));
  await noGps.getByText('Location recovery: DUTY_ACK_EXPIRED',{exact:true}).waitFor();
  await noGps.getByText('Last server heartbeat acknowledgement:',{exact:false}).waitFor();await noGps.close();
  console.log('PASS: native pulses maintain authenticated presence over 160 seconds with ZERO GPS uploads; native acknowledgement expiry removes watcher and requires explicit reconnect. Bridge/API simulated; actual Java lease policy tested separately.');
  // Reproduce the observed Go-online-only path without real GPS or hosted writes.
  const duty=await browser.newPage();await duty.clock.install();
  await duty.goto(`http://127.0.0.1:${server.address().port}`);
  await duty.getByText('Foreground-only location sharing',{exact:true}).waitFor({timeout:3000});
  await duty.evaluate(()=>{window.dutyLease=true;window.dutyLastHeartbeat=Date.now();window.setAppActive(false);});
  await duty.waitForFunction(()=>window.foregroundRemovals>0);
  const beforeHidden=await duty.evaluate(()=>window.dutyHeartbeats);
  await duty.clock.fastForward(121000);await duty.evaluate(()=>window.refreshDuty());
  assert.equal(await duty.evaluate(()=>window.dutyHeartbeats),beforeHidden,'Foreground-only heartbeat stops when hidden');
  assert.equal(await duty.evaluate(()=>window.bgStarts),0,'Go online must not imply background consent');
  await duty.evaluate(()=>window.setAppActive(true));
  await duty.getByText('Your dispatch connection expired. No new offers will be assigned until you reconnect on this device.',{exact:true}).waitFor({timeout:3000});
  await duty.getByRole('button',{name:'Reconnect on this device',exact:true}).click();
  await duty.getByRole('button',{name:'Go offline',exact:true}).waitFor();
  const enableDuty=duty.getByRole('button',{name:'Enable background location for this session',exact:true});
  assert.equal(await enableDuty.isDisabled(),true,'Reconnect must not silently restore background consent');
  await duty.getByRole('checkbox').check();await enableDuty.click();
  await duty.waitForFunction(()=>window.bgStarts===1);await duty.evaluate(()=>window.setAppActive(false));
  for(let i=0;i<4;i++) {
    await duty.clock.fastForward(31000);
    await duty.evaluate(()=>window.emitFix({latitude:35.8,longitude:-84.7,accuracy:5,time:Date.now(),simulated:false}));
    await duty.getByRole('status').filter({hasText:'Background location uploaded'}).waitFor();
    await duty.waitForFunction(()=>Date.now()-window.dutyLastHeartbeat<1000);
  }
  await duty.evaluate(()=>window.refreshDuty());
  assert.equal(await duty.getByRole('button',{name:'Reconnect on this device',exact:true}).count(),0);
  assert.equal(await duty.evaluate(()=>window.bgUploads),4);
  await duty.evaluate(()=>window.setAppActive(true));await duty.getByRole('button',{name:'Go offline',exact:true}).click();
  await duty.waitForFunction(()=>window.bgRemovals.includes('watch-1'));
  const offUploads=await duty.evaluate(()=>window.bgUploads);
  await duty.evaluate(()=>window.emitFix({latitude:35.8,longitude:-84.7,accuracy:5,time:Date.now(),simulated:false}));
  assert.equal(await duty.evaluate(()=>window.bgUploads),offUploads);await duty.close();
  console.log('PASS: foreground-only hidden lease expires with explicit recovery; consented background fixes sustain eligibility over two minutes; offline stops watcher/late uploads. Native/API simulated.');
  for(const [flag,finish] of [['pushPermissionDelay','finishPushPermission'],['bgStartDelay','finishBgStart']]) {
    const stalled=await browser.newPage();await stalled.clock.install();
    await stalled.goto(`http://127.0.0.1:${server.address().port}`);
    await stalled.getByRole('checkbox').check();await stalled.evaluate(flag=>{window[flag]=true;},flag);
    await stalled.getByRole('button',{name:'Enable background location for this session',exact:true}).click();
    await stalled.waitForFunction(finish=>typeof window[finish]==='function',finish);
    await stalled.clock.fastForward(16000);
    await stalled.getByRole('alert').filter({hasText:'Background location could not start.'}).waitFor({timeout:3000});
    await stalled.evaluate(finish=>window[finish](),finish);
    if(flag==='bgStartDelay') {
      await stalled.waitForFunction(()=>window.bgRemovals.includes('watch-1'));
      await stalled.evaluate(()=>window.emitFix({latitude:35.8,longitude:-84.7,accuracy:5,time:Date.now(),simulated:false}));
    } else assert.equal(await stalled.evaluate(()=>window.bgStarts),0);
    assert.equal(await stalled.evaluate(()=>window.bgUploads),0);
    await stalled.close();
  }
  console.log('PASS: stalled native background permission/watcher setup reaches actionable recovery; late grants cannot start GPS and late watchers are removed. Native/API simulated.');
  const gps=await browser.newPage();
  await gps.addInitScript(()=>{window.dutyOrderId='order-current';});await gps.clock.install();
  await gps.goto(`http://127.0.0.1:${server.address().port}`);
  await gps.waitForFunction(()=>typeof window.emitForegroundFix==='function');
  await gps.evaluate(()=>window.emitForegroundFix({coords:{latitude:35.8,longitude:-84.7,accuracy:5},timestamp:NaN}));
  await gps.getByText('GPS fix rejected: a fresh, valid device position is required.',{exact:true}).waitFor();
  assert.equal(await gps.evaluate(()=>window.bgUploads),0,'Invalid timestamp cannot poison the upload slot or create a request');
  await gps.evaluate(()=>{for(const fix of [
   {coords:{latitude:91,longitude:-84.7,accuracy:5},timestamp:Date.now()},
   {coords:{latitude:35.8,longitude:-84.7,accuracy:-1},timestamp:Date.now()},
   {coords:{latitude:35.8,longitude:-84.7,accuracy:5},timestamp:Date.now()-121000},
   {coords:{latitude:35.8,longitude:-84.7,accuracy:5},timestamp:9e15},
  ])window.emitForegroundFix(fix);});
  assert.equal(await gps.evaluate(()=>window.bgUploads),0);

  await gps.evaluate(()=>{window.dutyPostDelay=true;window.emitForegroundFix({coords:{latitude:35.8,longitude:-84.7,accuracy:5},timestamp:Date.now()});});
  await gps.waitForFunction(()=>typeof window.finishDutyPost==='function');await gps.clock.fastForward(16000);
  await gps.getByText('Location upload failed. Retrying on the next GPS update.',{exact:true}).waitFor({timeout:3000});
  assert.equal(await gps.evaluate(()=>window.dutyPostAborted),true);
  await gps.evaluate(()=>{window.dutyPostDelay=false;window.emitForegroundFix({coords:{latitude:35.8,longitude:-84.7,accuracy:5},timestamp:Date.now()});});
  await gps.getByText('Last successful upload',{exact:false}).waitFor();
  assert.equal(await gps.evaluate(()=>window.dutyOrderUploads),1);
  await gps.evaluate(()=>window.finishDutyPost());await gps.waitForTimeout(30);
  assert.equal(await gps.evaluate(()=>window.dutyOrderUploads),1,'Late abandoned GPS result must not be forwarded to an order');
  await gps.clock.fastForward(16000);
  await gps.evaluate(()=>{window.dutyMalformed=true;window.emitForegroundFix({coords:{latitude:35.8,longitude:-84.7,accuracy:5},timestamp:Date.now()});});
  await gps.getByText('Location upload failed. Retrying on the next GPS update.',{exact:true}).waitFor();
  assert.equal(await gps.evaluate(()=>window.dutyOrderUploads),1,'Malformed acknowledgement cannot report success or forward a position');await gps.close();
  const heartbeat=await browser.newPage();
  await heartbeat.addInitScript(()=>{window.dutyHeartbeatDelay=true;});await heartbeat.clock.install();
  await heartbeat.goto(`http://127.0.0.1:${server.address().port}`);
  await heartbeat.waitForFunction(()=>typeof window.finishDutyHeartbeat==='function');await heartbeat.clock.fastForward(16000);
  await heartbeat.getByText('Dispatch connection interrupted.',{exact:false}).waitFor({timeout:3000});
  assert.equal(await heartbeat.evaluate(()=>window.dutyHeartbeatAborted),true);
  await heartbeat.evaluate(()=>{window.dutyHeartbeatDelay=false;});await heartbeat.clock.fastForward(15000);
  await heartbeat.waitForFunction(()=>window.dutyHeartbeats===2);
  await heartbeat.getByText('Dispatch connection interrupted.',{exact:false}).waitFor({state:'hidden'});
  await heartbeat.evaluate(()=>window.finishDutyHeartbeat());await heartbeat.close();
  console.log('PASS: foreground GPS and heartbeats recover from hung transport, abort stale work, reject malformed acknowledgements and never forward a late old position. Native/API simulated.');
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
