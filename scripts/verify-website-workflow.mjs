import { verifyCheckout } from './checkout-browser-checks.mjs';
// Real website + API + migrated, disposable PGlite database. Only Clerk and
// payment provider are simulated. This is NOT a Stripe TEST transaction.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { tmpdir } from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(root, 'artifacts/api-server/package.json'));
const { build } = require('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const web = await mkdtemp(path.join(tmpdir(), 'rocoeats-workflow-'));
const apiTmp = path.join(root, 'artifacts/api-server/tmp');
await mkdir(apiTmp, { recursive: true });
const backend = await mkdtemp(path.join(apiTmp, 'browser-'));
let browser, server;
const pages = [], browserErrors = [];
try {
  // Never inherit hosted credentials, database connections, or ordering windows.
  for (const key of ['TEST_DATABASE_URL', 'DATABASE_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'CLERK_SECRET_KEY', 'ROCOEATS_PRIVATE_STAGING', 'LOCALEATS_ADMIN_CLERK_USER_IDS', 'ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS']) delete process.env[key];
  Object.assign(process.env, { NODE_ENV: 'test', LOG_LEVEL: 'silent', PAYMENT_PROVIDER: 'sandbox', ROCOEATS_ORDERING_ENABLED: 'true', ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED: 'false', API_MUTATION_LIMIT_PER_MINUTE: '10000', WEB_DIST_DIR: web });
  const cssDir = path.join(root, 'artifacts/localeats/dist/public/assets');
  const css = (await readdir(cssDir)).find(f => f.endsWith('.css'));
  await writeFile(path.join(web, 'app.css'), await readFile(path.join(cssDir, css)));
  await writeFile(path.join(web, 'index.html'), '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>');
  await writeFile(path.join(web, 'logo.svg'), await readFile(path.join(root, 'artifacts/localeats/public/logo.svg')));
  await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import App from './src/App'; createRoot(document.getElementById('root')).render(<App/>);`, resolveDir: path.join(root, 'artifacts/localeats'), loader: 'tsx' },
    outfile: path.join(web, 'app.js'), bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env.BASE_URL': '"/"', 'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': '"fixture"', 'import.meta.env.VITE_CLERK_PROXY_URL': 'undefined', 'import.meta.env.VITE_API_ORIGIN': 'undefined', 'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': 'undefined', 'import.meta.env.VITE_GOOGLE_MAPS_MAP_ID': 'undefined' },
    plugins: [{ name: 'test-only-clerk', setup(b) {
      b.onResolve({ filter: /^@clerk\/react\/internal$/ }, () => ({ path: 'internal', namespace: 'clerk-fixture' }));
      b.onResolve({ filter: /^@clerk\/react$/ }, () => ({ path: 'react', namespace: 'clerk-fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'clerk-fixture' }, args => ({ resolveDir: path.join(root, 'artifacts/localeats'), loader: 'js', contents: args.path === 'internal'
        ? 'export const publishableKeyFromHost=(_host,key)=>key;'
        : `import { useSyncExternalStore } from 'react';
           const subscribe=callback=>{window.addEventListener('qa-auth-change',callback);return()=>window.removeEventListener('qa-auth-change',callback)};
           export const useAuth=()=>{useSyncExternalStore(subscribe,()=>String(window.qaAuthReady)+String(window.qaUserId));return{isLoaded:window.qaAuthReady!==false,isSignedIn:!!window.qaUserId,userId:window.qaUserId,getToken:async()=>null}};
           export const useUser=()=>({isLoaded:true,user:window.qaUserId?{id:window.qaUserId,fullName:'Browser tester'}:null});
           export const ClerkProvider=({children})=>children;
           export const SignIn=()=>null, SignUp=()=>null;
           export const useSignIn=()=>({});
           export const useClerk=()=>({addListener:()=>()=>{},signOut:async()=>{location.assign('/')}});` }));
    } }],
  });
  const backendFile = path.join(backend, 'server.mjs');
  await build({
    entryPoints: [path.join(root, 'artifacts/api-server/tests/website-browser-server.ts')], outfile: backendFile, bundle: true, platform: 'node', format: 'esm',
    external: ['@electric-sql/pglite', 'stripe', 'express', 'pg', 'cors', 'pino', 'pino-http', 'http-proxy-middleware', '@clerk/shared/*', 'firebase-admin/*'],
    plugins: [{ name: 'isolated-services', setup(b) {
      b.onResolve({ filter: /^@workspace\/db$/ }, () => ({ path: path.join(root, 'artifacts/api-server/tests/database.ts') }));
      b.onResolve({ filter: /^@clerk\/express$/ }, () => ({ path: path.join(root, 'artifacts/api-server/tests/clerk.ts') }));
    } }],
  });
  const fixture = await import(pathToFileURL(backendFile));
  server = await fixture.start(root);
  const { origin } = server, { ids } = fixture;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  async function actor(role) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(id => { window.qaUserId = sessionStorage.getItem('qa-user') || id; window.qaAuthReady = sessionStorage.getItem('qa-pending') !== '1'; }, ids[role] || null);
    await context.route('**/api/**', async route => {
      try {
        const id = await route.request().frame().evaluate(() => window.qaUserId);
        await route.continue({ headers: { ...route.request().headers(), ...(id ? { 'x-test-user': id } : {}) } });
      } catch { await route.abort().catch(() => {}); }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => browserErrors.push(error.message));
    pages.push(page);
    return page;
  }
  async function api(role, url, method = 'GET', body) {
    const response = await fetch(origin + '/api' + url, { method, headers: { ...(ids[role] ? { 'x-test-user': ids[role] } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    assert.ok(response.ok, `${method} ${url}: ${response.status} ${await response.clone().text()}`);
    return response.json();
  }
  await verifyCheckout({ actor, origin, ids });
  if (process.env.ROCOEATS_CHECKOUT_ONLY !== 'true') {
  const customer = await actor('customer');
  await customer.goto(origin);
  await customer.getByRole('link', { name: 'Browse Restaurants & Menus', exact: true }).click();
  await customer.getByLabel('Search approved restaurants').fill('Browser Test');
  await customer.getByRole('link', { name: 'View menu' }).click();
  await customer.getByRole('heading', { name: 'Browser Test Kitchen', exact: true }).waitFor();
  const customerNav = customer.getByRole('navigation', { name: 'Main navigation', exact: true });
  for (const name of ['Administrator', 'Dispatch & orders', 'Driver', 'Restaurant']) assert.equal(await customerNav.getByRole('link', { name, exact: true }).count(), 0);
  await customer.getByLabel('Green beans (+$1.50)', { exact: true }).check();
  await customer.locator('.roco-menu-item').filter({ has: customer.locator('strong', { hasText: /^Local supper$/ }) }).getByLabel('Preparation instructions (optional)').fill('No onions');
  await customer.locator('.roco-menu-item').filter({ has: customer.locator('strong', { hasText: /^Local supper$/ }) }).getByRole('button', { name: 'Add to cart', exact: true }).click();
  await customer.getByRole('link', { name: 'Cart (1)', exact: true }).click();
  await customer.getByRole('button', { name: 'Add address', exact: true }).click();
  await customer.getByLabel('Street address', { exact: true }).fill('200 Test Delivery');
  await customer.getByLabel('City', { exact: true }).fill('Kingston');
  await customer.getByLabel('ZIP code', { exact: true }).fill('37763');
  await customer.getByLabel('Delivery instructions', { exact: true }).fill('Meet at door');
  await customer.getByRole('button', { name: 'Save address', exact: true }).click();
  await customer.getByLabel('Driver tip (dollars)').fill('3');
  await customer.getByRole('button', { name: 'Calculate test total', exact: true }).click();
  const savedResponse = customer.waitForResponse(r => r.url().endsWith('/api/orders') && r.request().method() === 'POST');
  await customer.getByRole('button', { name: /^Create order ·/ }).click();
  const saved = await savedResponse;
  assert.equal(saved.status(), 201);
  const order = await saved.json();
  assert.equal(order.items[0].specialInstructions, 'No onions');
  assert.equal(order.items[0].modifierSnapshot[0].option, 'Green beans');
  await customer.getByRole('button', { name: 'Prepare secure test payment', exact: true }).click();
  // Explicit stand-in for provider confirmation: only the simulator endpoint.
  // No Stripe API, hosted checkout, card, webhook delivery or transfer occurs.
  await api('customer', `/orders/${order.id}/sandbox-payment`, 'POST', { outcome: 'succeeded' });
  await customer.getByRole('link', { name: 'Track order', exact: true }).click();
  await customer.getByText('Payment succeeded · collected', { exact: true }).waitFor();
  const restaurant = await actor('restaurant');
  await restaurant.goto(origin + '/restaurant');
  const restaurantNav = restaurant.getByRole('navigation', { name: 'Main navigation', exact: true });
  await restaurantNav.getByRole('link', { name: 'Restaurant', exact: true }).waitFor();
  assert.equal(await restaurantNav.getByRole('link', { name: 'Driver', exact: true }).count(), 0);
  await restaurant.getByRole('tab', { name: 'Incoming orders', exact: true }).click();
  for (const status of ['accepted', 'preparing', 'ready for pickup']) {
    await restaurant.getByRole('button', { name: `Mark ${status}`, exact: true }).click();
  }
  const driver = await actor('driver');
  await driver.goto(origin + '/driver');
  await driver.getByRole('button', { name: 'Go online', exact: true }).click();
  assert.equal(await driver.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Administrator', exact: true }).count(), 0);
  await driver.getByRole('button', { name: 'Claim delivery', exact: true }).click();
  await driver.getByRole('button', { name: 'I’m at the restaurant', exact: true }).click();
  await driver.getByRole('button', { name: 'Confirm pickup', exact: true }).click();
  const nav = driver.getByRole('region', { name: 'Navigate to Customer', exact: true });
  assert.match(await nav.getByRole('link', { name: 'Google Maps' }).getAttribute('href'), /200.*Test.*Delivery/);
  await customer.reload();
  const codeResponse = customer.waitForResponse(r => r.url().endsWith('/delivery-code'));
  await customer.getByRole('button', { name: 'Generate handoff code', exact: true }).click();
  const { code } = await (await codeResponse).json();
  await driver.getByLabel('Customer handoff code', { exact: true }).fill(code);
  await driver.getByRole('button', { name: 'Confirm delivery with code', exact: true }).click();
  await driver.getByText(`Order ${order.id} · delivered`, { exact: true }).waitFor();
  await customer.reload();
  await customer.getByRole('heading', { name: 'Delivery receipt', exact: true }).waitFor();
  await customer.getByText(/Delivery confirmed by customer code at/).waitFor();
  const delivered = await api('customer', `/orders/${order.id}`);
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.paymentStatus, 'succeeded');
  const ledger = await api('admin', `/admin/ledger?orderId=${order.id}`);
  assert.equal(ledger.balanced, true);
  assert.equal(Number(ledger.missingPaymentBaselines), 0);
  assert.ok(ledger.journals.length >= 2);
  const payouts = (await api('admin', '/admin/payouts')).filter(p => p.orderId === order.id);
  assert.equal(payouts.length, 2);
  assert.equal(payouts.find(p => p.kind === 'driver').recipientProfileId, ids.driver);
  assert.equal(payouts.find(p => p.kind === 'driver').amountCents, 699);
  assert.equal(payouts.find(p => p.kind === 'restaurant').amountCents, 1035);
  for (const journal of ledger.journals) assert.equal(journal.lines.reduce((sum, line) => sum + line.amountCents, 0), 0);
  const admin = await actor('admin');
  await admin.goto(origin + '/admin');
  await admin.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Driver', exact: true }).click();
  await admin.getByText(/Administrator delivery workspace/).waitFor();
  await admin.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Administrator', exact: true }).click();
  await admin.getByRole('heading', { name: 'The county operations desk.', exact: true }).waitFor();
  assert.equal((await api('admin', '/profiles/me')).role, 'admin');
  for (const role of ['customer', 'restaurant', 'driver']) {
    const denied = await fetch(origin + '/api/admin/dispatch', { headers: { 'x-test-user': ids[role] } });
    assert.equal(denied.status, 403);
  }
  await admin.goto(origin + '/operations');
  await admin.getByLabel('Filter by order ID', { exact: true }).fill(order.id);
  await admin.getByRole('button', { name: 'Apply filter', exact: true }).click();
  await admin.getByText(/Trial balance is balanced/).waitFor();
  for (const [index, page] of pages.entries()) {
    if (page.isClosed()) continue;
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No mobile overflow for actor ${index}`);
    await page.screenshot({ path: path.join(web, `workflow-${index}.png`), fullPage: true });
    for (const link of await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link').all()) {
      const box = await link.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= 390, 'Workspace navigation stays visible on phones');
    }
  }
  const guest = await actor('guest');
  await guest.goto(origin);
  await guest.getByRole('link', { name: 'Order as Guest', exact: true }).click();
  await guest.getByRole('link', { name: 'View menu' }).click();
  await guest.getByLabel('Green beans (+$1.50)', { exact: true }).check();
  await guest.locator('.roco-menu-item').filter({ has: guest.locator('strong', { hasText: /^Local supper$/ }) }).getByRole('button', { name: 'Add to cart', exact: true }).click();
  await guest.getByRole('link', { name: 'Cart (1)', exact: true }).click();
  await guest.getByLabel('Your name', { exact: true }).fill('Browser guest');
  await guest.getByLabel('Receipt email', { exact: true }).fill('browser@example.test');
  await guest.getByLabel('Delivery phone', { exact: true }).fill('8655550100');
  await guest.getByRole('button', { name: 'Continue as Guest', exact: true }).click();
  await guest.getByRole('heading', { name: 'Review your delivery.', exact: true }).waitFor();
  const availabilityUrl = origin + `/restaurants/${ids.business}`;
  const settings = { acceptingOrders: false, hours: Array.from({ length: 7 }, (_, weekday) => ({ weekday, isClosed: false, openTime: '00:00', closeTime: '24:00' })) };
  await api('restaurant', '/restaurants/me/availability/settings', 'PUT', settings);
  await guest.goto(availabilityUrl);
  await guest.getByText('This restaurant has paused new orders.', { exact: true }).waitFor();
  await guest.getByText('Weekly hours (America/New_York)', { exact: true }).click();
  await guest.getByText('Sunday', { exact: true }).waitFor();
  await api('restaurant', '/restaurants/me/availability/settings', 'PUT', { ...settings, acceptingOrders: true, hours: settings.hours.map(h => ({ ...h, isClosed: true })) });
  await guest.reload();
  await guest.getByText('This restaurant is outside its ordering hours.', { exact: true }).waitFor();
  await api('restaurant', '/restaurants/me/availability/settings', 'PUT', { ...settings, acceptingOrders: true });
  const availabilityApi = '**/api/restaurants/*/availability';
  await guest.route(availabilityApi, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Intentional availability outage' }) }));
  await guest.reload();
  await guest.getByRole('alert').filter({ hasText: 'Availability could not be checked.' }).waitFor();
  await guest.unroute(availabilityApi);
  await guest.getByRole('button', { name: 'Retry availability', exact: true }).click();
  await guest.getByText('This restaurant is within its ordering hours.', { exact: true }).waitFor();
  assert.deepEqual(browserErrors, []);
  console.log(`PASS: real website/API/PGlite workflow: search, modifiers, cart/address/quote, simulator payment, restaurant acceptance/preparation, driver availability/claim/navigation/pickup/handoff, delivery receipt, balanced ledger and two earnings records; guest browsing/session/cart. Simulated Clerk and payment only. Screenshots: ${web}`);
  console.log('PASS: live restaurant hours, paused/closed status, weekly hours and availability outage recovery. Only the outage response was intercepted.');
  }
  assert.deepEqual(browserErrors, []);
} catch (error) {
  console.error('Website workflow failed. Local artifacts:', web);
  for (const [index, page] of pages.entries()) {
    if (page.isClosed()) continue;
    console.error(`Actor ${index} at ${page.url()}:`, (await page.locator('body').innerText()).slice(-6000));
    await page.screenshot({ path: path.join(web, `failure-${index}.png`), fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(backend, { recursive: true, force: true });
}
