## Current stage: durable device delivery and CI failure recovery

Preserve the notification changes in this revision; they were recovered from the
workspace after the prior interruption. Device-level push jobs now persist
fan-out, attempts, leases, acceptance timestamps and redacted failure codes.
Successful devices are not resent when another device fails. Expired leases can
be taken over, and stale workers cannot overwrite new outcomes. Invalid tokens
are removed; removed/reassigned devices cannot receive a previous account's
notification payload. Missing platform configuration does not consume attempts
or starve configured deliveries. Push remains at-least-once with provider collapse
keys; provider acceptance is explicitly not proof of device display. In-app
notifications remain durable. Migration 0010 adds device jobs and queue indexes.

Admin Order operations now integrates queue health, worker progress, webhook
recovery, redacted device recovery, audited reason-required retries, gross ledger
reporting and read-only provider financial reconciliation. Worker progress pulses
occur between completed batch jobs; readiness uses a 90-second freshness window.
Shutdown stops new claims while draining current work.

Investigated GitHub `Validate` failure 42003824582 on `21b22db`: a newly received
webhook was still `received`, then later tests cascaded because the payment mode
was not restored. Workers now use PostgreSQL's clock for due eligibility, leases
and retry timing, instead of comparing database timestamps against application
host time. Integration fixtures reset payment credentials/mode after each case.
A repeated immediate-webhook test checks DB-time leases, with independent host
clock skew injected on the real PostgreSQL CI lane (PGlite shares JS time).

Local verification: 49 tests pass, no skipped tests; production API/web build and
typecheck pass. Fresh PostgreSQL CI remains required for this revision. Native CI
now additionally builds unsigned release Android APK/AAB with release lint and
unsigned iOS Release/iphoneos, alongside existing debug/simulator checks. Do not
claim these new release checks passed until reviewing their run results. No
configured signed or store-distributable release has been produced. No merge.

Remaining launch blockers include provider-fee/net reconciliation, partial and
external refunds/disputes and bank payout events; complete support and delivery
proof workflows; restaurant menu modifiers/inventory and operational capacity;
authenticated browser E2E, load/security exercises and real device GPS/push.
Clerk/Stripe test credentials, push services, hosting/database ownership and
Apple/Google signing remain external requirements. Deployment packaging and full
end-to-end provider verification are still incomplete. Continue implementation;
do not treat this checkpoint as completion or a claim of launch readiness.

## Latest stage: immutable operational ledger and recovery verification

New orders now post balanced journals atomically with confirmed payments,
delivery earnings allocation, connected-balance transfers, full refunds and
settlement reversals. Deferred PostgreSQL constraints enforce balancing; triggers
reject updates, deletion, truncation and new lines on committed journals. Journal
fingerprints reject conflicting replays. Refund replay remains valid after later
settlement recovery. Historical paid orders without a verified payment baseline
are held before provider execution; no invented opening balances are posted.
Migration 0009 adds the ledger and these protections. Do not skip its custom SQL
triggers when updating Drizzle snapshots.

`GET /api/admin/ledger` exposes an admin-only, snapshot-consistent trial balance,
exact integer-cent strings, optional order/date filters and journal cursor pages
that preserve PostgreSQL microsecond ordering. The Order operations page includes
balances and expandable journals. Missing payment baselines are surfaced. These
are gross operational records: provider fees, disputes, tax remittances and bank
payouts are NOT yet reconciled; the UI/API explicitly state this limitation.

Local verification: 43 tests pass (including the integration parent), with new
checks for worker takeover/stale owner suppression, queue fairness across 40 held
orders, webhook retry backoff/dead-letter recovery, committed-journal append
rejection, balanced accounting after refund/recovery, role/date/pagination report
checks, and historical baseline quarantine. Production build/typecheck pass.
The preceding revision `63fa5c5` passed PostgreSQL CI plus Android debug and iOS
unsigned simulator compilation. Check fresh CI for this ledger revision before
claiming it verified on PostgreSQL/native platforms. No live charges or merges.

