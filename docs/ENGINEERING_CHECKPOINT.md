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
