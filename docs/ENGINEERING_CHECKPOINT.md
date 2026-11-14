# RoCoEats resumable engineering checkpoint

## READ FIRST — recovered website/backend continuation, November 14, 2026 UTC

This section supersedes the historical checkpoints below. Resume the existing
repository/branch; preserve all completed work. Do not restart completed checkout,
authentication, homepage, delivery or Stripe investigations. Do not follow the
archived Android/iOS/signing tasks below: native development is deferred.

### Verified post-deployment state — November 14, 2026 UTC

Owner deployed `9c095d39c821e90a23fb239d1ebd2a2e6105f97c` at 11:04 PM EST.
Engineering independently observed the exact SHA from /livez at 04:08 UTC and
passed all 23 read-only staging checks. /readyz: ready/database/auth/pricing/
Stripe TEST configuration/webhook configuration/workers all true; no missing or
unverified dependencies. Public ordering OFF, private test ordering OFF, effective
ordering OFF, live charges OFF; private staging remains true. No payment, refund,
transfer, reconciliation attempt, hosted configuration change or extra deployment
was performed. Private completed-order contents were not read without a session.

Geographic configuration: `mode=provisional_postal`, `configurationReady=true`,
`municipalConfigurationReady=false`, `municipalEnforcementEnabled=false`, empty
missingConfiguration. This is the intended inactive municipal state, not missing
provider setup or evidence of real Geocodio acceptance.

Deployed CSP is enforced on website and API responses; HSTS max-age=31536000.
Inline scripts and unsafe-eval remain disallowed. At a 412x915 mobile viewport,
homepage, real anonymous Clerk sign-in, restaurant and driver signup screens all
rendered with zero CSP violations, failed requests or uncaught errors. The caught
Zod capability probe seen at e451605 is gone. No forms were submitted. Authenticated
Clerk/Google sign-in, account-specific routing and private order/ledger contents
still require the owner's session. Widget rendering/configuration is not a full
identity-provider login or financial/provider acceptance test.

Read-only evidence in the current workspace:
`/tmp/rocoeats-9c095d3-postdeployment.json` and
`/tmp/rocoeats-9c095d3-browser-report.json`. No additional software defect was
observed. Next geographic milestone: authorized public-address Geocodio accuracy
acceptance, then separate activation approval. Do not request boundary/ZIP/30 m
approval again; it is already recorded. Existing public test cases include the
same-ZIP/outside-boundary airport and a public unit address. No provider account,
key, live lookup, expense or private address transmission has been authorized or
performed. Keep all ordering and financial safeguards closed.

### Owner approval and prior deployment preparation — November 14, 2026

Owner explicitly approved the existing Rockwood map/version, additional ZIP 37854
restriction and conservative 30 m edge review margin. Do not request that approval
again. Record: `docs/delivery-area/owner-approval.json`. This is not permission to
activate geography, create a provider account, incur expense or send private
addresses. Real Geocodio accuracy acceptance and separate activation approval
remain required. Public institutional accuracy cases are prepared in the existing
delivery-area README; no Geocodio requests were made.

The verified deployment target was
`9c095d39c821e90a23fb239d1ebd2a2e6105f97c`, regardless of a later documentation-only
branch head. All three workflows were independently reverified completed/success:
Validate push `43550235229`, Validate PR `43550240430`, existing native workflow
`43550240407` (optional signing/device jobs skipped). Target code passed 155 app/API
tests, 12 staging-tool tests, browser regressions, production builds and typechecks.
CI also passed container packaging, unchanged migration reruns preserving rows,
PostgreSQL backup/restore with ledger guards and dependency audit.

No migration/schema, dependency/lockfile, Dockerfile or startup-script changes
exist between deployed `e451605` and target `9c095d3`. Existing startup still runs
its serialized, idempotent migration check; do not reset/seed or manually migrate
hosted data. No environment changes are needed for this release: retain closed
ordering, Stripe TEST, existing Neon/database/credentials, private/free staging and
start command. Do not add/select municipal mode, approved hash, provider or key.
The default provisional policy means geographic enforcement is inactive and new
readiness fields explicitly report municipal enforcement false. Existing completed
orders and financial reconciliation paths do not acquire geocoding prerequisites.

Documentation-only commits record approval/test preparation; they do not change the
requested deployment target. No automatic deployment is authorized. Use existing
Render service → Manual Deploy → Deploy a specific commit → full target SHA → wait
Live. After owner deployment confirmation, run the existing read-only verifier
against that exact SHA and inspect geographicDelivery in /readyz. Do not use a
latest-commit deploy or alter environment settings to activate new geography.

### Repository and deployed/saved revisions

- Repository: `pcorey922-bit/LocalEats-Delivery-App`.
- Branch: `feature/rocoeats-launch-readiness`; draft PR #1. Never merge without
  owner authorization. Worktree was clean at the preceding checkpoint.
- Verified deployed revision: `9c095d39c821e90a23fb239d1ebd2a2e6105f97c`.
  Existing Render Free service `LocalEats-Delivery-App`, URL
  `https://localeats-delivery-app.onrender.com/`. No deployment is authorized now.
- Previous pushed implementation: `3a63f8b72bca3fe23408651b06c2a9c91942ae34`;
  all three workflows completed successfully: Validate push `43381992730`,
  Validate PR `43381999478`, existing native workflow `43381999472` (optional
  signing/device jobs skipped). No native source/build development was performed.
- Recovery saved all nine previously uncommitted files at
  `df137a11916ec44b758d826db93de27a685595cb`, preserving the completed tests and
  geographic adapter/readiness work. No work was discarded. This checkpoint
  additionally rejects malformed provider fields that could previously match
  street/unit text through string coercion; the regression failed before the fix.
  Resolve its exact SHA with
  `git log -1 --format=%H -- docs/ENGINEERING_CHECKPOINT.md`; the final session
  report supplies that SHA and its completed CI result. Do not substitute an older
  successful CI run for the current commit's checks.

### Safety and verified business state

Public ordering OFF, private test ordering OFF, live charges OFF; Stripe TEST
only. Last independent read-only `/livez` and `/api/mobile/readiness` inspection
confirmed deployed `9c095d3` and all three closed safeguards. No hosted settings,
credentials, permissions, customer/restaurant/menu/inventory records or financial
records were changed. Do not deploy, enable ordering, create orders, initiate
payments/refunds/transfers, retry reconciliation, or change secrets without the
owner's explicit authorization. Do not create a Geocodio account, incur expenses
or transmit customer addresses. Provider fixtures are not provider acceptance.

Preserve completed order `c219f42d-7fb9-4cec-9547-06025d8528f5`: owner verified
$19.19 Stripe TEST payment, signed webhook, restaurant acceptance/preparation,
driver claim/pickup/customer-code delivery, balanced operational ledger and zero
missing payment baselines. This was a real owner-supervised provider test, not an
engineering simulation. Anonymous engineering checks cannot read its private
contents. Provider fee/net reconciliation remains pending: owner saw fee $0.86,
net $18.33, funds availability November 19, 2026 at 7 PM Eastern. Do not retry
until Stripe explicitly confirms available evidence AND owner separately approves.
Financial correction `cfbd315` is already deployed in `e451605`.

### Completed geographic/security implementation — preserve

- Official Tennessee Comptroller dashboard resolves to maintained service item
  `432a7396947245d8acb98d9d2cba292b`, layer 2, Rockwood object 269.
  Item published May 6, 2025; last updated November 3, 2026. Full raw base and
  change references, source disclaimer, timestamps and hashes are committed under
  `artifacts/api-server/src/data/rockwood/`.
- Candidate version `TN-COT-432a7396947245d8acb98d9d2cba292b-layer2-269-20261103`.
  Geometry SHA-256:
  `e1ebc348ed9cc92ffe8ba8ba0d00873486c9fec851233d4190daad3538289d1f`.
  Includes an excluded hole; do not fill it or union annexations into the current
  base again. The state describes its municipality-reported data as informational,
  not legal surveyed boundaries or proof of unreported annexations.
- Owner review: `docs/delivery-area/index.html` and `rockwood-proposal.svg`.
  Road labels use public Census 2026 context. Gold shows intersection with the
  Census 37854 ZCTA reference only; a ZCTA is NOT an authoritative USPS ZIP polygon.
  Actual future eligibility requires the approved city polygon AND provider-verified
  ZIP 37854. Never equate all addresses in that ZIP with approved territory.
- Proposed 30 m interior review margin applies to exterior and hole edges. Map
  display is simplified below one pixel; runtime uses exact pinned full geometry.
  No automatic boundary refresh or territory expansion exists.
- `municipal-delivery.ts` verifies saved restaurant/delivery locations before new
  quotes, transactional order creation, checkout preparation and queued Stripe
  checkout execution. Existing identity/ownership checks remain. Historic reads,
  webhooks, deliveries and financial reconciliation do not require a new geocode.
- Provisional postal mode remains the existing default for closed/private staging.
  Production public checkout cannot use provisional mode. Municipal mode requires
  the exact approved hash, selected provider and server key. Unknown/missing
  configuration fails closed. No hosted activation has occurred.
- Geocodio adapter is implemented against fixed HTTPS `/v1.11/geocode`, refuses
  redirects, bounds request time/response size, and rejects coarse/unknown or
  ambiguous evidence, street/unit/country/state/city/ZIP mismatches and outside or
  near-edge coordinates. No client coordinate is trusted. Requires one accuracy-1
  rooftop result with supported precise match type. Strict rules can reject valid
  apartments/aliases; evaluate with authorized examples before activation.
- Latest hardening: adapter independently validates locality; snapshots input;
  identical concurrent requests share one provider call; eight distinct in-flight
  lookups maximum; five-minute/256-entry cache has no stale fallback; evidence is
  immutable; failures release slots and are never cached. Rejected HTTP responses
  release their bodies. No permanent geocoding database/migration was introduced.
- `/readyz` now reports sanitized `deliveryAreaReady` and `geographicDelivery`.
  Municipal misconfiguration makes readiness fail and lists setting NAMES only.
  It never calls Geocodio; configuration readiness is not accuracy/account/quota
  acceptance. The read-only staging verifier handles this optional newer summary
  while retaining compatibility with deployed `e451605`.
