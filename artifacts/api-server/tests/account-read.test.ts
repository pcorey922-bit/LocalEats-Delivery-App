import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retryAccountRead, sessionRead } from '../../localeats/src/lib/account-read';

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
