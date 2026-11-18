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
  await restored.context().addInitScript(() => { window.qaNativeBootstrap = true; });
  await restored.goto(origin + '/driver');
  await restored.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  await restored.getByRole('heading', { name: 'Local deliveries.', exact: true }).waitFor();
  assert.equal(await restored.getByText(/NATIVE_STARTUP_TIMEOUT/).count(), 0);
  await restored.reload();
  await restored.getByRole('button', { name: 'Go online', exact: true }).waitFor();
  assert.equal(await restored.getByRole('complementary', { name: 'On-duty location status', exact: true }).count(), 0);
  for (const page of [blocked, restored]) assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  console.log('PASS: actual native main bootstrap exits withheld-provider loading within 30 seconds; restored/restarted approved session reaches driver controls without auto-starting GPS. SDK/native simulated; no provider/device claim.');
}