- Zod startup `jitless` fix is committed at `3a63f8b`; strict CSP is unchanged.
  CSP/HSTS and anonymous Clerk screens passed on deployed `9c095d3` with zero
  violations, including confirmation that the earlier caught Zod probe is gone.
  Approved navy/gold homepage and five primary actions are preserved.

### Verification at this checkpoint

- **155 app/API tests passed**, including real HTTP checkout bypass rejection,
  polygon/hole/edge cases, provider failures, locality defense, single-flight
  concurrency/capacity, mutable-input isolation and secret-free readiness. Malformed
  provider field tests reject array/numeric coercion while preserving valid units;
  the real HTTP checkout regression rejects malformed provider evidence too.
- **12 staging verifier/configuration tests passed**, including new geographic
  readiness failures, secret suppression and compatibility with older deployments.
- Full typechecks and production API/website builds passed. Existing Vite chunk
  size advisory remains informational; no build error.
- Recovered browser logs confirm both suites finished successfully before the
  interruption: mobile account/component QA (including the final 390x844 summary),
  plus complete website/API/PGlite order-to-delivery/ledger and availability checks.
  Both use simulated Clerk/payments. They do NOT prove a
  new Stripe transaction, authenticated staging login or real Geocodio acceptance.
- Source map regenerated deterministically and verified at Samsung-sized width
  without horizontal overflow in the previous verified checkpoint. Current
  hardening does not change boundary geometry, map, homepage or native source.
- Recovery follow-up logs: `/tmp/rocoeats-recovered-final-tests.log`,
  `/tmp/rocoeats-recovered-build.log`, `/tmp/rocoeats-recovered-staging-tests.log`,
  `/tmp/rocoeats-recovered-workflow.log`. Original completed mobile/account browser
  log: `/tmp/rocoeats-boundary-hardening-account.log`. Before/after coercion
  evidence: `/tmp/rocoeats-recovered-geography-reproduction.log` and
  `/tmp/rocoeats-recovered-geography-fixed.log`. No real provider was called.
  CI is the portable evidence if temporary workspace files are unavailable.
  Inspect current SHA workflows using the commands below; never call pending,
  absent, cancelled or skipped required checks successful.

### Exact resume instructions

1. Read this current section, `docs/delivery-area/README.md` and
   `docs/PRODUCTION_BACKLOG.md`. Historical sections below are reference only.
2. Preserve local work and verify the remote before editing:
   ```sh
   cd /workspace/LocalEats-Delivery-App
   git status --short
   git fetch origin feature/rocoeats-launch-readiness
   git log -6 --oneline --decorate
   git rev-parse HEAD
   git rev-parse origin/feature/rocoeats-launch-readiness
   gh run list --repo pcorey922-bit/LocalEats-Delivery-App --commit "$(git rev-parse HEAD)" --json databaseId,name,status,conclusion,event,url
   gh pr checks 1 --repo pcorey922-bit/LocalEats-Delivery-App
   ```
   If checks are pending, wait using `gh pr checks 1 --repo
   pcorey922-bit/LocalEats-Delivery-App --watch --interval 15`, then inspect all runs
   for that exact head. Repair actual failures; never reset/discard/pull over dirty
   work, force-push, merge, deploy or activate settings to make a check green.
3. No need to repeat already completed development or tests absent new changes.
   For new changes, run relevant tests and then a meaningful checkpoint:
   ```sh
   env -u DATABASE_URL -u TEST_DATABASE_URL -u GEOCODIO_API_KEY -u ROCOEATS_DELIVERY_AREA_MODE -u ROCOEATS_APPROVED_BOUNDARY_SHA256 -u ROCOEATS_GEOCODING_PROVIDER pnpm test
   pnpm build
   node --test scripts/verify-staging-http.test.mjs scripts/check-staging-environment.test.mjs scripts/container-environment.test.mjs scripts/free-staging.test.mjs
   PLAYWRIGHT_CORE_PATH=/tmp/rocoeats-browser/node_modules/playwright-core CHROMIUM_PATH=/usr/bin/chromium node scripts/verify-account-browser.mjs
   PLAYWRIGHT_CORE_PATH=/tmp/rocoeats-browser/node_modules/playwright-core CHROMIUM_PATH=/usr/bin/chromium node scripts/verify-website-workflow.mjs
   node scripts/build-delivery-area-review.mjs
   git diff --check
   ```
   Use disposable databases and simulated providers; never point tests at hosted
   data. If browser tools/dependencies are missing, follow the managed runtime
   skill and current CI-pinned tooling rather than altering app infrastructure.
4. Optional owner-requested read-only deployed verification (expected SHA is
   `9c095d3`, independently confirmed after deployment; no later deployment is authorized):
   ```sh
   NODE_USE_ENV_PROXY=1 node scripts/verify-staging-http.mjs https://localeats-delivery-app.onrender.com/ 9c095d39c821e90a23fb239d1ebd2a2e6105f97c
   ```
   Use inherited proxy/CA; if sandbox cannot reach it, request tool-level escalation
   for the same authorized read-only command. No Render/Stripe/Clerk authenticated
   connector/session or hosted credentials are available here. Render login is
   owner-controlled; never attempt credential workarounds or create infrastructure.
5. Commit and push verified source promptly; wait for all required workflows. Keep
   the checkpoint current. Resume safe engineering only within owner scope.

### Remaining tasks and next owner-controlled decision

- Map/version, ZIP 37854 and 30 m margin are approved; do not ask again. Approval
  to ACTIVATE geography/provider or change hosted settings is not recorded. Require
  real Geocodio accuracy acceptance and separate activation authorization.
- Geocodio free tier was documented as 2,500 daily lookups without a credit card.
  No account or real lookup was made. Owner must separately authorize/create a
  free account and permitted accuracy-evaluation addresses; never request keys in
  chat. Keep payment methods/paid credits absent; recheck current provider terms.
- Evaluate known inside/outside, excluded-hole, boundary, apartment and street-alias
  addresses using public or explicitly authorized examples. Strict precision,
  one-result and unit rules may reject valid homes; adjust only on evidence without
  broadening geographic eligibility or accepting untrusted coordinates.
- A later owner-approved Render deployment/configuration may select municipal
  mode plus exact hash/provider/server key; see delivery-area README. This does
  not authorize opening public/private ordering or initiating another payment.
- Provider fee/net reconciliation remains pending and independently gated as above.
  Background GPS and interactive maps remain unverified/unconfigured; do not
  activate paid mapping or native work. Duplicate Notifications/card/mobile UX
  cleanup remains deferred unless separately prioritized; preserve checkout fixes.

## Historical checkpoints — superseded, reference only

Do not interpret the archived next actions below as current authorization.

Continue GitHub PR #1 on `feature/rocoeats-launch-readiness`. Do not merge,
enable live transactions, discard changes or claim launch readiness.

## Current physical-device evidence — November 9

Owner confirms signed APK source 5c687ac102adfe622f11403239398ec43fc84e15, run
42583769896, installed on Samsung Galaxy S22 Ultra, Play Protect allowed it, app
launched successfully and appearance matched the website. Record these as owner-
verified physical tests. OS/One UI version, auth, maps, permissions, notifications,
payments and delivery are not verified. Do not repeat signing setup or ask the
owner to reinstall this same tested APK. Ordering remains closed.

## Saved source and verification

Current continuation: read PRODUCTION_BACKLOG.md and the November 8 owner access/
administrator delegation sections at the end of this file. Owner-assisted access
checks passed on real staging revision 8d651fa; latest source is in git log.

Historical baseline below (superseded by the current sections):
Verified application revision `2c0877806045fe9b4ac01439ff3e0bb29464bba7` passed
PostgreSQL/restore/container CI (42352071658; PR validation 42352068790) and
unsigned native CI (42352071596). The following staging package and small error/
retry refinements are recorded in the final section; verify their own pushed CI.

- 88 automated tests pass with PGlite and with a local PostgreSQL 17 instance,
  with no skipped tests; an additional staging security preflight test passes.
- Production API/web build and typechecks pass. Chromium operational-component
  checks pass at 390x844 using explicitly simulated APIs and accounts.
- Actual empty-database migration, idempotent rerun, pg_dump/pg_restore, schema,
  row/sequence fingerprints and restored ledger guards were verified locally.
- Native CI verifies unsigned/unconfigured Android/iOS builds. No signed store
  deliverable, physical-device certification or complete provider E2E is claimed.
- No updated authenticated staging website is deployed. Business-owned host,
  identity and Stripe TEST credentials remain unconnected; no live money enabled.

Earlier entries below are historical checkpoints, not current launch certification.

## Completed engineering — preserve and reuse

- Role-scoped customer, restaurant, driver and admin routes and interfaces;
  server-approved restaurant/driver access; server-calculated quotes and immutable
  order/menu/address/pricing snapshots; opening hours in America/New_York.
- Customer checkout, restaurant acceptance/preparation/readiness, driver claim,
  pickup and delivery, earnings allocation and full-cancellation/refund foundation.
  Integration tests exercise this HTTP/relational workflow with test identities
  and injected/test-only financial effects. Actual Clerk/Stripe round trips have
  not been verified.
- Stable financial-operation IDs/payloads, provider idempotency keys, committed
  attempts, leases, backoff, stale-worker fencing and reconciliation holds.
  Stripe TEST checkout/refund/transfer/reversal I/O occurs outside DB transactions.
  Unknown writes older than 23 hours are held; known refunds can be read/polled.
  Cancellation, customer refund confirmation and recipient recovery are separate.
- Signed durable webhook inbox, monotonic refund events, duplicate handling,
  mismatch quarantine, dead-letter/backoff and audited administrator retries.
  Connect account creation is also a durable provisioning job, with readiness
  confirmed from the provider rather than assumed after creation.
- Immutable balanced gross operational journals for confirmed payments,
  allocations, transfers, full refunds and reversals. PostgreSQL deferred triggers
  enforce balance and reject mutation, truncation and added lines after commit.
  Historical paid orders without verified ledger baselines are quarantined before
  financial execution; no invented balances are backfilled.
- Admin gross trial balance, exact aggregate cents, stable microsecond-safe cursor
  pages, missing-baseline reporting, financial recovery controls, operational queue
  health, worker progress, redacted webhook/device recovery and reason-required
  retry audit records. Reports explicitly exclude unreconciled provider fees,
  disputes, tax remittances and bank payout outcomes.
