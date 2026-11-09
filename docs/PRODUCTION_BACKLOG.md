# Persistent production backlog

Work only on feature/rocoeats-launch-readiness / PR #1. Preserve navy branding,
original demo, versioned migrations, free hosting and Stripe TEST-only gates.
Never enable public ordering, add billing or publish native apps without approval.

## Current priority: real private TEST payment and delivery acceptance

Staging: https://localeats-delivery-app.onrender.com/ (read-only verified deployed
711e2d7 on November 9; new guest/telephone commits still require deployment). Owner has confirmed Google sign-in and administrator controls.
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

Payment setup committed as a0ee18d; full PostgreSQL/restore/container CI
42467372777 passed. Native CI 42467377086 failed before compilation on official
Gradle/Capacitor GitHub release dependency downloads (HTTP 504), not app diagnostics.
Do not claim the latest native build passed; handle dependency availability next.

Tracking batch exposes authorized courier display name and saved arrival/pickup/
completion times to customers and restaurants, throughout preparation and receipts.
No driver IDs/contact details or GPS sharing permissions were broadened. Tracking
responses are no-store; stale or reassigned positions stay hidden. Closed orders
show ended sharing rather than waiting for a driver; manual refresh supports recovery.
100 automated tests cover the full assignment/reassignment/pickup/handoff/completion
path with test identities/payments and GPS samples. Phone UI fixture checks ended
tracking; real device/background and actual-provider delivery remain unverified.
Tracking committed as 8030577; all previous work was pushed before native changes.

Native dependency batch isolates official Gradle/Swift package resolution from
compiler steps, retries only transient HTTP 502/503/504 or transport timeouts up
to three attempts, and preserves original failures. iOS builds share the explicitly
resolved package directory; jobs have a 30-minute ceiling. Canonical URLs, TLS and
package verification remain unchanged. The regression verifies recovery, no retry
for compiler failures and bounded persistent outages. Actual native build results
must be taken from the new CI run; upstream availability is not certified locally.
Signing, system-browser Google OAuth on devices, push/background GPS and store
distribution remain unverified and require owner-controlled accounts/devices.

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

## November 8 — durable driver offer responses

Drivers can decline an unassigned, paid, ready-for-pickup offer for 15 minutes,
review their own declined offers and explicitly reconsider. Declines persist across
reloads; duplicate requests do not extend the window. Expiry uses the database
clock, stale reconsideration tokens cannot erase newer responses, and profile/order
locks serialize responses with claim and administrator assignment. Dispatch respects
a driver's active decline. Other drivers remain eligible; customer addresses are
not exposed in these lists. Assigned deliveries retain their existing release and
custody rules. Maintenance prunes old expired responses while preserving audits.

Migration 0025 is additive and runs through the existing staging migration startup;
no Neon reset or manual SQL is required. All 101 API tests pass with both PGlite
and a fresh disposable PostgreSQL 17 database, including concurrent response/claim,
expiry, approval, privacy and stale-token checks. Production builds/typechecks and
phone-size actual-component QA pass; browser identity/API fixtures are simulated.
No actual Stripe payment, delivery, push or device GPS verification is claimed.
The owner has not yet verified the four current /operations Stripe checks; their
results remain unknown. Ordering remains disabled and Stripe remains TEST-only.

Native run 42468145201 exhausted the bounded dependency retries on upstream HTTP
504 downloading official Gradle/Capacitor binaries, before compilation. Validate
42468140635 passed for f725251. Native builds/device acceptance remain blocked;
no transport-security bypass or alternate binary mirror was introduced.

## November 9 — interrupted pricing refresh recovered

Recovered and verified the pricing/setup refresh fix left by the usage interruption.
Saving reviewed pricing invalidates setup readiness as well as commerce configuration;
Stripe verification refreshes local setup state, and a manual refresh retrieves recent
signed-event status without reloading the page. Production build/typechecks passed
November 8; recovered phone-size component QA passed November 9, exercising the
actual pricing form payload, status refresh and existing owner/driver controls with
explicitly simulated API/authentication. Commit 711e2d7 passed full Validate runs
42469208537/42469212306; native run 42469212293 failed and remains unverified.

New required launch work: anonymous customer browse/checkout/support with scoped,
expiring/revocable guest capabilities shared by web/native; telephone restaurant
confirmation with honest pending status, audited dispatcher actions, concurrent
transition safety and payment rejection recovery. Neither new workflow is certified
on staging or devices. Keep public ordering disabled and payments TEST-only.

## November 9 — guest backend access foundation