Immediate remaining engineering: provider-fee/balance reconciliation; partial
refunds and external disputes/refunds with payout holds; push lease/fan-out crash
recovery; worker progress/readiness under sustained batches; operator recovery UI;
restaurant capacity/dispatch timeout policies; support pagination/search; polished
responsive/accessibility/browser E2E and load/failure exercises. External testing
still needs actual Clerk/Stripe test/push configuration and physical devices.
Final signed app-store builds need Apple/Google accounts/signing and approved
business/tax/service policy. See lower checkpoint sections for broader scope.

## Latest completed stage: operational recovery and durable onboarding

This stage adds durable Connect provisioning outside database transactions,
financial queue fairness for held orders, bounded webhook backoff/dead-letter
states, role-scoped webhook recovery endpoints with audit reasons, operational
queue/worker reporting, readiness/liveness endpoints, PostgreSQL-backed concurrent
mutation limits, bounded database connection/query/lock waits, independent worker
loops and graceful draining. Refund events are monotonic across webhook/worker
races. Local tests now total 37 and pass; typecheck, production builds and native
asset synchronization pass. Fresh CI results must be checked for the commit.

Added failure checks: cancellation during blocked transfer I/O; customer refund
remaining confirmed while settlement recovery fails and later recovers; refund
webhook preceding a worker response; durable Connect timeout replay without a
held transaction; audited webhook retry permissions; concurrent distributed
request limits; stopping new claims while draining current worker work.

New migrations: 0007–0008. Current endpoints include `/livez`, `/readyz`,
`/api/admin/operational-health`, `/api/admin/webhook-inbox` and audited
`POST /api/admin/webhook-inbox/:eventId/retry` with a reason. All Stripe account
creation uses persisted provisioning jobs. Completed stage supersedes items 1–3
below only to the extent described; additional lease-takeover/load tests, operator
UI integration and outbound alert-provider configuration still need work.

Next priorities: immutable balanced ledger/provider-fee reconciliation; partial
refunds/disputes; complete support/search/capacity tools; browser/device E2E;
accessibility/performance; signed releases and external provider verification.

# Resumable engineering checkpoint — production hardening

## Resume rule

Continue PR #1 (`feature/rocoeats-launch-readiness`). Do not discard local work,
merge the draft, enable live payments, or equate compilation with launch readiness.
The starting verified GitHub revision for this work was `44881bf`. The interrupted
run left substantial uncommitted work; it has been preserved and extended here.

## Implemented since that revision

- Durable financial-operation records with immutable request parameters, stable
  provider idempotency keys, committed attempt timestamps, leases, retries and
  reconciliation holds. Stripe checkout/refund/settlement/reversal network I/O
  now runs outside order transactions. Cancellation persists before provider work.
- Provider results are applied atomically to domain records; ambiguous failures
  retain their original operation. Unknown writes older than 23 hours are held;
  known refund objects may continue safe read-only polling. Reconciliation reads
  provider objects and validates identifiers/amounts before changing local state.
  It never creates replacement monetary requests on an unknown outcome.
- Signed webhook receipts are durably stored before HTTP acknowledgement, then
  processed with leases and idempotent domain updates. Mismatches are retained
  for reconciliation rather than disappearing on transaction rollback.
- Metadata links can recover checkout/refund responses lost before local commit.
  Refund confirmation queues settlement recovery even when a webhook beats the
  worker response. Recovery remains separate from customer refund confirmation.
- Explicit pricing configuration is required; missing configuration cannot
  silently use sample fees, commission, ZIPs or zero tax. Sample policy data is
  imported by automated tests only. New orders store the entire policy snapshot.
- Local financial simulation is restricted to NODE_ENV=test. Interactive/provider
  workflows must use Stripe test credentials; there is no live-mode override.
- Driver online heartbeats and one-active-delivery database uniqueness prevent
  overbooking across simultaneous orders. Claims recheck current approval.
- Assigned-driver location publishing validates ownership, coordinates, timing,
  freshness and update frequency. Customer tracking hides stale/terminal locations.
  Location sharing is foreground, explicitly enabled, and uses actual device GPS.
