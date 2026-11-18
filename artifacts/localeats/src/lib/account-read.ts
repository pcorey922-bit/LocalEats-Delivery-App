import { AccountResponseError } from './account-response';
import { accountStatus } from './account-entry';

// Only use for reads: a network retry must never replay checkout or account writes.
export function retryAccountRead(failureCount: number, error: unknown) {
  if (error instanceof AccountResponseError || error instanceof AccountReadTimeout || failureCount >= 2 || (error instanceof Error && error.name === 'AbortError')) return false;
  const status = accountStatus(error);
  return status === undefined || status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export class AccountReadTimeout extends Error {
  readonly code: string;
  constructor(stage: 'api' | 'session') {
    super(stage === 'session'
      ? 'Session renewal did not finish. Retry, or sign out and sign in again. Code: ACCOUNT_SESSION_TIMEOUT.'
      : 'The account API did not respond in time. Retry to reconnect. Code: ACCOUNT_API_TIMEOUT.');
    this.name = 'AccountReadTimeout';
    this.code = stage === 'session' ? 'ACCOUNT_SESSION_TIMEOUT' : 'ACCOUNT_API_TIMEOUT';
  }
}
export function accountReadMessage(error: unknown) {
  if (error instanceof AccountReadTimeout || error instanceof AccountResponseError) return error.message;
  const status = accountStatus(error);
  if (status === 401) return 'Your app session could not be verified. Sign out and sign in again. Code: ACCOUNT_401.';
  if (status === 403) return 'The server denied workspace access. Check account access; no permissions were changed. Code: ACCOUNT_403.';
  return 'Could not load account information. Retry to reconnect, or check account access.';
}

export async function sessionRead<T>(
  read: (headers?: HeadersInit, signal?: AbortSignal) => Promise<T>,
  getToken: (options: { skipCache: boolean }) => Promise<string | null>,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  const controller = new AbortController();
  let stage: 'api' | 'session' = 'api';
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new AccountReadTimeout(stage)), options.timeoutMs ?? 20000);
  let rejectOnAbort: (() => void) | undefined;
  try {
    controller.signal.throwIfAborted();
    const stopped = new Promise<never>((_, reject) => {
      rejectOnAbort = () => reject(controller.signal.reason);
      controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
    });
    const operation = async () => {
      try { return await read(undefined, controller.signal); }
      catch (error) {
        if (controller.signal.aborted) throw controller.signal.reason;
        // A read may renew Clerk once. Never retry forbidden roles or writes.
        if (accountStatus(error) !== 401) throw error;
        stage = 'session';
        const token = await getToken({ skipCache: true });
        controller.signal.throwIfAborted(); // Fence a late token after timeout/logout.
        if (!token) throw error;
        stage = 'api';
        return read({ Authorization: `Bearer ${token}` }, controller.signal);
      }
    };
    return await Promise.race([operation(), stopped]);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
    if (rejectOnAbort) controller.signal.removeEventListener('abort', rejectOnAbort);
  }
}

export const accountReadOptions = {
  // Native connectivity hints may be stale after restart; perform the bounded read.
  networkMode: 'always',
  retry: retryAccountRead,
  retryDelay: (attempt: number) => Math.min(500 * 2 ** attempt, 2000),
  refetchOnReconnect: true,
  // Permission/setup error screens mount their own header/profile observer.
  // Do not let that observer restart the same failed read in a render loop.
  retryOnMount: false,
} as const;
