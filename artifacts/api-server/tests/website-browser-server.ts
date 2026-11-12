// Bundled only by the local browser runner, with disposable DB and Clerk adapters.
// Never imported by production entrypoints or exposed as a deployed fixture.
import app from '../src/app';
import { db, engine, profilesTable, restaurantsTable, restaurantHoursTable, menuCategoriesTable, menuItemsTable, platformSettingsTable } from './database';
import { testPricing } from '../src/lib/testing/pricing';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const ids = {
  customer: '11111111-1111-4111-8111-111111111111',
  restaurant: '22222222-2222-4222-8222-222222222222',
  driver: '33333333-3333-4333-8333-333333333333',
  admin: '44444444-4444-4444-8444-444444444444',
  business: '55555555-5555-4555-8555-555555555555',
  category: '66666666-6666-4666-8666-666666666666',
  item: '77777777-7777-4777-8777-777777777777',
};

export async function start(root: string) {
  if (process.env.NODE_ENV !== 'test' || process.env.PAYMENT_PROVIDER !== 'sandbox' || process.env.TEST_DATABASE_URL || process.env.STRIPE_SECRET_KEY) {
    throw new Error('Browser workflow requires an isolated simulator without external database or Stripe credentials');
  }
  const migrations = path.join(root, 'lib/db/drizzle');
  for (const file of (await readdir(migrations)).filter(f => f.endsWith('.sql')).sort()) {
    await engine.exec(await readFile(path.join(migrations, file), 'utf8'));
  }
  await db.insert(platformSettingsTable).values({ settingKey: 'test_pricing', value: testPricing });
  for (const role of ['customer', 'restaurant', 'driver', 'admin'] as const) {
    await db.insert(profilesTable).values({ id: ids[role], clerkUserId: ids[role], role, displayName: `Browser ${role}`, driverApproved: role === 'driver' });
  }
  process.env.LOCALEATS_ADMIN_CLERK_USER_IDS = ids.admin;
  process.env.ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS = ids.admin;
  await db.insert(restaurantsTable).values({ id: ids.business, ownerProfileId: ids.restaurant, name: 'Browser Test Kitchen', description: 'Disposable local workflow fixture', street1: '100 Test Pickup', city: 'Kingston', region: 'TN', postalCode: '37763', status: 'approved', acceptingOrders: true });
  for (let weekday = 0; weekday < 7; weekday++) {
    await db.insert(restaurantHoursTable).values({ restaurantId: ids.business, weekday, openTime: '00:00', closeTime: '24:00' });
  }
  await db.insert(menuCategoriesTable).values({ id: ids.category, restaurantId: ids.business, name: 'Meals' });
  await db.insert(menuItemsTable).values({
    id: ids.item, restaurantId: ids.business, categoryId: ids.category, name: 'Local supper', priceCents: 1000,
    modifierGroups: [{ id: 'side', name: 'Choose a side', minSelections: 1, maxSelections: 1, options: [{ id: 'beans', name: 'Green beans', priceCents: 150 }] }],
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  return {
    origin: `http://127.0.0.1:${(server.address() as { port: number }).port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await engine.close();
    },
  };
}