Additive migration 0026 creates guest sessions, each owning exactly one order and
an internal customer fulfillment record (no Clerk account or password). Only a
SHA-256 digest of a random 256-bit capability is stored; access expires in seven
days and can be revoked. Existing customer pricing, address ownership, immutable
snapshots, capacity/inventory, checkout queue, tracking, handoff, support and refund
logic are reused. Privileged endpoints retain Clerk-only authentication. A live
guest capability plus authenticated customer is necessary to associate an order;
email matching never grants access. Contact email is passed to Stripe hosted TEST
Checkout; return URLs contain no guest capability. No raw cards are collected.

Anonymous session creation is rate-limited; private staging still requires an
invited authenticated user to mint a test guest session. Valid capabilities admit
only customer/browsing paths through private staging, not admin/driver APIs. Ordering
and Stripe TEST gates are unchanged. The relational guest regression passes:
anonymous browsing, invalid tokens/contact, concurrent duplicate creation, one-order
scope, address/quote checks, closed-ordering gate, simulated payment/refund, support,
expiry/revocation, privileged denial and possession-verified account association.
All 102 API tests and backend build/typechecks passed locally with simulated
identity/payment adapters. Actual Stripe/deployed/native guest acceptance is pending.
Next: shared guest customer UI/persistence and telephone confirmation. Guest email
tracking-link delivery requires a configured mail provider/outbox; no paid service
has been added. Stripe receipt settings need owner verification.

## November 9 — shared guest customer interface

Web/native shared routes now offer Continue as Guest, contact collection, persistent
anonymous cart, delivery address, server quote, unchanged closed-ordering gate,
TEST checkout, current-order retrieval, scoped live tracking, handoff code, support,
cancellation/refund details, optional possession-verified account linking and link
revocation. Protected account/partner/admin routes are preserved. Private link tokens
use URL fragments, are removed before requests, and are never sent to absolute
third-party or privileged API URLs. Browser/device storage holds the bearer link;
shared devices must revoke access when done. No email-only recovery or account merge.
Operations can mint a private guest test link without storing it in the owner's
browser session; open it signed out in a separate private browser. Creation does not
enable ordering. Both direct and durable queued Stripe checkout paths use the guest
receipt email and guest return route, with no access token in provider metadata/URLs.

103 API/unit tests pass, including guest cart persistence and cross-origin token
protection; full production build/typechecks and phone-size actual components pass.
Browser QA covers contact submission, reload/persistent cart, address, quote and
disabled order submission using simulated API/auth. Guest backend commit 0ce82fe
passed full PostgreSQL/migration/restore/container Validate CI 42569873460.
Actual Stripe/guest staged delivery, external receipt email and real Android/iOS
interruptions are NOT verified. Native uses the shared routes and existing return
scheme; unsigned compilation and physical-device acceptance remain separate blockers.
Next: telephone confirmation before hosted payment, with no unapproved price increase.

## November 9 — telephone restaurant confirmation before payment

Additive migration 0027 snapshots electronic/telephone receipt mode per order and
stores durable versioned phone confirmation. Admin-only Operations has receipt-mode
configuration, pending-age queue, restaurant phone/hours, full ordered modifiers and
instructions, contact/accept/reject actions, exact food-price attestation and prep
estimate. Customer messages remain pending/contacting until genuine acceptance;
confirmed-but-unpaid orders explicitly wait for payment. Direct and queued checkout
refuse telephone orders without acceptance. Verified payment activates ordinary
accepted/preparing/ready/driver fulfillment. Generic status updates cannot bypass it.

No manual Stripe authorization/capture state was invented: confirmation occurs before
requesting hosted payment. Unavailable items/price discrepancies require unpaid
cancellation and a fresh approved quote. Rejection, stock release, expiry, duplicate
commands and conflicting dispatchers are transaction-safe/audited; existing late
payment refunds remain. Unpaid call waits join existing response-time escalation.
New orders alert active admins through the durable notification system. Free hosting
sleep and real push/provider/device verification remain limitations.

104 API/unit tests pass with relational state and simulated identity/payment adapters;
production build/typechecks and phone-size actual guest/dispatcher/status components
pass with simulated APIs. Includes exact-price refusal, bypass denial, acceptance
before checkout, deterministic payment activation, conflicting decisions, rejection,
escalation and expiry. Guest screens commit 3e97fc4 passed full PostgreSQL/migration/
restore/Docker CI 42570260849 and 42570266443. Native 42570266453 failed before
compilation on official Gradle/Capacitor HTTP 504. Actual private guest + telephone +
Stripe TEST delivery, email receipts and physical devices remain unverified.

Next priority: verify latest deployment and Stripe setup, perform a real private guest
telephone/electronic test delivery, harden guest recovery/contact/notification delivery,
and resolve native dependency availability before device acceptance. Public ordering
remains disabled. No costs, live transactions, owner secrets or Neon resets introduced.

