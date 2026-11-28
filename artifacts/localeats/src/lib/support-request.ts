import { accountStatus } from "./account-entry";

// A timeout cannot establish whether a write committed. Never retry it here.
export async function supportRequest<T>(
  run: (signal: AbortSignal) => Promise<T>,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined,
    stop: () => void = () => {};
  try {
    controller.signal.throwIfAborted();
    const stopped = new Promise<never>((_, reject) => {
      stop = () => reject(controller.signal.reason);
      controller.signal.addEventListener("abort", stop, { once: true });
    });
    timer = setTimeout(
      () =>
        controller.abort(
          new Error(
            "Support request timed out. Review its status before retrying the saved request.",
          ),
        ),
      options.timeoutMs ?? 20000,
    );
    return await Promise.race([
      Promise.resolve().then(() => {
        controller.signal.throwIfAborted();
        return run(controller.signal);
      }),
      stopped,
    ]);
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener("abort", stop);
    options.signal?.removeEventListener("abort", abort);
  }
}

export function supportRecovery(
  id: string,
  saved: Iterable<{ id: string }>,
  error: unknown,
): "confirmed" | "rejected" | "unconfirmed" {
  for (const item of saved) if (item.id === id) return "confirmed";
  // Absence from a paginated list is not proof of failure. Only a definite
  // validation/version rejection permits a new editable attempt after review.
  return [400, 409].includes(accountStatus(error) ?? 0)
    ? "rejected"
    : "unconfirmed";
}
