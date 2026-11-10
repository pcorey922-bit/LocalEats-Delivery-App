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

## Deployed native contract and signed-build recovery

Actual deployed /mobile/readiness/CORS/public Clerk/closed-ordering checks now PASS.
A real ephemeral auth grant verified start=201, pending=202, invalid proof=403,
unsigned and forged identity approval=401; no account/order/payment was created.
Authenticated Clerk approval/ticket redemption and physical-device acceptance remain
unverified. Signed run 42582782177 passed signing/deployment prerequisites but exposed
an overbroad dependency-prefetch error: AGP project artifact variants are ambiguous
without task-specific artifact views. Prefetch now resolves only the external Kotlin
compiler configuration, preserving Android's normal dependency/variant selection.
No signing identity is rotated. Re-run target=staging and inspect actual artifacts.

## Verified official Gradle CLI installation

Java wrapper redirect downloads continued to return HTTP 504 before task execution.
Added the standard official binary installation path using Node streaming download,
three bounded transport attempts and the same source-pinned vendor SHA-256. Only
verified official bytes are extracted/executed; wrapper validation remains enabled,
no mirror/proxy/TLS override or private credential is used. A real local 137 MB archive
was downloaded, SHA-256 verified, extracted and Gradle 8.14.3 executed successfully.
CI uses this identical pinned CLI instead of repeating Java-wrapper downloads.
Preflight tests reject missing checksum/non-vendor URLs; Android compilation errors
still fail immediately. Real application mode is explicitly selected for staging.

## VERIFIED SIGNED ANDROID TEST APK — November 9

APK app-code source 5c687ac102adfe622f11403239398ec43fc84e15 is pushed/verified.
Signed staging workflow 42583769896 SUCCEEDED and uploaded actual artifact
13658705753, RoCoEats-Android-Staging-Test-APK (4,486,617 bytes, expiry Dec 9).
Download https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/42583769896/artifacts/13658705753
Run https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/42583769896
Archive digest sha256:56482fdacbf7d17798cb10fd32fc8158f031abbc238f9238929e11156982d575.
APK v2 signature verifies, RSA-3072 certificate CN=RoCoEats Staging/O=RoCoEats/C=US;
certificate SHA-256 f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296.
Actual packaged checks passed: staging package, non-debuggable, cleartext/backup off,
no prohibited sensitive/background location permissions, no packaged server/private
keys or signing password; approved public staging origin/Clerk key present. Reports
and per-APK checksum are inside the artifact. Independent local artifact fetch was
blocked by signed-storage access; compiled verification evidence was read from the
successful CI logs. This is not a malware certification or Play Protect approval.

5c687ac complete Validate 42583769000/42583776593 PASSED (PostgreSQL/migrations,
concurrency, backup/restore, Docker/non-root/startup). Native 42583776579 PASSED BOTH
Android debug/release/AAB/lint/staging variant and iOS simulator/unsigned release.
112 app/API tests, public-config/installer tests and production builds pass. Actual
live staging native contract/CORS/closed-ordering and pending/wrong-proof/forged-auth
guards passed without creating an order/payment or authenticated user session.
Phone-width actual component native signin/guest import was tested with explicit
browser/API/Clerk simulations, not a real Google approval or Samsung session.

Owner has the real artifact URL and was asked to try installation while keeping
Play Protect/Auto Blocker enabled. Physical Samsung installation/launch, actual Clerk
browser-to-app ticket consumption, guest/driver/admin/navigation, network/lifecycle,
push/GPS and real Stripe sandbox checkout are still UNVERIFIED. No protections may
be disabled or overridden. Owner should revoke the consumed temporary setup token;
stable signing secrets must be preserved. Pricing (0% sandbox-only tax), TEST mode
and ordering=false were preserved. PR stays draft. Next: owner device evidence,
resolve concrete device/Google review findings, then real private TEST delivery.

## PHYSICAL SAMSUNG TEST PASSED — owner confirmation November 9

Device: Samsung Galaxy S22 Ultra. Exact signed APK: source
5c687ac102adfe622f11403239398ec43fc84e15 / signed run 42583769896 / artifact
13658705753. Owner reports: installation succeeded, Google Play Protect allowed it,
app opens successfully, appearance matches the website. These four observations
are physical-device evidence supplied by the owner, not emulator or mocked tests.
OS/One UI version and screenshots were not supplied. Do not generalize this into
Google developer certification or assume future APKs receive the same verdict.

