import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { useAppForeground } from "../hooks/use-app-foreground";
import { clearNativeRequest } from "../lib/native-auth-request";
import { nativeStartup, type NativePhase } from "../lib/native-startup";
export function useNativeStartup(
  phase: NativePhase,
  ready: boolean,
  enabled = true,
) {
  useEffect(() => {
    if (enabled && Capacitor.isNativePlatform())
      nativeStartup.report(phase, ready);
  }, [phase, ready, enabled]);
}
// Remains mounted OUTSIDE Clerk and route components. Phase changes never extend
// the deadline. Background time is excluded; duplicate foreground events do not reset it.
export function NativeStartupBoundary({
  children,
  enabled = Capacitor.isNativePlatform(),
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const state = useSyncExternalStore(
    nativeStartup.subscribe,
    nativeStartup.get,
  );
  const latest = useRef(state);
  latest.current = state;
  const foreground = useAppForeground();
  const [failure, setFailure] = useState<NativePhase | null>(null);
  const remaining = useRef(30000);
  useEffect(() => { if (enabled) nativeStartup.setForeground(foreground); }, [enabled, foreground]);
  useEffect(() => {
    if (!enabled) return;
    if (state.ready) { remaining.current = 30000; return; }
    if (!foreground) return;
    const started = performance.now();
    const timer = setTimeout(() => setFailure(latest.current.phase), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [enabled, state.ready, foreground]);
  if (!enabled) return children;
  const failureCode =
    state.failure || (failure ? `NATIVE_STARTUP_TIMEOUT_${failure}` : null);
  return (
    <>
      <div hidden={!!failureCode} inert={!!failureCode}>
        {children}
      </div>
      {!state.ready && !failureCode && (
        <p className="roco-meta" role="status">
          Secure startup · NATIVE_{state.phase}
        </p>
      )}
      {failureCode && (
        <main className="roco-main">
          <h1>App startup did not finish</h1>
          <p role="alert">
            Secure sign-in or account loading did not finish. Code: {failureCode}.
          </p>
          <p>
            Reload to restore your existing session, or cancel the pending
            sign-in request. Do not create another account.
          </p>
          <button className="roco-button" onClick={() => location.reload()}>
            Reload app
          </button>{" "}
          <button
            className="roco-button"
            onClick={() => {
              clearNativeRequest();
              location.reload();
            }}
          >
            Cancel pending sign-in and reload
          </button>
        </main>
      )}
    </>
  );
}