- Driver online heartbeat freshness, unique active assignment per driver,
  ownership-checked foreground GPS, stale-location rejection/hiding, navigation
  links, availability/claim/release controls and delivery oversight.
- Durable in-app notifications plus individual push-device jobs/receipts,
  attempt/lease recovery, successful-device suppression on retry, invalid-token
  removal and reassigned-device protection. Missing platform configuration does
  not consume attempts or starve configured jobs. Push is at-least-once; provider
  acceptance does not prove on-device display. APNs remains sandbox-only.
- Android FCM HTTP v1 transport uses scoped RSA-signed service-account OAuth,
  fixed Google origins, bounded requests, cached access tokens and acknowledged
  responses. Tests verify signing/scope, token reuse, rejected/invalid responses
  and failures. Removed unused Firebase/Firestore SDK dependency tree.
- PostgreSQL-backed mutation rate limits, bounded pool/query/lock waits,
  independent worker loops with actual batch progress, graceful shutdown,
  `/livez` and dependency/worker `/readyz` checks.
- Optional same-origin website serving through the API (`WEB_DIST_DIR`), safe SPA
  deep links without API interception, hidden-file rejection, asset caching,
  non-root Docker packaging and CI smoke verification. See `docs/DEPLOYMENT.md`.
- Patched production dependencies and regenerated Zod 4 schemas via
  `lib/api-spec/orval.config.ts`; do not revert to vulnerable Zod 3 artifacts.

## Resolved intermittent CI failure

`pnpm test` at `21b22db` intermittently failed because freshly received webhook
jobs were not immediately eligible. Later tests cascaded after provider mode
was left changed. Due/expired SQL predicates now use PostgreSQL
`clock_timestamp()` directly, preserving microseconds; lease/retry dates use DB
time instead of host time. Test fixtures restore provider state after each case.
Repeated immediate claims and PostgreSQL host-clock-skew checks pass. Do not add
sleeps to mask this regression. PGlite shares JavaScript time; independent host
skew injection is intentionally exercised on the real PostgreSQL lane.

## Remaining engineering launch blockers

These are unfinished technology, not merely missing account credentials:

1. Partial refunds with immutable allocation/rounding policy, multiple refund
   records, cumulative limits, idempotency, concurrent refund safety and recovery.
   Current `refunds.order_id` is unique and full-refund assumptions exist in
   finance/ledger/webhook code; changing only the route is unsafe.
2. External refunds/disputes, payout holds, provider balance/fee/net reconciliation,
   bank payout status/failure handling and verified financial exception reporting.
   Connected-balance transfers must never be presented as confirmed bank payouts.
3. Full customer/restaurant/driver support cases, operator search/pagination,
   delivery proof and corresponding dispute/support workflows.
4. Restaurant menu modifiers/customizations, inventory/capacity and explicit
   acceptance/dispatch timeout handling. Current menu availability is a boolean;
   orders with no available driver remain visible for manual operations.
5. Complete required restaurant/driver verification workflows beyond the current
   approval/profile/Connect foundations. Confirm business-required verification
   information and service policies before accepting real operators.
6. Authenticated browser E2E across actual Clerk users, provider sandbox checkout,
   refunds, transfers/recovery and bank payout events; real physical-device GPS,
   permission denial, offline/reconnection, notification and return-link testing.
7. Accessibility/responsive operational UI verification, sustained multi-user load,
   broader failure recovery/security exercises, monitoring/alert routing and
   database restore verification.
8. Configure and deploy the actual web/API/database environment, verify public
   HTTPS and authenticated operational readiness. Produce configured signed mobile
   releases and perform store submission/install/distribution checks.

Do not widen scope into unrelated features or redesign working components. Finish
these integrated launch blockers and meaningful tests before declaring completion.

## External requirements

- A managed PostgreSQL database and Node/container hosting account, HTTPS domain,
  secret environment access, backups and alert destination. Available Sites
  Worker/D1 hosting is incompatible with the existing Node/PostgreSQL backend;
  do not rewrite the architecture or publish a disconnected frontend there.
- Clerk instance/publishable and server keys, allowed origins/redirects and admin
  Clerk user IDs. No runtime test-identity bypass exists.
- Stripe business/Connect account configured in TEST mode, server test key,
  webhook signing secret and verified connected test accounts. Owner verification
  and bank linking occur in Stripe, not in source code. Live keys are rejected.
- Approved tax/service/commission/driver compensation/cancellation/refund policies.
  Missing pricing fails closed; there are no default hardcoded business terms.
- Firebase/Google services configuration and APNs credentials/entitlements with
  physical devices. No actual push-provider round trip has been certified.
- Apple Developer/App Store Connect and Google Play ownership, signing material,
  store identity/privacy information and external approval.

## Resume commands and storage

`pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build` and
`pnpm audit --prod --audit-level=moderate`.
After a dependency/type-generation change use `pnpm exec tsc --build --force`
when stale local declarations remain. GitHub CI uses a clean dependency install.
API test runner uses unique temporary bundles. `TEST_DATABASE_URL` selects real
PostgreSQL; otherwise PGlite applies the same migrations locally.

Migrations `0000`–`0010` are committed. Preserve the custom ledger triggers in
`0009`; Drizzle schema push alone cannot install those invariants. Existing legacy
DBs must follow the baseline instructions before migration; never silently delete
conflicting active assignments or fabricate historical ledger balances.

GitHub is the durable code source. Connector commits may initially have different
SHAs from local commits but are verified to have identical tree hashes. Align only
when clean and trees match; never reset uncommitted progress. Update this checkpoint
and commit verified progress before the execution session ends.

## Driver onboarding implementation — November 6

Migration 0012 adds private driver applications. Drivers submit contact/vehicle details,
license state/expiry and eligibility/insurance attestations at `/driver/application`.
Administrators review applications at `/admin/driver-applications`; approval requires
recording completed external identity, screening and insurance checks. This is manual
review infrastructure, not automated identity/background verification. Government IDs,
license numbers and banking details are not collected by these endpoints.

The driver dashboard and administrator operations include application/review forms.
Review uses application version checks and profile row locks. Resubmission pauses
dispatch, rejects edits during an active delivery and invalidates prior reviews.
Legacy admin approval cannot newly approve a driver without an approved application.
Already approved legacy drivers remain supported; submitted applications are checked
for license expiry on authenticated driver requests.

Local suite passed with PGlite and test-only auth/provider adapters; production build
passed. No external screening, Stripe sandbox round trip, physical-device test or
new hosted backend deployment was completed. Existing interactive demo is preserved.
Next: authenticated browser verification of onboarding, expiration/active-delivery
edge tests, then proof-of-delivery and support workflows. Remaining financial,
provider, deployment and release blockers listed above still apply.

## Customer-code delivery proof — November 6

Migration 0013 stores salted code hashes, expiry, failed attempts and confirmation
time. Customers generate a six-digit code after pickup at POST
`/orders/:orderId/delivery-code`; the code expires after 15 minutes and five failed
attempts require reissue. Drivers submit `{code}` on the existing deliver endpoint.
Proof, order/delivery status, balanced earning allocation, location cleanup and
three recipient notifications commit atomically. Repeated pickup/completion requests
from the assigned driver acknowledge the completed transition without duplicate effects.
GET `/orders/:orderId/delivery-proof` is scoped to the customer, assigned driver or admin.
The customer order history and driver delivery screen have connected handoff controls.
The approved standalone visual demo is unchanged and remains explicitly simulated.

Tests passed locally with PGlite/test-only identity/provider adapters, including
concurrent completions, expiration, attempt exhaustion, ownership, pickup retries,
injected earnings DB failure/rollback/recovery, one delivery event, exactly three
notification rows, two earnings rows and one balanced allocation journal. No actual
Stripe/bank reconciliation, push-provider/device round trip or browser test of the
new authenticated forms is claimed. Next: support-case escalation for failed handoffs.

## Support escalation — November 6

Migration 0014 adds support cases. Authenticated members submit general or order-linked
cases at POST `/support/cases` using a client UUID for duplicate-request protection.
Order references require the customer, owning restaurant, assigned driver or admin.
GET `/support/cases` returns only the requester's records. Administrators use
GET `/admin/support/cases` and PATCH `/admin/support/cases/:id` with the case version
to review, resolve or reopen a case. Decisions have audit records and a private
in-app notification; notification bodies omit issue details. Support decisions never
automatically refund, cancel or complete deliveries. Connected UI is in customer
order details, restaurant/driver order controls and administrator operations.

Tests passed with PGlite/test-only auth/provider adapters: privacy, duplicate
concurrent submissions, ownership, stale concurrent resolutions, notification
deduplication and unchanged order state. Production build passed. The handoff proof
implementation is saved at remote commit 968211a10edd1e4c06d790b932f08077cd4abeaa.
Next checks: real PostgreSQL CI, authenticated browser/device testing of these new
forms and notification recovery, then partial refunds/disputes and external financial
reconciliation. No new production website, provider sandbox certification, signed
mobile artifacts or bank reconciliation is claimed by these changes.

## Checkout snapshot integrity and preparation notes — November 6

Order creation now holds shared row locks on the customer, restaurant, address,
menu items (in stable ID order), and configured pricing until order snapshots commit.
It rejects changed inputs and rechecks opening hours inside the transaction.
Preparation notes are available in the real item controls, separate cart identities,
checkout payloads and restaurant order lines. New addresses accept delivery instructions;
those remain immutable in the order after future address edits.
Tests pause requests immediately before transaction entry, mutate price, availability,
address or restaurant state, and verify conflict responses with no persisted order.
Separate instruction lines and address snapshot preservation are tested through HTTP.
Local full suite and production build passed with PGlite/test-only identity/providers.
Authenticated real-provider browser/device verification still requires configuration.

## Account-scoped cart storage — November 6