- Driver availability/location controls, customer tracking, dispatch oversight,
  financial recovery queues, and labeled pricing-policy fields replace raw pricing
  JSON and simulator success controls in the application UI.

## Verification at checkpoint

Local tests: 31 Node tests (including the integration parent), all passing.
`pnpm run typecheck`, `pnpm build`, and native asset sync passed. Fresh GitHub
PostgreSQL/native compile results must be checked for this revision.
The integration suite uses PGlite locally and real PostgreSQL 17 in GitHub CI.
Tests include missing-price fail-closed behavior, concurrent driver claims across
orders, stale/unauthorized GPS, durable provider-timeout replay, expiry quarantine,
webhook receipt/replay/mismatch retention, and existing ordering/refund/role tests.
Provider effects in failure-injection tests are injected test fixtures only; no
fake transport is used by production HTTP routes or the production worker.

New migrations: 0004–0006. The active-driver unique index intentionally fails if
legacy data already contains multiple active deliveries for one driver. Audit and
resolve those real assignments operationally before applying it; do not silently
cancel orders or reassign custody to make the migration pass.

## Remaining work — do not call this finished

1. Add more crash/failure tests: cancellation during an in-flight transfer, refund
   webhook before response, lease takeover with two workers, repeated pending
   refund events, settlement-recovery failure and subsequent reconciliation.
2. Make Connect account creation durable too: its current onboarding route still
   calls Stripe while holding a profile transaction. Audit all provider I/O paths.
3. Add webhook-inbox operational views/retry audit controls, backoff/dead-letter
   monitoring, queue-age metrics, structured alerts, graceful worker shutdown and
   health/readiness checks. Address blocked-order queue fairness under load.
4. Build a balanced immutable financial ledger and reconciliation reporting.
   Partial refunds, external refunds/disputes, balance recovery obligations,
   tax-provider integration/registrations and payout holds still need engineering
   and explicit business policy. Configured manual test tax is not a legal tax
   determination. Connected-balance transfers do not verify bank payouts.
5. Provide robust search/pagination/support tooling, restaurant capacity and
   driver-unavailability escalation. Never invent ETA or delivery availability.
6. Finish accessibility, responsive visual QA, authenticated multi-role browser
   E2E, load tests, rate limits, monitoring and operational incident exercises.
7. Verify native GPS permission behavior and tracking on real Android/iOS devices.
   Background location is not implemented or certified. Verify checkout return,
   permission denial, poor GPS/network, sign-out and app lifecycle recovery.
8. Verify Stripe TEST Checkout/Connect/refund/reversal round-trips and signed
   events using actual configured services. Clerk/PostgreSQL deployment,
   Firebase/APNs, signing identities and store accounts are absent here.
9. Signed release builds, physical-device tests, store assets/privacy/support
   pages and deletion/retention operations remain release gates. Existing CI
   produces debug/simulator compile artifacts; those are not store releases.

## File map and commands

- `src/lib/financial-operations.ts`: durable financial requests, worker, reconciliation.
- `src/lib/finance-queue.ts`: idempotent enqueue and settlement recovery.
- `src/lib/webhook-worker.ts`, `src/routes/payment-webhook.ts`: durable incoming events.
- `src/routes/dispatch.ts`, `src/routes/drivers.ts`: availability, claims and GPS.
- `tests/platform.test.ts`: relational multi-user HTTP and failure-injection checks.
- Frontend `pages/delivery-tracking.tsx`, `pages/commerce-pages.tsx`: integrated UI.

API paths above are relative to `artifacts/api-server`; schema/migrations live in
`lib/db`. Run from repository root:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm --filter @workspace/localeats exec cap sync
```

Production setup instructions in DEPLOYMENT.md and COMMERCE_API.md predate this
hardening stage. Where they mention interactive sandbox mode, fallback example
pricing, synchronous finance or immediate webhook completion, this checkpoint
supersedes them. Update those documents before deployment. External configuration
is required for acceptance testing, but it is not the only remaining work.
