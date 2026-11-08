# Persistent production backlog

Work only on feature/rocoeats-launch-readiness / PR #1. Preserve navy branding,
original demo, versioned migrations, free hosting and Stripe TEST-only gates.
Never enable public ordering, add billing or publish native apps without approval.

## Current priority: real private TEST payment and delivery acceptance

Staging: https://localeats-delivery-app.onrender.com/ (verified deployed 6cad154 on
November 8). Owner has confirmed Google sign-in and administrator controls.
Read-only deployed checks November 8: /livez 200; /readyz reports DB/auth/provider/
workers ready, pricing and webhook missing; unsigned profile and forged admin
requests return 401. No authenticated Clerk session or Render/Neon secret access
is available in the engineering environment. Actual owner role/driver claims must
not be marked verified from local fixtures or the owner's Google sign-in alone.

Batch 1: repair non-clickable placeholder dashboard; route all roles into existing
functional workspaces; bootstrap a configured owner's missing profile on first
protected request; make dashboard use central active-profile authorization; add
self-only redacted owner/driver configuration diagnostics at /account/access.
Authenticated diagnostics remain reachable when private staging admission is
misconfigured; this grants no business API access and returns no configured IDs.
Expose a validated release SHA in /livez for deployed revision checks.

Batch 1 committed as 8d651fa; PostgreSQL/restore/container Validate CI 42463887908
passed. Actual owner access remains deployment/session dependent.

Batch 2 committed as 911ffad; complete PostgreSQL/container CI 42464424954 passed.
Protect configured owner records before first bootstrap; add strict,
audited own-profile settings with concurrent-edit protection and provider-managed
sign-in/security controls; send new restaurant/driver registrations directly to
their workspaces. Denied operations/driver pages link to setup/access recovery.
The access page shows only the signed-in user's own Clerk ID with a copy action,
so the owner can correct a Google-created identity mismatch without being able to
load a business profile. Server diagnostics still return no configured IDs.

Owner-assisted staging check: owner replied Yes to both setting-match rows and
Administrator/Driver access. Engineering correlated this with live revision
8d651fa via /livez, not the later 911ffad batch. Ten deployed read-only HTTP/security
checks passed; direct authenticated business requests were not made by engineering.
Evidence: docs/verification/STAGING_HTTP_2026-11-08.json. Re-run
`NODE_USE_ENV_PROXY=1 node scripts/verify-staging-http.mjs https://localeats-delivery-app.onrender.com/ <full-revision>`
after deployment. It fails on revision mismatch and never signs in or mutates data.

Batch 3: configured-owner-only administrator grant/revoke controls, expected-role
concurrency guards, mandatory reasons/audit and protected owner records. Grants
require dedicated active customer accounts without driver enrollment, restaurant
ownership or active orders. Revocation fences delivery custody and retains ordinary
driver enrollment/approval rather than inventing approval. Ordinary admins cannot
delegate. No schema, hosting, payment or driver-approval bypass was introduced.
Committed as 4cf3216; complete PostgreSQL/container CI 42465057837 passed.
Follow-up fences writes with full-precision database versions and stamps role
changes with the database clock: a delayed grant stays rejected even after an
intervening grant/revoke cycle returns the account to its original role. Refresh
the owner-only account list before retrying a conflict; never replay stale grants.

Next priority: deploy latest account/permission batches; configure test pricing and
Stripe signing secret in owner-controlled settings, then complete the real
four-role Stripe TEST acceptance sequence. Do not recreate the implemented APIs.

## Current session: payment setup and delivery execution

Baseline remote/workspace clean at 6cad154. Ten real read-only HTTP/security checks
passed at that exact deployed revision; DB/auth/workers/test-provider configuration
present, but pricing and webhook signing secret still missing. The engineering
environment has no hosted secrets, owner session or provider credentials.