Customer carts use `rocoeats-cart:v2:<Clerk user ID>` with a fresh external-store
instance on account changes. Unscoped legacy carts are deliberately not imported
because ownership cannot be determined. Users must rebuild those old carts once.
Malformed saved data no longer crashes cart rendering; invalid quantities/mixed
restaurants are rejected, and quota failures retain the current in-memory cart with
an actionable warning. Cross-tab storage changes refresh the current account only.
Customization controls remount on account change to clear prior preparation notes.
Tests cover account isolation, legacy data, malformed storage, invalid updates,
quota errors, subscriptions and cross-tab refresh. Browser verification used the real
modifier component and cart hook in an isolated fixture with simulated account IDs;
required choices, separate notes, account switching, restoration and form reset passed.
No live Clerk session or provider-backed authenticated E2E is claimed. Reproduce with
`node artifacts/api-server/tests/build-cart-browser.mjs /absolute/qa-output` and serve
that directory with supported preview tooling; the fixture is not a production route.
Checkout revision 628b7ae28b86923f2bac35f283cbed2cc0d89599 passed PostgreSQL CI
(run 42178396335) and unsigned Android/iOS compilation (run 42178396125).
Final cart changes passed the full local test suite and production build; checkout
race tests also cover changes to delivery pricing before transaction entry.

## Prelaunch ordering gate — November 6

New order creation, checkout and sandbox payment confirmation now fail closed unless
server `ROCOEATS_ORDERING_ENABLED=true`. Quotes and receipt/cancellation recovery
remain available. The transaction checks the gate again before writing the order.
Commerce configuration and checkout controls reflect the gate. This authorizes only
ordering in the separately enforced test provider mode, never live financial activity.
Tests exercise unset/malformed/false values, blocked writes and recovery while closed.
The hosted visual demo is unchanged. Next: PostgreSQL backup/restore rehearsal in CI.

## PostgreSQL recovery rehearsal — November 6

CI now dumps/restores its disposable PostgreSQL 17 fixture database and compares all
public/drizzle table contents, sequence state and schema, then checks immutable ledger
updates and deferred journal-balance protection in the restored database. The script
refuses production names and existing restore targets; dump files and the new target
are cleaned up, and cleanup failure fails validation. Local shell safety tests use a
fake Docker executable only to test refusal/cleanup boundaries. Fingerprint SQL passed
against PGlite with determinism and changed-content detection; full local suite and
build passed. The actual pg_dump/pg_restore exercise must be verified in this commit's
GitHub Validate job because local Docker is unavailable. Production backup/PITR remains
external infrastructure configuration. Next: inspect recovery CI, fix failures, then
continue partial refunds/disputes and deployment/provider/device requirements above.

## Administrative suspension and recovery-test correction — November 6

Account updates and restaurant status changes now lock their target rows and write
atomic audit records. Suspending/removing a restaurant owner pauses their restaurant;
reactivation/reapproval does not automatically reopen ordering. Driver suspension or
role removal clears dispatch approval and online presence. Role changes are rejected
while the account has active customer orders, restaurant orders or assigned deliveries.
Quotes/payment availability check the restaurant owner's active role, and checkout
holds a shared lock on that owner until the order commits, preventing suspension/role
races from creating stranded new orders. Existing management controls display server
errors; the approved demo remains unchanged.
Tests cover authorization, protected admin accounts, suspension side effects, safe
reactivation, audits and concurrent owner suspension at checkout. The recovery SQL test
was corrected after real PostgreSQL CI exposed JS Date truncation of microseconds:
its mutation probe now rolls back inside PostgreSQL rather than rewriting timestamps.
The prior recovery commit's CI failure was a test precision issue; the full restore
exercise still requires the next Validate run. The launch gate commit 8808103 passed
PostgreSQL validation and unsigned native compilation. Local suite and build pass.

Recovery CI restored identical rows and sequences but found a DDL-only GPS constraint
parenthesization difference from PostgreSQL BETWEEN expansion. Migration 0015 replaces
that one constraint with equivalent explicit bounds and keeps full schema comparison
enabled. Invalid latitude/longitude/accuracy regression tests were added. Diagnostic
commit d08696a printed the exact fixture DDL difference; next Validate must establish
that the full pg_dump/pg_restore rehearsal and ledger guards pass after normalization.

### Verified recovery result and next executable step

Implementation revision 2c2f25dcbeaa204ed7b8c13d36076fbb71dba7db passed full PostgreSQL
17 validation, real pg_dump/pg_restore rehearsal, restored ledger guards, production
build, dependency audit, Docker build and HTTP/dependency smoke checks in GitHub run
42182600095. The timestamp precision and GPS DDL differences above are resolved.
Unsigned native validation for that revision was still running when this note was
written (42182606619); gate revision 8808103 had already passed unsigned native checks.
No production backup service, public transactional deployment, live provider/device
E2E or owner administrator identity has been configured/certified. Live money remains
disabled and new ordering defaults closed. Exact continuation: inspect native run
42182606619, then implement the remaining financial partial-refund/dispute/reconciliation
requirements while keeping the existing durable queue and immutable ledger invariants.
Obtain external configuration through supported secure interfaces when accessible;
do not request payment, bank or identity secrets in chat or source code.

## Owner-driver identity and driver navigation — November 6

Trusted administrator profiles can use driver application/availability/delivery APIs
without changing their administrator role. Operational actions still require independent
driver approval; application submission resets only driver approval, not admin access.
Review, approval/revocation, dispatch lists and self payout onboarding support these
identities. Driver earnings remain attributed to that same profile in the ledger.
Ordinary drivers still cannot access administrator APIs or grant administrator roles.
The driver workspace gives owners a direct return link to their owner dashboard.

Driver API destinations now include pickup region/postal code. Restaurant and customer
navigation controls use full, validated addresses, explicit Google Maps links and
Apple Maps links on iOS, plus copy/manual fallback. No address notes are sent to maps.
Incomplete/oversized/control-character destinations fail closed. No new mapping key
or proprietary routing engine is needed for these user-initiated external links.
Official references: https://developers.google.com/maps/documentation/urls/get-started
and https://developer.apple.com/documentation/mapkit/unified-map-urls (new unified
paths require iOS 18.4; the app uses the established HTTPS daddr link for older systems).

Local suite and production build passed, including administrator application/approval,
dispatch/claim/pickup/code proof/delivery/earnings/revocation with preserved admin role,
ordinary-driver authorization rejection, and navigation URL/fallback validation.
These are test-only identity/provider integrations; actual Clerk identities, real-device
map-app handoff and background GPS remain unverified. Existing demo is preserved.
Next: latest-location telemetry for on-duty unassigned drivers, secure dispatch status,
stale/disconnected warnings and explicit foreground/background tracking limitations.

## On-duty GPS, dispatch presentation and privacy — November 6

Migration 0016 adds latest-position-only driver duty telemetry. POST `/driver/location`
requires an approved driver/administrator, active account and fresh on-duty heartbeat.
Coordinates/timestamps are validated; older/equal observations never overwrite a newer
fix. POST `/driver/heartbeat` renews only fresh duty sessions and cannot silently reopen
an offline/disconnected session. Offline, approval revocation, application resubmission
and suspension clear current telemetry atomically. The maintenance loop prunes old rows.
Only authenticated administrators receive duty locations; customer order tracking keeps
its existing assignment-scoped API. Dispatch includes effective approval/expiry, actual
active assignment IDs, status, stale/disconnected warnings and full order destinations.

The global foreground duty session stays mounted while an approved owner moves between
admin/driver screens. Local intent is memory-only, account-scoped, cleared on sign-out,
and turned off synchronously before offline API calls. Location/heartbeat watches pause
in the background. Reliable native background tracking is NOT implemented/certified.
The Google Maps advanced-marker renderer requires real browser-key/map-ID configuration;
without it, the real status/coordinate list and external navigation remain usable.
No fake location data is introduced into production flows. Admin manual assignment/
reassignment controls remain an unimplemented priority; existing driver claim/release
and duplicate-assignment protections are preserved.

Local HTTP/database tests cover permission, monotonic updates, invalid/stale/future
fixes, heartbeat recovery, stale/disconnected reporting, concurrent offline/upload,
revocation and retention. Browser fixture verification used actual navigation and
map/status components with explicitly simulated GPS/accounts; copying, encoded URLs,
null destination and stale warnings passed without application errors. This does not
verify actual Clerk auth, real GPS, real Maps SDK credentials or physical map-app launch.
A viewport screenshot is in docs/verification/dispatch-navigation-fixture.jpg (full-page
capture timed out; viewport capture succeeded). Reproduce with the existing fixture
builder. Next: verify CI, implement protected administrative assignment/reassignment,
then native background services and real-device/provider/configuration requirements.
Owner-driver/navigation revision fd83b6276056b0486c5e4011e2eb6b242fe2ca0c passed
PostgreSQL/restore/container validation (42184948132) and unsigned Android/iOS native
compilation (42184947908). Final duty telemetry changes passed the local full suite
and production build. Their fresh CI/provider/device status must be checked separately.

## Protected dispatch assignment and location cleanup — November 7

Administrators can assign, reassign or release paid ready-for-pickup deliveries through
POST `/admin/orders/:id/assignment` and mobile-friendly dispatch controls. Observed
assignment identity/timestamp tokens reject stale operators; driver profile locks,
order locks and the existing unique active-driver index prevent competing claims and
double booking. Eligibility includes active/approved driver or approved owner-driver,
online heartbeat, available capacity and unexpired application. Pickup remains the
custody confirmation; this is immediate assignment, not a separate offer acceptance.
Reason-required audits and durable notifications include removed drivers. Assigned
GPS is deleted on reassignment and driver release; tracking checks location ownership.
Driver claim also rechecks application approval/expiry inside its locked transaction.

77 automated tests passed locally (48 in the relational HTTP suite including parent),
with no skips, using PGlite and test-only identity/provider adapters. Production build
and typechecks passed. Initial sandbox tests could not use loopback; HTTP validation
ran using the supported escalated executor. Existing GitHub checks for 249bbc2 were
all successful. New PostgreSQL multi-connection/restore/native CI must be checked on
this pushed revision. No real provider, hardware, configured Maps or Clerk E2E claim.
Next: restaurant-arrival coordination, restaurant capacity/inventory, acceptance and
dispatch escalation, then remaining partial-refund/dispute/reconciliation blockers.

## Restaurant arrival coordination — November 7

Migration 0017 adds assignment-scoped `arrivedAt`. Assigned approved drivers report
arrival through POST `/driver/orders/:id/arrive` and the driver workspace. Restaurant,
customer and driver receive durable notifications; dispatch shows the attestation time.
Order locking makes concurrent retries emit one set of notifications and one audit.
Reassignment/release clears arrival, and former drivers cannot report arrival or pickup.
This is driver attestation, not GPS-verified presence or custody proof.

