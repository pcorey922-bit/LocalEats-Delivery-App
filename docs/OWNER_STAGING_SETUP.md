# Owner-controlled staging setup

No hosting purchase, account connection, DNS change, live payment or application
publication has been performed. Do not enter bank details or secrets into chat,
GitHub files, frontend variables, or the local payment simulator.

## Accounts and deployment boundary

Use business-owned accounts for the container host, PostgreSQL, Clerk, Stripe,
Google Maps/Firebase, Apple Developer and Google Play. Use separate staging keys,
database and domains. The existing application needs a continuously running Node
22 container and PostgreSQL, including its background workers. Static/Worker/D1
hosting alone cannot run this backend. A paid container/database plan with backups
is likely necessary for reliable business operation. Confirm current provider
pricing and authorize the purchase before creating paid resources. No recurring
cost quote has been verified in this session.

A private staging deployment is blocked until owner-controlled hosting, database,
Clerk and Stripe test configuration are available through secure account settings.
There is no deployed updated staging URL to provide yet. Component fixtures are
simulations for QA and must not be offered as a transactional business demo.

## Staging execution checklist

1. Create a separate staging PostgreSQL database and container service in the same
   region through the chosen host's dashboard. Configure host access controls or
   a private network so only authorized test users can reach staging. Keep backups
   enabled. Keep the production service and rocoeats.com DNS untouched.
2. Deploy this repository's `feature/rocoeats-launch-readiness` branch with the root
   Dockerfile. Use a business-owned image registry if deploying a prebuilt image.
   The running container uses its packaged files and database; GitHub is needed
   for source/build updates, not daily order processing.
3. Supply public frontend settings as Docker **build arguments**:
   `VITE_CLERK_PUBLISHABLE_KEY`; optionally `VITE_CLERK_PROXY_URL`; and, after owner
   Google billing approval, `VITE_GOOGLE_MAPS_API_KEY` plus `VITE_GOOGLE_MAPS_MAP_ID`.
   Leave `VITE_API_ORIGIN` unset for same-origin website/API hosting. Maps browser
   keys must allow only the staging HTTPS origin and Maps JavaScript API. Server
   and mobile API keys are separate and must have appropriate restrictions.
4. In the host's secret environment configure `DATABASE_URL`, `CLERK_SECRET_KEY`,
   `CLERK_PUBLISHABLE_KEY`, `LOCALEATS_ADMIN_CLERK_USER_IDS` (your actual Clerk user
   ID), `PUBLIC_APP_URL` (the assigned HTTPS origin), `CORS_ORIGINS` (explicit
   allowed website/native origins), `PAYMENT_PROVIDER=stripe_test`,
   `STRIPE_SECRET_KEY` (test key), and `STRIPE_WEBHOOK_SECRET` (test endpoint secret).
   Preserve container `NODE_ENV=production`, `PORT=3001` and `WEB_DIST_DIR`.
   Keep `ROCOEATS_ORDERING_ENABLED=false` while configuring the environment.
5. Configure the Clerk application's permitted origins/return URLs for that HTTPS
   origin. Create your real staging administrator identity. Ordinary users must
   never grant themselves administrator roles. No test-user-header bypass exists
   in the deployed API. Keep authentication secrets in provider/host secret settings.
6. Apply database migrations **once** as the release step with
   `pnpm --filter @workspace/db migrate`, using the staging database secret. This
   command is for a new database or one with correctly recorded migration history;
   legacy unversioned databases require the baseline procedure in DEPLOYMENT.md.
   Migrations through 0024 are required for this checkpoint. Never use schema push
   as a substitute for the SQL ledger constraints and triggers.
7. Configure the Stripe TEST endpoint at `https://<assigned-origin>/api/webhooks/stripe`
   using the event subscriptions in DEPLOYMENT.md. Create restaurant and driver
   test accounts; complete their provider-hosted Connect test onboarding through
   `/earnings`. Bank-account collection remains inside Stripe. A connected-balance
   transfer is not proof of a bank deposit. Software still needs partial refunds,
   disputes and complete provider/bank reconciliation before commercial activation.
8. Sign in as the owner, set reviewed test pricing/service ZIPs in administration,
   approve verified test restaurants/drivers, and configure restaurant hours, menus,
   modifiers, stock and optional capacity. Use clearly labeled test data. Only after
   staging access and configuration are verified, explicitly enable
   `ROCOEATS_ORDERING_ENABLED=true` **in this private test environment**. This never
   permits live Stripe keys and is not permission to open public ordering.
