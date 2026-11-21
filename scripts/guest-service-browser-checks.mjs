import assert from 'node:assert/strict';

// Disposable local order only. No checkout/payment/provider request is made.
export async function verifyGuestService({ actor, api, origin, ids }) {
  const guest = await actor('guest');
  await guest.goto(origin + `/restaurants/${ids.business}`);
  await guest.getByLabel('Green beans (+$1.50)', { exact: true }).check();
  await guest.locator('.roco-menu-item').filter({ has: guest.locator('strong', { hasText: /^Local supper$/ }) }).getByRole('button', { name: 'Add to cart', exact: true }).click();
  await guest.getByRole('link', { name: 'Cart (1)', exact: true }).click();
  await guest.getByLabel('Your name', { exact: true }).fill('Guest service browser tester');
  await guest.getByLabel('Receipt email', { exact: true }).fill('guest-service@example.test');
  await guest.getByLabel('Delivery phone', { exact: true }).fill('8655550100');
  await guest.getByRole('button', { name: 'Continue as Guest', exact: true }).click();
  await guest.getByRole('button', { name: 'Add address', exact: true }).click();
  await guest.getByLabel('Street address', { exact: true }).fill('201 Disposable Delivery');
  await guest.getByLabel('City', { exact: true }).fill('Rockwood');
  await guest.getByLabel('ZIP code', { exact: true }).fill('37854');
  await guest.getByRole('button', { name: 'Save address', exact: true }).click();
  await guest.getByRole('button', { name: 'Calculate test total', exact: true }).click();
  const creation = guest.waitForResponse(r => r.url().endsWith('/api/orders') && r.request().method() === 'POST');
  await guest.getByRole('button', { name: /^Create order ·/ }).click();
  const response = await creation;
  assert.equal(response.status(), 201);
  const order = await response.json();
  await guest.getByRole('link', { name: 'Track order', exact: true }).click();
  await guest.getByRole('region', { name: 'Delivery tracking', exact: true }).getByText('Order: placed', { exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Get support', exact: true }).click();
  await guest.getByLabel('Subject', { exact: true }).fill('Guest delivery question');
  await guest.getByLabel('What happened?', { exact: true }).fill('Please confirm these disposable delivery instructions.');
  const support = guest.waitForResponse(r => r.url().endsWith('/api/support/cases') && r.request().method() === 'POST');
  await guest.getByRole('button', { name: 'Send support request', exact: true }).click();
  const supportResponse = await support;
  assert.equal(supportResponse.status(), 201);
  const entry = await supportResponse.json();
  assert.equal(entry.orderId, order.id);
  await guest.getByRole('button', { name: 'Conversation & reply', exact: true }).click();
  const admin = await actor('admin');
  await admin.goto(origin + '/operations');
  const review = admin.locator('article.roco-card').filter({ has: admin.getByRole('heading', { name: 'Guest delivery question · open', exact: true }) });
  await review.getByRole('combobox').selectOption('in_review');
  await review.getByLabel('Response to requester', { exact: true }).fill('Operations has received your delivery instructions.');
  const decision = admin.waitForResponse(r => r.url().endsWith(`/api/admin/support/cases/${entry.id}`) && r.request().method() === 'PATCH');
  await review.getByRole('button', { name: 'Update case & notify requester', exact: true }).click();
  assert.equal((await decision).status(), 200);
  await guest.getByRole('button', { name: 'Review latest conversation', exact: true }).click();
  await guest.getByText('Operations has received your delivery instructions.', { exact: true }).waitFor();
  await guest.getByLabel('Reply', { exact: true }).fill('Thank you. I will now cancel this unpaid test order.');
  const reply = guest.waitForResponse(r => r.url().endsWith(`/api/support/cases/${entry.id}/messages`) && r.request().method() === 'POST');
  await guest.getByRole('button', { name: 'Send reply', exact: true }).click();
  assert.ok((await reply).ok());
  await guest.getByText('Thank you. I will now cancel this unpaid test order.', { exact: true }).waitFor();

  // Freeze browser interval timers: successful cancellation must invalidate its
  // actual order, confirmation and tracking queries, not wait for the 10s poll.
  await guest.clock.install({ time: new Date('2026-11-15T00:00:00Z') });
  await guest.clock.pauseAt(new Date('2026-11-15T00:00:05Z'));
  await guest.clock.runFor(500);
  const currentTracking = guest.waitForResponse(r => r.url().endsWith(`/api/orders/${order.id}/tracking`) && r.request().method() === 'GET');
  await guest.getByRole('region', { name: 'Delivery tracking', exact: true }).getByRole('button', { name: 'Refresh tracking', exact: true }).click();
  await currentTracking;
  await guest.clock.runFor(500);
  guest.once('dialog', dialog => dialog.accept());
  const refreshed = guest.waitForResponse(r => r.url().endsWith(`/api/orders/${order.id}/tracking`) && r.request().method() === 'GET', { timeout: 3000 });
  const cancelled = guest.waitForResponse(r => r.url().endsWith(`/api/orders/${order.id}/cancel`) && r.request().method() === 'POST');
  await guest.getByRole('button', { name: 'Cancel / full test refund', exact: true }).click();
  assert.ok((await cancelled).ok());
  await refreshed;
  // Drain React Query's zero-delay notifications without reaching the 10s poll.
  await guest.clock.runFor(500);
  await guest.getByRole('region', { name: 'Delivery tracking', exact: true }).getByText('Order: cancelled', { exact: true }).waitFor({ timeout: 3000 });
  await guest.getByRole('region', { name: 'Restaurant confirmation', exact: true }).getByText('Your order has been cancelled. Review payment details for refund updates, if paid.', { exact: true }).waitFor({ timeout: 3000 });
  assert.equal(await guest.getByRole('button', { name: 'Cancel / full test refund', exact: true }).count(), 0);
  assert.equal(await guest.getByRole('button', { name: 'Prepare secure test payment', exact: true }).count(), 0);
  await guest.clock.resume();
  await guest.reload();
  await guest.getByRole('region', { name: 'Delivery tracking', exact: true }).getByText('Order: cancelled', { exact: true }).waitFor();
  const saved = await api('admin', `/orders/${order.id}`);
  assert.equal(saved.status, 'cancelled');
  assert.equal(saved.paymentCollected, false);
  assert.equal(saved.paymentStatus, 'failed');
  assert.equal(await guest.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  console.log('PASS: guest browser checkout/order tracking, support request, administrator response, guest reply and immediate unpaid cancellation with polling paused; refresh preserves cancellation. Real disposable local API; no payment/provider call.');
}
