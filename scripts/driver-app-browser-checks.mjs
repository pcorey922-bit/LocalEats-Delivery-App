import assert from 'node:assert/strict';

// This verifies the dedicated app's shared UI and real local role checks. It is
// not evidence of a native installation, physical GPS, push receipt or signing.
export async function verifyDriverApp({ actor, api, origin }) {
  const signedOut = await actor('guest');
  await signedOut.goto(origin);
  await signedOut.waitForURL(url => url.pathname === '/sign-in' && url.searchParams.get('join') === 'driver');
  const driver = await actor('driver');
  await driver.goto(origin);
  await driver.waitForURL(origin + '/driver');
  await driver.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  await driver.getByRole('button', { name: 'Menu', exact: true }).click();
  const nav = driver.getByRole('navigation', { name: 'Main navigation', exact: true });
  await nav.getByRole('link', { name: 'Earnings', exact: true }).waitFor();
  for (const name of ['Find food', 'Orders', 'Administrator']) assert.equal(await nav.getByRole('link', { name, exact: true }).count(), 0);
  await driver.getByRole('button', { name: 'Go online', exact: true }).click();
  await driver.getByRole('button', { name: 'Go offline', exact: true }).waitFor();
  await driver.reload();
  await driver.getByRole('button', { name: 'Reconnect on this device', exact: true }).waitFor();
  assert.equal(await driver.getByRole('complementary', { name: 'On-duty location status', exact: true }).count(), 0, 'A reload never silently restarts GPS');
  await driver.getByRole('button', { name: 'Reconnect on this device', exact: true }).click();
  await driver.getByRole('button', { name: 'Go offline', exact: true }).waitFor();
  await driver.getByRole('button', { name: 'Go offline', exact: true }).click();
  await driver.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  const unapproved = await actor('unapprovedDriver');
  await unapproved.goto(origin);
  assert.equal((await api('unapprovedDriver', '/driver/availability')).approved, false);
  assert.equal(await unapproved.getByRole('button', { name: 'Go online', exact: true }).isDisabled(), true);
  const customer = await actor('otherCustomer');
  await customer.goto(origin + '/account/setup');
  await customer.waitForURL(origin + '/driver');
  await customer.getByText('Sign in with an active, administrator-approved driver profile to view deliveries.', { exact: true }).waitFor();
  assert.equal(await customer.getByRole('button', { name: 'Go online', exact: true }).count(), 0);
  assert.equal((await api('otherCustomer', '/profiles/me')).role, 'customer', 'App identity never changes the account role');
  const owner = await actor('admin');
  await owner.goto(origin);
  await owner.getByText(/Administrator delivery workspace/).waitFor();
  await owner.getByRole('button', { name: 'Go online', exact: true }).click();
  await owner.getByRole('button', { name: 'Go offline', exact: true }).waitFor();
  await owner.getByRole('button', { name: 'Go offline', exact: true }).click();
  assert.equal((await api('admin', '/profiles/me')).role, 'admin', 'Owner driver exception preserves administrator role');
  // Physical-device failure reproduction: 401 followed by Clerk never settling.
  // Only Clerk/OS transport is simulated; profile/driver role APIs remain real.
  const recovery = await actor('driver');
  await recovery.clock.install();
  await recovery.goto(origin + '/about');
  await recovery.evaluate(() => sessionStorage.setItem('qa-stall-refresh', '1'));
  await recovery.route('**/api/profiles/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Session expired"}' }));
  await recovery.goto(origin + '/driver');
  await recovery.waitForFunction(() => window.qaTokenRefreshes > 0);
  await recovery.clock.fastForward(21000);
  await recovery.getByText(/ACCOUNT_SESSION_TIMEOUT/).waitFor();
  assert.equal(await recovery.getByRole('button', { name: 'Go online', exact: true }).count(), 0);
  await recovery.getByRole('button', { name: 'Sign out and sign in again', exact: true }).waitFor();
  await recovery.reload();
  await recovery.waitForFunction(() => window.qaTokenRefreshes > 0);
  await recovery.clock.fastForward(21000);
  await recovery.getByText(/ACCOUNT_SESSION_TIMEOUT/).waitFor();
  await recovery.unroute('**/api/profiles/me');
  await recovery.evaluate(() => sessionStorage.removeItem('qa-stall-refresh'));
  await recovery.getByRole('button', { name: 'Retry', exact: true }).click();
  await recovery.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  // Transport never resolving must also leave skeletons, with no automatic writes.
  let stalledReads = 0;
  await recovery.route('**/api/profiles/me', () => { stalledReads++; });
  await recovery.reload();
  await recovery.waitForFunction(() => document.querySelector('[aria-label="Checking driver access"]'));
  await recovery.clock.fastForward(21000);
  await recovery.getByText(/ACCOUNT_API_TIMEOUT/).waitFor();
  assert.equal(stalledReads, 1);
  await recovery.unroute('**/api/profiles/me');
  await recovery.getByRole('button', { name: 'Retry', exact: true }).click();
  await recovery.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  let deniedReads = 0;
  await recovery.route('**/api/profiles/me', route => { deniedReads++; return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"Access denied"}' }); });
  await recovery.reload();
  await recovery.getByText(/ACCOUNT_403/).waitFor();
  assert.equal(deniedReads, 1, 'Forbidden role is not retried or auto-provisioned');
  assert.equal(await recovery.getByRole('button', { name: 'Go online', exact: true }).count(), 0);
  await recovery.unroute('**/api/profiles/me');
  await recovery.getByRole('button', { name: 'Retry', exact: true }).click();
  await recovery.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  console.log('PASS: stalled Clerk renewal and hung profile transport exit skeletons with phase-specific codes; restart, explicit retry and role denial preserve server authorization. Browser/native sessions are simulated.');
  const flow = { id: '11111111-1111-4111-8111-111111111119', state: 'Z'.repeat(43) };
  await owner.route('**/api/mobile/auth/approve', async route => {
    assert.deepEqual(route.request().postDataJSON(), flow, 'Presentation audience is never sent as authorization');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  for (const [app, scheme] of [['driver', 'rocoeats-driver'], ['customer', 'rocoeats'], ['https://untrusted.example', 'rocoeats']]) {
    await owner.goto(origin + '/about');
    await owner.goto(origin + `/mobile/authorize#flow=${flow.id}&state=${flow.state}&app=${encodeURIComponent(app)}`);
    await owner.getByRole('button', { name: 'Approve my app sign-in', exact: true }).click();
    assert.equal(await owner.getByRole('link', { name: /^Return to RoCoEats/ }).getAttribute('href'), `${scheme}://auth`);
  }
  await owner.unroute('**/api/mobile/auth/approve');
  for (const page of [driver, unapproved, customer, owner, recovery]) assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  console.log('PASS: dedicated driver root/sign-in intent, driver-only navigation, approved duty/reload/offline, unapproved denial, customer role preservation and owner-driver exception. Real local API, simulated Clerk; no native/device/provider claim.');
}