Native Clerk/browser-to-app approval, guest access, admin/driver role access, Maps,
location permissions/denials, push, background/lifecycle behavior and Stripe TEST
payment/delivery are still UNVERIFIED on Samsung. Public ordering remains false.
Next: verify actual native sign-in/role handling, then navigation/permissions and
notification configuration/device checks. Preserve design and stable signing key.

Prepared an isolated CI Android-emulator smoke target that downloads this exact
signed APK, validates its checksum/owner certificate, and exercises real native
launch, guest/sign-in screens, cold returns and invalid-link rejection. It receives
no signing keys, accounts or guest capabilities, and creates no orders/payments.
Shell/Python/YAML syntax reviewed; actual emulator results are pending its first run.
ADB is confined to the disposable emulator; it is never used on the owner's phone.

## Foreground location privacy and emulator consent checks

Corrected iOS location permission wording and the shared driver disclosure to match
actual behavior: user-chosen on-duty sharing with dispatch while RoCoEats is active,
plus authorized order participants during active delivery. No background permission,
tracking service or runtime capability was added. iOS plist parsing and frontend
typecheck pass. The installed APK's earlier launch result remains valid, but these
wording changes have not been physically verified or shipped in a new APK.

Emulator attempt 42585658397 failed at boot deadline before installing/exercising the
app. This is infrastructure evidence only; do not count any app checks from that run.
Added isolated boot diagnostics, explicit KVM acceleration, headless Vulkan-off
settings and an absolute eight-minute boot deadline. No Samsung settings are changed.
The pending runtime suite also checks location/notification permissions are not
pre-granted and reports incomplete runs explicitly rather than marking them passed.

## Resume checkpoint — November 9 (Eastern time)

- Fetched PR #1 at `2f1e0b917174556bde77dc800cbdc91aadafb89a`. Validate
  run 42586776915 passed. Native run 42586776890 passed Android and iOS build
  jobs. Its signed staging and emulator jobs were skipped.
- Recovered the older local Codex checkout without modifying its working
  tree. All 16 local-only commits have patch-equivalent remote commits.
  Its uncommitted dispatch work overlaps the published `17601d9` implementation,
  which already includes authorization, assignment version checks, GPS cleanup,
  notifications and custody protections. Keep the remote implementation.
- Owner physical Samsung Galaxy S22 Ultra evidence for signed staging artifact
  13658705753: APK installed and launched, Android presented its native location
  prompt, Driver Mode went online, and administrator dispatch showed the driver
  available with fresh, accurate coordinates. The Google Maps location link
  opened at the correct position. This verifies basic foreground GPS reporting
  and the external coordinate link. Embedded map rendering, pickup/drop-off
  navigation and continuous background tracking still require separate tests.
  The exact deployed backend revision during the phone test was not recorded.
- Next acceptance is an authorized private Stripe TEST order through all four
  roles, including a processed signed event, delivery and financial records.
  Complete provider refund/dispute/Connect exercises separately. The signed
  staging APK is suitable for device testing. Play submission still requires a
  signed Android release AAB, and iOS distribution requires signing/provisioning.
  Keep public ordering disabled pending explicit launch authorization.

### Runtime dispatch map configuration

The web administrator dispatch can receive the restricted browser key and map ID
from the server environment. Both settings must be present and the map ID must be
a real ID. Unconfigured deployments retain the coordinate list and Google Maps
links. Existing frontend build settings still work when runtime settings are
absent. See DEPLOYMENT.md for the Render variables and verification steps.

113 local app/API tests passed using PGlite, nine staging/release script checks
passed, and the production build and typechecks passed. The map tests exercise
configuration and role restrictions with fixtures. Actual map rendering awaits
the restricted Google Maps configuration and an authenticated staging check.

Read-only staging checks observed `bf9e8c1` deployed. Ten HTTP checks passed,
including readiness, anonymous denial and configuration-file protection. The
service reported database, auth, pricing, TEST provider, webhook configuration
and workers ready with live charges disabled. No authenticated checkout or signed
provider event was exercised. Deploy the verified PR revision and follow
PRIVATE_TEST_DELIVERY.md for private acceptance after explicit authorization.

### Recovered dispatch custody test

Ported the useful regression from the older Codex checkout to the current API.
The relational test rejects unpaid assignment, races reassignment against the
original driver's pickup, and verifies that only the driver who completes the
handoff earns the driver settlement. All 114 local app/API tests passed. This
uses fixture payments. The actual Stripe TEST order and commercial settlement
remain separate acceptance items.