Payment setup batch adds admin-only redacted local status and real server-side
read-only Stripe Balance/Webhook Endpoints verification. Exact destination, SDK API
version and event subscriptions are shown in /operations. Disabled/live/wrong-version/
incomplete endpoints and provider failures never appear verified. No charges, bank
data, endpoint changes, secret inputs or ordering activation are introduced.
99 automated tests and production build/typechecks pass; phone-size component QA
passes with explicit simulated auth/provider responses. Actual Stripe probe and
signed checkout still require the owner-deployed endpoint and real owner session.
Follow PRIVATE_TEST_DELIVERY.md for exact owner setup and the real acceptance path.

## Existing implemented foundation — preserve and verify on staging

- Clerk authentication, server role/approval checks and explicit owner-driver access.
- Restaurant application/menu/hours/modifiers/inventory/capacity, transactional
  checkout snapshots and stock reservation/release, expiry and escalation workers.
- Order acceptance/preparation/readiness; dispatch eligibility/concurrent assignment;
  driver duty, arrival, pickup, handoff proof, delivery and private authorized GPS.
- Stripe hosted TEST Checkout, durable signed webhook inbox, refunds/platform-funded
  partial credits, Connect provisioning/transfers, ledger, dispute holds and
  provider charge/fee reconciliation. This does not certify commercial settlement.
- In-app notifications and device push outbox; map navigation links and dispatch
  UI; Android/iOS unsigned compile pipelines. Provider/device tests remain external.
- Support conversations, delivery incidents, recovery controls and backup/restore.

## Required deployed acceptance sequence

1. Deploy latest verified branch; check /livez revision and /account/access while
   signed into the intended owner Clerk identity. Confirm both owner matches,
   active Super Administrator and effective Driver access; do not share secrets.
2. Correct mismatched owner IDs only through Render Environment and redeploy.
   Never elevate by Google email, client role changes or a test header.
3. Configure Stripe TEST signing secret and reviewed test pricing/service ZIPs.
   Create allowlisted test identities, approve restaurant/driver applications,
   publish available menus/hours and verify ordering remains closed until approved
   private testing. No fabricated orders, approval records or provider receipts.
4. Verify a real test order through restaurant → eligible driver → arrival/pickup
   → customer handoff/delivery → receipts/earnings, then rejection, cancellation,
   partial/full refund and recovery. Record real provider evidence separately.

## Launch-critical external dependencies and next engineering work

- Owner or a securely connected hosting account must deploy changes (Render auto
  deploy is off). No tools in this session can read hosted environment values.
- A real owner session is required for positive staged authorization verification;
  self diagnostics provide exact-match booleans without returning secrets or IDs.
- Stripe TEST webhook/Connect account setup and real provider exercises are pending.
- Google dispatch maps require restricted keys/billing authorization; no paid
  mapping service is enabled. Native Google/Apple navigation links are separate.
- Firebase/APNs credentials, platform entitlements and physical Android/iOS devices
  are needed to verify push and background location. Do not claim those work from
  mocks or unsigned compilation. Store signing/publication remains owner controlled.
- Render Free sleeps; workers pause and recover on wake. Neon quotas cap testing.
  Do not represent this free staging as reliable always-on production dispatch.
- Native background lifecycle/device verification, commercial settlement/bank payout
  reconciliation, load/availability certification and launch policy review remain
  open. Expand this list with concrete failures from the actual staging exercises.
- Administrator delegation is owner-only with audit/custody safeguards; configured
  owners remain controlled through protected server settings. Deployed delegation
  and step-up/MFA security policy review remain open before commercial launch.

## Resume and evidence discipline

Fetch/compare remote, inspect clean status, read this file and ENGINEERING_CHECKPOINT.
Run targeted checks first and necessary full/PG/container CI for changed batches.
Commit/push each verified batch; verify local HEAD equals remote before stopping.
Record automated/simulated/browser/provider/device/deployed evidence separately.
Use git log for exact batch SHAs; no optimistic percentages or launch-complete claim.
