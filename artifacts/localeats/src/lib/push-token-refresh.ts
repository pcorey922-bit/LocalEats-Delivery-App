import { nativeStep } from "./native-startup";
type Enrollment = { id: string | null; optedOut: boolean };
type Dependencies = {
  active: () => boolean;
  manual: () => boolean;
  saved: () => Enrollment;
  permission: () => Promise<boolean>;
  appId: () => Promise<string>;
  platform: "android" | "ios";
  configured: (signal: AbortSignal) => Promise<boolean>;
  lookup: (id: string, signal: AbortSignal) => Promise<unknown>;
  rotate: (
    id: string,
    token: string,
    appId: string,
    signal: AbortSignal,
  ) => Promise<unknown>;
  register: () => Promise<void>;
  save: (token: string) => void;
  changed: (failed: boolean) => void;
};
const uuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
/** Refresh only an existing, server-owned enrollment. Never requests permission or POSTs a device. */
export function createPushTokenRefresh(deps: Dependencies) {
  let stopped = false,
    epoch = 0,
    recovering = false,
    updating = false,
    latest: string | undefined;
  const controllers = new Set<AbortController>();
  const allowed = (id?: string) => {
    const saved = deps.saved();
    return (
      !stopped &&
      deps.active() &&
      !deps.manual() &&
      !saved.optedOut &&
      uuid(saved.id) &&
      (!id || id === saved.id)
    );
  };
  const cancel = () => {
    epoch++;
    latest = undefined;
    for (const controller of controllers) controller.abort();
    controllers.clear();
  };
  const stop = () => {
    stopped = true;
    cancel();
  };
  async function operation(
    run: (signal: AbortSignal, valid: () => boolean) => Promise<void>,
  ) {
    const owner = epoch,
      controller = new AbortController();
    controllers.add(controller);
    const valid = () =>
      owner === epoch && !controller.signal.aborted && allowed();
    try {
      await nativeStep(
        "NATIVE_PUSH_REFRESH_TIMEOUT",
        () => run(controller.signal, valid),
        controller.signal,
      );
    } catch {
      if (valid()) deps.changed(true);
    } finally {
      controller.abort();
      controllers.delete(controller);
    }
  }
  async function access(signal: AbortSignal, valid: () => boolean) {
    if (!valid()) return null;
    const id = deps.saved().id!;
    if (
      !(await deps.permission()) ||
      !valid() ||
      !(await deps.configured(signal)) ||
      !valid()
    )
      return null;
    const appId = await deps.appId();
    if (!valid() || !allowed(id)) return null;
    const current = await deps.lookup(id, signal);
    if (
      !valid() ||
      !allowed(id) ||
      !object(current) ||
      current.registered !== true ||
      current.platform !== deps.platform ||
      current.appId !== appId
    )
      return null;
    return { id, appId };
  }
  const receive = (token: string) => {
    if (
      !allowed() ||
      typeof token !== "string" ||
      token.length < 16 ||
      token.length > 4096 ||
      !/^[A-Za-z0-9_:\-]+$/.test(token)
    )
      return;
    if (deps.platform === "ios" && !/^[a-f0-9]{64}$/i.test(token)) return;
    latest = token;
    if (updating) return;
    updating = true;
    void (async () => {
      try {
        while (latest && allowed()) {
          const value = latest;
          latest = undefined;
          await operation(async (signal, valid) => {
            const current = await access(signal, valid);
            if (!current) return;
            const result = await deps.rotate(
              current.id,
              value,
              current.appId,
              signal,
            );
            if (!valid() || !allowed(current.id)) return;
            if (
              !object(result) ||
              result.registered !== true ||
              result.deviceId !== current.id
            )
              throw Error("Unconfirmed token refresh");
            deps.save(value);
            deps.changed(false);
          });
        }
      } finally {
        updating = false;
      }
    })();
  };
  const recover = async () => {
    if (!allowed() || recovering) return;
    recovering = true;
    try {
      await operation(async (signal, valid) => {
        if ((await access(signal, valid)) && valid()) await deps.register();
      });
    } finally {
      recovering = false;
    }
  };
  return {
    receive,
    recover,
    cancel,
    stop,
    failed: () => {
      if (allowed()) deps.changed(true);
    },
  };
}