All 77 local tests and production build/typechecks passed with the new migration.
Coverage includes arrival authorization, malformed order IDs, concurrent retries,
notification/audit deduplication, assignment reset and post-pickup rejection. These
remain test-only identity/provider tests. PostgreSQL and native CI for 17601d9 were
in progress when this checkpoint was saved; inspect their results and this commit's
new runs. No deployed provider-backed staging or physical-device certification exists.

## Restaurant capacity admission — November 7

Migration 0018 introduces optional owner-configured `maxOpenOrders`, preserving
unlimited admission for existing restaurants. Restaurant availability settings/forms
show the limit and current load. Quotes/public availability reflect full capacity;
checkout serializes per restaurant and checks capacity inside the snapshot transaction.
Idempotency is rechecked before capacity/menu validation so simultaneous retries
acknowledge the original reservation. Pending payment through ready-for-pickup consumes
capacity; pickup/cancellation releases it through actual state, without drift-prone
counters. Lowering a limit preserves existing orders. Pending unpaid reservations
still require cancellation; automatic expiry/escalation and inventory remain unfinished.

78 automated tests passed locally, including capacity authorization/range/database
constraints, concurrent final-slot requests, same-key retries while full, limit
preservation for older clients, pickup/cancellation release, audits and safe lowering.
Production build/typechecks passed. Dispatch revision 17601d9 passed PostgreSQL/restore/
container validation and unsigned Android/iOS CI (42348386135, 42348385949; PR validation
42348381663 also passed). Arrival and this revision require their own CI review.

## Item inventory and working restaurant menus — November 7

Migration 0019 adds optional available stock, monotonic stock revision and per-order-line
inventory deductions, with database bounds. Owner inventory APIs and forms support
reasoned, optimistic updates. Checkout aggregates customizations/instructions by item,
locks stock rows in ID order, checks availability and deducts once with the order.
Before-acceptance cancellation restores only deducted tracked units once, in sandbox
and durable Stripe-test paths. Accepted food requires manual stock adjustment; payment
decline alone retains reservations until cancellation. Item units only, no ingredient
inventory. Unlimited/legacy items retain their existing behavior.

Fixed two existing functional defects exposed by broader menu tests: public restaurant
lookup shadowed GET `/restaurants/me`, and menu projections dropped modifier groups.
The authenticated owner route now resolves and both menu views expose real choices.
Inventory and dispatch forms preserve stale observation tokens/errors through polling
and require explicit refresh after conflicts instead of silently adopting new values.

79 local automated tests passed (50 relational tests including parent), with injected
stock-write rollback, concurrent final units, same-key retries, aggregate customization
limits, revision conflicts, zero-stock listing, tracked/untracked cancellation rules,
and provider cancellation/expiry fixtures. Production build/typechecks passed.
Chromium at 390x844 passed actual-component stock/assignment saves, retained conflicts,
explicit refresh, eligible-driver choices, release, no horizontal overflow and no
application errors. Browser APIs/accounts are explicitly simulated; not Clerk/provider
or physical-device verification. Reproduce via `node artifacts/api-server/tests/build-operations-browser.mjs /tmp/rocoeats-operations-browser`,
then with Playwright installed outside the project, set ROCOEATS_PLAYWRIGHT_MODULE to
its index.mjs and run `node artifacts/api-server/tests/verify-operations-browser.mjs /tmp/rocoeats-operations-browser`.
Arrival revision a31313d passed PostgreSQL/restore/container and unsigned native CI.
Capacity revision 6aacb47 passed PostgreSQL/restore/container and unsigned Android/iOS CI (42348754164, 42348754244).
Check this revision's own CI after push. Remaining priorities: unattended reservation
expiry/acceptance/dispatch escalation, then partial refunds/disputes/reconciliation,
configured staging and real-provider/device release requirements described above.

### Deployment configuration correction

The container now accepts public Maps browser-key/map-ID build arguments; runtime
variables alone cannot configure an already-built frontend. `.env.example` includes
the closed ordering gate and Maps settings. Removed stale Firebase Admin dependency
advice. OWNER_STAGING_SETUP.md records the secure owner-only staging, migrations,
Clerk/Stripe TEST, private access and Cloudflare steps without applying external
changes or purchases. The latest application implementation is 2fa9064; its local
79-test/build/browser/audit checks passed. Its real PostgreSQL tests, backup/restore
and build had passed while container validation was still running. Confirm the final
Validate and unsigned native results for this and subsequent configuration revisions.

## Unpaid reservation expiry — November 7 continuation

Migration 0020 gives existing/new orders a persisted 15-minute unpaid reservation
window. The orders worker expires due unpaid orders with SKIP LOCKED and the same
order lock as payment/cancellation/fulfillment. Stock return, cancellation event,
audit, notifications and Stripe checkout-expiration job commit together; no provider
I/O occurs inside this transaction. Checkout attempts on a newly expired reservation
return 410. Paid orders do not expire. A valid late Stripe confirmation atomically
expires the reservation first, keeps it cancelled and queues the existing full-refund
recovery. Invalid provider amounts cannot trigger expiry through payment recording.
The worker remains enabled while the ordering gate is closed and participates in
readiness. Customer checkout discloses the reservation window.

81 tests and production build/typechecks passed locally, including competing workers,
checkout/cancel retries, exactly-once stock recovery, paid-order preservation and
late-payment races. PGlite/test-only identity/provider adapters were used; verify
this commit's real PostgreSQL/restore/container CI after push. Source 7cd193d passed
all PostgreSQL/container and unsigned native checks. Next: configurable timing,
restaurant/dispatch escalation, recovery and financial partial-refund work.

## Timeout escalation and operational recovery

Migration 0021 adds per-order timing snapshots, fair scheduled reviews and durable
versioned incidents. Administrators configure future-order reservation/response/
assignment/pickup windows in the operational dashboard (defaults 15/5/10/10 minutes).
Changes never rewrite existing deadlines. Paid restaurant response and unassigned
orders escalate without automatic financial cancellation. An assignment exceeding
its pickup window is released only before driver-reported arrival, clearing GPS and
notifying the previous driver and order participants. Arrival-reported assignments
remain in custody for operator review. Pickup/reassignment/cancellation resolves the
corresponding incidents from actual state; acknowledgement records a recovery plan
and cannot dismiss an unresolved operational condition. Recurrent unassigned incidents
reopen with a new version and deduplicated notification. Worker scheduling uses the
database clock and cycles reviews to avoid starving newer orders.

83 local tests and production build/typechecks passed, covering timing snapshots,
permissions/bounds, concurrent reviews, deduplicated escalation, stale acknowledgement,
automatic resolution, assignment release/GPS cleanup, arrival preservation, pickup and
delivery recovery. CI must confirm PostgreSQL/restore/container/native for this revision.
Next: partial refunds and dispute/reconciliation safeguards, then staging validation.

## Platform-funded partial Stripe test refunds

Migration 0022 adds multiple immutable partial-refund requests, provider identity and
monotonic confirmation guards. Administrators request explicitly platform-funded
`platform_goodwill_v1` credits on delivered Stripe test orders. Restaurant/driver
earnings and tips remain intact. This is a defined limited funding policy, not a
proportional tax/recipient-funded refund implementation. Request UUIDs are durable
idempotency keys; pending/unknown outcomes reserve the cumulative charge budget.
Confirmed failure releases the budget. Provider jobs use existing leases/backoff,
23-hour unknown-write holds, known-refund polling and read-only reconciliation.
Signed matching webhooks can confirm before the worker; stale events cannot regress
confirmed records or journal twice. Amount/currency/payment mismatches are quarantined.

Confirmed partial credits post balanced immutable cash/revenue journals. After all
credits settle, the existing full-refund path requests only the remaining cash and
reverses the original allocation with an offset for prior platform-funded credits.
Full refund plus partial credits never intentionally exceeds the original charge;
pending credits block the remaining full refund. Customer receipts and administrator
forms show multiple credits. No live money or provider round-trip certification.

85 automated tests and production build passed locally, including competing budgets,
same-ID retries, ambiguous provider outcomes, webhook-before-response/stale events,
immutable request/delete/truncate protection, preserved earnings and tips, and a
partial-plus-remaining-refund flow with zero final ledger balances. PostgreSQL CI
must validate this revision. Reservation b510e0b and timeout 3d784ff both passed full
PostgreSQL/restore/container and unsigned native CI. Next: signed dispute holds,
financial reconciliation controls and staging preparation.

## Dispute holds, provider evidence and support conversations

Migration 0023 records signed Stripe dispute events as versioned financial holds.
Known holds block new payout/partial-credit requests and outgoing transfer/refund
worker execution; safe recovery operations remain separate and held work is excluded
from queue candidate selection. Existing provider writes cannot be undone by a hold;
expired disputed jobs can be reconciled read-only, with state/lease/attempt fencing.
No replacement provider write is issued by reconciliation. Provider reads occur
outside DB transactions and are revalidated under the order lock afterward.

Administrator reconciliation verifies original payment/charge/available balance
identity, integer amount/currency and fee/net arithmetic, storing immutable balance
evidence and balanced fee journals once. Dispute reconciliation records settled
withdrawal/reinstatement and fee evidence; a won dispute releases only with matching
settled recovery, and a closed warning/prevented dispute requires no balance movement.
Lost disputes remain held. Dispute losses are recorded as platform expense pending
owner review. Evidence submission/appeal, external-refund reconciliation, remaining
refund fees, bank payouts and recipient-funded partial allocation remain unfinished.
No report claims complete net profit, tax remittance or bank reconciliation.

Migration 0024 adds private append-only support conversations with durable reply IDs,
version-safe concurrent replies, stored operator decisions, requester reopening and
stable version-based pagination. Existing current decisions are preserved from stored
case data. Customers/restaurants/drivers can continue their own cases and admins can
reply/review; unrelated accounts receive 404. Messages never trigger financial or
custody actions. Generic notifications do not expose private message contents.

88 local tests and production build/typechecks passed, including signed dispute
inbox ingestion, stale event/provider-read fences, held-job filtering, loss/reinstatement
journal replay, exact fee evidence and immutable protection; support reply privacy,
duplicates, races, reopening, retained decisions and pagination. Tests use injected
provider evidence and test identities; no real provider/device round trip is certified.
Partial-refund 52d8272 passed PostgreSQL/restore/container and unsigned native CI.
Verify this revision's own CI. Next: runnable private staging package/preflight, owner
configuration, then external-refund/Connect bank-payout reconciliation and broader E2E.


