// Device-local intent is deliberately memory-only. A reload, fresh sign-in, or
// new app process requires an explicit reconnect instead of silently restarting GPS.
export function createDutyIntentStore() {
  const values = new Map<string, boolean>(),
    listeners = new Set<() => void>();
  return {
    get: (userId: string | null) =>
      userId ? (values.get(userId) ?? false) : false,
    set: (userId: string, online: boolean) => {
      values.set(userId, online);
      listeners.forEach((l) => l());
    },
    clear: () => {
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
