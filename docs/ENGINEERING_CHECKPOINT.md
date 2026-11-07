# RoCoEats resumable engineering checkpoint

Continue GitHub PR #1 on `feature/rocoeats-launch-readiness`. Do not merge,
enable live transactions, discard changes or claim launch readiness.

## Saved source and verification

Latest implementation revision: `26e4d95f3d5f7c850baf39f18074692e3b34fd79`.
The local checkout is aligned with the GitHub history and has no unsaved code.
This checkpoint may be a later documentation-only commit.

- 53 automated tests pass locally and in real PostgreSQL CI, including the
  integration parent. No tests skipped. CI runs `42016933829` and `42016924348`
  passed the production dependency audit, tests, API/web production builds,
  Docker build and container startup/website/readiness smoke checks.
- Production dependency audit reports zero known advisories. This is not a
  penetration test or a guarantee of security.
- Native workflow `42016933790` passed Android debug, unsigned release APK/AAB,
  release lint, iOS simulator and unsigned Release/iphoneos compilation for the
  same latest implementation revision `26e4d95`.
- Native artifacts are deliberately named unsigned/unconfigured. They are not
  signed distribution packages, published apps, or verified physical-device apps.
- No deployed business website or verified public application URL exists yet.
  Hosting/database/auth/provider credentials and domain ownership are not connected.

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
