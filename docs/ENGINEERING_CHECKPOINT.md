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
