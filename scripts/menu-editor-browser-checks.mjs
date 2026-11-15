import assert from 'node:assert/strict';

// Real menu API and disposable database. Only the explicit 503 response is
// simulated; no hosted restaurant or customer data is touched.
export async function verifyMenuEditor({ restaurant, customer, api, origin, ids }) {
  await restaurant.getByRole('tab', { name: 'Menu management', exact: true }).click();
  const original = await api('restaurant', '/restaurants/me');
  const category = original.categories.find(c => c.id === ids.category);
  const originalItem = category.items.find(i => i.id === ids.item);
  const inventory = await api('restaurant', '/restaurants/me/inventory');
  const card = restaurant.locator('section.roco-card').filter({ has: restaurant.getByRole('heading', { name: category.name, exact: true }) });
  await card.getByRole('button', { name: 'Add item', exact: true }).click();
  const editor = restaurant.getByRole('region', { name: 'Add menu item', exact: true });
  await editor.getByLabel('Item name', { exact: true }).fill('Phone menu test');
  const price = editor.getByLabel('Price in dollars', { exact: true });
  let postCount = 0;
  const countPost = request => { if (request.url().endsWith('/api/restaurants/me/menu-items') && request.method() === 'POST') postCount++; };
  restaurant.on('request', countPost);
  for (const invalid of ['', '-1', '1.001', '1e2', '10000.01']) {
    await price.fill(invalid);
    await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  }
  assert.equal(postCount, 0, 'Invalid prices never reach the API');
  await price.fill('2.01');
  await editor.getByLabel('Description (optional)', { exact: true }).fill('Freshly prepared, with clear ingredient details.');
  const endpoint = '**/api/restaurants/me/menu-items';
  await restaurant.route(endpoint, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Intentional pre-commit outage' }) }));
  await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  await editor.getByRole('alert').filter({ hasText: 'We could not confirm the save.' }).waitFor();
  assert.equal(await price.inputValue(), '2.01');
  assert.equal(await editor.getByLabel('Item name', { exact: true }).inputValue(), 'Phone menu test');
  await restaurant.unroute(endpoint);
  // Hold the response after the actual API commits and dispatch a second submit.
  // It must not create a second request while the first save is in flight.
  let release, received;
  const held = new Promise(resolve => { release = resolve; });
  const committed = new Promise(resolve => { received = resolve; });
  await restaurant.route(endpoint, async route => {
    const response = await route.fetch({ headers: { ...route.request().headers(), 'x-test-user': ids.restaurant } });
    received();
    await held;
    await route.fulfill({ response });
  });
  const before = postCount;
  await editor.getByRole('button', { name: 'Save item', exact: true }).click();
  await committed;
  assert.equal(await editor.getByRole('button', { name: 'Saving item…', exact: true }).isDisabled(), true);
  await editor.locator('form').dispatchEvent('submit');
  release();
  await editor.waitFor({ state: 'detached' });
  assert.equal(postCount, before + 1, 'Only one in-flight creation request');
  await restaurant.unroute(endpoint);
  restaurant.off('request', countPost);
  const created = (await api('restaurant', '/restaurants/me')).categories.flatMap(c => c.items).filter(i => i.name === 'Phone menu test');
  assert.equal(created.length, 1);
  assert.equal(created[0].priceCents, 201);
  assert.equal(created[0].description, 'Freshly prepared, with clear ingredient details.');

  const itemRow = card.locator('.roco-menu-item').filter({ has: restaurant.locator('strong', { hasText: /^Local supper$/ }) });
  await itemRow.getByRole('button', { name: 'Edit', exact: true }).click();
  const edit = restaurant.getByRole('region', { name: 'Edit menu item', exact: true });
  await edit.getByLabel('Description (optional)', { exact: true }).fill('Updated restaurant description');
  await edit.getByRole('button', { name: 'Save item', exact: true }).click();
  await edit.waitFor({ state: 'detached' });
  const updated = (await api('restaurant', '/restaurants/me')).categories.flatMap(c => c.items).find(i => i.id === ids.item);
  assert.deepEqual(updated, { ...originalItem, description: 'Updated restaurant description' }, 'Editing details preserves price, availability and modifiers');
  assert.deepEqual((await api('restaurant', '/restaurants/me/inventory')).filter(i => inventory.some(original => original.id === i.id)), inventory, 'Editing details preserves existing inventory and revisions');
  await customer.goto(origin + `/restaurants/${ids.business}`);
  await customer.getByText('Updated restaurant description', { exact: true }).waitFor();
  await customer.getByText(created[0].description, { exact: true }).waitFor();
  await restaurant.reload();
  await restaurant.getByRole('tab', { name: 'Menu management', exact: true }).click();
  await card.getByText('Updated restaurant description', { exact: true }).waitFor();
  await itemRow.getByRole('button', { name: 'Edit', exact: true }).click();
  await edit.getByLabel('Description (optional)', { exact: true }).fill('');
  await edit.getByRole('button', { name: 'Save item', exact: true }).click();
  await edit.waitFor({ state: 'detached' });
  assert.equal((await api('restaurant', '/restaurants/me')).categories.flatMap(c => c.items).find(i => i.id === ids.item).description, null, 'Descriptions can be cleared');
  await card.getByRole('button', { name: 'Add item', exact: true }).click();
  await editor.getByLabel('Item name', { exact: true }).fill('Cancelled item');
  await editor.getByRole('button', { name: 'Cancel editing', exact: true }).click();
  assert.equal((await api('restaurant', '/restaurants/me')).categories.flatMap(c => c.items).some(i => i.name === 'Cancelled item'), false);
  assert.equal(await restaurant.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Menu form fits a phone viewport');
  console.log('PASS: mobile menu create/edit/clear/cancel, exact cents, input validation, failed-save recovery, in-flight duplicate prevention, customer-visible descriptions and unchanged inventory/modifiers. Real local API; no provider calls.');
}