The read-only staging mobile endpoint also reported private staging enabled and
both ordering and live charges disabled. For the next owner-assisted test, use
a manually deployed, CI-verified PR revision in Render, leave ordering closed
while checking the owner and tester roles, and follow PRIVATE_TEST_DELIVERY.md.
No signed Play release AAB or signed iOS release was produced in this session.

## Staging deployment handoff — November 9 (Eastern time)

Fetched and verified `fdb0c9f90679822217f9fb7da6537acb01de8329` on draft PR #1.
It includes `98ed8af` (Samsung evidence), `50ebfae` (runtime dispatch map), and
`fdb0c9f` (custody and earnings race). Web Validate 42757767621 passed.
Native run 42757767506 passed Android/iOS compilation; the signing and emulator
jobs were skipped.

Render currently serves `bf9e8c1`. Eleven read-only HTTP checks passed for that
revision, including private staging, ordering closed, live charges disabled,
dependency readiness and anonymous access denial. The verifier now checks these
ordering and staging safety flags in addition to the revision. It performs no
authenticated actions or transactions. Use the existing free service in Render
Dashboard → Deploys → Manual Deploy → Deploy a specific commit and enter the
verified SHA above. Preserve the connected Neon database, existing environment and
Docker command. After Live, run the HTTP verifier against that exact SHA and
confirm owner/tester access before the authorized private Stripe TEST order.

Hosted access and authenticated Clerk tester sessions were unavailable in this
session. No deployment, customer order, Stripe webhook processing, refund or
payout was exercised. Use PRIVATE_TEST_DELIVERY.md for the four-role run and
capture test-only payment and accounting evidence there or in the operator record.

### Foreground GPS lifecycle and private checkout safeguards

The shared lifecycle check combines WebView visibility with native activity.
Both driver location watches pause when backgrounded and cancel pending client
requests when the watch ends. On-duty uploads cannot start an assigned-order
upload after the originating watch ends. The manual delivery control serializes
uploads and updates its last-sent time only when the server accepts the sample.
No background permissions or services were introduced. The existing Samsung
foreground evidence still applies to the installed APK. Repeat with a newly
built signed staging APK: background, lock, resume, go offline and sign out.
Compare dispatch timestamps across each transition. Continuous background GPS
requires separate native implementation and on-device verification.

Extended relational coverage to verify anonymous and uninvited checkout
requests are denied with the private test order gate open, and admitted order
creation is denied when closed. The private acceptance guide now includes
reconciliation evidence and closing the test window. All 114 local app/API
tests, production typechecks and build passed. The tests use fixture identities
and simulated payments. The actual hosted four-role Stripe TEST order remains
pending the verified staging deploy and authenticated test sessions.

Launch tax settings remain open. Preserve the sandbox-only pricing until the
responsible collector, destination jurisdiction, and tax treatment of food,
fees, and tips are verified for the actual business model. Signed Play AAB,
signed iOS archive, physical push, and embedded Maps provider verification
remain pending.

## Render deployment verified — November 10 (Eastern time)

Render serves `fdb0c9f90679822217f9fb7da6537acb01de8329`, matching the owner's
deployment. All eleven closed-staging HTTP checks passed. Database, auth, pricing,
test provider configuration, webhook configuration and workers reported ready.
Private staging is active. Ordering and live charges are disabled. A separate
unsigned webhook request returned HTTP 400 before event intake. These checks do
not establish delivery of a real signed event or a real payment.

PR revision `6835d3d` passed Validate (42759057919) and Android/iOS compile CI
(42759057632). Signed staging and emulator jobs were skipped. Preserve the
Samsung foreground GPS evidence for the installed build.

Added a separate `ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED` window. It requires
private staging, the public switch explicitly false, Stripe TEST credentials and
a configured webhook signing secret. Existing admission remains in force. The
new setting defaults off. Automated coverage verifies invited order creation,
anonymous/uninvited denial, closure blocking checkout and cancellation after
closure. The test uses fixture identities and makes no external checkout request.
All 116 local app/API tests, ten configuration/release checks, production
typechecks and the build passed. Deployment and authenticated Stripe acceptance
for this new path remain pending. Follow PRIVATE_TEST_DELIVERY.md using the
existing owner and invited tester sessions. No environment or credentials were
changed in this session.
