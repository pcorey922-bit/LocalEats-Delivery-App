// Safe UI diagnostics only: no account IDs, URLs, credentials or provider errors.
export type NativePhase =
  | "RESTORING"
  | "BROWSER_OPEN"
  | "WAITING_APPROVAL"
  | "REDEEMING"
  | "TICKET"
  | "ACTIVATING"
  | "PROFILE"
  | "DRIVER_DATA"
  | "READY";
let snapshot: { phase: NativePhase; ready: boolean; failure?: string } = {
  phase: "RESTORING",
  ready: false,
};
let foreground = true;
const listeners = new Set<() => void>();
export const nativeStartup = {
  isForeground: () => foreground,
  setForeground: (active: boolean) => { foreground = active; },
  get: () => snapshot,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  block(code: string) {
    snapshot = {
      ...snapshot,
      ready: false,
      failure: /^NATIVE_[A-Z_]+$/.test(code) ? code : "NATIVE_HANDOFF_FAILED",
    };
    listeners.forEach((listener) => listener());
  },
  report(phase: NativePhase, ready = false) {
    if (snapshot.failure) return;
    if (snapshot.phase === phase && snapshot.ready === ready) return;
    snapshot = { phase, ready };
    listeners.forEach((listener) => listener());
  },
};
export class NativeStepError extends Error {
  constructor(readonly code: string) {
    super(
      `Secure app startup could not finish. Code: ${code}. Cancel this request and try again.`,
    );
    this.name = "NativeStepError";
  }
}
export async function nativeStep<T>(
  code: string,
  operation: () => Promise<T>,
  signal: AbortSignal,
  timeoutMs = 15000,
): Promise<T> {
  signal.throwIfAborted();
  let timer: ReturnType<typeof setTimeout>, abort!: () => void;
  const stopped = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new NativeStepError(code)), timeoutMs);
    abort = () => reject(new NativeStepError("NATIVE_HANDOFF_CANCELED"));
    signal.addEventListener("abort", abort, { once: true });
  });
  try {
    const result = await Promise.race([operation(), stopped]);
    signal.throwIfAborted();
    return result;
  } finally {
    clearTimeout(timer!);
    signal.removeEventListener("abort", abort);
  }
}