9. Check `/livez` returns 200 and `/readyz` returns 200 after auth, payments, pricing,
   database and workers are configured. Exercise the actual four-role ordering,
   navigation, cancellation/refund and reconciliation flows. Test provider/device
   notifications separately; provider acceptance is not verified on-device display.
   Configure alert delivery and rehearse a staging backup restoration before launch.
10. Record the deployed commit, actual HTTPS URL, health results and test evidence
    in ENGINEERING_CHECKPOINT.md. Share a staging URL only after verifying it.

## Cloudflare domain work — owner action after approval

Do not apply these changes as part of an engineering checkout or CI run.
In the hosting dashboard, first add `staging.rocoeats.com` as the staging custom
hostname and copy the exact DNS target/verification records supplied by the host.
In Cloudflare, select rocoeats.com → DNS → Records. Add only those staging records
with the provider's requested record type, target and proxy mode. Do not replace
apex/www/MX/TXT records or infer a host IP. Complete the host's TLS verification,
use Cloudflare Full (strict) when proxying, and verify HTTPS before enabling traffic.
Restrict staging access through the host or an explicitly configured access policy.
Update Clerk allowed origins, PUBLIC_APP_URL, CORS and the Maps referrer restriction
when the staging hostname is verified, then rebuild frontend origin-dependent assets.

Production apex/www routing, public ordering, live Stripe/bank onboarding and signed
store publication require separate owner authorization and their unfinished launch
requirements. Preserve the original visual demonstration throughout this process.

## Prepared local staging package (no hosting purchase)

`compose.staging.yml` runs the actual application image with a separate PostgreSQL
17 volume, an explicit one-off migration service and a loopback-only API/website
port. It includes no authentication bypass, fake business data, live payment key,
public port binding or automatic ordering activation. Docker Engine/Compose and
Node 22+ are required on your own development machine. Do not use the disposable
QA database password from CI for this environment.

Minimum owner inputs: a separate Clerk development instance's publishable/server
keys, your Clerk `user_...` identifier, Stripe TEST server/webhook keys, and a random
staging database password. A local staging environment needs no paid host or domain
change. A remotely accessible private HTTPS staging environment additionally needs
an owner-controlled container/database host with access controls and TLS. Configure
private access before opening a hosted service. Maps/push configuration can follow;
the core ordering walkthrough requires the identity/payment/database inputs first.

1. Copy `staging.env.example` to `.env.staging` (gitignored), then run
   `chmod 600 .env.staging` before adding secrets.
2. Generate a database password on your own machine with `openssl rand -hex 32`;
   enter that value and the account settings in `.env.staging`. Do not paste them
   into chat or commit that file. Keep `ROCOEATS_ORDERING_ENABLED=false`.
3. Run `node --env-file=.env.staging scripts/check-staging-environment.mjs`.
   This checks formats/unsafe settings and redacts values; it does not certify
   credentials, permissions, provider round trips or private network access.
4. Run `docker compose --env-file .env.staging -f compose.staging.yml build`.
5. Run `docker compose --env-file .env.staging -f compose.staging.yml up -d db`.
6. Apply migrations once using
   `docker compose --env-file .env.staging -f compose.staging.yml run --rm migrate`.
7. Start the packaged website/API using
   `docker compose --env-file .env.staging -f compose.staging.yml up -d api`.
8. Open `http://localhost:3001`. This is a local URL, not a deployed HTTPS demo.
   Configure Clerk allowed local origins and a Stripe CLI test webhook forwarder
   or a securely hosted HTTPS test endpoint. Configure owner pricing, approved
   restaurants/drivers, opening hours, menus, stock and timing policy through the
   actual interfaces. Enable the test ordering gate only after completing setup,
   then recreate `api` and perform the four-role test walkthrough.
9. `docker compose --env-file .env.staging -f compose.staging.yml down` stops it
   while retaining the staging database volume. Do not add volume-removal flags
   unless you intentionally authorize deletion of that test database.

The standalone staging PostgreSQL volume is not a production backup strategy.
Hosted production still requires managed backups, restore verification and the
remaining financial/provider/device launch gates. Source now requires migrations
through 0024; use the current migration journal rather than copying older SQL lists.
