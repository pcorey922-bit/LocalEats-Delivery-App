import assert from 'node:assert/strict';
// Actual main.tsx, lazy App, Clerk wrapper and driver UI. Native/Clerk are
// explicitly simulated; the API and disposable migrated DB are real local code.
export async function verifyNativeStartupBootstrap({ actor, origin }) {
  const blocked = await actor('driver');
  await blocked.context().addInitScript(() => { window.qaNativeBootstrap = true; window.qaProviderBlocked = true; });
  await blocked.clock.install();
  await blocked.goto(origin + '/driver');
  await blocked.getByRole('status').filter({ hasText: 'NATIVE_RESTORING' }).waitFor();
  await blocked.clock.fastForward(31000);
  await blocked.getByRole('alert').filter({ hasText: 'NATIVE_STARTUP_TIMEOUT_RESTORING' }).waitFor();
  await blocked.getByRole('button', { name: 'Reload app', exact: true }).waitFor();
  assert.equal(await blocked.getByRole('button', { name: 'Go online', exact: true }).count(), 0);
  const restored = await actor('driver');
  await restored.context().addInitScript(() => {
    window.qaNativeBootstrap = true;
    // A native/polyfilled response can have no exposed stream while text()
    // still contains the valid, authenticated API payload. Do not synthesize roles.
    const transport = window.fetch;
    window.fetch = async (...args) => {
      const response = await transport(...args);
      if (/\/api\/(profiles\/me|session\/access)(?:\?|$)/.test(String(args[0])))
        Object.defineProperty(response, 'body', {value:null});
      return response;
    };
  });
  await restored.goto(origin + '/driver');
  try { await restored.getByRole('button', { name: 'Go online', exact: true }).waitFor({timeout:3000}); }
  catch (error) { console.log('Streamless authenticated response diagnostic:', await restored.getByRole('alert').allTextContents()); throw error; }

  await restored.getByRole('heading', { name: 'Local deliveries.', exact: true }).waitFor();
  assert.equal(await restored.getByText(/NATIVE_STARTUP_TIMEOUT/).count(), 0);
  await restored.reload();
  await restored.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  assert.equal(await restored.getByRole('complementary', { name: 'On-duty location status', exact: true }).count(), 0);
  const emptyAccess = await actor('driver');
  await emptyAccess.context().addInitScript(() => { window.qaNativeBootstrap = true; });
  await emptyAccess.route('**/api/session/access', route => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  await emptyAccess.goto(origin + '/account/access?join=driver');
  await emptyAccess.getByRole('alert').filter({ hasText: 'ACCOUNT_ACCESS_RESPONSE_INVALID' }).waitFor({ timeout: 3000 });
  await emptyAccess.unroute('**/api/session/access');
  await emptyAccess.getByRole('button', { name: 'Refresh access', exact: true }).click();
  await emptyAccess.getByRole('definition').filter({ hasText: 'active' }).waitFor();
  await emptyAccess.getByRole('link', { name: 'Driver workspace', exact: true }).click();
  await emptyAccess.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  const emptyProfile = await actor('driver');
  await emptyProfile.context().addInitScript(() => { window.qaNativeBootstrap = true; });
  await emptyProfile.route('**/api/profiles/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: 'null' }));
  await emptyProfile.goto(origin + '/driver');
  await emptyProfile.getByRole('alert').filter({ hasText: 'ACCOUNT_PROFILE_RESPONSE_INVALID_EMPTY' }).waitFor();
  assert.equal(await emptyProfile.getByRole('button', { name: 'Go online', exact: true }).count(), 0);
  await emptyProfile.reload();
  await emptyProfile.getByRole('alert').filter({ hasText: 'ACCOUNT_PROFILE_RESPONSE_INVALID_EMPTY' }).waitFor();
  await emptyProfile.unroute('**/api/profiles/me');
  await emptyProfile.getByRole('button', { name: 'Retry', exact: true }).click();
  await emptyProfile.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  const failedAccess = await actor('driver');
  await failedAccess.context().addInitScript(() => { window.qaNativeBootstrap = true; });
  await failedAccess.clock.install();
  await failedAccess.route('**/api/session/access', () => {});
  await failedAccess.goto(origin + '/account/access?join=driver');
  await failedAccess.getByRole('status').filter({ hasText: 'Checking account permissions' }).waitFor();
  await failedAccess.clock.fastForward(21000);
  await failedAccess.getByRole('alert').filter({ hasText: 'ACCOUNT_API_TIMEOUT' }).waitFor();
  await failedAccess.unroute('**/api/session/access');
  await failedAccess.route('**/api/session/access', route => route.fulfill({status:403,contentType:'application/json',body:'{"error":"Access denied"}'}));
  await failedAccess.getByRole('button', { name: 'Refresh access', exact: true }).click();
  await failedAccess.getByRole('alert').filter({ hasText: 'ACCOUNT_403' }).waitFor();
  await failedAccess.unroute('**/api/session/access');
  await failedAccess.getByRole('button', { name: 'Refresh access', exact: true }).click();
  await failedAccess.getByRole('definition').filter({ hasText: 'active' }).waitFor();
  await failedAccess.clock.fastForward(31000);
  assert.equal(await failedAccess.getByRole('heading', {name:'App startup did not finish'}).count(),0,'Resolved access screen remains ready');
  await restored.goto(origin + '/dashboard?join=driver');
  await restored.waitForURL(origin + '/driver');
  await restored.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  // Exercise actual portal/menu anchors, including a full document navigation.
  await restored.goto(origin + '/account');
  await restored.getByRole('button', { name: 'Menu', exact: true }).click();
  await restored.getByRole('link', { name: 'Driver workspace', exact: true }).click();
  await restored.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  await restored.goto(origin + '/account/access?join=driver');
  await restored.getByRole('link', { name: 'Driver workspace', exact: true }).click();
  await restored.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  for (const page of [blocked, restored]) assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  console.log('PASS: actual native routes reject empty account responses, timeout/403 reads visibly, recover on explicit retry, route legacy Dashboard to Driver and restore controls after restart. Native/Clerk simulated.');
  console.log('PASS: actual native main bootstrap exits withheld-provider loading within 30 seconds; restored/restarted approved session reaches driver controls without auto-starting GPS. SDK/native simulated; no provider/device claim.');
}
