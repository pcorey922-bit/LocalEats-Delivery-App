# Current launch gates — November 19 verified functional checkpoint

Functional d2e79f73ad942c2ddd189714a8f755c909f8ad49: all THREE CI SUCCESS,
including four native builds. Completed: audience-safe signed APK smoke tooling
(actual install verified; UI blocked by OS Launcher ANR), fresh GPS eligibility,
cancellable push enrollment/unknown-ack opt-out, protected Firebase client build
handoff, visible timely native alerts and creation-based queue expiry. 213 local
app/API PASS / one PG skip; CI PostgreSQL and browser/build/native checks PASS.

Owner-reported Samsung v154 dashboard/roles/controls/foreground-GPS/session restore
accepted. Compatible customer v165 and GPS-only driver v168 artifacts are source/
cert/hash verified and ready; physical customer and background GPS checks pending.
Do not re-investigate accepted auth, repeatedly retry emulator infrastructure, or
rebuild existing core workflows. Artifact SHAs/links and exact steps in checkpoint.

Remaining priorities: real device receipt/background/lifecycle acceptance; approved
push backend migration-0029 deployment and provider inputs; iOS signing/device;
authorized Stripe settlement/refund/dispute/payout proof; geographic ground truth /
owner acceptance (one USGS centroid corroboration added without new geocoding);
always-on hosting/restore and approved contact/legal content. No further confirmed
independent missing business workflow established. Next engineering responds to
new device evidence or owner-approved release inputs. No deployments, records,
permissions, financial operations or activation were performed in this session.

## November 19 — expired push queues cannot burst historical alerts

Existing five-minute TTL now applies from creation across worker, FCM and APNs;
expired messages never send/retry, but in-app history stays. Regression reproduced
before fix. 213 local app/API PASS / one PG skip; builds/types/API bundle PASS.
No provider calls or hosted changes. Current exact CI next. Native policy 3c5769d
all three workflows PASS. GPS-only compatible v168/575ee03 signed+Validate PASS,
artifact source/hash/cert/preflight independently verified (links in checkpoint).
Customer v165 ready, physical check pending. Remaining gates need owner device /
provider / approved hosting access; no further missing core workflow established.

## November 19 — native alert visibility configured, customer APK ready

Actual policy gaps corrected: FCM user-visible messages request HIGH priority and
shared channel; consent creates Android HIGH/PRIVATE channel; customer/driver iOS/
Android foreground presentation configured. Sender/channel/browser/build/types and
both generated native configurations PASS. No real provider receipt. Cancel and
Firebase integration commits each have all three CI PASS. Current policy CI next.
Customer compatible signed APK v165/d0cf7b8 ready (run 44482969353, artifact
14510280728), independently source/cert/hash/package verified, physical customer
acceptance pending. It excludes new main push/GPS and needs no backend deploy.
Remaining gates need owner/provider/device/approved hosted access; no additional
missing core workflow established. Exact owner steps/artifact links in checkpoint.

## November 19 — Firebase client build integration prepared

Optional protected per-audience client JSON now has validation, private runner
handoff, cleanup and compiled-resource checks. Four Node/eight Python tests pass;
no provider config/accounts or hosted settings changed. Real configured APK and
FCM/APNs delivery still require owner inputs and separately approved backend
push/migration-0029 deployment. Exact phone steps in ANDROID_STAGING_TEST.md.
Continue compatible customer APK readiness while those external gates remain closed.

## November 19 — push enrollment race fixed, provider setup still blocked

Confirmed timeout/late acknowledgement defect is fixed with account-scoped cancel,
request abort, listener cleanup and durable local unconfirmed opt-out handles.
Browser timeout/account-change/permission/configuration/opt-out regressions, native
bootstrap/account suites, build/types PASS; 210 app/API PASS / one local PG skip.
No real notifications. GPS 89ec27c all three CI PASS. Driver smoke installed actual
signed APK after source/cert checks; remaining UI checks blocked by Pixel Launcher
ANR (44481651431), not claimed as pass. Do not repeat infrastructure investigation.
Next actionable product gap: protected Android Firebase client-config build input;
then owner-controlled Firebase/APNs provisioning and physical receipt acceptance.

## November 19 — background GPS startup gate corrected

Fresh server on-duty eligibility now precedes native watcher creation; offline/
unapproved/malformed/unavailable states fail closed. Stop/cancel and revocation
remain explicit. Eight controller tests + consent browser + build/types PASS;
physical background GPS still NOT verified. Emulator smoke implementation is pushed;
first run's SDK-ADB path failure has a concrete fix and one new run in progress.
Continue with confirmed push-registration deadline/account-scope races; no provider
credentials or sends required for the regression. All hosted safety gates untouched.

## November 19 — Samsung driver access accepted, next native gates

Owner reports physical v154/d0cf7b8 dashboard, owner/admin recognition, availability
controls/online status, offers empty state, historical delivery, navigation buttons,
foreground GPS success indicator and close/reopen session restoration. Empty-profile
error did not recur. Driver auth/access blocker is resolved for this observed test;
do not repeat it. Background GPS, real push, live assignment receipt and native
end-to-end delivery remain UNVERIFIED. iOS physical/signing acceptance remains open.

Active independent task: extend existing signed Android smoke workflow to driver,
without auth accounts, hosted writes or weakening signing. Then inspect confirmed
background GPS and push gaps using existing implementation/tests. No deployments,
financial operations, paid services or activation authorized by this work.

## November 19 — next independent implementation and launch priorities

