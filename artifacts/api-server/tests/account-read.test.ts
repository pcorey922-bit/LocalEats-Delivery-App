import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retryAccountRead, sessionRead, AccountReadTimeout, accountReadOptions } from '../../localeats/src/lib/account-read';

test('account reads retry bounded network/server failures, never rejected permissions or aborts', () => {
  for (const error of [new TypeError('Failed to fetch'), { status: 503 }, { status: 408 }, { status: 429 }]) {
    assert.equal(retryAccountRead(0, error), true);
    assert.equal(retryAccountRead(1, error), true);
    assert.equal(retryAccountRead(2, error), false);
  }
  for (const status of [400, 401, 403, 404, 409]) assert.equal(retryAccountRead(0, { status }), false);
  assert.equal(retryAccountRead(0, new DOMException('Canceled', 'AbortError')), false);
});
test('a read rejected with 401 refreshes Clerk once and supplies the fresh token only to that read', async () => {
  let reads = 0, refreshes = 0;
  const result = await sessionRead(async headers => {
    reads++;
    if (!headers) throw { status: 401 };
    assert.equal(new Headers(headers).get('authorization'), 'Bearer refreshed');
    return 'profile';
  }, async options => { refreshes++; assert.equal(options.skipCache, true); return 'refreshed'; });
  assert.equal(result, 'profile');
  assert.equal(reads, 2);
  assert.equal(refreshes, 1);
});
test('a persistent 401 or forbidden role never loops or falls back to a guest session', async () => {
  for (const status of [401, 403, 404]) {
    let reads = 0, refreshes = 0;
    await assert.rejects(sessionRead(async () => { reads++; throw { status }; }, async () => { refreshes++; return 'token'; }));
    assert.equal(reads, status === 401 ? 2 : 1);
    assert.equal(refreshes, status === 401 ? 1 : 0);
  }
});

test('stalled Clerk renewal times out and fences a late token without another API read', async () => {
  let reads = 0, finish!: (token: string) => void;
  const result = sessionRead(async () => { reads++; throw { status: 401 }; }, () => new Promise(resolve => { finish = resolve; }), { timeoutMs: 15 });
  await assert.rejects(result, error => error instanceof AccountReadTimeout && error.code === 'ACCOUNT_SESSION_TIMEOUT');
  finish('late-private-fixture');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reads, 1);
  assert.equal(retryAccountRead(0, new AccountReadTimeout('session')), false);
  assert.equal(accountReadOptions.networkMode, 'always');
});
test('hung API reads have a bounded deadline and receive cancellation', async () => {
  let requestSignal: AbortSignal | undefined;
  await assert.rejects(sessionRead((_headers, signal) => { requestSignal = signal; return new Promise(() => {}); }, async () => null, { timeoutMs: 15 }), error => error instanceof AccountReadTimeout && error.code === 'ACCOUNT_API_TIMEOUT');
  assert.equal(requestSignal?.aborted, true);
});
test('unmount or logout aborts stalled renewal and never forwards a late credential', async () => {
  const controller = new AbortController();
  let finish!: (token: string) => void, refreshStarted!: () => void, reads = 0;
  const started = new Promise<void>(resolve => { refreshStarted = resolve; });
  const result = sessionRead(async () => { reads++; throw { status: 401 }; }, () => { refreshStarted(); return new Promise(resolve => { finish = resolve; }); }, { signal: controller.signal });
  await started; controller.abort(new DOMException('Account changed', 'AbortError'));
  await assert.rejects(result, { name: 'AbortError' });
  finish('old-account-token'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(reads, 1);
});
