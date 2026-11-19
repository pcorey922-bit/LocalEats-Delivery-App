import test from 'node:test';
import assert from 'node:assert/strict';
import { backgroundDutySession, type DutyFix } from '../../localeats/src/lib/background-duty';
type Deps = Parameters<typeof backgroundDutySession>[0];
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const deferred = <T>() => { let resolve!: (v: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; };
function fixture(overrides: Partial<Deps> = {}) {
  let time = 1_800_000, order: string | null = 'order-a';
  let callback: (fix?: DutyFix, error?: { code?: string }) => void = () => {};
  const calls: string[] = [], removed: string[] = [], fatal: string[] = [], statuses: string[] = [];
  const deps: Deps = {
    now: () => time, permission: async () => true,
    watcher: { addWatcher: async (_options, cb) => { callback = cb; return 'watch-1'; }, removeWatcher: async ({ id }) => { removed.push(id); } },
    api: async <T>(path: string) => { calls.push(path); return (path.endsWith('/availability') ? { approved: true, available: true, online: true, activeOrderId: order } : { accepted: true }) as T; },
    status: v => statuses.push(v), fatal: v => fatal.push(v), ...overrides,
  };
  return { session: backgroundDutySession(deps), calls, removed, fatal, statuses,
    emit: (changes: Partial<DutyFix> = {}) => callback({ latitude: 35.8, longitude: -84.7, accuracy: 10, time, ...changes }),
    fail: (code: string) => callback(undefined,{code}), advance: () => { time += 30000; }, order: (v: string | null) => { order = v; },
  };
}
test('background duty uses current authorized assignment, throttles uploads and stops all uploads after explicit stop', async () => {
  const f = fixture(); await f.session.start(); f.emit(); f.emit(); await flush();
  assert.deepEqual(f.calls, ['/api/driver/availability', '/api/driver/heartbeat', '/api/driver/availability', '/api/driver/location', '/api/driver/orders/order-a/location']);
  f.emit(); await flush(); assert.equal(f.calls.length, 5);
  f.advance(); f.order('order-b'); f.emit(); await flush();
  assert.equal(f.calls.at(-1), '/api/driver/orders/order-b/location');
  await f.session.stop(); f.advance(); f.emit(); await flush();
  assert.equal(f.calls.length, 9); assert.deepEqual(f.removed, ['watch-1']);
});
test('permission cancellation and late native watcher creation cannot leave a background watcher running', async () => {
  const permission = deferred<boolean>(); let watchers = 0;
  const f = fixture({ permission: () => permission.promise, watcher: { addWatcher: async () => { watchers++; return 'late'; }, removeWatcher: async () => {} } });
  const started = f.session.start(), stopped = f.session.stop(); permission.resolve(true); await Promise.all([started, stopped]);
  assert.equal(watchers, 0); assert.deepEqual(f.calls, []);
  const watcher = deferred<string>(), removed: string[] = [];
  const late = fixture({ watcher: { addWatcher: () => watcher.promise, removeWatcher: async ({ id }) => { removed.push(id); } } });
  const waiting = late.session.start(); await flush(); const ending = late.session.stop(); watcher.resolve('late-native-id'); await Promise.all([waiting, ending]);
  assert.deepEqual(removed, ['late-native-id']);
});
test('revoked/expired/off-duty authorization stops background sharing without retrying privileged requests', async () => {
  for (const status of [401, 403, 409]) {
    let calls = 0;
    const f = fixture({ api: async <T>() => { if (++calls === 1) return {approved:true,available:true,online:true,activeOrderId:null} as T; throw { status }; } });
    await f.session.start(); f.emit(); await flush(); await flush();
    assert.equal(f.fatal.length, 1); assert.deepEqual(f.removed, ['watch-1']);
    f.advance(); f.emit(); await flush(); assert.equal(calls, 2);
  }
});
test('stopping during an interrupted request prevents a later position or delivery upload', async () => {
  const heartbeat = deferred<unknown>(), calls: string[] = [];
  const f = fixture({ api: async <T>(path: string) => { calls.push(path); if (calls.length===1) return {approved:true,available:true,online:true,activeOrderId:null} as T; return await heartbeat.promise as T; } });
  await f.session.start(); f.emit(); await flush(); await f.session.stop(); heartbeat.resolve({ online: true }); await flush();
  assert.deepEqual(calls, ['/api/driver/availability','/api/driver/heartbeat']);
});
test('invalid/stale/simulated GPS is rejected and a transient outage recovers on a fresh fix without fabricated success', async () => {
  let attempts = 0, preflight = true;
  const f = fixture({ api: async <T>(path: string) => {
    if (preflight) { preflight = false; return {approved:true,available:true,online:true,activeOrderId:null} as T; }
    attempts++;
    if (attempts === 1) throw { status: 503 };
    return (path.endsWith('/availability') ? { approved: true, available: true, online: true, activeOrderId: null } : { accepted: true }) as T;
  } });
  await f.session.start();
  for (const invalid of [{ latitude: NaN }, { longitude: 181 }, { accuracy: -1 }, { time: 0 }, { time: 9e12 }, { simulated: true }]) f.emit(invalid);
  await flush(); assert.equal(attempts, 0);
  f.emit(); await flush(); assert.equal(f.fatal.length, 0); assert.match(f.statuses.at(-1)!, /interrupted/);
  f.advance(); f.emit(); await flush(); assert.match(f.statuses.at(-1)!, /uploaded/); assert.equal(attempts, 4);
  await f.session.stop();
});

test('background watcher starts only after fresh server approval and on-duty eligibility', async () => {
  for (const state of [null, {approved:false,available:true,online:true,activeOrderId:null}, {approved:true,available:false,online:true,activeOrderId:null}, {approved:true,available:true,online:false,activeOrderId:null}, {approved:'true',available:true,online:true,activeOrderId:null}]) {
    let watchers=0;
    const f=fixture({api:async<T>()=>state as T,watcher:{addWatcher:async()=>{watchers++;return 'unauthorized'},removeWatcher:async()=>{}}});
    await assert.rejects(f.session.start());
    assert.equal(watchers,0,'Cached UI intent never starts GPS after fresh eligibility is missing');
  }
});


test('stop while eligibility is pending never starts GPS, and permission revocation stops native callbacks', async () => {
  const access=deferred<unknown>();let starts=0;
  const f=fixture({api:async<T>()=>await access.promise as T,watcher:{addWatcher:async()=>{starts++;return 'late'},removeWatcher:async()=>{}}});
  const starting=f.session.start();await flush();const stopping=f.session.stop();
  access.resolve({approved:true,available:true,online:true,activeOrderId:null});
  await Promise.all([starting,stopping]);assert.equal(starts,0);
  for (const status of [401,403,409,503]) {
    const denied=fixture({api:async()=>{throw {status}}});
    await assert.rejects(denied.session.start());assert.deepEqual(denied.removed,[]);
  }
  const revoked=fixture();await revoked.session.start();revoked.fail('NOT_AUTHORIZED');await flush();await flush();
  assert.deepEqual(revoked.removed,['watch-1']);assert.equal(revoked.fatal.length,1);
  revoked.emit();await flush();assert.deepEqual(revoked.calls,['/api/driver/availability']);
});


test('malformed location acknowledgement never reports success or forwards to the active order', async () => {
  const calls:string[]=[];
  const f=fixture({api:async<T>(path:string)=>{calls.push(path);return (path.endsWith('/availability')?{approved:true,available:true,online:true,activeOrderId:'order-a'}:{accepted:'false'}) as T;}});
  await f.session.start();f.emit();await flush();
  assert.equal(calls.some(path=>path.includes('/orders/')),false);
  assert.match(f.statuses.at(-1)!,/interrupted/);await f.session.stop();
});