Current fix 4c44ab6 and checkpoint 06a378c each have all three CI workflows PASS.
Compatible APK d0cf7b8 Validate + protected signer PASS (run 44468084935;
artifact 14502534790); independent artifact inspection and Samsung acceptance
remain outstanding. Do not rebuild or re-investigate the response-reader fix.

Next independent code task: extend the existing customer-only Android signed-APK
emulator smoke target to the driver audience, preserving signature/source/manifest
validation and zero accounts/hosted writes. This is confirmed MISSING automation;
it is not new business functionality or a substitute for authenticated phone GPS/
push acceptance. Exact files and five acceptance criteria are at the top of
ENGINEERING_CHECKPOINT.md. No implementation begun during this planning checkpoint.

Top five unfinished launch requirements: (1) usable/accepted native customer and
driver Android/iOS apps, (2) real provider/device notification acceptance and newer
push deployment approval, (3) authorized provider financial acceptance, (4) Rockwood
accuracy evidence/approval, (5) always-on operations/hosted recovery and approved
legal/contact content. Core customer/restaurant/admin/driver/finance workflows are
implemented and automated-tested; one real TEST delivery does not certify every
financial/native scenario. Separate missing code/content from missing acceptance.

### Weekly-reset release checkpoint — November 19

Response-reader fix 4c44ab66188475dce41975cc79ea03a1f4436776 and compatible
APK d0cf7b88164e25b5962fea4d06f7e918e45e195c are tested and pushed. Backport
is COMPLETE. Exact-SHA CI pending; protected signer 44468084935 initiated, APK
Validate 44468084570 pending. Resume by checking these runs, verifying artifact,
then one physical controls/navigation/restart test. Do not repeat development.
No backend deploy or migration 0029. Full evidence/resume steps in checkpoint.

### November 19 — finish streamless response transport repair first

Confirmed custom-fetch discarded valid authenticated JSON when Response.body was
null; native-entry test reproduces v152's exact empty-profile code before fix.
Supported body readers now preserve payloads; strict role/profile checks remain.
20 focused tests + production/types + native-entry real-local-API regressions PASS.
Next: exact main CI, compatible APK backport to existing repair branch, protected
signing and one physical controls/navigation/restart test. No backend deployment
or migration 0029. Handset wire properties still unobserved; no physical acceptance
claim. Safe diagnostic facts are present if a truly empty response persists.
Do not repeat investigations, change permissions or start unrelated tasks before
this checkpoint is pushed and the usable signed repair is ready. See checkpoint.

### CI correction before APK handoff

Background GPS browser fixture must include the existing API's required createdAt.
Keep strict validation; initial source 1c3b0d1/6d2d5a2 Validate failed this mocked
fixture. v148 signed artifact is withheld. Verify corrected exact source CI and
new signed APK before physical retest. See checkpoint for original failure proof.

## Current blocker — physical driver workspace, November 18

v144 installs/authenticates, but physical driver controls remain UNVERIFIED and
Access permissions never appear. Existing account IDs/roles must not be changed
without server evidence. Reproduced empty-success rendering defect is fixed by
runtime profile/access validation, bounded access read/retry and dedicated driver
Dashboard routing. 203 local tests pass / one PG-only skip; builds/types, actual
native-entry, account and driver browser regressions pass. These do not identify
the handset transport response; sanitized error codes enable the next safe test.
Source pointers: main 1c3b0d16286d8b847dbc22fd7a6ecab77507b697; compatible
APK 6d2d5a2e6c92abc3cfb194c547904bbf995685aa. Protected signer 44268689778
and native matrix 44268683728 dispatched; inspect exact-SHA final conclusions
before artifact handoff (pending when written). Next: physical controls/restart
or safe visible code. No backend deploy/migration 0029 needed. Keep all gates
closed, no provider calls/financial actions. Historical APK acceptance tasks below
are superseded by this owner evidence; do not reinstall 18bb/4c/v144 as a repair.

## Current acceptance gate — verified final APK, November 18

Main functional source cfaf340ecbc7b57eb845271d7a54d454001df8f4: all three
workflows SUCCESS (including four native builds). FINAL APK source
61b23965c2009097e3aca2b2bfdbb355a1239989: Validate, four native builds and
protected signer SUCCESS. Artifact/version 144, exact source/cert/hash/final
cancellation fence verified; see checkpoint for download and Samsung steps.
4c24733 and 18bb APKs are superseded. Command service recovered and final signing
was dispatched by agent; no owner workflow dispatch needed. Recovery stashes kept.

Priority: physical updated driver sign-in, bounded failure and session restore.
No additional native rewrite justified until controls or NATIVE_* code supplied.
Then actual GPS/background tracking and push delivery; iOS device/signing acceptance
still outstanding. Main/app tests, builds, audits and CI passed; simulated auth is
not physical acceptance. No backend deploy or migration 0029 required for this APK.
All hosted ordering/live/municipal gates remain disabled, Stripe TEST. Existing
order/ledger untouched; no provider calls or financial operations. Historical
pending checkpoint entries below are superseded by this section.

## Final fence / command-service continuity — November 18

4c24733 is superseded: late auth-start completion could open a browser after the
startup deadline. Final first-error/cancellation/start-single-flight fence and
regression pass locally on main; build/typechecks pass. Command service then
lost transport while starting backport validation. Verified work is preserved via
GitHub commits; inspect exact new CI. Existing signing must be dispatched AGAIN
for final supplemental branch HEAD (target staging, audience driver); old reruns
keep old SHA. No signing-policy workaround, backend deploy, migration 0029 or
financial action. Resume dirty worktrees with compare/stash/fast-forward, preserving
recovery copies. Phone physical outcome remains the next real acceptance gate.

