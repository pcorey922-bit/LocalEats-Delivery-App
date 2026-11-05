# RoCoEats test deployment and release preparation

**Live charges are deliberately disabled in code. This branch is not approved for public launch.**
Only `PAYMENT_PROVIDER=sandbox` (development/test only) and `stripe_test` with an
`sk_test_…` secret are supported. Live and restricted Stripe keys are rejected.
No real card information should be entered in the simulator or Stripe test mode.

## What is implemented

- Server-priced quotes, fees, configurable illustrative tax, tips, service ZIPs,
  and idempotent order creation. Reviewed totals must still match at creation.
- Hosted Stripe **test** Checkout, signed raw-body webhooks, session/amount/currency
  verification, replay protection, and a local simulator with success/decline.
- Restaurant acceptance, preparation, ready-for-pickup, administrator-approved
  driver claims/reassignment, pickup, delivery, and support cancellation.
- Full test refunds, cancellation of pending hosted sessions, refund webhooks,
  immutable per-order earnings allocations, test Connect onboarding and transfers,
  and transfer reversals before refunds of settled orders.
- Durable in-app notifications, read state, a retrying mobile push outbox, Android
  FCM and development APNs adapters, device registration/removal, and audit logs.
- Restaurant pause/opening-hour settings in Eastern time and delivery directions.
- Customer payment/refund/status screens; restaurant availability/order controls;
  driver actions; earnings/onboarding; admin order/refund/settlement/pricing and
  driver-approval screens. Account-deletion requests can be initiated in-app.
- Android/iOS native sources, external checkout browser, custom return links,
  foreground refresh, push enrollment, signing hooks, and unsigned compile CI.

Transfers are movements to a **test connected balance**. They do not prove a bank
payout. Stripe controls connected-account bank payout schedules and requirements.
Reversed and cancelled settlements are distinguished from failed transfers.
Full refunds are supported; partial refunds/disputes initiated outside this app
require provider reconciliation and are not silently treated as complete refunds.

## Local development

Use Node 22 and pnpm 11.25.0. The application uses PostgreSQL and Clerk.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

Copy `.env.example` settings into the API process environment and put Vite values
in `artifacts/localeats/.env.local`. Never commit real secrets. Default test pricing
is illustrative: 499-cent delivery, 500-basis-point service fee, zero configured
test tax, 1,000-basis-point restaurant commission, 8,000-basis-point driver delivery
share, all tips to the driver, and ZIPs 37854/37748/37763. These are **not approved
business terms or a determination of Tennessee tax obligations**. Administrators
can change the test settings. Existing order allocations retain their snapshots.

Set `PAYMENT_PROVIDER=sandbox` and `NODE_ENV=development` to exercise the entire
local order/refund/settlement flow with no payment credentials. A real Clerk
instance and local/staging database are still needed for interactive signed-in use.
The automated tests replace authentication only inside their test bundle.

```sh
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/localeats dev
```

The frontend defaults to port 5173 and base `/`. Proxy `/api` to the API or set
`VITE_API_ORIGIN` to its HTTPS origin. Use the server-only
`LOCALEATS_ADMIN_CLERK_USER_IDS` allowlist to designate an administrator. Public
account setup cannot grant admin or driver approval. Approve restaurants, enable
ordering, set seven days of opening hours, and approve drivers before testing.

## Database migrations

Versioned SQL is in `lib/db/drizzle`:

- `0000_original_schema.sql` represents the original unversioned application.
- Subsequent migrations add commerce, notification, availability and refund states.

For a **new empty staging database**, set `DATABASE_URL` and run
`pnpm --filter @workspace/db migrate`. Back up an existing database before changes.
For an existing unversioned Replit database matching the original schema, **do not
run migration 0000 again**. Compare its schema with `0000_original_schema.sql`,
then apply only `0001` onward using PostgreSQL `psql` with `ON_ERROR_STOP=1` and a
transaction. Record the applied versions in your deployment record; do not mix
this manual legacy-upgrade procedure with automatic Drizzle migrations until its
migration history has been baselined. The automated suite exercises the original
schema followed by every incremental migration from scratch.

## Stripe test setup

1. Configure a Stripe test platform with Connect enabled. Set
   `PAYMENT_PROVIDER=stripe_test`, `STRIPE_SECRET_KEY=sk_test_…`, and a trusted
   `PUBLIC_APP_URL=https://your-web-origin` (origin only, no path/query).
2. Forward the test events below to `POST /api/webhooks/stripe` and set its test
   `STRIPE_WEBHOOK_SECRET=whsec_…`. The route verifies signatures before processing
   and is mounted before JSON parsing and Clerk middleware.
