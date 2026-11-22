import { nativeStep } from './native-startup';
export type DutyFix = { latitude: number; longitude: number; accuracy: number; time: number; simulated?: boolean };
type Options = { method?: 'GET' | 'POST'; body?: string; signal: AbortSignal };
type Dependencies = {
  watcher: {
    addWatcher(options: { backgroundTitle: string; backgroundMessage: string; requestPermissions: boolean; stale: boolean; distanceFilter: number }, callback: (fix?: DutyFix, error?: { code?: string }) => void): Promise<string>;
    removeWatcher(options: { id: string }): Promise<void>;
  };
  permission: () => Promise<boolean>;
  api: <T>(path: string, options: Options) => Promise<T>;
  status: (message: string) => void;
  fatal: (message: string) => void;
  now?: () => number;
};

type DutyAccess = { approved: true; available: true; online: true; activeOrderId: string | null };
function eligible(value: unknown): value is DutyAccess {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return state.approved === true && state.available === true && state.online === true &&
    (state.activeOrderId === null || typeof state.activeOrderId === 'string' && state.activeOrderId.length > 0);
}

/** Uses existing Clerk/session/approval/location authorization; no new credential
 * or bypass endpoint. Native HTTP is enabled only in the dedicated driver build. */
export function backgroundDutySession(deps: Dependencies) {
  let stopped = false, inFlight = false, lastAttempt = -Infinity;
  let starting: Promise<void> | undefined, id: string | undefined, removing: Promise<void> | undefined;
  const abort = new AbortController(), now = deps.now ?? Date.now;
  async function request<T>(path: string, options: Options): Promise<T> {
    const controller = new AbortController();
    try {
      // Bound the complete request even if native HTTP ignores cancellation.
      // Its late result cannot continue the abandoned upload sequence.
      return await nativeStep('NATIVE_LOCATION_REQUEST_TIMEOUT', () =>
        deps.api<T>(path, { ...options, signal: controller.signal }), abort.signal);
    } finally {
      controller.abort();
    }
  }
  const remove = () => {
    if (!id) return Promise.resolve();
    removing ??= deps.watcher.removeWatcher({ id });
    return removing;
  };
  const stop = () => {
    stopped = true;
    abort.abort();
    return (starting ?? Promise.resolve()).catch(() => {}).then(remove);
  };
  const fail = (message: string) => {
    if (stopped) return;
    deps.fatal(message);
    void stop().catch(() => deps.status('Location service could not stop. Disable location permission in device settings and reopen RoCoEats.'));
  };
  async function position(fix?: DutyFix, error?: { code?: string }) {
    if (stopped) return;
    if (error?.code === 'NOT_AUTHORIZED') { fail('Background location permission is unavailable. Reconnect explicitly after reviewing device permissions.'); return; }
    if (error || !fix) { deps.status('Waiting for a GPS fix. Dispatch may show your location as stale.'); return; }
    const age = now() - fix.time;
    if (![fix.latitude, fix.longitude, fix.accuracy, fix.time].every(Number.isFinite) ||
        Math.abs(fix.latitude) > 90 || Math.abs(fix.longitude) > 180 || fix.accuracy < 0 || fix.accuracy > 10000 ||
        age > 120000 || age < -30000 || fix.simulated === true) {
      deps.status('GPS fix rejected: a fresh, valid device position is required.');
      return;
    }
    if (inFlight || now() - lastAttempt < 30000) return;
    inFlight = true;
    lastAttempt = now();
    try {
      const options = { method: 'POST' as const, signal: abort.signal };
      await request('/api/driver/heartbeat', options);
      if (stopped) return;
      const availability = await request<unknown>('/api/driver/availability', { signal: abort.signal });
      if (stopped) return;
      if (!eligible(availability)) { fail('On-duty access ended. Background sharing stopped; reconnect explicitly when eligible.'); return; }
      const body = JSON.stringify({ latitude: fix.latitude, longitude: fix.longitude, accuracyMeters: fix.accuracy, observedAt: new Date(fix.time).toISOString() });
      const result = await request<{ accepted: boolean }>('/api/driver/location', { ...options, body });
      if (stopped) return;
      if (!result || typeof result.accepted !== 'boolean') throw Error('Invalid location acknowledgement');
      if (result.accepted === true && availability.activeOrderId) {
        await request(`/api/driver/orders/${encodeURIComponent(availability.activeOrderId)}/location`, { ...options, body });
      }
      if (!stopped) deps.status(result.accepted ? 'Background location uploaded to authorized dispatch.' : 'Waiting for a newer GPS fix.');
    } catch (error) {
      if (stopped) return;
      const code = (error as { status?: number })?.status;
      if ([401, 403, 409].includes(code ?? 0)) fail('Driver session or on-duty access could not be verified. Background sharing stopped. Reopen the app and reconnect explicitly.');
      else deps.status('Location upload interrupted. Retrying on a fresh GPS update; dispatch may show stale location.');
    } finally { inFlight = false; }
  }
  return {
    start() {
      starting ??= (async () => {
        if (!await nativeStep('NATIVE_LOCATION_PERMISSION_TIMEOUT', deps.permission, abort.signal)) throw Error('Background location requires device permission and, on Android, a visible notification.');
        if (stopped) return;
        deps.status('Verifying current on-duty access before starting background location…');
        const access = await request<unknown>('/api/driver/availability', { signal: abort.signal });
        if (stopped) return;
        if (!eligible(access)) throw Error('Current driver approval and online availability are required. Reconnect explicitly.');
        await nativeStep('NATIVE_LOCATION_WATCHER_TIMEOUT', async () => {
          id = await deps.watcher.addWatcher({ backgroundTitle: 'RoCoEats Driver · On duty', backgroundMessage: 'Sharing your driver location. Go offline in RoCoEats to stop.', requestPermissions: true, stale: false, distanceFilter: 0 }, (fix, error) => { void position(fix, error); });
          // Native calls cannot necessarily be canceled. A watcher returned after
          // timeout/stop must be removed even though the caller has already left.
          if (stopped) await remove().catch(() => deps.status('Location service could not stop. Disable location permission in device settings and reopen RoCoEats.'));
        }, abort.signal);
      })().catch(error => {
        if (stopped) return;
        stopped = true;
        abort.abort();
        throw error;
      });
      return starting;
    },
    stop,
  };
}