## Runnable staging package and final verification

compose.staging.yml packages the real app image, separate PostgreSQL 17 volume,
one-off migration service and loopback-only web/API port. It has no public binding,
identity bypass, test business seed, real credentials or automatic ordering activation.
staging.env.example and the redacting Node preflight document/check the minimum owner
settings: Clerk development keys/user ID, Stripe TEST server/webhook keys and a random
hex database password. Live/restricted payment keys, placeholders, unsafe origins,
weak/password-shaped values and incomplete Maps settings fail preflight. Credential
validity and access require actual owner configuration; format checks cannot certify it.
CI now checks this preflight and Compose rendering with clearly fake QA placeholders.
OWNER_STAGING_SETUP.md contains exact build/migrate/start commands and secure owner steps.

Verification this session: 88 automated tests on PGlite and on actual local PostgreSQL
17; one preflight security test; production build/typechecks; real pg_dump/pg_restore
with fingerprints and restored ledger guards; all 25 migrations via the actual Drizzle
release command on an empty staging fixture and successful idempotent rerun. Chromium
at 390x844 verified existing dispatch/inventory controls plus timing configuration,
partial-credit cents, reconciliation controls and support lost-response/failed-refresh
retry without duplicate messages. Browser APIs/identities/provider proof are simulated,
not actual Clerk, Stripe, Maps, push or physical devices. Provider evidence errors now
return a safe reconciliation explanation; failed support refresh retains its saved ID.
Final pushed revision still needs its own CI result checked.

Minimum owner action for a local actual site: configure the separate Clerk development
instance, owner Clerk ID and Stripe TEST/webhook credentials in a protected .env.staging,
then run the documented preflight/build/migrate/start commands. For remote private HTTPS
also connect an owner-controlled container/PostgreSQL host and access controls. There
is no verified updated staging URL yet. No DNS, paid service, live payment, app publishing
or production database changes were performed.

Next engineering priority: recipient/tax-funded partial-refund allocation; external
refund ingestion/reconciliation; complete Connect bank-payout/failure accounting and
dispute evidence/appeals. Then configured four-role provider E2E, failed-delivery business
policy/compensation, privacy/accessibility/load tests and physical-device release gates.
Keep platform-funded credits explicitly labeled and preserve all existing financial
idempotency, hold, immutable journal and stock/custody invariants.

## Secure owner administrator and owner-driver configuration

The supplied owner Clerk ID was added only to the gitignored local .env.staging,
permission 0600, in LOCALEATS_ADMIN_CLERK_USER_IDS and the explicit new server-only
ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS setting. No actual owner ID or secret is embedded
in source, tests or tracked templates. Compose forwards both runtime settings; secure
staging preflight requires owner-driver IDs to be a subset of bootstrap admin IDs.
Local configuration is not a hosted deployment and must be entered in host secrets
when deploying; never commit the private environment file.

Central active-profile authorization now audits trusted bootstrap grants and applies
on protected APIs as well as profile reads. Client metadata/body roles do not confer
admin or owner-driver authority. Active, double-allowlisted administrators have effective
driver access without self-review; stored driver approval/application review fields
remain untouched. Known license expiry still blocks duty until updated. Ordinary
admins/drivers retain approval rules. Locked claim, duty/GPS and dispatch assignment
checks use the same server-derived capability. Presence consent/freshness, duplicate
assignment prevention, custody transitions and handoff proof remain enforced.
The driver UI identifies owner access and makes vehicle details optional; it does not
claim owner screening or insurance verification. Owner operations stay accessible.

90 automated tests and production build/typechecks passed locally, including same-owner
registration/bootstrap, direct protected API promotion, concurrent grant deduplication,
no self-approval delivery/earnings/assignment, spoofed roles/Clerk IDs/driver flags,
ordinary-admin and single-allowlist rejection, license expiry, suspension and withdrawal
of owner-driver configuration. Real Clerk login requires the development publishable/
secret keys and instance origins; test-only identity adapters do not verify personal
Clerk sign-in. OWNER_STAGING_SETUP.md names the exact secure file, provider dashboard
location and hosted runtime settings. Check this commit's PostgreSQL/native CI next.

## November 8 — owner-controlled Render staging preparation

Resumed exact remote `0cf0a53fb97fd5e8d6eac4ea80ac8585db2d3875` with the preserved
uncommitted staging work; remote comparison showed no divergence. No redesign,
architecture replacement, production DNS change, live transaction, account purchase
or application publication was performed.

- Root `render.yaml` provisions one same-origin Docker website/API and managed
  PostgreSQL 17 in Ohio, with internal database connection, external database access
  disabled, explicit 1 GB persistent storage, no storage autoscaling, migrations
  before deploy, 60-second shutdown allowance and manual application deployment.
- Protected initial environment prompts collect Clerk Development/public key,
  Clerk secret, trusted owner/bootstrap subjects and Stripe test secret. No actual
  owner subject, secret or banking detail is tracked. The local private environment
  remains ignored, mode 0600, and is excluded from Docker context.
- Container startup derives checkout/CORS origin from Render's assigned HTTPS
  address and uses the same public Clerk key on frontend/backend. Private staging
  validates test configuration and owner allowlists. No unsupported Clerk proxy
  is used with Development keys. Optional BuildKit CA mounts support managed
  development networks without weakening TLS or embedding session CA files.
- Business APIs require a Clerk-verified subject in the server owner/tester list;
  tester admission grants no business role or approval. Landing/sign-in assets are
  public. Health endpoints and signature-protected Stripe webhook remain reachable.
  Ordinary owner authorization, approval and owner-driver safeguards are preserved.
- Ordering defaults off. Test ordering startup and both checkout request/worker
  paths require a configured test webhook. Readiness now reports webhook readiness.
  Stripe publishable keys are unnecessary for the existing hosted Checkout model.
- `RENDER_STAGING_ANDROID.md` gives phone signup, Blueprint, protected environment,
  webhook, tester admission, backup/update and owner-login steps. Budget approximately
  $13–$14/month before tax/overages, subject to the owner's dashboard quote. Owner
  must authorize any paid deployment. No Render account is connected here.

Verification: 92 automated tests passed against disposable PostgreSQL 17 (zero
failures/skips), plus 3 staging/runtime preflight tests; complete production build
and typechecks passed; production dependency audit found no known vulnerabilities.
The Blueprint passed Render's published JSON schema. Exact deploy migration command
succeeded on a fresh separate database and on repeat. Built real server startup
with synthetic provider settings served /, /sign-in, /admin, /restaurants, /driver
and /orders; /livez passed; incomplete /readyz correctly returned 503; real Clerk
middleware rejected anonymous and forged test-user/role header requests; hidden
environment-file URL returned 404. These checks do not prove authenticated owner
login, real Stripe calls or browser/device certification.

Local Docker build hit the environment's 7.9 GB filesystem limit during layer
creation; disposable failed build cache was cleared without deleting source.
Use the pushed Validate workflow for final image build/container verification.
No real HTTPS staging website exists yet. Minimum owner action: create their free
Render account using the repository-owning GitHub account, then follow the phone
guide and explicitly approve the displayed paid resources. Enter credentials only
in Render's protected environment settings. After deployment, record the actual
URL, deployed SHA, authenticated four-role checks and provider/device evidence.

## November 8 — zero-cost staging supersedes paid deployment instructions

Owner declined billing and requires $0/month, no card and no paid upgrades. The
working tree was clean at remote `6a49caf60edd84f307ec646f6b3d751988c7e356` before
this work. Preserve the paid root `render.yaml` unchanged for later authorization.

Chosen intermittent owner-test deployment: Render **Free web service**, manually
created via New > Web Service (not the paid Blueprint), plus Neon **Free PostgreSQL**.
Current official plans were checked: Render sleeping free Docker/HTTPS service;
Neon no-card/no-fixed-expiry free PostgreSQL, 1 GB/project, 100 CU-hours/month and
5 GB transfer. Supabase Free DB was considered (500 MB/inactivity pause), Railway
Free ($1 resource credit, inadequate guarantee for continuously polling workers),
Koyeb (requires card) and static-only hosting (cannot run this backend). All are
linked in FREE_STAGING_ANDROID.md. Specific owner-account availability is untested;
if Render's manual Free flow still mandates a card, stop at that external blocker.

`deploy/render-free.yaml` has one Free Docker web service, no paid datastore/disk/
worker/pre-deploy command and protected environment placeholders. It reuses the
Dockerfile, same-origin website/API, Clerk, owner access, Stripe test gate and SQL.
`start-free-staging.mjs` validates explicit private/test configuration and a direct
Neon TLS URL, serializes existing migrations with a session advisory lock, and
starts the real server only on migration success. The direct connection avoids
transaction-pooler loss of session locks. Persistent data stays in Neon, not Render's
ephemeral filesystem. Runtime pool size is two; ordering starts disabled. No
simulator, fake role identity or hardcoded owner subject was introduced.

Focused verification: free environment rejection checks and migration failure/lock
cleanup checks passed; real PostgreSQL 17 fresh migrations, competing startup
migrations, repeat migration and persisted profile after reopening connections all
passed (3 new tests). First connection attempt raced local Postgres recovery;
rerun after its ready log passed. Free reference configuration passed Render's
published JSON schema. CI runs these checks before the existing complete validation.
The application/design, paid configuration and dependencies are unchanged; avoid
repeating unrelated suites outside the final CI validation.

This is not an always-on dispatch service: Render sleeps after idle and pauses
workers; queued jobs/expiry/retries recover on wake using existing database state.
Keep-alive pings are not configured or recommended. Continuous worker DB polling
can consume Neon allowance while awake. Quota exhaustion suspends service/compute
or blocks writes; no credit card, upgrades or bypasses are authorized. Backups and
free quotas must be monitored by the owner. Push/maps/device/provider validation
remain separate, and no Google billing activation is included in the $0 plan.