3. Subscribe to `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `refund.created`, `refund.updated`,
   and `refund.failed`. Completion pages never independently mark payment paid.
4. On `/earnings`, onboard test restaurant/driver Connect accounts. Operations can
   transfer earned amounts after a paid, completed delivery. A connected account
   must have transfers active and payouts enabled.
5. Run a real hosted **test** checkout, signature/retry test, full refund, connected
   transfer and reversal. No provider round-trip has been verified without keys.

Financial operations use stable provider idempotency keys and serialize on the
order row. Unresolved financial operations older than 23 hours are blocked for
manual provider reconciliation rather than blindly retrying a possibly pruned
Stripe idempotency key. Failed/pending refunds remain visible for operations;
late payment on a cancelled order queues a refund and never reopens dispatch.
There is no live-mode override in this branch.

Reference: https://docs.stripe.com/checkout/fulfillment
Reference: https://docs.stripe.com/connect/separate-charges-and-transfers

## API and web hosting

Build with `pnpm build`; serve `artifacts/localeats/dist/public` with SPA fallback
to `index.html`, and proxy `/api` or configure the build-time HTTPS API origin.
Run `pnpm --filter @workspace/api-server start` with PostgreSQL, Clerk, port,
`NODE_ENV=production`, an explicit `CORS_ORIGINS` list, and **Stripe test** mode.
The local simulator cannot start payment operations in production.
Retain production dependencies: Firebase Admin and its runtime dependencies are
external to the bundled API. Keep the worker process running for push delivery.
The outbox polls every 15 seconds and attempts delivery at most five times.
In-app notifications persist even if push is unconfigured or fails.

## Native applications

Bundle identifier: `com.rocoeats.app`; confirm ownership before registration.
Native apps bundle the web frontend; API/database hosting remains separate.
Set `VITE_API_ORIGIN` (HTTPS origin without `/api`) and a real
`VITE_CLERK_PUBLISHABLE_KEY`. Add your web origin, `https://localhost` (Android),
and `capacitor://localhost` (iOS) to API CORS and configure Clerk allowed origins.
Bearer tokens are fetched fresh for cross-origin API requests.

```sh
pnpm --filter @workspace/localeats mobile:sync
pnpm --filter @workspace/localeats mobile:android
# On macOS:
pnpm --filter @workspace/localeats mobile:ios
```

External hosted checkout and Connect onboarding open in a system browser. Return
pages provide `rocoeats://orders` and `rocoeats://earnings` links. Returning to the
foreground also refreshes data. These links carry no payment authority or tokens.
Device round-trips, Clerk sessions, and social sign-in still require validation.
The custom scheme is not a substitute for verified universal/app links for OAuth.

### Push configuration

- Android: supply the Firebase Android app's `google-services.json` in the native
  app directory and `FIREBASE_SERVICE_ACCOUNT_JSON` in the API environment. The
  service-account identity must have messaging permission for the same project.
- iOS: supply `APNS_PRIVATE_KEY` (.p8 PEM), `APNS_KEY_ID`, and `APNS_TEAM_ID` on the
  API. Configure the Apple app ID/signing profile for push. The app includes the
  registration delegate and a **development** push entitlement. This branch only
  targets the APNs sandbox; App Store/TestFlight APNs production delivery is not
  enabled or verified.
- Enroll a physical device on `/notifications`. Push alerts intentionally contain
  generic text; authenticated in-app records contain the details. Push can arrive
  more than once after ambiguous network failures; notification IDs/collapse keys
  reduce duplicate alerts. Validate foreground/background/denied-permission and
  sign-out behavior on devices before enabling operational push.

Reference: https://capacitorjs.com/docs/apis/push-notifications

### Compile and signing

`.github/workflows/native-validation.yml` builds an Android debug APK and an
unsigned iOS simulator app on PRs. These artifacts are explicitly **unconfigured**
compile outputs; they do not contain real deployment/auth configuration and are
not store packages. Native project generation/sync alone does not verify a binary.

Android release signing reads `ROCOEATS_KEYSTORE_PATH`,
`ROCOEATS_KEYSTORE_PASSWORD`, `ROCOEATS_KEY_ALIAS`, and `ROCOEATS_KEY_PASSWORD`
from the build environment. Run `./gradlew bundleRelease` in the Android directory
with signing configured to produce an AAB. Unsigned outputs must not be submitted.
For iOS, select your Apple team in Xcode, configure release signing/entitlements,
archive, and upload to App Store Connect. Replace template icons/splash assets and
set final release versions before any public submission.

## Verification and remaining release gates

Automated tests cover pricing/rounding, live-key rejection, DST/opening hours,
role/driver-approval checks, migration application, ownership/service area,
concurrent idempotent orders/driver claims, pickup/delivery rules, full refunds,
earnings/transfers/reversals, notification ownership, and signed test webhooks.
Local HTTP integration tests use PostgreSQL compiled to WebAssembly (PGlite).
GitHub validation runs the same suite against a PostgreSQL 17 service with
multiple connections to exercise real row locking. See CI for the exact result.

Before public release, obtain and verify:

- PostgreSQL and Clerk deployment configuration, real Stripe **test** credentials,
  signed provider event forwarding, hosted test checkout/refund/Connect tests.
- Approved fees, tax methodology/provider and registrations, commission/share,
  delivery boundaries, cancellation/refund terms, retention and deletion policy.
- Firebase/APNs setup and real-device notification/sign-in/checkout tests.
- Google Play Console and Apple Developer accounts, ownership/signing identities,
  store metadata/icons/screenshots, privacy/support pages, data disclosures, and
  review access. Deletion requests currently enter an operations queue; removing
  the Clerk account and applying retention still requires operational handling.
- Native CI compilation, signed device builds, internal Play/TestFlight testing,
  and business/operational acceptance. No merge, live deployment, live charge,
  real fund movement, or store submission is authorized by passing a unit test.