Final supplemental source: 61b23965c2009097e3aca2b2bfdbb355a1239989. Verify its
new CI, then dispatch a fresh protected staging/driver run; never use the older
4c artifact or an immutable old rerun. Main source has identical tested fence code.

# Persistent production backlog

Work only on feature/rocoeats-launch-readiness / PR #1. Preserve navy branding,
original demo, versioned migrations, free hosting and Stripe TEST-only gates.
Never enable public ordering, add billing or publish native apps without approval.

## Current verified source and candidate APK

Main bbdf34edf37eb669cb5590d5d1a4c9ae041d0c31 has all three CI workflows
SUCCESS, including four actual native build jobs. Replacement APK source
4c247335583fd24022650dc5bac64d63ab987845 is on existing supplemental
fix/driver-staging-session-recovery, excluding migration 0029/new notification API.
Its Validate 44260685822, native compile 44260755182 and protected driver signer
44260761946 were pending at checkpoint creation; inspect exact conclusions. No
signer reinitialization. Exact APK source locally passes 198 tests/one PG skip,
production/typecheck and account/native-entry bootstrap tests; production audit clear.
See checkpoint for phone update and acceptance steps. Previous 18bb physical
acceptance FAILED. Next owner-only gate: one updated APK handoff/restart test,
controls OR bounded NATIVE_* code. No further speculative rewrite; GPS/push/device
acceptance follows actual evidence. No Render deployment/financial operation.

## CI dependency gate, November 18

29551e9 Validate failed on new unpatched HIGH picomatch advisory, before tests.
Remove unused glob middleware layer; retain exact existing httpxy 0.5.5 engine.
Real local HTTP tests preserve Clerk path/body/key isolation/gzip/cookies/status
semantics and TEST bypass. Production audit is clear without suppression; 202
local app/API passes plus one PG-only skip, builds/typechecks pass. Include this
narrow security source correction in the APK backport; NO Render deploy needed
for the client repair. No schema/financial/settings change. Recheck exact-SHA CI.

## Current blocker — native handoff before account loading, November 18

18bbca7 FAILED physical acceptance: browser approval/another approval, then endless
skeletons without ACCOUNT_* recovery. Do not claim its account timeout fixed the
phone. Reproduced successful auth blocked by awaited Browser.close() BEFORE profile
loading; SDK ticket/finalization waits were also unbounded. Fix optional dismissal,
single-flight/phase-aware one-use handoff, callback replay, active-session proof and
an independent actual-main startup watchdog. Keep session tasks/role checks intact.
Optional push-listener failures must not reject app initialization. No backend,
migration, secrets or financial changes needed. Exact handset promise remains
unobserved; fixed phase-only diagnostics support next physical evidence safely.

Local 199 unit/API passes (one local PG skip), builds, account/handoff/bootstrap,
driver recovery and full customer delivery regressions pass. Finish exact-SHA CI, backport only client changes to the existing 18bb staging-repair
branch, verify a newly signed same-package/certificate APK, then one phone retest.
Do not deploy migration 0029 or main for this repair. GPS/push/device acceptance
remains blocked until controls or a bounded diagnostic appears. Keep all gates OFF.

## Priority: physical driver dashboard/session recovery

Samsung installation/launch from deployed 6cc3c784 PASSED; browser sign-in later
SUCCEEDED. Endless authenticated skeletons remain a launch blocker. Reproduced
unbounded Clerk renewal after API 401; full read/session deadline, cancellation,
late-token fencing, bounded native offline-hint handling and explicit driver
retry/sign-out controls now fix that code path. Exact phone transport response
remains unobserved; don't assert provider acceptance or a guessed physical cause.
Local unit/API/build/account/driver/customer order-through-delivery browser checks pass; finish exact-SHA CI. Backport only repair onto deployed 6cc for signed replacement APK,
without migration 0029/backend deployment. Preserve newer notification development.
Next owner gate: update signed APK, retry existing driver session and report any
sanitized timeout code; then authorized physical GPS/background and push acceptance.
No ordering, permissions, provider/financial operations or hosted settings changed.

## Isolated APK repair handoff

Primary fix adbefc65a953fe42afbc7fc3059d8ea345b97e26 preserves newer development.
APK source 18bbca77700e5d2ea4c0d8ba3b10b065608d45cf on supplemental
fix/driver-staging-session-recovery backports only the session/UI repair onto
hosted 6cc. No migration 0029 or backend deploy needed. Existing protected signer
run 44070581572 builds the driver artifact; compile run 44070575802 and Validate
44070539424 must succeed. These were pending when this record was written; inspect
GitHub before claiming acceptance. See checkpoint for exact Samsung update steps.
Next blocker is physical post-update outcome: controls or sanitized phase/status
code, then session restart/GPS/push evidence. Never infer a phone provider/network
cause from offline test success. No additional independent core defect established.

## Latest source/checkpoint

Functional source d430e9ff8c29ef281cae437c5382e774ea3af5d8 fixes notification
identity and strict PostgreSQL restore. Push Validate 44044790407 SUCCESS;
PR Validate 44044800393 and native 44044800367 also SUCCESS, including all four
actual native jobs. Current follow-up makes legacy token-only push opt-out
accessible even when OS permission is denied; browser regression, typechecks and
production build pass. Verify this follow-up commit's exact-SHA CI. Hosted and signed APK source is still 6cc3c78.
Next: exact-SHA CI conclusions, owner Samsung APK/sign-in/background acceptance,
separately approved existing Render deployment with additive migration 0029, then
app-specific real push setup/receipt. No activation/provider/financial operation.