No hosting resource was created and no real staging URL exists. No Render/Neon
credentials or Clerk/Stripe secrets are available to this environment. Minimum next
owner action: open console.neon.tech/signup on the phone and Continue with GitHub.
Enter the future Neon connection string only in Render's protected DATABASE_URL
setting. FREE_STAGING_ANDROID.md provides the remaining phone steps for one-at-a-time
assistance. After owner provisioning, verify actual HTTPS access, Clerk owner login,
restricted testers, database persistence and real Stripe TEST webhook/order flow.

## November 8 — Render migration subprocess EACCES correction

Owner reported first Render Free startup at c9eaad7 failed spawning pnpm with
EACCES. `free-staging.mjs` now launches the installed Drizzle JS CLI using the
current absolute Node executable and the database package's working directory.
This uses the same migration/configuration without a PATH lookup, executable pnpm
shim or package-manager cache. Existing advisory locking, failure-before-startup,
private admission and test-only ordering controls are unchanged. No schema, design,
dependency, hosting plan or protected environment value changed.

Focused PostgreSQL regression reproduces EACCES with an unreadable-for-execution
pnpm shim, then passes fresh, concurrent and repeated migrations plus persistence
checks using that same blocked PATH. Earlier container validation only started
the API and did not run migrations inside the runtime image; CI now also migrates
a fresh database as container UID 1000 with PATH=/nonexistent, restarts migration
and verifies a persisted profile. Check this revision's Validate run for Docker
build and non-root migration results. Local Docker storage remains constrained;
the final image/build test runs on the GitHub CI runner.

Owner redeploy: existing Render web service > Manual Deploy > Deploy latest commit
on feature/rocoeats-launch-readiness. Retain the free startup Docker Command and
all protected settings, keep ordering false, and do not reset Neon. The owner's
existing Render HTTPS URL was not supplied or verified in this repair session.

## November 8 — working dashboard and verifiable owner access

Continue from PRODUCTION_BACKLOG.md, which now persists priority, implemented
foundation, external dependencies and the actual staging acceptance sequence.
Owner supplied https://localeats-delivery-app.onrender.com/ and reports deployed
5e1fd62 with Google sign-in. Read-only checks verified /livez 200, DB/auth/provider/
worker readiness, missing pricing and webhook, and 401 for anonymous profile and
forged administrator requests. Chromium at 390x844 verified real website navigation
to Clerk's Google sign-in screen. No authenticated owner session was used.

Found stale non-clickable /dashboard placeholders and a separate role read path.
Dashboard now uses central active-profile authorization and real role-specific
workspace links. Configured owners bootstrap a missing profile transactionally on
first protected use; concurrent visits audit once, and suspension is preserved.
Signed-in /account/access reports exact-match booleans for both owner settings,
effective Super Administrator/Driver access and profile status, without returning
IDs or secrets. Its self-only API remains available to a signed-in identity omitted
from private admission; other business APIs remain blocked. /livez now includes a
validated host-provided release hash when available for deployment verification.
Navy styling/demo and ordering/payment guards are unchanged.

93 automated tests and complete production build/typechecks pass locally, including
new owner bootstrap, direct dashboard authorization, admission exemption privacy,
forged-role rejection and suspended-owner diagnostics. Actual hosted flag values
and positive owner/driver authorization remain unverified until deployment and a
real owner session. No Render/Neon secrets or browser-control connector is connected.

## November 8 — protected owner recovery and account/onboarding controls

Owner/dashboard batch 8d651fa passed complete PostgreSQL, backup/restore, production
build, Docker image, non-root migration/persistence and startup CI 42463887908.

Second batch prevents member management from changing a configured owner's record
even before bootstrap has changed its stored customer role. Added self-only
display-name updates with strict input, atomic expected-name checks, active-account
fencing and audit; role/identity/approval input is rejected. Account settings expose
Clerk-managed sign-in/security controls. Restaurant/driver registration routes into
the real respective workspace. Denied admin/driver/profile views now offer safe
access/setup recovery links. Signed-in Clerk ID copying works independently of a
business profile so an owner omitted from admission can repair host configuration.

94 automated tests and complete production typechecks/build passed locally. An
isolated Chromium 390x844 test of the real React components verified owner/driver
workspace links, identity-mismatch recovery, self-profile PATCH payload, security
settings delegation and mobile layout with production CSS. Its auth/API are
explicitly simulated, distinct from the actual deployed sign-in-screen checks.
No authenticated real owner, Stripe, push or physical-device verification is claimed.
Use the second batch's pushed PostgreSQL/container CI before redeployment.

## November 8 — owner-confirmed staged access and administrator delegation

Owner replied Yes to both owner identity-match settings and effective Administrator/
Driver access on the actual staging site. Read-only /livez identifies deployed
8d651fa04de9fd20e7016788a0f08cb42dcd5a93; do not assume the later 911ffad batch is
deployed. Scripted ten-route HTTPS checks passed (including forged-role/unsigned
API rejection and hidden-file protection); saved sanitized evidence in
docs/verification/STAGING_HTTP_2026-11-08.json. Direct authenticated owner business
API calls were not performed by engineering. Pricing/webhook remain unconfigured.

Account controls batch 911ffad passed full PostgreSQL/restore/build/container CI
42464424954. Next batch implements configured-owner-only administrator delegation,
mandatory reasons/audit, expected-role concurrency, owner lockout protection and
dedicated account/custody rules. Revocation preserves a subsequently enrolled
driver's existing approval status, takes them off duty and clears duty GPS; grants
never approve drivers. New owner controls are in Admin > Accounts. Ordinary member
updates still cannot grant admin. 95 automated tests and complete production build/
typechecks passed locally. Chromium component checks cover grant/revoke payloads
at 390x844 with simulated auth/API; actual deployed delegation remains untested.
No new services, dependencies, migrations, live payments or ordering activation.

Administrator batch 4cf3216 passed PostgreSQL/restore/build/container CI 42465057837.
Follow-up adds full-precision opaque version fencing for grant/revoke writes, using
database clock timestamps. The regression explicitly grants, revokes, then retries
the original customer-role grant: it stays rejected despite the role returning to
customer. UI fetches owner-only account versions and can refresh conflicts. 95 tests,
production build/typechecks and simulated phone-size component checks passed.
Check this follow-up's pushed CI before deploying the final source. No owner session,
provider secrets or paid infrastructure was added to the engineering environment.

The successful phone-size component fixture/runner is now preserved in
artifacts/localeats/tests/account-browser.tsx and scripts/verify-account-browser.mjs,
with developer-tool prerequisites in that tests directory's README. No substantive
finished UI verification work is left only in a temporary workspace. The harness
explicitly simulates identity/API and adds no runtime dependency or auth bypass.

## November 8 — real TEST payment setup checks

Resumed clean remote 6cad154; actual staging revision matches. Read-only deployed
checks again found pricingReady=false/webhookReady=false, with DB/auth/workers and
test-provider configuration present. No hosted secrets or owner session is attached
to this engineering executor. Do not infer that a Stripe key prefix proves provider
connectivity or that a historical signed event verifies the current webhook secret.

Added admin-only payment setup/status and an audited, read-only real Stripe API
probe for TEST-mode Balance and the exact webhook destination/version/subscriptions.
No raw provider errors, keys, account balances, endpoint IDs or secrets return to
the browser. No SQL transaction spans provider I/O. Endpoint pagination uncertainty,
live responses, disabled endpoints, version/event mismatch and API failures are
reported conservatively. /operations explains the required protected configuration.
The probe never changes ordering, creates payments or mutates Stripe configuration.

99 automated tests and complete production build/typechecks pass. Phone-size actual
component QA passes with simulated auth/API. Provider verification is not claimed:
the owner must deploy, configure the webhook/pricing and invoke the check through
the real authenticated app. PRIVATE_TEST_DELIVERY.md specifies setup, authorization,
actual Checkout/delivery/proof/reconciliation and failure evidence requirements.

## November 8 — restaurant/customer delivery progress

Payment setup a0ee18d passed PostgreSQL/restore/build/container CI 42467372777.
Native compile run 42467377086 failed on upstream HTTP 504 for the official Gradle
distribution and Capacitor Swift binary archives before compilation; no device or
unsigned-native success is claimed for that revision.

Tracking now returns assigned courier display name and arrival/pickup/completion
timestamps only to existing authorized order participants/admin. No internal driver
IDs/contact details or broader GPS visibility are exposed. Coordinates remain limited
to ready-for-pickup/out-for-delivery, stale/reassigned positions are withheld, and
Cache-Control: no-store protects shared-device caching. Customer/restaurant expanded
orders show tracking during preparation and after closure, with accurate ended-sharing
text and manual refresh. The 100-test suite exercises assignment, restaurant arrival,
fresh/stale sample GPS, reassignment access revocation, pickup, real relational handoff
proof and completion using test-only payment/identity adapters. Production typechecks/
build and simulated phone-size actual-component tests pass. Actual Stripe/device E2E
is still blocked on the owner's sandbox webhook/pricing/accounts and authorization.

## November 8 — bounded native dependency recovery

Tracking batch 8030577 is pushed; preserve it. Recent native runs fail before
compilation on HTTP 504 fetching Gradle 8.14.3 and Capacitor 8.6.0 Swift binaries
from their official releases. Added dependency-only bounded retries for transient
transport failures, shared explicit Swift package resolution for simulator/release,
and 30-minute job deadlines. Compiler/lint steps are not retried or suppressed;
no mirror, TLS bypass, new service or paid cache was introduced. A standalone test
verifies transient recovery, immediate compiler failure and original error codes
after persistent outage. Check the new native CI; do not claim unsigned/native or
actual-device readiness from these helper tests. Linux has no attached iOS device.

## November 8 — driver offer decline/reconsider checkpoint

Additive migration 0025 persists per-driver 15-minute offer declines with an expiry
index. Approved available drivers can decline only paid/unassigned ready orders;
claim and administrator dispatch respect active declines. Reconsider requires the
current response UUID, preventing delayed requests from deleting a newer decline.
Profile/order locks serialize races, retries preserve expiry, and audit records
survive expired-row maintenance. Driver UI supports declined offers and recovery.
101 automated tests pass on PGlite and fresh local PostgreSQL 17, including concurrent
claim/decline, expiry, authorization and nonce fencing. Production build/typechecks
and simulated phone-size browser tests pass. Owner Neon data was not changed.

