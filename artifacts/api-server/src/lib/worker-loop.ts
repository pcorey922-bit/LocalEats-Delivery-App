export function startWorkerLoop(options: {
  intervalMs: number;
  run: (stopping: () => boolean) => Promise<void>;
  onError: (error: unknown) => void;
  onSuccess?: () => Promise<void>;
}) {
  let stopping = false;
  let current: Promise<void> | null = null;
  const tick = () => {
    if (stopping || current) return;
    current = Promise.resolve()
      .then(async () => {
        if (stopping) return;
        await options.run(() => stopping);
        await options.onSuccess?.();
      })
      .catch(options.onError)
      .finally(() => {
        current = null;
      });
  };
  const timer = setInterval(tick, options.intervalMs);
  timer.unref();
  tick();
  return {
    stop: async () => {
      stopping = true;
      clearInterval(timer);
      await current;
    },
    running: () => current !== null,
  };
}