## Current actionable gate — November 17 signed driver and notifications

Deployed 6cc3c7848b7196aa00a26fc40676d939aa0c0a56 passed 23 read-only checks
and actual mobile-width public-page checks. Closed ordering/live/municipal gates.
Existing protected workflow produced and verified a signed driver staging APK:
[run 44039742923](https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44039742923),
[download artifact](https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44039742923/artifacts/14308852404).
Physical installation/login/background GPS remain unverified; use the phone steps
in ANDROID_STAGING_TEST.md. Customer's previous signed APK remains unchanged.

Confirmed native push gap fixed in current source: durable, account-scoped device
status/retryable opt-out, clear configuration versus permission versus receipt,
and distinct allowlisted customer/driver APNs topics instead of customer-only.
Migration 0029 preserves existing devices as customer, touches no business records.
Real Firebase/APNs receipt remains unverified; no provider sends in automation.
Strict backup/restore caught PostgreSQL varchar-array cast deparse differences; explicit text constraint and round-trip regression fix these without weakening recovery checks. All 193 app/API cases pass on local real PostgreSQL (no skips), followed by strict restore verification. New packaging requires deploying this backend capability first; don't confuse
6cc artifact with these newer changes. Finish exact-SHA CI before deployment handoff.

Next independent engineering action: inspect any genuine CI failures, then preserve
clean source. Remaining launch gates require owner/device/provider access rather
than another speculative core rewrite: physical locked-screen GPS/Clerk renewal,
app-specific push configuration/receipt, Apple provisioning/iOS device, approved
legal/contact content, geographic ground truth, authorized settlement scenarios,
and production uptime/recovery. Keep all ordering/live/municipal gates closed.

## Verified code release — November 17

9e1a1622c2cad674ed04fa003718793dde968bb5 passed both Validate workflows and the
entire four-job native matrix (customer/driver Android/iOS), including compiled
privacy/identity/staging-package checks. Android's actual decoded foreground
service value is 0x8, confirming the verifier-format fix; prior 8868's failed run
is historical. No signed artifact or physical background/push acceptance is claimed.

Actionable next gate: owner deploys the exact final verified checkpoint SHA to the
existing Render service, Environment unchanged; engineering verifies read-only,
then creates the configured signed driver APK through the prepared existing signer.
No additional standalone core workflow defect was established after these tests.
Remaining real device/provider/legal/hosting gates are listed in the checkpoint;
continue from evidence rather than rebuilding completed features or repeating the
Geocodio diagnostic/payment. All ordering/live/municipal safeguards remain closed.

## November 17 current release gate

Website 91ee3ea and dedicated native baseline ee14a30 have all three CI workflows
passed, including four customer/driver Android/iOS build jobs for ee14. Background
8868e0d passed shared Validate and iOS/customer Android, but its driver Android
verifier failed on the foreground-service flag representation after compilation.
A semantic-equivalence fix keeps location-only/private-service requirements; verify
latest exact-SHA CI before release. Do NOT call the old failed native run a pass.

Prepared existing signed APK workflow for customer/driver selection, private key
handling unchanged, exact package/asset scans, artifact source identity and compiled
staging-manifest checks. Driver packaging fails closed until the shared website's
return-scheme capability is deployed. Native preflight requires explicit closed
public/private/effective ordering and live-charge flags. No signing job was run.

Next: all latest CI conclusions, owner-controlled existing Render deploy, read-only
staging verification, then configured signed driver APK and supervised phone
background/session acceptance. Owner-approved legal/contact text, Apple signing/
iOS device, app-specific push setup, geographic accuracy, provider settlement and
production hosting/backup acceptance remain genuine external gates. No independent
core workflow gap beyond those documented was established by the current tests.

## November 17 current priorities — full-platform authorization

Recovered f31aac9a27a7731bf7ab66f1cb1d65da903e084e has all THREE CI workflows
SUCCESS. Staging 4934f2413756e0b88bc0da333ec7f906569de906 independently passed
23 read-only checks November 17; all ordering/live/municipal gates OFF.

Completed customer gaps: explicit staging/invitation browsing states, shared
navy/gold website logo, About/How It Works/Support/FAQ and unpublished legal
publication routes. Anonymous public directory/menu access with ordering closed
is already supported outside private staging and now regression-tested. Staging
401 is intentional; do not relax its access control to satisfy external crawlers.
184 local app/API cases, builds/typechecks and full browser regressions pass.

Dedicated driver Android/iOS identities, entry/navigation and isolated return
links are implemented using existing auth/API/driver workflows. Local browser/
API/build tests pass; verify all four native CI matrix builds after push. Customer
identities/signing remain preserved. All four baseline native builds and both
Validate workflows passed for ee14a3093170aa1e916fda362cc8fcbc4c867416.
Opt-in driver background tracking is now implemented with existing revocable
Clerk/approval/presence checks, driver-only native HTTP/permission configuration,
private Android service, orphan watcher cleanup and stop/expiry safeguards. Local
189 app/API cases, consent UI/full browser regressions, typechecks/builds and both
Capacitor syncs pass. Verify new native plugin/merged-permission CI before release.
Next actionable engineering: dedicated driver signed staging target using existing
owner signing infrastructure, followed by owner-authorized real-device background
GPS/Clerk-renewal/battery/push acceptance. No physical acceptance is claimed. Native development is now
explicitly authorized; older deferral notes below are historical. Background GPS,
real push, signed releases and physical iOS acceptance remain genuine unfinished
native/provider/device gates, not implied by compilation.