Owner says current Stripe checks have not yet been verified: do not infer results
from older health responses. Ordering remains closed. Deploy the latest pushed
branch, then use /operations for the real read-only Stripe check; private test
payment/delivery acceptance is still pending. Native run 42468145201 failed before
compilation on official binary download HTTP 504 despite bounded retries.

## November 9 — recovered setup refresh

Interrupted four-file UI fix recovered. Pricing save and provider verification
refresh setup readiness; explicit refresh reloads signed-event status. Actual-component
390x844 browser QA passes with simulated API/auth, including the pricing policy
payload. Prior production build/typechecks passed; 711e2d7 full Validate CI passed.
Guest ordering and telephone confirmation are new launch-critical requirements;
implement additive shared workflows, preserving private staging/TEST-only gates.

## November 9 — guest backend checkpoint

Migration 0026 and guest-sessions/guest-access implement scoped expiring capabilities,
server-side customer authorization and one-order transactional binding. Customer
checkout/financial-operations/tracking/support/cancellation reuse existing logic;
all privileged routes retain Clerk auth. Registered-customer regression preserved.
102 local relational API tests pass; identity/payment adapters are simulated.
Private staging remains closed to anonymous session creation; owner can mint a
guest test capability while authenticated, and only customer routes admit it.
Next checkpoint must add shared guest UI/cart/session recovery, then telephone
confirmation. Real sandbox/device acceptance remains pending; ordering is disabled.

## November 9 — shared guest screens checkpoint

Guest UI now reuses customer cart/address/quote/checkout APIs, with anonymous cart
persistence, scoped current-order/support/tracking/handoff access, revocation and
optional capability-verified account linking. Operations provides private guest test
links; ordering remains closed. Guest tokens are fragments stripped before requests,
not provider metadata; customFetch limits automatic attachment to relative customer
APIs. Queued Stripe worker and direct checkout both use guest receipt/return routing.
103 automated API/unit tests and actual-component phone QA pass (simulated auth/API),
full production build passes; backend 0ce82fe Validate 42569873460 passed PostgreSQL,
migrations, restore and container validation. No deployed/real-provider/device guest
workflow is certified. Next is safe telephone confirmation before taking payment.

## November 9 — telephone dispatch checkpoint

Migration 0027 adds receipt-mode snapshots and versioned audited phone confirmation.
Operations now configures future receipt modes and provides a pending-call queue
with phone/hours/items/modifiers, call notes, exact-price acceptance/prep estimate
and unpaid rejection. Confirmation precedes hosted payment; no invented manual
capture/authorization. Direct/queued checkout and generic status endpoints enforce
this. Verified payment activates accepted; original electronic ordering remains.
Stock release, pending escalation, expiry and idempotent/conflicting command recovery
are covered. Customer status messages use real confirmation/order records.
104 API/unit tests, production build/typechecks and simulated phone component QA pass.
Private Stripe/provider delivery and device tests still require owner setup/access.
Guest 3e97fc4 complete PostgreSQL/restore/container CI passed; native dependencies
still return upstream HTTP 504. Read PRIVATE_TEST_DELIVERY.md for exact staging flows.

## November 9 — combined guest delivery checkpoint

105 automated tests pass including a complete relational guest + telephone + driver
proof/earnings/ledger workflow (only identity/payment adapters simulated). On-demand
audited guest contact is limited to admin and active fulfillment; drivers never see
email and lose access after delivery. Secure optional account association now preserves
order support and notifications. Build/typechecks and simulated phone browser QA pass.
c732e83 complete PostgreSQL/restore/Docker Validate 42570925118 passed. Real staging
still deploys 711e2d7; November 9 HTTP evidence is checked in. /readyz reports missing
pricing/webhook; this does not substitute for owner's authenticated Stripe checks.
Next owner step: deploy latest pushed branch, then verify Operations setup without
sharing keys. Ordering stays false. Actual guest/phone/Stripe/device acceptance pending.

## November 9 — final guest mobile link checkpoint

107 API/unit tests plus production build/typechecks pass. Native private links use
the configured HTTPS site, never webview localhost; malformed/untrusted origins
fail closed and tokens remain fragments. 70889fb full Validate 42571305415 passed.
Native c732e83 run 42570932127 passed Android debug/release/AAB/lint and iOS simulator/
unsigned device release, with unconfigured artifacts. 70889fb iOS again failed during
package resolution. Native transport is intermittent; signing, configured device
builds, OAuth/push/background GPS and guest physical-device acceptance remain open.
No actual Stripe E2E was performed. Preserve ordering=false/TEST mode. Next: deploy
latest branch, verify Operations Stripe settings, and run PRIVATE_TEST_DELIVERY.md
with authorized private accounts/guest capability. Guest email delivery/recovery,
commercial operations and device acceptance remain launch blockers.

## November 9 — final repeat-checkout checkpoint

Closed guest orders now support fresh guest checkout without revoking previous
tracking/refund links. Active/revoked/expired access is guarded, new capability
scope is independent, contact is revalidated and actions are audited/rate-limited.
107 tests and production build/typechecks pass; phone-size actual form QA verifies
saved-link consent, payload, fresh token storage and /cart navigation with simulated
API/auth. dfe72bf full Validate 42571799623 AND native 42571804960 passed. Native
artifacts are unconfigured; no physical-device, signed release or real Stripe claim.
Next: deploy latest branch, verify Operations/Stripe TEST configuration, execute
actual authorized private guest + telephone/electronic test deliveries, then address
secure email/recovery and configured native/device acceptance. Keep ordering closed.

## Android staging checkpoint

Read docs/ANDROID_STAGING_TEST.md. Owner Stripe settings are verified/configured,
sandbox 0% tax remains temporary, ordering is closed; do not overwrite them.
Versioned public native config, private TEST CORS, staging Android variant, signing
bootstrap/build targets and packaged APK verification are prepared. Source permissions
hardened; no test private key exists in source/artifacts. GitHub Secrets access is
HTTP 403: owner must supply one temporary narrowly scoped bootstrap token via GitHub
Secrets, never chat, before stable signing can run. Native Google/guest integration,
actual APK/device/Play Protect acceptance remain to verify. Preserve all prior flows.

## Native sign-in checkpoint

Migration 0028 implements state/PKCE-bound, five-minute, one-use browser sign-in grants.
Tickets last 60 seconds and are issued outside SQL transactions. Native Google sign-in
uses the system browser; no roles/tokens are accepted from a deep link. Warm/cold app
returns and validated private guest-link import are implemented. Configured APK build
now verifies real deployed native protocol/CORS, public Clerk match and closed ordering.
111 tests, build/typechecks and simulated actual-component phone QA pass. Real Clerk
and Samsung tests are still required. Stable signing is externally blocked until the
owner completes ANDROID_STAGING_TEST.md; probe 42580742817 correctly stops there.
Keep source saved before any more work; no payment or pricing settings were changed.

## Stable staging signer checkpoint

Owner setup completed: bootstrap 42581883152 passed; private key/password live only
in owner repository encrypted Actions secrets. Bootstrap secret was removed. Do not
rotate or recreate it. 0937bd9 server PostgreSQL/restore/container CI passed.
112 tests plus production build/typechecks pass; native bearer tokens are destination
scoped, expanded browser QA is saved, APK review retains public signing metadata.
Android lazy Kotlin dependencies now prefetch before the compiler under bounded retry.
Next: owner Render deploy, verify /api/mobile/readiness and both native CORS origins,
run native-validation target=staging, inspect actual signed artifact/security gates,
then Samsung/Play Protect and real Clerk/Stripe device acceptance. Signing setup is
no longer blocked; deployment and real-device verification remain owner-dependent.

## Official Gradle transport checkpoint

Use downloads.gradle.org Gradle 8.14.3 bin.zip with verified vendor SHA-256 rather
than the failing all.zip; same toolchain version, 60-second read timeout, explicit
wrapper validation. Wrapper JAR matches official vendor checksum. bf9e8c1 server CI
passed; its iOS native job passed, Android hit upstream distribution HTTP 504 before
compilation. Owner stable signing exists; Render mobile deployment is still needed
before target=staging can create the real signed artifact.

## Signed build retry checkpoint

Deployed mobile contract/CORS and no-order/payment native negative-auth HTTP tests
passed. Signing prerequisites passed; run 42582782177 failed because generic Android
classpath prefetch caused AGP artifact ambiguity. It is narrowed to kotlinCompilerClasspath
only. Keep owner signing key unchanged and retry target=staging. Do not offer an APK
until actual signature/manifest/secret scans and artifact upload pass.

## Verified Gradle CLI checkpoint

Official Gradle binary was actually downloaded/stream-hashed against the pinned
vendor checksum and executed locally at version 8.14.3. CI now installs the same
verified binary through Node before dependency prefetch/build, keeping wrapper
validation and rejecting non-vendor/unpinned URLs. No transport security bypass.
Run signed target=staging at latest HEAD; do not rotate the stable owner key.

## Verified signed APK handoff checkpoint

Application source 5c687ac102adfe622f11403239398ec43fc84e15: server CI 42583769000/
42583776593 and BOTH native platforms 42583776579 PASSED. Actual configured owner-signed
staging APK run 42583769896 PASSED all package/signature/credential/security gates;
artifact 13658705753 is real and retained until Dec 9. See ANDROID_STAGING_TEST.md
for direct link, certificate fingerprint and Samsung extraction/install instructions.
Stable key is in owner encrypted GitHub secrets; never initialize/rotate it again.
Owner deployment passed native protocol/Clerk/CORS/closed-ordering verification.
112 tests pass; no actual payment or authenticated Google-device session was tested.
Samsung/Play Protect acceptance is awaiting the owner's physical-device results.
Next: inspect owner evidence and fix actual device issues, then private sandbox E2E.
This documentation-only checkpoint does not change the APK app source or require
another native rebuild. Keep all signing/provider secrets out of source and chat.

## Permission disclosure and emulator retry checkpoint

Owner Samsung installation/launch/appearance PASSED; native authentication response
is still awaited. Foreground/on-duty disclosure now accurately includes dispatch in
shared UI/iOS permission text; no background capability or permission was added.
Frontend types and iOS plist syntax pass. Initial emulator 42585658397 did not boot
and ran no app checks. Retry adds bounded boot diagnostics/KVM/headless settings and
explicit ungranted location/push checks. Preserve original signed APK source 5c687ac
and owner key; no need to reinstall it for authentication verification.
