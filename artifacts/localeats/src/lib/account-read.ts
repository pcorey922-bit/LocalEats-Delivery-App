import { accountStatus } from './account-entry';

// Only use for reads: a network retry must never replay checkout or account writes.
export function retryAccountRead(failureCount: number, error: unknown) {
  if (failureCount >= 2 || (error instanceof Error && error.name === 'AbortError')) return false;
  const status = accountStatus(error);
  return status === undefined || status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export async function sessionRead<T>(
  read: (headers?: HeadersInit) => Promise<T>,
  getToken: (options: { skipCache: boolean }) => Promise<string | null>,
) {
  try { return await read(); }
  catch (error) {
    // Refresh Clerk once after a rejected session. Never retry a forbidden role,
    // missing profile, or write, and never substitute a guest capability.
    if (accountStatus(error) !== 401) throw error;
    const token = await getToken({ skipCache: true });
    if (!token) throw error;
    return read({ Authorization: `Bearer ${token}` });
  }
}

export const accountReadOptions = {
  retry: retryAccountRead,
  retryDelay: (attempt: number) => Math.min(500 * 2 ** attempt, 2000),
  refetchOnReconnect: true,
  // Permission/setup error screens mount their own header/profile observer.
  // Do not let that observer restart the same failed read in a render loop.
  retryOnMount: false,
} as const;
