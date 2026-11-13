import assert from 'node:assert/strict';

// Actual website + API + disposable relational DB; no order or payment submitted.
export async function verifyCheckout({ actor, origin, ids }) {
  // Touch-enabled Chromium, real queries and API. Clerk identity remains simulated.
  for (const failure of [503, 'network', 401]) {
    const recovery = await actor('customer');
    let requests = 0, refreshedBearer = false;
    await recovery.route('**/api/profiles/me', route => {
      requests++;
      if (requests === 1) return failure === 'network' ? route.abort('internetdisconnected') : route.fulfill({ status: failure, contentType: 'application/json', body: JSON.stringify({ error: 'Intentional transient session failure' }) });
      refreshedBearer ||= route.request().headers().authorization === 'Bearer qa-refreshed-token';
      return route.fallback();
    });
    await recovery.goto(origin + '/cart');
    await recovery.getByRole('heading', { name: 'Review your delivery.', exact: true }).waitFor();
    assert.equal(requests, 2);
    assert.equal(await recovery.getByRole('button', { name: 'Try again', exact: true }).count(), 0);
    assert.equal(await recovery.evaluate(() => window.qaTokenRefreshes || 0), failure === 401 ? 1 : 0);
    assert.equal(refreshedBearer, failure === 401);
    await recovery.close();
  }
  const forbidden = await actor('customer');
  let forbiddenReads = 0, forbiddenAddresses = 0;
  forbidden.on('request', request => { if (new URL(request.url()).pathname === '/api/addresses/me') forbiddenAddresses++; });
  await forbidden.route('**/api/profiles/me', route => { forbiddenReads++; return route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"Account unavailable"}' }); });
  await forbidden.goto(origin + '/cart');
  await forbidden.getByRole('button', { name: 'Try again', exact: true }).waitFor();
  assert.equal(forbiddenReads, 1);
  assert.equal(forbiddenAddresses, 0);
  await forbidden.unroute('**/api/profiles/me');
  await forbidden.getByRole('button', { name: 'Try again', exact: true }).click();
  await forbidden.getByRole('heading', { name: 'Review your delivery.', exact: true }).waitFor();
  await forbidden.close();
  for (const role of ['admin', 'restaurant', 'driver']) {
    const page = await actor(role);
    let addressRequests = 0;
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/addresses/me') addressRequests++; });
    await page.goto(origin + '/cart');
    await page.getByRole('heading', { name: 'Customer account required', exact: true }).waitFor();
    assert.equal(addressRequests, 0);
    const denied = await fetch(origin + '/api/addresses/me', { headers: { 'x-test-user': ids[role] } });
    assert.equal(denied.status, 403);
    await page.close();
  }
  const page = await actor('customer');
  // Observe every DOM update, rather than only the final state after a reload.
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const ids = [...document.querySelectorAll('.roco-cart-item')].map(row => row.getAttribute('data-cart-line-id')).filter(Boolean);
      if (ids.length !== new Set(ids).size) sessionStorage.setItem('qa-duplicate-cart-dom', JSON.stringify(ids));
    }).observe(document, { childList: true, subtree: true, attributes: true });
  });
  await page.goto(origin);
  await page.evaluate(({ fries, business }) => {
    sessionStorage.setItem('qa-pending', '1');
    localStorage.setItem('rocoeats-guest-cart:v1', JSON.stringify([{ menuItemId: fries, name: 'French fries', priceCents: 349, quantity: 2, restaurantId: business, restaurantName: 'Old guest kitchen' }]));
  }, ids);
  await page.goto(origin + `/restaurants/${ids.business}`);
  const meal = name => page.locator('.roco-menu-item').filter({ has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) });
  await meal('French fries').getByRole('button', { name: 'Add to cart', exact: true }).waitFor();
  assert.equal(await meal('French fries').getByRole('button', { name: 'Add to cart', exact: true }).isDisabled(), true);
  await page.getByRole('link', { name: 'Cart (0)', exact: true }).waitFor();
  await page.evaluate(() => { sessionStorage.removeItem('qa-pending'); window.qaAuthReady = true; window.dispatchEvent(new Event('qa-auth-change')); });
  await meal('French fries').getByRole('button', { name: 'Add to cart', exact: true }).tap();
  await meal('French fries').getByText('1 in cart', { exact: true }).waitFor();
  await meal('Cheeseburger').getByRole('button', { name: 'Add to cart', exact: true }).tap();
  await meal('Soda').getByRole('button', { name: 'Add to cart', exact: true }).tap();
  await page.getByRole('link', { name: 'Cart (3)', exact: true }).click();
  await page.locator('.roco-cart-item').first().waitFor();
  assert.equal(await page.locator('.roco-cart-item').count(), 3);
  const friesRow = () => page.locator('.roco-cart-item').filter({ hasText: 'French fries' });
  assert.equal(await friesRow().count(), 1);

  await page.getByRole('status', { name: 'Cart food subtotal', exact: true }).filter({ hasText: '$14.48' }).waitFor();
  // Reuse the same JS stores through auth hydration. A suspended document may
  // miss storage events: subscription must reconcile before showing its cart.
  await page.evaluate(id => {
    const key = `rocoeats-cart:v2:${id}`;
    const correct = JSON.parse(localStorage.getItem(key));
    const fries = correct.find(line => line.name === 'French fries');
    window.qaCorrectCart = JSON.stringify(correct);
    localStorage.setItem(key, JSON.stringify([...correct, { ...fries, specialInstructions: 'Separate preparation' }]));
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }, ids.customer);
  await page.waitForFunction(() => document.querySelectorAll('.roco-cart-item').length === 4);
  await page.evaluate(() => { window.qaAuthReady = false; window.dispatchEvent(new Event('qa-auth-change')); });
  await page.getByTestId('status-loading').waitFor();
  await page.evaluate(id => {
    localStorage.setItem(`rocoeats-cart:v2:${id}`, window.qaCorrectCart);
    window.qaAuthReady = true;
    window.dispatchEvent(new Event('qa-auth-change'));
  }, ids.customer);
  await page.waitForFunction(() => document.querySelectorAll('.roco-cart-item').length === 3);
  assert.equal(await friesRow().count(), 1);
  await page.getByRole('status', { name: 'Cart food subtotal', exact: true }).filter({ hasText: '$14.48' }).waitFor();

  // Hold an old empty address response until after a successful save. The saved
  // option must be cached/selected before this stale GET can finish.
  let releaseOld;
  let captured = false;
  const addressPath = '**/api/addresses/me';
  await page.route(addressPath, async route => {
    if (route.request().method() !== 'GET' || captured) return route.fallback();
    captured = true;
    const response = await route.fetch({ headers: { ...route.request().headers(), 'x-test-user': ids.customer } });
    await new Promise(resolve => { releaseOld = resolve; });
    await route.fulfill({ response }).catch(() => {});
  });
  await page.reload();
  await page.getByText('Loading saved addresses…', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Add address', exact: true }).click();
  await page.getByLabel('Street address', { exact: true }).fill('200 Mobile Test Way');
  await page.getByLabel('Apartment / unit (optional)', { exact: true }).fill('Unit 2');
  await page.getByLabel('City', { exact: true }).fill('Kingston');
  await page.getByLabel('ZIP code', { exact: true }).fill('37763');
  await page.getByLabel('Delivery instructions', { exact: true }).fill('Meet at door');
  await page.getByLabel('Set as default address', { exact: true }).check();
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/addresses/me') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save address', exact: true }).click();
  const savedResult = await savedResponse;
  assert.equal(savedResult.status(), 201);
  const saved = await savedResult.json();
  assert.ok(saved.id);
  await page.waitForFunction(id => document.querySelector('select')?.value === id, saved.id);
  releaseOld();
  await page.unroute(addressPath);
  assert.equal(await page.getByLabel('Delivery address', { exact: true }).inputValue(), saved.id);
  const quoted = page.waitForResponse(response => response.url().endsWith('/api/orders/quote'));
  await page.getByRole('button', { name: 'Calculate test total', exact: true }).click();
  assert.equal((await (await quoted).json()).subtotalCents, 1448);
  for (const [status, message] of [[401, 'Your sign-in session could not be verified'], [403, 'This account cannot access delivery addresses'], [500, 'Your saved delivery addresses could not be loaded']]) {
    await page.route(addressPath, route => route.request().method() === 'GET' ? route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'Intentional address failure' }) }) : route.fallback());
    await page.reload();
    await page.getByRole('alert').filter({ hasText: message }).waitFor();
    if (status === 401 || status === 403) assert.equal(await page.getByRole('button', { name: 'Add address', exact: true }).count(), 0);
    await page.unroute(addressPath);
    await page.getByRole('button', { name: 'Retry addresses', exact: true }).click();
    await page.waitForFunction(id => document.querySelector('select')?.value === id, saved.id);
  }
  // A temporary address network failure recovers automatically, retaining cart.
  let addressAttempts = 0;
  await page.route(addressPath, route => {
    if (route.request().method() !== 'GET') return route.fallback();
    if (++addressAttempts === 1) return route.abort('internetdisconnected');
    return route.fallback();
  });
  await page.reload();
  await page.waitForFunction(id => document.querySelector('select')?.value === id, saved.id);
  assert.equal(addressAttempts, 2);
  await page.unroute(addressPath);
  await page.context().setOffline(true);
  await page.getByText('You’re offline.', { exact: false }).waitFor();
  assert.equal(await page.locator('.roco-cart-item').count(), 3);
  await page.context().setOffline(false);
  await page.getByText('You’re offline.', { exact: false }).waitFor({ state: 'hidden' });
  await page.waitForFunction(id => document.querySelector('select')?.value === id, saved.id);

  // Same document, different identity, without relying on a cache-clear event.
  await page.evaluate(id => { sessionStorage.setItem('qa-user', id); window.qaUserId = id; window.dispatchEvent(new Event('qa-auth-change')); }, ids.otherCustomer);
  await page.getByText('No saved delivery addresses. Add one to continue.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('option', { name: /200 Mobile Test Way/ }).count(), 0);
  await page.evaluate(id => { sessionStorage.setItem('qa-user', id); window.qaUserId = id; window.dispatchEvent(new Event('qa-auth-change')); }, ids.customer);
  await page.waitForFunction(id => document.querySelector('select')?.value === id, saved.id);
  await page.goto(origin + `/restaurants/${ids.business}`);
  // Toggling an optional selection back off must not create a second plain line.
  await meal('French fries').getByLabel('Extra salt (+$0.00)', { exact: true }).check();
  await meal('French fries').getByLabel('Extra salt (+$0.00)', { exact: true }).uncheck();
  await meal('French fries').getByRole('button', { name: 'Add to cart', exact: true }).tap();
  await meal('French fries').getByLabel('Preparation instructions (optional)').fill('No salt');
  await meal('French fries').getByRole('button', { name: 'Add to cart', exact: true }).tap();
  await page.getByRole('link', { name: 'Cart (5)', exact: true }).click();
  await friesRow().first().waitFor();
  assert.equal(await friesRow().count(), 2);
  const stored = await page.evaluate(id => JSON.parse(localStorage.getItem(`rocoeats-cart:v2:${id}`)), ids.customer);
  assert.equal(stored.filter(line => line.menuItemId === ids.fries && !line.specialInstructions).length, 1);
  assert.equal(stored.find(line => line.menuItemId === ids.fries && !line.specialInstructions).quantity, 2);
  assert.equal(stored.find(line => line.specialInstructions === 'No salt').quantity, 1);
  const otherTab = await page.context().newPage();
  await otherTab.goto(origin);
  await page.bringToFront();
  await page.reload();
  await friesRow().first().waitFor();
  assert.equal(await friesRow().count(), 2);
  const requoted = page.waitForResponse(response => response.url().endsWith('/api/orders/quote'));
  await page.getByRole('button', { name: 'Calculate test total', exact: true }).click();
  assert.equal((await (await requoted).json()).subtotalCents, 2146);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  // Real same-origin tab writes produce storage events, without refresh.
  await otherTab.evaluate(id => {
    const key = `rocoeats-cart:v2:${id}`;
    localStorage.setItem(key, JSON.stringify(JSON.parse(localStorage.getItem(key)).map(line => line.name === 'Soda' ? { ...line, quantity: 2 } : line)));
  }, ids.customer);
  await page.getByLabel('Soda quantity', { exact: true }).filter({ hasText: '2' }).waitFor();
  await page.goBack();
  await page.goForward();
  await page.getByLabel('Soda quantity', { exact: true }).filter({ hasText: '2' }).waitFor();
  await page.reload();
  await page.getByLabel('Soda quantity', { exact: true }).filter({ hasText: '2' }).waitFor();
  assert.equal(await page.evaluate(() => sessionStorage.getItem('qa-duplicate-cart-dom')), null, 'No temporary duplicate cart DOM across taps, hydration, navigation, refresh and tab changes');
  await page.goto(origin + '/dashboard');
  await page.getByTestId('list-dashboard-sections').waitFor();
  assert.equal(await page.locator('a[href="/notifications"]').count(), 1);
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  await menu.tap();
  const accountNav = page.getByRole('navigation', { name: 'Account navigation', exact: true });
  await accountNav.waitFor();
  await accountNav.getByRole('link', { name: 'Account', exact: true }).tap();
  await page.getByTestId('page-account').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await otherTab.close();
  await page.close();
  console.log('Checkout PASS: automatic network/503 recovery, single Clerk refresh on 401, denied 403, missed resume events, offline/reconnect, touch taps, tab storage/navigation, one Notifications link and collapsible mobile navigation; one-tap three-item $14.48 cart, auth hydration isolation, canonical modifiers/instructions, tab switch/reload, address loading/save race, 401/403/500 recovery, identity-scoped addresses and customer-only checkout. No orders/payments submitted by these checks.');
}