Owner-only launch decisions: approved Privacy/Terms and public contact details;
geographic ground-truth/office evidence/activation; separately authorized Stripe
settlement/refund/dispute/payout provider acceptance; production uptime/backups;
physical-device acceptance. No domain migration, ordering activation, provider
transaction, paid service, production launch or PR merge authorized here.

## Current launch priorities — November 15 core-completion review

Deployed 4934f2413756e0b88bc0da333ec7f906569de906 passed 23 read-only checks and
all three GitHub workflows. All ordering/live-charge/municipal gates remain OFF.
Historical release/deployment instructions below are superseded by this status.

Implemented foundation: customer discovery/menus/guest checkout/tracking/cancellation/
support; restaurant onboarding/approval/hours/inventory/modifiers/capacity/fulfillment;
driver approval/duty/offers/navigation/handoff/earnings; administrator dispatch,
recovery/support/configuration/refunds/reporting; durable Stripe TEST webhooks,
ledger/refunds/credits/disputes/payout and reconciliation controls. Preserve these.

Actionable software completion: restaurant menu descriptions are now editable via
an accessible phone form instead of name/price-only prompts, with exact price
validation and failure recovery. Category create/rename now use phone forms, and
failed visibility/deletion actions show errors. Both menu commits have three
successful exact-SHA CI conclusions. Guest support already existed and now has
full browser acceptance through administrator decision and guest reply. Confirmed
stale cancellation UI is fixed: affected order/confirmation/tracking caches refresh
immediately, with polling-paused regression. Full local browser/API workflow,
account/homepage/CSP checks and typechecks/builds pass. Check final pushed CI; then
the next release action is separately approved deployment and Samsung acceptance.
No additional missing core workflow was established in this functional review.

Launch acceptance blockers (do not invent new features to avoid these gates):
1. Geographic accuracy: independent public-building ground truth, unresolved office
   provider-response evidence and owner accuracy acceptance/activation approval.
   Preserve boundary/exclusions/ZIP 37854/30 m margin. No repeat provider suite.
2. Financial/provider acceptance: completed $19.19 delivery remains intact; fee/net
   settlement awaits explicit Stripe availability plus separate owner authorization.
   Refund/dispute/Connect/payout scenarios have automated simulation coverage, not
   real-provider acceptance. No transaction authorized in this session.
3. Hosting/operations: Render Free sleeps; owner decision on always-on production
   service and approved hosted backup/recovery drill before commercial operations.
4. Owner/device acceptance: latest release in authorized customer/restaurant/driver/
   admin sessions on Samsung; operational support/pricing/tax policy and launch
   approval. Public/private ordering, live payments and municipal activation remain
   separately gated. Native apps remain deferred.

## November 15 current security/reliability release

Deployed c44d222 independently passed 23 read-only checks with all ordering,
live-charge and municipal gates OFF. Subsequent verified commits bind immutable
financial request identity, reject unsupported providers, recheck driver custody
authority and recheck administrator reconciliation authority after provider reads.
Their exact three CI workflows passed; see ENGINEERING_CHECKPOINT.md for hashes.

Final follow-up closes stale authority on queued checkout, cancellation, transfer
and partial-credit requests. Six HTTP race cases deny mutations without altering
financial/order/audit snapshots. Existing ownership/refund rules and already
committed requests are preserved. Local total: 183 cases (one PostgreSQL-only
check skipped locally), 14 CLI/staging checks, builds and browser workflow pass.
No provider or hosted financial operation occurred; no migration/env change.

Next gate: exact latest-SHA CI completion, then separately approved deployment
and owner-session acceptance. No further reproduced defect in this focused review.
Preserve closed operations and existing completed order. Geographic acceptance
and provider settlement remain unverified/owner-controlled; never repeat the
one-shot Geocodio suite or reconcile the historical payment without authorization.

## November 15 transactional authority follow-up

a6feb5e financial identity and 3b4f6e3 driver mutation reauthorization have all
three exact-SHA CI workflows passed, including PostgreSQL concurrency coverage.
Manual payment/dispute/operation reconciliation now rechecks current administrator
authority after provider-read latency before writing evidence, holds or journals.
Local tests/build/browser regressions pass; real provider acceptance remains
separate. No actual reconciliation, financial records or hosted settings changed.
Next verify transactional authority on newly queued financial requests.

## November 15 financial queue integrity follow-up

c44d2228e5a8c7757659172acd896565fa638dd3 is deployed and independently passed
23 read-only checks. All ordering/live gates and municipal enforcement remain OFF.
Financial operation idempotency now rejects conflicting resource/provider identity;
unsupported-provider jobs are held before execution and rejected from Stripe
reconciliation. Verified with 180 local app/API tests, builds and simulated-payment
browser workflow. No schema, hosted record or provider operation changed.
Next: reproduce stale authorization in driver custody actions before editing them.

Reproduced/fixed driver revocation race: release, arrival, pickup and completion
revalidate permission transactionally before locking the order. Existing owner
exception and custody rules remain. Local suite 182 tests (one PostgreSQL-only
lock-compatibility check skipped locally), builds and browser workflow pass; CI
must verify the real PostgreSQL concurrency check. Next audit: stale administrator
authority across manual financial provider-read latency.

## November 15 post-deployment status

4b2cea8fde2657b0b6d0dba5ecc0f39da7681b9a is now deployed, with 23/23 independent
read-only staging checks passed and all three exact-SHA CI workflows successful.
Municipal enforcement independently confirmed inactive (provisional_postal),
public/private ordering and live charges OFF. Owner confirms diagnostic disabled;
no provider suite or historical payment is to be repeated. Prior pending-deploy
notes below are historical, not a request to redeploy old releases.

