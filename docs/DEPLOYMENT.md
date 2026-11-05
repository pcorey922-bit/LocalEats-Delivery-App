# RoCoEats deployment preparation

This branch is a tested development foundation, not a production delivery service.
Checkout saves unpaid development orders. No real card collection, refunds,
restaurant settlement, or driver payouts are implemented. Do not accept live
orders or claim that funds were collected. Do not mark payments succeeded by hand
in production to bypass the fulfillment guard.

## Verified in this change

- Workspace TypeScript checks and production API/web builds pass.
- Automated role/profile, lifecycle, and mobile API transport tests pass.
- Android and iOS Capacitor 8 projects generate and sync successfully.
- Android compilation was attempted but the environment cannot download Gradle.
- No database-backed end-to-end, browser, device, signed release, or iOS compile
  validation has been completed. Authentication and database credentials were
  not supplied to this development environment.

## Local development

Use Node 22 and pnpm 11.25.0. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

The default production build includes the API and customer/partner application;
the unrelated mockup sandbox is excluded. Copy `.env.example` values into your
process environment (Vite reads a frontend `.env.local` in `artifacts/localeats`).
Never commit secrets. Provision PostgreSQL, review the schema in `lib/db`, then
apply it to a disposable staging database first:

```sh
pnpm --filter @workspace/db push
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/localeats dev
```

The Vite frontend defaults to port 5173 and base `/`. For local testing use a
reverse proxy from `/api` to the API, or configure `VITE_API_ORIGIN` with an HTTPS
staging API. Supply a real Clerk publishable key; an empty key cannot sign in.

## API hosting

Build with `pnpm build`. Run `pnpm --filter @workspace/api-server start` with
`DATABASE_URL`, `PORT`, `NODE_ENV=production`, `CLERK_SECRET_KEY`,
`CLERK_PUBLISHABLE_KEY`, and an explicit comma-separated `CORS_ORIGINS` list.
Place the API behind HTTPS. Serve `artifacts/localeats/dist/public` on an HTTPS
static host with SPA fallback to `index.html`; proxy `/api` or set the build-time
`VITE_API_ORIGIN`. If an existing Clerk proxy is used, preserve its configuration;
otherwise use your Clerk instance's keys and configure its allowed origins.

## Android and iOS

The native projects are in `artifacts/localeats/android` and
`artifacts/localeats/ios`. Bundle identifier: `com.rocoeats.app` (confirm ownership
before store registration). Native apps bundle web assets; they do not bundle
the Express API or database. Set frontend `VITE_API_ORIGIN` to your HTTPS API
origin without `/api`, and `VITE_CLERK_PUBLISHABLE_KEY` before rebuilding.
The client attaches a fresh Clerk bearer token to cross-origin API requests.
Set API `CORS_ORIGINS` to your web origin and the native origins
`https://localhost` (Android) and `capacitor://localhost` (iOS).
Validate Clerk's native-webview origin/session behavior on actual devices;
social login, external redirects, and deep-link returns are not yet implemented.

```sh
pnpm --filter @workspace/localeats mobile:sync
pnpm --filter @workspace/localeats mobile:android
# On a Mac with Xcode:
pnpm --filter @workspace/localeats mobile:ios
```

Use the native toolchain versions required by the installed Capacitor packages.
The generated Android project targets SDK 36; install its matching SDK and JDK.
For Android create a release signing key and a signed AAB in Android Studio.
For iOS select your Apple development team in Xcode, configure signing, archive,
and upload to App Store Connect. Signing credentials stay outside Git. Replace
the template app icons/splash assets and configure actual release versions.
Native configuration/reference: https://capacitorjs.com/docs/getting-started

## Driver API and acceptance checks

All endpoints require a signed-in, active driver profile:

- `GET /api/driver/offers`: paid, ready-for-pickup offers with restaurant pickup
  information; no customer delivery addresses.
- `GET /api/driver/deliveries`: that driver's assigned deliveries and addresses.
- `POST /api/driver/orders/:orderId/claim`: conditional, single-driver claim.
- `POST /api/driver/orders/:orderId/pickup`: assigned driver advances pickup.
- `POST /api/driver/orders/:orderId/deliver`: pickup must precede completion.

The `/driver` screen polls every 15 seconds and surfaces claim/action conflicts.
The restaurant UI stops at ready-for-pickup. Generic order updates cannot record
pickup or delivery, and unpaid orders cannot enter fulfillment. Cancellation of
a paid order is blocked until refund processing exists.

In staging test two drivers claiming one paid test order concurrently, wrong-role
requests, deactivated accounts, address privacy, repeated pickup/delivery,
restaurant ownership, payment reversal during dispatch, network loss, token
refresh, and app restarts. Use explicitly labeled test data only. The automated
suite does not replace these database-backed integration tests.

## Required before any public launch

1. Integrate a payment provider with signed, idempotent webhooks and reconciled
   amounts/currencies. Add checkout retry/idempotency, cancellation/refunds,
   disputes, marketplace onboarding, restaurant settlement, and driver payouts.
2. Configure real service boundaries, restaurant opening hours/availability,
   delivery pricing, tax calculation, tips, and operational support. Current
   checkout records zero fees and zero tax; it is unsuitable for charging users.
3. Complete driver approval, delivery contact/navigation, notification and
   recovery flows, account deletion, and privacy/support screens.
4. Run real PostgreSQL integration tests, authenticated browser/device flows,
   signed native builds, and internal Play/TestFlight tests.
5. Supply Google Play Console and Apple Developer accounts, signing identities,
   store metadata, screenshots, privacy policy, data disclosures, review access,
   and approved operational/business settings before submission.

No production infrastructure was provisioned and no store submission was made.
