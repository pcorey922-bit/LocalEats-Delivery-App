import type { JoinRole } from "./account-entry";
import { NativeStepError } from "./native-startup";
export type NativeRequest = {
  id: string;
  verifier: string;
  expiresAt: string;
  role?: JoinRole;
  checkout?: boolean;
  phase?: "waiting" | "redeeming" | "activating";
};
const key = "rocoeats-native-auth:v1";
export function readNativeRequest(): NativeRequest | null {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v &&
      /^[a-z0-9-]{36}$/.test(v.id) &&
      /^[A-Za-z0-9_-]{43}$/.test(v.verifier) &&
      Date.parse(v.expiresAt) > Date.now()
      ? v
      : null;
  } catch {
    return null;
  }
}
export function saveNativeRequest(request: NativeRequest) {
  localStorage.setItem(key, JSON.stringify(request));
}
const runs = new Map<
  string,
  { promise: Promise<void>; controller: AbortController }
>();
export function clearNativeRequest(expectedId?: string) {
  const pending = readNativeRequest();
  if (expectedId) {
    runs.get(expectedId)?.controller.abort();
    if (pending?.id !== expectedId) return;
  } else if (pending) runs.get(pending.id)?.controller.abort();
  localStorage.removeItem(key);
}
export function nativeRequestRunning(id: string) {
  return runs.has(id);
}
// Route changes, duplicate callbacks and StrictMode subscriptions share one run.
export function runNativeRequest(
  request: NativeRequest,
  operation: (signal: AbortSignal) => Promise<void>,
) {
  const current = runs.get(request.id);
  if (current) return current.promise;
  if (request.phase && request.phase !== "waiting")
    return Promise.reject(new NativeStepError("NATIVE_HANDOFF_INTERRUPTED"));
  const controller = new AbortController();
  const promise = Promise.resolve()
    .then(() => operation(controller.signal))
    .finally(() => {
      if (runs.get(request.id)?.controller === controller)
        runs.delete(request.id);
    });
  runs.set(request.id, { promise, controller });
  return promise;
}