New fix: audited webhook/push manual retries now schedule against database time,
so host clock drift cannot defer the requested recovery. Existing authorization,
audit reasons, terminal-state checks and provider limits are preserved. 177
app/API tests and typecheck/build pass locally; exact pushed CI must finish.
Next: expose existing timeout escalations to affected customers without repeated
alerts or changing financial/order state.

Customer delay follow-up: new confirmation/driver-unassigned incidents notify the
customer and restaurant once per incident/version; arrived pickup delays notify
assigned members while retaining custody. Pre-arrival expiry keeps its existing
reassignment update. No new timeouts or financial actions. 178 local app/API tests
and builds pass; new test follows repeated/concurrent reviews through normal
delivery and two earnings records. Check latest exact-SHA browser/CI completion.

## November 15 verified engineering progress

Recovered geographic diagnostics and office mismatch regressions; database-time
driver presence/assignment/location checks; database-time handoff expiry and
idempotent completion; exhausted fifth-attempt push lease recovery. Latest local
suite: 176 app/API tests, 14 CLI/staging tests, typechecks/builds and local browser
delivery regression pass. Provider/payment/device behavior remains simulated in
these tests. See ENGINEERING_CHECKPOINT.md for commits, CI and resumption details.

Notification recovery never sends an automatic sixth attempt. Unknown provider
outcomes become failed/actionable; late acknowledgements are fenced, summaries
recover, and the existing audited administrator retry is required for another send.
No mobile build/source, hosted settings, real provider operation or finance record
was changed. All ordering and live-charge gates remain closed.

Remaining launch gates are owner-controlled deployment/authenticated staging
acceptance, independent geographic ground truth and missing historical office
components, diagnostic shutdown confirmation, and actual Stripe settlement evidence
with separately authorized reconciliation. No claim of full production acceptance.

## Current continuation — November 15, 2026

Latest verified deployed release is 13717a36e27967e60167764d1e7358c90e256a78;
23 read-only checks passed with public/private ordering and live charges OFF,
Stripe TEST configured and municipal enforcement inactive. Historical release
notes below are retained; do not redeploy or rerun the successful payment.
Owner's live Geocodio report is preserved in
delivery-area/geocodio-live-api-review-2026-11-14.md. Office rejection remains
unresolved because normalized returned components/reason were not retained.
Recovered code adds sanitized rejection reasons and deterministic suite/address
mismatch tests; no admission rules or geography changed. Forestry rejection is
correct for the excluded hole; its diagnostic expectation is now explicit reject.
Do not reset/repeat the one-shot provider suite. Activation requires independent
public-building verification, resolution of missing office evidence and separate
owner authorization. Confirm diagnostic flag OFF through the owner's panel.

Next engineering priority: dispatch clock consistency, assignment/custody recovery,
then financial exception handling and notification reliability. Existing completed
features should be audited/tested before changes; do not rebuild them.

November 15 dispatch fix: database clock now controls online freshness, heartbeat
writes, claim/dispatch assignment times and location windows. Future/stale presence
requires explicit reconnect; voluntary declines remain unpenalized. Availability,
heartbeat and duty location recheck current application permission under the
existing profile lock. Regression coverage includes independent PostgreSQL clock
skew in CI. Next security/reliability audit: handoff-code expiry and retry behavior.

Handoff follow-up: issuance, expiration and completion timestamps now use database
time too. Expired proof stays blocked despite a slow application clock; concurrent
valid completion retries create one delivery event and two earnings records once.
Next concrete recovery gap: inspect fifth-attempt push claims after worker crashes;
never infer device receipt or automatically send beyond the retry cap.

## Rockwood boundary approved and deployed — provider acceptance and activation pending

Deployed `9c095d3` independently passed all 23 read-only staging checks on
November 14, 2026. Database/auth/pricing/Stripe TEST/webhook configuration/workers
are ready; no missing configuration. Public/private ordering and live charges are
OFF. Geographic readiness is provisional_postal and municipal enforcement false.
CSP/HSTS are enforced. Real anonymous Clerk screens rendered at mobile width with
zero CSP violations, failed requests or uncaught errors; Zod's old probe warning is
gone. Authenticated account/provider acceptance still needs the owner's session.
No hosted/financial changes were made. See ENGINEERING_CHECKPOINT.md for evidence.

Owner approved the pinned boundary map, additional ZIP 37854 restriction and
30 m edge review margin on November 14, 2026; see delivery-area/owner-approval.json.
Real provider accuracy acceptance and separate activation authorization remain
required. The verified deployed website/backend revision is `9c095d3`.
See [source, provider and activation details](delivery-area/README.md). The pinned
Tennessee Comptroller base polygon includes an excluded hole. Its informational
status and Census ZCTA reference limitations are explicit. No provider account,
customer address transmission, geographic activation or hosted change has occurred.
Public launch remains blocked pending provider accuracy acceptance and separate
activation/commercial authorization. Default provisional postal checks remain for private testing;
production public checkout cannot use that provisional configuration.

Current continuation: see the first section of ENGINEERING_CHECKPOINT.md. The
adapter now independently validates locality, snapshots immutable lookup evidence,
shares identical in-flight lookups and limits distinct concurrent requests. Readiness
and the staging verifier report configuration failures without provider calls or
secret values. The recovered follow-up also rejects malformed provider fields
instead of allowing string coercion to establish street/unit evidence. These
changes do not activate the provider or municipal policy.