## November 9 — guest delivery coordination and combined acceptance regression

Guest contact details are available on demand only to authenticated dispatch/admin
or the owning restaurant/assigned driver during active fulfillment. Reads are audited
and no-store. Ordinary customers, unassigned drivers and guest tokens cannot retrieve
this endpoint; active couriers receive phone/name, never receipt email, and lose access
after completion. The driver workspace and telephone queue expose the authorized
contact control. When a guest securely links an order, its support cases and order
notifications follow the registered customer; historical message authors are preserved.

105 API/unit tests pass. The combined regression submits an anonymous telephone order,
confirms exact-price acceptance, obtains checkout, simulates only provider payment,
then uses actual relational HTTP operations for restaurant preparation, driver duty/
claim/arrival/pickup, guest tracking/handoff code, duplicate-safe proof delivery,
restaurant/driver earnings and balanced ledger. Contact denial/redaction/completion
revocation and support after optional association are tested. Production builds and
phone-size actual-component browser QA pass (simulated auth/API). Telephone c732e83
passed complete PostgreSQL/restore/container Validate CI 42570925118.

Read-only real staging check November 9: ten HTTP checks passed at deployed 711e2d7;
/livez 200, unsigned/forged admin APIs rejected, /readyz 503 reports pricingReady=false
and webhookReady=false, DB/auth/provider configuration/workers present, live charges
false. This is NOT a real authenticated Stripe verification. Owner's four Operations
checks remain unverified. Evidence: verification/STAGING_HTTP_2026-11-09.json.
Next: deploy latest branch, verify protected Stripe setup, then execute a real private
guest/electronic/telephone TEST delivery. Guest mail/recovery channels, production
capacity/load, native official dependency availability and physical devices remain
launch blockers. Nothing is production-certified from the relational test simulator.

## November 9 — native guest link correctness and build evidence

Copied guest links now use the configured HTTPS website/API origin rather than a
native webview's localhost origin. Unconfigured native builds refuse to manufacture
an unusable tracking URL. Origin credentials, non-HTTPS remote destinations, path
injection and malformed tokens fail closed; capabilities remain fragments only.
107 API/unit tests and complete production build/typechecks pass. Link-copy failures
show a recoverable message. Native account/device acceptance is still not certified.

Updated CI evidence: 70889fb complete PostgreSQL/restore/Docker Validate 42571305415
passed. c732e83 native run 42570932127 PASSED Android debug, release APK/AAB/lint,
iOS simulator and unsigned device release builds. Its four retained artifacts are
explicitly named unconfigured: they prove compilation, not usable authenticated
staging apps, store signing or device behavior. Configure a real HTTPS VITE_API_ORIGIN,
Clerk publishable key and permitted native CORS/Clerk origins before device builds
(DEPLOYMENT.md). Latest 70889fb native iOS job failed at package resolution again;
upstream availability remains intermittent. Earlier runs documented official binary
HTTP 504. Do not describe native compilation as uniformly passing or claim physical
GPS/push/guest acceptance. Use the latest Actions run for current exact status.

## November 9 — guest repeat checkout without lost refund access

After a cancelled/expired or delivered guest order, a guest can start a fresh checkout
without Clerk registration or revoking the previous order's tracking/refund access.
The previous private link must be saved first. A fresh capability/customer fulfillment
record cannot access the previous order; the old link stays valid until its own
expiry/revocation. Active orders cannot restart, and revoked/expired access cannot
mint another session. Private staging admits this only through an existing valid
guest capability; creation is rate-limited and audited. Contact fields are revalidated,
including usable phone digits. All 107 tests, production build/typechecks and actual
phone-size restart form/persistence QA pass (simulated auth/API); relational tests
exercise closed vs active order guards and independent old/new capabilities.

Latest verified CI before this batch: dfe72bf full PostgreSQL/restore/Docker Validate
42571799623 PASSED; native 42571804960 PASSED BOTH Android debug/release APK/AAB/lint
and iOS simulator/unsigned device release. Artifacts remain unconfigured and device
acceptance/signing remain open. Intermittent prior dependency failures are historical,
not a claim that this successful run failed. Do not infer real-device/provider readiness.

## Android staging preparation — November 9

Owner confirms Stripe TEST/endpoint/events/signing secret and sandbox pricing saved;
0% tax is only a temporary test placeholder, not production-approved. Read-only
staging 61eefcd now reports ready=true, DB/auth/pricing/webhook/workers configured,
live charges false. No configuration or business data was changed. Native OPTIONS
checks show current Android/iOS CORS absent; latest source adds native origins only
for private Stripe TEST staging, without bypassing any server identity/role checks.

