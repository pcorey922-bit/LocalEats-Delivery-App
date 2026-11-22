import type { DutyEvidence } from './background-duty';
const emptyEvidence: Readonly<DutyEvidence> = Object.freeze({});
// Device-local intent is deliberately memory-only. A reload, fresh sign-in, or
// new app process requires an explicit reconnect instead of silently restarting GPS.
export function createDutyIntentStore() {
  const evidence = new Map<string, Readonly<DutyEvidence>>();
  const statuses = new Map<string, string>();
  const values = new Map<string, boolean>(),
    listeners = new Set<() => void>();
  return {
    get: (userId: string | null) =>
      userId ? (values.get(userId) ?? false) : false,
    set: (userId: string, online: boolean) => {
      values.set(userId, online);
      listeners.forEach((l) => l());
    },
    evidence: (userId:string|null) => userId ? evidence.get(userId) ?? emptyEvidence : emptyEvidence,
    record: (userId:string, value:DutyEvidence) => {
      evidence.set(userId, {...evidence.get(userId), ...value});
      listeners.forEach(l => l());
    },
    // Diagnostics never grant duty intent or persist across processes/accounts.
    status: (userId: string | null) => userId ? (statuses.get(userId) ?? 'DRIVER_SESSION_NOT_STARTED') : 'DRIVER_SIGN_IN_REQUIRED',
    report: (userId: string, code: string) => {
      if (statuses.get(userId) === code) return;
      statuses.set(userId, code);
      listeners.forEach(l => l());
    },
    clear: () => {
      evidence.clear();
      statuses.clear();
      values.clear();
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
export const dutyIntent = createDutyIntentStore();