Municipal mode requires the exact reviewed geometry hash and provider approval,
then exact street-level server evidence in Rockwood/TN/37854 inside the municipal
polygon, at least 30 m from exterior/hole edges. It rejects ambiguity, coarse
locations, changed addresses and outages. Quotes, order creation, checkout and
queued provider execution recheck; historic reads/webhooks/reconciliation are
unchanged. No completed order or financial record is rewritten.

## First owner-reported end-to-end Stripe TEST delivery — November 13 UTC

On deployed `374477b`, the owner confirmed a $19.19 Stripe TEST payment, processed
signed webhook, restaurant acceptance/preparation, driver claim/pickup and delivery
with customer handoff code. Operational ledger was balanced with zero missing
payment baselines. These are owner-assisted real-provider/device results, not
engineering's independent access to the private payment or order. The owner closed
the private ordering window afterward; engineering's read-only verifier confirmed
both ordering gates and live charges disabled at this same SHA.

Provider fee/net reconciliation remains unverified. The existing generic 409
conflates invalid evidence with legitimate pending balances. Stripe documents
pending/available funds and delayed balance transactions after asynchronous capture;
the exact provider state for this payment still requires owner-supplied read-only
evidence. The correction distinguishes pending, missing and invalid evidence, resolves
unexpanded referenced objects using GET only, and retains the requirement for real
available USD evidence and exact immutable financial matching. No pending balance
is recorded as reconciled, and no fees are estimated. Deployment and retry of the
existing order's reconciliation require owner approval. No new payment, refund,
transfer, inventory change or service-area change is part of this fix. Preserve the
Rockwood-only initial launch scope; commercial acceptance remains separate.

## Latest owner acceptance — November 13, 2026 UTC

Deployed revision: `374477bdb7d87a45a419c689c32a4491c04626d3`.
Owner verified on Samsung Galaxy S22 Ultra: customer login/dashboard, three
quantity-one items retained after refresh (899 + 349 + 200 = 1448 cents), saved
address loading, mobile menu opening/closing, and the expected HTTP 409 while
RoCoEats Test Kitchen has paused acceptance. The apparent duplicate fries occurs
only in Samsung extended scrolling screenshots; live view, ordinary screenshots
and recordings show one entry. Treat this as a probable screenshot-stitching
artifact, not a confirmed remaining application duplication defect.

Engineering read-only staging reassessment passed all 23 standard HTTP checks at
this revision with database/auth/pricing/Stripe TEST/webhook configuration/workers
ready. Public ordering, private test ordering and live charges remain disabled.
This is configuration evidence, not a successful provider transaction or delivery.
Authenticated restaurant stock/hours, dispatch eligibility, provider endpoint
verification, actual signed-event processing and per-order financial evidence
remain owner-assisted checks. Reuse PRIVATE_TEST_DELIVERY.md; do not recreate the
already established accounts, restaurant or menu.

Deferred owner-reported UX: duplicate Notifications dashboard card (root cause
not independently established) and remaining mobile navigation/checkout cleanup.
Do not expand this into new development before the supervised private TEST order.
No ordering activation, restaurant unpause, provider probe/audit, payment or
financial reconciliation write has been authorized by this reassessment.

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

The deployment verifier now includes five native-origin HTTP checks and expects
native protocol version 1. All 16 checks passed against the deployed fdb0c9f.
Android `https://localhost` and iOS `capacitor://localhost` preflights allowed
the required headers, anonymous profile requests remained denied, and an
untrusted origin received no CORS grant. This verifies the live server contract.
Authenticated native sign-in, push, background GPS, Play AAB and signed iOS
device acceptance remain open.

## Private Stripe acceptance preparation — November 10 (Eastern time)

On exact revision `5d9374c87a83a37c3986b38f7bc301c5705dcb04`, web Validate
42762375054 passed and native 42762375059 passed the Android/iOS compile jobs.
Signed packaging and Android emulator jobs were skipped. This revision is
verified for closed private Render staging. At the time of checking, Render
still served `fdb0c9f` and passed all 16 closed-staging HTTP checks.

Owner reported the staging Operations probe confirmed Stripe TEST mode and the
enabled webhook URL, API version and required subscriptions. The dashboard had no
accepted signed event yet. This is owner-observed provider configuration evidence.
A signed checkout event, collected TEST payment and four-role delivery remain open.

Operations now reports the latest signed event's ID, type, inbox state and
processing time without returning its payload. Use the Stripe event ID and
matching order payment record for reconciliation. The read-only staging verifier
can also validate the open private test window with an exact deployed SHA while
requiring public ordering and live charges to remain off. Local app/API tests,
build and typechecks passed. Seven verifier fixture scenarios passed. Live
private-window verification still requires the supporting Render deployment and
the owner-controlled test setting. No staging settings were changed.

## Private staging deployment and first-order rehearsal — November 10

At 1:42 a.m. Eastern, Render returned exact revision
`5d9374c87a83a37c3986b38f7bc301c5705dcb04`. All 16 staging checks passed.
Database, authentication, pricing, Stripe TEST configuration, webhook
configuration and workers reported ready. Private staging was on, and both
ordering switches and live charges were off. PR commit `3a83f97` also passed
Validate 42769283979 and native workflow 42769284602. Its latest-signed-event
details are available after deploying that revision.