Native staging build now has approved public HTTPS/Clerk Development configuration,
non-debuggable separate Android staging package/label, versioning, stable owner-secret
signing workflow and APK signature/manifest/credential scan gates. Broad external
FileProvider access was removed; backup/device transfer is excluded. Existing native
compile validation retains unconfigured labels and adds staging-variant compilation.
Owner-only signing setup is blocked by GitHub integration HTTP 403 for Secrets. See
ANDROID_STAGING_TEST.md for a one-day, one-repository Secrets-only bootstrap token.
No signing key is committed or uploaded as an artifact. A signed staging artifact
must not be claimed until that workflow actually succeeds. Play Protect reputation
is separate from signing/static review; never disable Play Protect/Auto Blocker.
108 application tests and production typechecks/build pass locally; native preflight
unit checks pass. Native variant compilation/security review still require CI/APK
inspection, and the Samsung has not been tested. Next: native auth/guest access and
cold-start return recovery, then configured APK after protected signing setup.

## Native authentication and guest recovery — November 9

Added migration 0028 and a durable PKCE/state-bound browser-to-app sign-in exchange.
Google/registration use the system browser; explicit authenticated consent approves
only that browser identity. Five-minute grants expire and are consumed transactionally
once; 60-second Clerk tickets are minted outside DB locks and never placed in URLs.
Client-supplied user/role fields, invalid state/proof, approval identity changes,
expiry and replay are rejected. App restart recovery handles warm/cold return links;
registered checkout returns are not diverted into a stale guest token. Guest testers
can import an exact-origin private link in the native app without registering; backend
access is checked before saving. No private guest capability travels through a custom
URL scheme. Existing permissions, ordering and payments remain server-controlled.

Added a safe public native-readiness contract and configured-build deployment/CORS/
Clerk-key checks. An APK cannot be published by this job against the old backend.
111 API/unit tests, production build/typechecks and phone-size real-component native
sign-in/guest-import QA pass. Browser/Clerk/provider adapters are simulated; real
Google ticket redemption/Samsung behavior remain unverified. Signing probe run
42580742817 failed at the intended preflight because owner signing secrets are absent.
7e4fa7b server PostgreSQL/restore/container CI passed; its native jobs hit upstream
Kotlin/Capacitor HTTP 504 dependency downloads, not a source compilation error.
Next: owner signing setup + latest Render deploy, then configured APK and real-device
acceptance. Preserve the owner's verified Stripe TEST/pricing settings unchanged.

## Stable Android signing initialized; native transport safety — November 9

Owner saved the one-time setup token through protected GitHub settings. Bootstrap
workflow 42581883152 SUCCEEDED at 0937bd9: stable RSA-3072 staging keystore/password
are now encrypted repository secrets, bootstrap secret removed, no private artifact.
The engineer never read token/key/password values. Owner should revoke the temporary
personal token. Signing-secret management still correctly remains unavailable to the
normal integration. Do NOT rerun initialization or rotate installed signing identity.

Native API client now attaches Clerk bearer tokens only to trusted API destinations;
external URLs/static assets cannot receive automatic sessions. 112 API/unit tests
and full production build/typechecks pass. Expanded phone component fixture (native
browser handoff and guest import) is saved with the source, with simulated adapters.
Packaged APK checks also reject sensitive permissions and any embedded signing
password, retaining public certificate fingerprints/checksum for owner review.

Native CI's Gradle help task did not prefetch lazily resolved Kotlin compiler jars;
Android 7e4fa7b failed on an official Kotlin JAR HTTP 504 during compilation. Added
an explicit concrete Android/Kotlin configuration prefetch task under the existing
bounded transport retry helper. Compilation/lint errors remain unwrapped; no mirror,
TLS bypass or paid cache. Actual task/variant validation requires the new native CI.
0937bd9 full PostgreSQL/migration/restore/Docker Validate 42581477537 PASSED. Owner must
deploy latest source in Render so native CORS/readiness and migration 0028 are live,
then target=staging can build the installable APK. A successful signed artifact and
Play Protect/Samsung acceptance must still be verified; no APK URL is invented.

## Official Android distribution recovery — November 9

bf9e8c1 server Validate passed; iOS compiled. Android stopped before any task because
Gradle's official all.zip returned HTTP 504 through all retries. The official
Gradle 8.14.3 binary distribution endpoint returned HTTP 200 and its published SHA-256
was verified. Switched to the same version's smaller official bin.zip, pinned the
vendor SHA-256 and increased read timeout to 60 seconds. The checked-in wrapper JAR
also matches Gradle's official published checksum; CI now runs official wrapper
validation before native builds. No alternate mirror, TLS weakening or security
bypass was used. Actual signed build remains gated on the deployed mobile backend.
