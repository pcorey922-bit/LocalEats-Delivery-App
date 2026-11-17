import assert from 'node:assert/strict';

export async function verifyPublicInformation({ actor, origin }) {
  const page = await actor('guest');
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin);
    const links = page.getByRole('navigation', { name: 'RoCoEats information', exact: true });
    assert.equal(await links.getByRole('link').count(), 6);
    for (const [name, path, title] of [
      ['About', '/about', 'About RoCoEats'], ['How it works', '/how-it-works', 'How RoCoEats works'],
      ['Contact & support', '/support', 'Contact & support'], ['FAQ', '/faq', 'Frequently asked questions'],
      ['Privacy', '/privacy', 'Privacy policy publication'], ['Terms', '/terms', 'Terms of service publication'],
    ]) {
      await links.getByRole('link', { name, exact: true }).click();
      await page.waitForURL(origin + path);
      await page.getByRole('heading', { level: 1, name: title, exact: true }).waitFor();
      await page.getByRole('status').filter({ hasText: 'Private staging · TEST payments only.' }).waitFor();
      if (['/privacy', '/terms'].includes(path)) await page.getByRole('heading', { name: 'Approved document not yet published', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${path} at ${width}px`);
    }
  }
  const directory = '**/api/restaurants';
  for (const status of [401, 403, 503]) {
    await page.route(directory, route => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'Controlled directory response' }) }));
    await page.goto(origin + '/restaurants');
    const access = page.getByRole('region', { name: 'Restaurant access', exact: true });
    await access.getByRole('heading', { name: status === 401 ? 'Sign in to browse private staging' : status === 403 ? 'Check your staging invitation' : 'Restaurant information could not be loaded', exact: true }).waitFor();
    assert.equal(await access.getByRole('link', { name: 'Sign in', exact: true }).count(), status === 401 ? 1 : 0);
    assert.equal(await page.getByText('API unavailable', { exact: false }).count(), 0);
    await page.unroute(directory);
  }
  await page.getByRole('button', { name: 'Retry restaurant information', exact: true }).click();
  await page.getByRole('link', { name: 'View menu', exact: false }).first().waitFor();
  const logo = await (await fetch(origin + '/logo.svg')).text();
  assert.ok(logo.includes('#111E30') && logo.includes('#EFBD68') && !logo.includes('#254337'), 'Navy/gold mark replaces the legacy green heart');
  console.log('PASS: public information/support/legal publication routes at 320/390/768px; explicit staging 401/invitation 403/outage states and retry; unified navy/gold mark. No account, order or provider write.');
}