Extended the existing signed Stripe webhook relational test to follow one
order through signed receipt and payment, restaurant preparation, administrator
assignment, driver arrival and pickup, customer handoff, exact restaurant and
driver allocations, Stripe fee/net reconciliation and balanced ledger journals.
The webhook signature and provider charge response use fixtures. This rehearsal
made no Stripe request and created no staging order or payout. The real
four-role acceptance is still pending authenticated tester sessions and the
owner opening the private TEST window. Keep public ordering and live charges
off throughout and close the private window when the test ends.

### Test Kitchen preparation

The staging health verifier passed all 16 checks at 5d9374c with private
staging active, both ordering switches off and live charges disabled.
Existing onboarding, administrator review, operator menu and inventory
controls, opening hours and driver availability cover the test setup.
Documented the exact owner steps in PRIVATE_TEST_DELIVERY.md. A relational
test used the requested fictional menu and prices, approved the listing,
set tracked stock and hours, verified the $14.48 quote and denied checkout
while the window was closed. The invited fixture driver went online.
The deployed listing, invited accounts and actual owner's driver status
still require authenticated owner checks. No live staging records changed.

## Signup and account recovery

Private staging checks membership before profile provisioning. The previous
restaurant screen displayed the same setup error for a denied staging identity
and a missing profile. An authenticated identity may also have no RoCoEats
profile yet. The new flow uses separate recovery paths: report denied access
without provisioning, and automatically provision an admitted missing profile
with the member role selected by the signup entry point. Concurrent signup
recovers the existing profile instead of rewriting its role. Administrator
bootstrap and owner-driver approval remain controlled by server configuration.

Account queries are keyed by authenticated identity. Protected sign-in loading
has a recovery screen, and the API client bounds requests including token
lookup. Checkout signup returns to the cart and can carry the device guest cart
to an empty customer cart. Public discovery behavior is unchanged outside
private staging, and staging admission, both ordering switches and Stripe TEST
mode remain enforced.

Local relational tests distinguish anonymous, denied and unprovisioned
identities, provision all three member roles, reject admin injection and
verify restaurant creation. API tests cover a stuck token lookup and join
intent restrictions. Build/typechecks passed. Clerk provider registration,
Gmail alias reproduction in deployed Incognito, Apple availability and
physical mobile acceptance remain unverified. Owner-led checkout is deferred.

Native browser handoff now retains a fixed member signup or checkout
destination through ticket redemption. Recovery of an expired web session
signs out before restarting the intended path. Added route tests and extended
the existing simulated mobile-width browser fixture. All 121 local tests and
the production build/typechecks passed. The Chromium runner was blocked before
navigation by a denied process socket, so the browser fixture is unverified.
Read-only Render checks passed all 16 on 5d9374c with both ordering gates closed.
No production settings or Stripe transactions were changed.

### Signup browser reproduction and loading loop fix

On 5702b18, web Validate 42775984020 and native workflow 42775983964 passed.
The deployed Render revision still reports 5d9374c. The installed Chromium
process could not bind its singleton socket in this workspace. Google's
official Chrome Headless Shell ran the mobile-width browser fixture locally.

The fixture loaded the real signup, account setup, restaurant and dashboard
routes with simulated Clerk and API responses. A 403 reproduced the loading
loop in account setup: its error view mounted a header that retried the same
failed query, hid the error view, and repeated. Profile observers now retain
the error until an explicit retry or normal refocus. Direct restaurant and
driver URLs preserve signup intent and distinguish missing profile from denied
access. The fixture verified all three signup paths, reload persistence, stable
restaurant/dashboard denial and Retry, expired-session recovery, guest-cart
transfer, and native handoff. All 121 local API tests and the production build
passed. Real Clerk registration and the reported Gmail alias on deployed
private staging remain unverified. Signed native builds, physical-device
coverage and real provider acceptance remain open. Ordering gates were not changed.

### Checkout quote consistency

The customer can now place only the exact cart, address and tip snapshot
that was quoted. A response that arrives after an edit stays hidden until
the current inputs are quoted. The same reviewed request and idempotency
key are retained across a retry, including recalculating unchanged inputs
with the same total. Order completion does not erase a cart changed while
the request was pending. The mobile-width browser fixture tested delayed
quote response, requote, and identical submission retries using simulated
API responses. This exercise created no staging order or Stripe payment.

### Security hardening pass

Verified draft PR #1 at 779d28f with passing Validate 42777465245 and native
42777464916. Android/iOS compile jobs passed; signing and emulator jobs were
skipped. Render still served 5d9374c and passed all 16 read-only checks, with
private staging active and both ordering windows and live charges off.

Reviewed cookie/session handling and API response caching using OWASP ASVS,
object permissions using the OWASP API Security Top 10, and native data handling
using OWASP MASVS. This is a scoped review, not a full standards assessment.

- Cookie-bearing API writes now require a trusted origin even when an
  Authorization header is present. Production trusts configured origins rather
  than deriving a trusted origin from the incoming Host. The existing approved
  native origins remain eligible in private Stripe TEST staging. Authenticated,
  guest-capability and private staging responses default to no-store.
- Per-order GPS writes recheck current driver eligibility under a profile lock
  before acquiring order custody. The maintenance worker deletes stale order
  positions as well as duty positions after 15 minutes. The latest position
  remains available to authorized participants within existing freshness rules.
- All 121 local tests and the production build/typechecks passed. Production
  dependency audit found no known vulnerabilities at the requested threshold.
  The first origin-test fixture used production mode with a simulator-backed
  quote and returned 503 by design. The corrected fixture exercises profile
  mutations and the real origin guard with simulated authentication.

Next security priorities are cross-account finance and support authorization
review, production-grade abuse monitoring, physical-device storage and
background GPS verification, and authenticated provider staging acceptance.
No staging or financial settings were changed.
