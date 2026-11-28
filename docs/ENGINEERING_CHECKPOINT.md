# November 28 — Owner workspace release live on Render staging

The owner manually deployed `c07e20053b35a663155d969a27b98dc6999e852e` to the
existing Render staging service and confirmed Render showed Live and `c07e200`.
An independent read-only check confirmed the full revision via `/livez`. All 23
GET and OPTIONS checks passed. Dependencies reported ready, and public ordering,
private test ordering, live charges, TEST payouts, webhook retention and municipal
enforcement were off. The report includes native CORS and anonymous access checks.
[Sanitized staging evidence](verification/STAGING_HTTP_2026-11-28_c07e200.json)

Authenticated owner acceptance of the workspace on Samsung remains open.
FCM validation requires separate authorization. Signed iOS device and provider
receipt acceptance remain open.

The read-only release verifier now requires explicit evidence that TEST payouts,
webhook retention and municipal enforcement are off. It also requires verified
Render CDN client identity and geographic configuration readiness. Missing or
malformed safeguard responses fail verification while the report still records
the other checks. Both new regressions failed before the fix. All 37 release
preflight tests passed, and the hardened verifier passed all 23 staging HTTP
checks against the same deployed SHA.

# November 28 — Owner navigation with real records and full delivery acceptance

Follow-up regression with an owner-managed driver and a pending TEST payout reproduced
section movement when late records changed the page height. Initial anchor navigation
now waits for the first read queries to settle, then aligns once; later polling/status
refresh cannot pull the owner back. Focused mobile test verifies this plus owner driver
approval disabled, payout transfer disabled, and support decision disabled without a
substantive reply. No gate/authorization logic changed.

Owner UI commit c41d7a4f36c5efb45c3e82c796df8a48f3548896 CI exposed an outdated exact
heading assertion in verify-website-workflow.mjs ('county operations desk'). Updated
it to the actual new dashboard title, preserving the exact assertion. Do not label
that earlier commit fully CI-green. Native validation succeeded; Validate workflows
failed at the obsolete heading. This follow-up supersedes that release candidate.

Actual full website/API/disposable-PGlite browser workflow now PASS: customer search,
modifiers, address/cart/quote, simulated payment, restaurant acceptance/preparation,
driver claim/pickup/handoff/delivery, balanced ledger/two earnings records, guest
checkout/tracking, support open/admin decision/reply, unpaid cancellation, menu/category
editing and hours/outage recovery. Auth and payment provider are simulated. No hosted
records or external providers used. Focused owner browser, frontend types and production
build PASS. Support commit 32149c4 all3 CI SUCCESS remains verified. Prior full
component browser suite PASS remains applicable.

All three GitHub Actions runs for `c07e20053b35a663155d969a27b98dc6999e852e` passed.
Validate covered the PostgreSQL suite, backup and restore, browser workflows and
container checks. Native validation compiled both Android and iOS app variants.
[Push Validate](https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/46118408237)
· [PR Validate](https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/46118411897)
· [Native validation](https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/46118411887)

This release preserves the existing migrations, environment, native signing and
driver GPS behavior, including the 90-second limit.

# November 28 — Owner workspace usability verified; support recovery CI passed

Support recovery commit 32149c44b51e5ea6ba5e59b12bdcc9ba3ad4b02e is pushed.
All three exact-SHA CI workflows SUCCESS: 46117370108, 46117370086, 46117366337.
Recovered support authorization/timeout/retry work is complete, not an open task.
API evidence remains 295 passed / one PostgreSQL-only local skip; CI also ran the
repository's PostgreSQL/native validation. No provider acceptance inferred.

Owner experience: readable navy/gold dashboard with eight real management shortcuts;
restaurant/account/finance tabs support direct URLs and browser Back. Operations now
has named System, Dispatch, Drivers, Orders, Payments and Support sections. Larger
text, gold ordinary actions, distinct primary/secondary sizes and 44px+ touch targets
are scoped to owner pages; approved homepage unchanged. Protected settings have separate
status cards. Missing values explicitly need review, never imply disabled/passed.
Read-only service refresh added. Technical queues/recovery and provider diagnostics
are expandable; original reasons, warnings, consents and disabled gates preserved.
Account loading/errors no longer masquerade as an administrator access denial.

Validation: frontend types and production build PASS; focused owner browser PASS at
320/390/768/1440px and full existing account/customer/support/native-session/diagnostic
browser suite PASS. Tests use isolated mocked API/auth/provider responses, not real
Google/FCM or hosted account acceptance. Mobile screenshots visually inspected. Direct
orders anchor navigation waits for account hydration; missing flags, denied/error
roles, Back navigation, untouched consent and zero automatic writes/provider requests
covered. New exact-source CI pending push; check conclusions, do not assume success.

No deployment, migration, environment/credential change, financial operation, provider
execution, APK rebuild, or Driver GPS/90-second change. Hosted release remains e265270.
Deployment of both web/backend changes needs separate owner approval; no new variables.
Next technical acceptance: authorized staging owner verifies the new navigation/status
layout after approved deployment, then separately approved one-shot FCM validate_only
execution (fresh OAuth + validation call; no delivery). Signed physical iOS/provider
receipt and production hosting/recovery acceptance remain external. Do not invent
another feature or rerun accepted GPS/customer checks while awaiting those boundaries.

# November 28 — Recovered support timeout and retry work verified

Recovered six unfinished files without resets; originals retained in the session backup.
Prior authorization correction 3334075f0460dd3d1d3fcf3405eea0696660370d is pushed,
all three exact-SHA workflows successful. Transaction-time active-account/admin checks
and database timestamps preserved. Support reads/writes now have a 20-second bound,
including stalled authentication, cancellation fences late requests, and no automatic
mutation retries occur. Frozen request/reply/decision IDs survive uncertain outcomes
and incomplete history. Administrator decision retries return current state without
repeating messages/audits/notifications or closing a case reopened by a later reply.
Legacy decision clients remain compatible; no migration required.

Validation: API 295 passed, one PostgreSQL-only test skipped, zero failures; focused
support-request tests 3/3; API/frontend typechecks and production builds passed.
Browser regression covers lost response recovery for all three writes with simulated
API/auth only. Exact new CI results must be checked after push; pending is not success.
No hosted/provider/financial/native/GPS changes. Next: focused owner Operations and
administrator dashboard readability/direct navigation, preserving all confirmations.

# November 27 — FCM handoff resolved; independent support recovery work active

Owner supplied exact authenticated FCM readiness at approximately04:23EST/09:23Z:
{"ready":true,"allowanceUsed":false,"run":null}. Evidence saved in
verification/FCM_READY_OWNER_2026-11-27_e265270.json, owner-observed not agent-session.
Deployed e265270 remains verified23/23. Readytrue confirms closed push/other safeguards
and dedicated local identity, unused durable slot. Do not request this evidence again.
NO execution authorized: new OAuth+FCM validation request pair remains blocked pending
explicit approval. Google OAuth historical success confirmed; FCM permission/receipt
not verified. No consents checked/provider calls made. Preserve GPS90s/native artifacts.

Resumed clean remote8bd64b9db1869773059dff5944404e725f652948; all3 CI SUCCESS
45973307572/45973307562/45973299685. PR1 OPEN/DRAFT, branch relationships preserved.
Read checkpoint/backlog/source once. Most core commerce/workspace workflows implemented
and simulation-tested; provider/device/production-hosting/geographic acceptance remains
external, not a reason to rebuild them. Confirmed independent defect in support:
request authority cached before transaction allowed revoked account writes. Four focused
before-fix cases returned201/200 after suspension/demotion. Reused existing no-key-update
transaction profile locks; new authoritative role checks before opening/reply/decision.
Focused regression now5/5 PASS, with no case/message/audit/notification changes on denial.
Admin support timestamp now uses database time. Full API291 PASS/1 PostgreSQL-only skip/0 failures; API types/build PASS. Exact
source CI pending push. Next package is support browser request timeout/idempotency/recovery. No hosted changes.

# November 27 — FCM validation release Live; public checks passed, owner status pending

OWNER reports approved Render deployment succeeded/Live, displayed e265270; neither
diagnostic executed during this release, no consent boxes checked. Previous approved
Google OAuth success at08:28:48Z remains historical real owner-observed evidence.
INDEPENDENT exact deployedSHA e2652709a9d7a531ee8e711fc67d6c609fb9648b confirmed;
existing23 GET/OPTIONS-only checks ALL PASS at2026-11-27T09:22:15.741Z. DB/auth config/
pricing/webhooks/workers/security/native/proxy ready; public/private ordering/live
charges/payouts/retention/municipal gatesOFF. Evidence:
verification/STAGING_HTTP_2026-11-27_e265270.json.

Additional GET-only protection checks09:22:12.977Z: FCM permission endpoint, OAuth
endpoint and Operations health all401 unauthenticated. Evidence:
verification/FCM_VALIDATION_ACCESS_2026-11-27_e265270.json. Owner-role restrictions also
previously automated-tested on exact source. No provider call, diagnostic POST, hosted
change, deployment, financial transaction, Android rebuild or GPS alteration by agent.

Protected CURRENT pushOFF/readiness/one-shot state still needs owner-authenticated
status. Requested same-Samsung-Chrome GET /api/admin/fcm-permission-validation,
report ready/allowanceUsed/run only. Expected true/false/null; GET does not execute
OAuth/FCM or consume allowance. readytrue includes closed push/other gates + approved
local credential identity, so no redundant Operations label needed if that is supplied.
Do not mark authenticated readiness or unused durable slot independently verified from
anonymousGET; owner reports no execution, protected status pending at this checkpoint.
If different/unavailable, stop/investigate without retrying or editing settings.

Public deployment verification PASS. Readiness for separate one-time provider validation
approval is conditional on protected status above. Actual FCM permission/device delivery
UNVERIFIED; old OAuth-only approval consumed, new OAuth+FCM validation execution NOT
approved. Keep both consent boxes unchecked, never press diagnostic/Retry/send controls.
No new release or variables needed. Android/GPS90s/signing/credentials/IAM and safeguards
preserved. Resumed clean bf38359 matching remote. Documentation/evidence only.

# November 27 — Exact FCM validation release approved; owner deployment pending

Owner approves ONE existing Render deploy of e2652709a9d7a531ee8e711fc67d6c609fb9648b,
NOT provider execution/env/IAM/credential/billing changes or APK builds. All3 exact CI
reconfirmed SUCCESS45968198861/45968187677/45968198855. Newer docs HEAD is NOT target.
Source review confirms fixed validate_only:true, no target overrides/fallback, unique
platform_settings key committed before provider I/O, conflict rejection, no expiry or
reset path; retries/concurrency/restarts cannot recreate its durable allowance. Tests
already passed; no repeat accepted native/provider tests. No migrations/env/key changes.

Live preflight23/23 PASS at2026-11-27T08:57:35.838Z, deployed STILL exacta4288526b668d71db0c519e621f543484e3afb11.
DB/auth/security/native/proxy ready, ordering/live/payout/retention/municipal gatesOFF.
Evidence verification/STAGING_HTTP_2026-11-27_a428852_FCM_PREFLIGHT.json. PushOFF last
owner-observed with successful OAuth; no new settings changed. Confirm label before
manual deploy. No direct Render deployment/session capability; NO DEPLOYMENT PERFORMED.
Rollback artifact availability for a428852 is owner-dashboard-only UNVERIFIED here;
owner must confirm retained successful deploy/rollback availability, otherwise stop.

Owner manual target: existing LocalEats-Delivery-App -> Manual Deploy -> Deploy a
specific commit -> FULL e2652709a9d7a531ee8e711fc67d6c609fb9648b. No latest commit,
restart, environment edit or cache clear. After Live/source report, verify23 checks
expectinge265270 plus unauthenticated GET denial. Owner Chrome can inspect protected
GET /api/admin/fcm-permission-validation, expected readytrue/allowanceUsedfalse/runnull,
provider pushdisabled. Do NOT tick consent or press either diagnostic Verify/Validate.
Execution remains separately unauthorized (would entail fresh OAuth+one FCM dry run).
Current Google OAuth success remains confirmed owner evidence; FCM permissions/receipt
unverified. GPS/90s/Android signing/records preserved. Stop at owner Render-session step.

# November 27 — Permission diagnostic code CI verified; live permission not tested

Functional e2652709a9d7a531ee8e711fc67d6c609fb9648b ALL THREE CI SUCCESS:
45968198861(PR Validate),45968187677(push Validate),45968198855(native Android/iOS).
Prior f3b8c59 offline/evidence commit all3 SUCCESS too. Current hosting unchangeda428852;
no new Google calls/sends/deploy/config changes. OAuth authentication is CONFIRMED by
owner at08:28:48Z; live FCM permission/device delivery remain UNVERIFIED. Safe preparation
local API286 PASS+1 PG-only skip, FCM16+builder2 PASS, types/builds/browser PASS.

Next OWNER APPROVAL is one existing Render deployment of EXACT functionale265270 SHA,
not newer docs HEAD, with unchanged credentials/flags and no migrations/APK rebuild.
After Live, verify23 read-only checks + owner GET permission readiness; do not execute.
A later separate execution approval must explicitly cover fresh OAuth +one validate_only
FCM request (no delivery). One-shot allowance cannot expire/reset/retry automatically;
failure/unconfirmed stops review. Existing OAuth-only approval is consumed and not reused.
Rollback target retained a428852; DB audit/one-shot state not reversed by rollback.
No current phone action until deployment approval. Next actual-device stage requires
separate one-app/device enrollment/recipient-scoped send authorization and outbox review.
Do not open global sending, enroll a device, or repeat accepted GPS tests now.
This follow-up is documentation only; its CI is separate from functional source above.

# November 27 — Separate validation-only FCM permission diagnostic implemented

Real Google OAuth success remains owner-observed evidence at08:28:48Z; previous
single OAuth-only approval consumed. No further real provider calls by agent. Implemented
separate GET/POST /api/admin/fcm-permission-validation + owner Operations component,
NOT deployed. Original OAuth-only endpoint still never calls FCM;16 unit tests preserve
that contract. Public/provider delivery gate stays OFF; no credentials/IAM/native edits.

New path uses fixed-project/topic immutable validate_only:true payload, no device token,
notification, caller override or fallback to delivery. One fresh scoped OAuth request
plus one FCM messages:send VALIDATION request (each10s bounded). Tokens stay server-
transient, not cached/returned/logged/persisted; sanitized status only. Exact same
approved dedicated identity, configured-owner+active-admin authorization, closed
staging/ordering/push/payout/retention/municipal+StripeTEST guards. Strict input allows
only confirmValidationOnly:true. GET readiness/history is local/read-only/no provider.

Existing platform_settings table holds durable GLOBAL one-shot v1 allowance committed
with audit-start BEFORE provider I/O. No expiry/reset endpoint/automatic retry; failures,
crashes or lost responses consume allowance. Sanitized report/audit persist; GET recovers
completed/unconfirmed outcome. No DB transaction held over network. Owner UI explicit
checkbox/button, no token/target inputs, no automatic POST/retry. FCM HTTP200 only with
valid SAME-project acknowledgement grants permissionValidated;403/400/redirect/missing
or different-project evidence never accepted. This is dry-run permission proof, not
physical device receipt. No migration/new env flag/APK rebuild required.

Local tests: API286 PASS/1 PostgreSQL-only SKIP/0 fail, including dedicated relational
owner/role/guards/input/concurrency/one-shot/error/audit/privacy and unchanged financial/
notification records. FCM16 PASS + fixed-builder2 PASS; HTTP/body timeout/no-fallback,
no token cache and OAuth-only non-FCM boundary covered. API/UI types and production
builds PASS; browser suite PASS, new permission explicit-consent/permanent allowance/
GET-only lost-response/no horizontal overflow cases, simulated providers only.
Exact functional-source CI now passed (see top entry); live FCM permission is not yet verified.

Next: STOP at separate owner deployment
and provider-execution approvals. Future call approval must explicitly include fresh
OAuth + one FCM messages:send with validate_only:true (not a notification). Keep provider
pushOFF even during permission validation. Prior deployeda428852/23-read-only evidence
unchanged, no new hosting action. After approved deployment, only read readiness until
execution approval. Rollback target is retained a428852; one-shot/audit records are not
reset by rollback/redeploy. Later stages: separately authorized one configured staging
app/device enrollment, then recipient-scoped real notification/OS receipt test with
outbox safeguards reviewed; do not globally open worker sending merely for validation.
No owner phone action before new exact-source release approval. GPS/90s/signing and
all financial/public-ordering/geographic safeguards preserved. Work includes previous
f3b8c59 offline-builder commit; live diagnostic UI does not exist until approved deploy.

# November 27 — Real Google OAuth success confirmed by owner; permission stage next

Owner executed the ONE separately approved OAuth-only check on deployeda4288526b668d71db0c519e621f543484e3afb11.
Exact label: Google OAuth authenticated. FCM permissions and device delivery remain
unverified. Time Nov27 03:28:48EST =08:28:48Z; cooldown until03:38:48EST =08:38:48Z.
Subsequent GET Refresh OAuth status recovered the same successful outcome. Owner
observed pushdisabled/no notification sent. Evidence is REAL OWNER-OBSERVED, not an
agent provider request or simulated acceptance. Preserved in
verification/OAUTH_SUCCESS_OWNER_2026-11-27_a428852.json. No tokens/key/provider body
received. Google credential authentication now CONFIRMED at that observation; effective
FCM project permission and physical receipt remain UNVERIFIED. One-time authorization
is CONSUMED; cooldown expiry does not authorize another run. Do not repeat OAuth.

Safest next milestone: separately approved FCM validation-only permission diagnostic,
using fixed staging project/topic and literal validate_only:true, no device enrollment
needed for this first check. Official API documents no delivery in this mode, but it
STILL calls messages:send, explicitly outside completed OAuth-only authorization.
Future approval must cover a fresh OAuth token request plus one validation-only FCM
request; diagnostic discarded the earlier token. No normal sender/worker/gate enablement,
caller-controlled flag/topic/token or fallback to real sending. Require owner/closed
gates/identity, durable one-run allowance/audit, sanitized result and strict success
assessment; invalid payload/HTTP4xx is NOT permission acceptance. A dry-run200 is not
physical device receipt. Reference https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send.

Safe bounded preparation completed: pure prepareFcmPermissionProbe returns immutable
serialized validation-only payload/fixed project/topic, rejects any caller arguments,
contains no device token/notification/credentials and performs no fetch. Tests cover
zero network calls, flag/project/endpoint identity, override rejection and immutability.
Two targeted tests PASS; API typecheck/production build PASS. Added test to existing
API test runner; no runtime route/worker imports, no UI/endpoints added, no deployment
needed for this OFFLINE preparation. Exact new-source CI pending push. Do not claim
full live permission diagnostic exists or instruct owner to press an invented button.

Next independent engineering action: build/test owner-only FCM validation-only route
and UI around this fixed builder (without touching accepted OAuth-only path); then
present concrete verified SHA for separate deployment AND provider-call authorization.
No owner phone action now. Following permission success, separately authorize exactly
one staging device/app enrollment (token stays private), then design/approve one actual
notification/receipt test. Review outbox/TTL before any future send window; no bulk retry
or blanket gate activation from a permission probe. All ordering/financial/retention/
municipal/send safeguards OFF; credentials/IAM/billing unchanged. Android257/258 and
accepted GPS/90s preserved. This turn made no Google/FCM/financial/hosted calls/changes.
Resumed clean d816459 matching remote. Owner evidence + offline code only.

# November 27 — Owner readiness confirmed; ready for separate OAuth-only approval

Resolves protected-status conditions recorded at287d387. Owner reports exact
GET /api/admin/firebase-oauth response from authenticated Samsung Chrome after a428852:
{"ready":true,"retryAfter":null,"lastRun":null}
Owner confirms no OAuth verification executed and no Firebase notification sent.
Owner-observed evidence (not agent-authenticated inspection) preserved in
verification/OAUTH_OWNER_STATUS_2026-11-27_a428852.json; exact observation time not given.

Checked DEPLOYED a428852 code: ready requires safeguardsClosed(), approved dedicated
credential identity/local validity and no cooldown. safeguardsClosed explicitly requires
ROCOEATS_PUSH_DELIVERY_ENABLED !== 'true'; actual sender gate enables ONLY exact 'true'.
Thus owner-observed readytrue also demonstrates push sendingdisabled at observation,
with public/private orderingOFF, payouts/retentionOFF, provisional area mode and Stripe
TEST. No repeat Operations label check is necessary absent changed/new contrary evidence.
retryAfternull/lastRunnull show no allowance or prior diagnostic audit recorded. Owner
reports no execution/sends; do not turn this into an independent Google-history claim.

Combined with independently verified exactSHA/23 read-only checks and live anonymous
401 protections from287d387, status is READY FOR SEPARATE approval of ONE OAuth-only
execution. Approval has NOT been granted; do not run it, check consent or press Verify.
Google authentication, effective FCM permission and physical receipt remain UNVERIFIED.
No deployment/config/key/IAM/billing/financial/native/GPS/90s changes or new tests needed;
documentation diff check only. Stop awaiting explicit one-time OAuth authorization.

# November 27 — OAuth diagnostic deployed; public checks pass, owner status pending

OWNER reports approved manual Render deployment Live, sourcea428852, Nov27 03:14:59EST
(08:14:59Z). INDEPENDENT exactSHA confirmed a4288526b668d71db0c519e621f543484e3afb11.
Existing23 GET/OPTIONS-only checks ALL PASS at08:18:03.799Z. DB/auth configuration/
pricing/webhooks/workers/security/native/proxy checks ready. Public/private ordering,
live charges, payouts, retention and municipal enforcement OFF. Sanitized evidence:
docs/verification/STAGING_HTTP_2026-11-27_a428852.json.

Additional live GET-only access checks at08:18:42.005Z: /api/admin/firebase-oauth,
/api/admin/operational-health and /api/notification-devices/config all401 without
credentials. Evidence docs/verification/OAUTH_ACCESS_2026-11-27_a428852.json. Source
owner/admin/active-profile restrictions and negative-role/concurrency/privacy tests
previously passed all3 exact-source CI; hosted nonowner-authenticated role tests not
performed without sessions. No diagnostic POST, Google request, notification/send,
financial transaction, config change, deployment or GPS change by agent this turn.

PROTECTED LIVE EVIDENCE STILL PENDING: current pushOFF flag and last diagnostic/audit
outcome require owner's authenticated GET. Asked owner to view Operations push label
and open same-browser /api/admin/firebase-oauth, report ready/retryAfter/lastRun only.
No keys/cookies/session IDs requested. GET does not OAuth or write audit/allowance.
Expected unused-ready status: readytrue, retryAfternull, lastRunnull. If unavailable,
not ready, prior run/cooldown or pushenabled, STOP and investigate; do not auto-execute.
Do not claim no historical provider sends or no prior OAuth execution from anonymous
checks alone. Agent executed none; source has no automatic OAuth execution path.

Status: public release verification PASS; readiness for separate one-time OAuth
approval is CONDITIONAL on protected owner status above. No execution authorized.
Even a ready result proves local credentials/identity/closed gates only, not Google
OAuth acceptance, effective FCM permissions or physical delivery. No button/checkbox
interaction before separate approval. Current deployment needs no additional release
or native rebuild. Accepted Android/GPS/90s, credentials/IAM and safeguards preserved.
Resumed clean a30c867 matching remote; documentation/evidence-only checkpoint.

# November 27 — Exact OAuth release approved; manual owner deployment required

Owner authorizes ONE deployment of a4288526b668d71db0c519e621f543484e3afb11 to
existing Render staging only. NOT OAuth execution, env/key/IAM/billing changes, sends,
APKs or financial operations. All3 exact-source CI reconfirmed SUCCESS:
45961710895 /45961705271 /45961710899. Target is still a428852, not newer docs HEAD.
No migrations/Dockerfile/startup changes vs currentff73741; GPS/90s/signing untouched.

Fresh23 read-only checks PASS at2026-11-27T08:04:59.671Z, actual deployed SHA STILL
ff73741bb7a5e3ffcb0985b02d2355bb1fd99f48. DB/auth configuration/security/native checks
ready; public/private ordering/live charges/payouts/retention/municipal gates OFF.
Evidence docs/verification/STAGING_HTTP_2026-11-27_ff73741_OAUTH_PREFLIGHT.json.
Push OFF last OWNER-OBSERVED on current release; public readiness does not expose it.
No Render deployment connection/CLI/browser capability available. No deployment done.
Rollback artifact availability cannot be independently verified through public endpoints;
owner must inspect successfulff73741 Deploys entry before proceeding. Do not claim it
confirmed merely because ff73741 is Live. If missing or push notdisabled, STOP/report.

Owner Samsung: existing LocalEats-Delivery-App -> confirm rollback entry/gates -> Manual
Deploy -> Deploy a specific commit -> FULL a4288526b668d71db0c519e621f543484e3afb11.
No latest-HEAD/restart/env edit/cache clear. Wait Live and report actual source. Then
engineering verifies23 checks expecting a428852, and owner Chrome reads Operations
local-credential/send labels plus OAuth readiness. Do not tick OAuth consent or press
Verify Google OAuth only, other Verify, Retry or any send. GET readiness/Refresh OAuth
status is provider-free. Provider authentication remains UNVERIFIED until separately
approved manual OAuth execution. No credential supplied/read by agent. Rollback plan:
retained successfulff73741 -> Rollback (target build/env snapshot, DB unchanged), not
fresh old-SHA deployment with current config; execution scope must be confirmed if needed.

This update only records approval/preflight/manual handoff. Existing deployments,
Android artifacts/accepted GPS/90s and all gates unchanged. Stop at owner Render-session
boundary; do not create credential workarounds or request secret/session contents.

# November 27 — OAuth diagnostic exact-source CI passed; approval boundary

Implementation a4288526b668d71db0c519e621f543484e3afb11 pushed to approved branch.
ALL THREE CI SUCCESS45961710895(PR Validate),45961705271(push Validate),45961710899
(native Android/iOS Customer+Driver). No deploy or real Google/provider execution.
Local280 PASS/1 PG-only skip, FCM13 PASS, types/builds/browser PASS; actual provider
acceptance still unverified. Reviewed code uses OAuth-only helper, no message call,
owner/profile/closed-gate/identity checks, DB-clock cooldown/audit, no token retention.
No migrations/env/signing/GPS/90s changes. Native compile is not physical acceptance.

DEPLOYMENT TARGET is FULL a4288526b668d71db0c519e621f543484e3afb11, NOT newer docs
HEAD. Next owner approval is exact-commit existing Render release, keeping all variables
and gates unchanged. Rollback target retained ff73741. After approved release, verify
exactSHA/23 read-only checks; owner uses Samsung CHROME on hosted staging Operations,
not installed older native APKs. Readiness/Refresh OAuth status does not contact Google.
STOP before pressing Verify Google OAuth only until separate one-time execution approval.
That run creates sanitized audit records and one OAuth request, no notifications/FCM send.
No immediate phone test requested or accepted GPS retest needed. This follow-up is docs
only; its CI is separate from the verified functional source above. Working tree kept clean.

# November 27 — Owner-only Firebase OAuth diagnostic implemented; NOT deployed/run

Owner approved repository implementation/tests only; no Google execution, deployment,
credential/IAM/billing changes or sends. Resumed clean e893ee8 matching remote.
Implemented GET/POST /api/admin/firebase-oauth and Operations component. Server requires
active admin AND server-configured owner, rechecks under profile lock before allowance.
POST strict confirmOAuthOnly:true, no custom query/credential/URL/project inputs. Requires
private staging, public/private ordering OFF, push OFF, payouts/retention OFF, provisional
postal mode and Stripe TEST key/mode. Exact approved project/account identity bound to
rocoeats-3bd55 / dedicated rocoeats-staging-fcm; broader SDK account rejected locally.

Existing FCM fixed-origin OAuth exchange shared without invoking send path. Diagnostic
calls only https://oauth2.googleapis.com/token with firebase.messaging scope, rejects
redirects, bounds HTTP AND body processing to10s, sanitizes all provider/parser errors.
No token/JWT/key returned/logged/persisted; token reference dropped, diagnostic does not
populate send-path cache. Production sender keeps existing scoped cache behavior.

Existing request_limits table enforces global one-per10min on DB clock across replicas/
restarts; allowance + sanitized audit-start commit BEFORE external call. Result audit
contains bool/constant code only; status GET recovers completed/unconfirmed outcomes
without OAuth. No migration/new env flag, no network transaction held under DB lock.
UI visible to superAdministrator only; explicit checkbox/button; no credential field,
no automatic POST/retry/refocus execution. Lost response uses GET recovery; no duplicate
OAuth. Existing notification/financial/device records untouched by diagnostic.

Validation: full API280 PASS/1 PostgreSQL-only SKIP/0 failures, including new relational
owner/nonowner/inactive/gate/input/concurrency/rate/audit/privacy tests. FCM13 unit tests
PASS with synthetic keys/mock OAuth and local redirect servers; verifies exact scope/
identity, wrong account, errors, HTTP/body stalls, no FCM message calls or token cache.
API/UI typechecks and production builds PASS; existing vendor/bundle warnings only.
Browser suite PASS including390px OAuth confirmation/no-key-input/GET-refresh/lost-
response scenarios and existing account/CSP/signup/checkout/session regressions, mocked
Clerk/API only. No live-provider acceptance. Native/GPS/90s/signing source unchanged;
no new APK needed. No hosted data/settings touched. Exact-source CI now passed; see verified release entry above.

Next: STOP for separate owner deployment approval of the verified source above. Existing Render manual exact-commit release only after
approval; no env changes/migrations. Verify23 read-only checks after owner Live; Operations
GET diagnostics ready does NOT call Google. One explicit OAuth-only run needs separate
owner authorization (may include sanitized audit entry); push gate remains OFF. Google
OAuth success proves credential acceptance only, NOT FCM permission or physical receipt.
Current deployedff73741 remains verified23/23; accepted Android/GPS behavior preserved.

# November 27 — FCM credential-validation release deployed and verified

OWNER: Render deployment succeeded/Live, approved exact source
ff73741bb7a5e3ffcb0985b02d2355bb1fd99f48. Authenticated Operations labels observed:
Provider push sendingdisabled; Android credentials locally valid/provider delivery
unverified; iOS sandbox configurationrequired; checkout retentiondisabled; test
payoutsdisabled. Owner pressed no Verify/Retry/send controls. These protected labels
are OWNER-OBSERVED, not agent private-session inspection. No credential received.

INDEPENDENT: existing23 GET/OPTIONS staging checks ALL PASS at
2026-11-27T07:40:19.980Z; exact deployed SHA matches. DB/auth configuration/pricing/
webhook/workers/native contracts/security headers/proxy checks ready. Public/private
ordering, live charges, test payouts, retention and municipal enforcement OFF. Evidence:
docs/verification/STAGING_HTTP_2026-11-27_ff73741.json. No provider transactions or
private-session/physical workflow acceptance claimed. Existing providerConfigured
readiness flag refers to Stripe, not Firebase authentication. No redeployment made.

LOCAL Firebase validation is now owner-observed on hosted code: JSON/schema/RSA key
can be parsed. Google OAuth credential acceptance, effective FCM project permissions,
provider receipt and actual Android OS notification delivery remain UNVERIFIED.
Code inspection confirms no separate deployed OAuth-only owner diagnostic; the current
OAuth exchange is inside the send path. Do not invoke send just to test credentials.
Do not instruct use of Stripe Verify, notification Retry or an invented UI button.

Safest next ENGINEERING step: prepare/test an owner-only manual OAuth-only diagnostic
in existing Operations architecture, returning sanitized success/error/time only,
never a token/key/JWT/provider body. Use existing fixed Google OAuth URL and narrow
firebase.messaging scope; no message endpoint, enrollment, financial write or gate
activation. Require active server-configured owner, strict session authorization,
private staging and closed gates, bounded timeout/rate limit, no automatic GET/load/
retry execution. Record sanitized audit outcome if implemented. OAuth success would
prove Google authenticates the key, NOT FCM send permission/project match/device receipt.
Any later FCM validate_only API check is a DIFFERENT separately authorized provider
operation, and still not device receipt; do not use fabricated tokens as acceptance.
References: https://firebase.google.com/docs/cloud-messaging/send/v1-api and
https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send.

Next OWNER ACTION after concrete diagnostic implementation/tests: separate approval
for its exact-SHA deployment and explicit one-time OAuth-only execution. Current
approval does not permit another deploy, provider call, key/Render/IAM/billing change,
push enablement or financial operation. No action needed on phone in this turn.
This turn changes documentation/evidence only; no runtime edits/tests or repeated
accepted GPS tests. Customer257/Driver258 artifacts and Driver GPS/90s preserved.
Resumed clean678ba0d matching remote. Stop after recording read-only release results.

# November 27 — Controlled FCM release preflight passed; owner Render action required

Owner authorizes ONE existing staging-service deployment to apply saved server JSON;
no sends, other environment/IAM/billing/key changes, financial operations or app release.
Frozen deployment candidate: ff73741bb7a5e3ffcb0985b02d2355bb1fd99f48, verified remote
HEAD at preflight. All3 exact-SHA CI SUCCESS45958115214(native)/45958115212(PR Validate)/
45958109416(push Validate). Functional4ed3aae credential validation is an ancestor;
subsequent commits through candidate are docs-only. No new migrations, Dockerfile or
startup changes vs current644e038; existing Android/GPS/90s contracts unchanged.

Live read-only verifier:23/23 PASS, observed2026-11-27T07:26:21.405Z, deployed still
644e038b4532936a6db2e954e34a8bf558166c24. DB/auth/pricing/worker/webhook/native/CSP/HSTS/
proxy readiness PASS; public/private ordering, live charges, payouts, retention and
municipal enforcement OFF. Sanitized evidence:
docs/verification/STAGING_HTTP_2026-11-27_644e038_PREFLIGHT.json.
This is PRE-deployment evidence, not release verification. Public providerConfigured
refers to Stripe setup, NOT FCM authentication. Public readiness does not expose push
sending; authenticated owner confirmation requested, no reply at checkpoint. Prior
owner says OFF/only JSON saved; do not present this as independently observed live gate.

Deployment NOT performed: no Render connector, CLI or authenticated dashboard capability
available. No credential workarounds attempted. Exact Samsung procedure saved at top
of PRIVATE_TEST_DELIVERY.md. Owner must view Operations provider push sendingdisabled
before using Manual Deploy -> Deploy a specific commit -> FULL ff73741 SHA. If gate
not disabled, checks fail or rollback artifact absent, stop/report; do not edit settings.
Do NOT deploy newer checkpoint/documentation HEAD or restart/Save-and-deploy instead.
After owner reports Live, rerun23 read-only checks EXPECTING ff73741 and ask only for
sanitized Operations androidCredentialStatus/Provider push sending labels. No Verify,
Retry or send. Local credential validity is not Google OAuth/IAM/provider acceptance.

Rollback PROCEDURE identified, not executed/automatically authorized: existing service
Deploys -> retained successful644e038 deployment -> Rollback -> confirm exact target.
Render reuses target build/service-specific env snapshot for that rollback; current
saved settings are not overwritten and future standard deploys reuse current settings.
Database records are not rolled back; no DB restore/migration reversal needed here.
Old-SHA fresh deployment is NOT equivalent to rollback of environment snapshot. Confirm
retained artifact in owner dashboard before release; if absent stop/report, no rebuild
workaround with current credential. No additional deployment under this one-release
approval without confirming scope. Reference https://render.com/docs/rollbacks.

Credential storage is owner-confirmed only, not read by agent; active FCM status and
Google authentication unverified pending release/approved diagnostics. No native APK
rebuild/GPS retest requested. This checkpoint changes docs/evidence only; deployment
remains pinned to ff73741, not this newer docs commit. Stop at owner-session boundary.

# November 27 — FCM credential stored with Save only (owner confirmed)

Owner reports FIREBASE_SERVICE_ACCOUNT_JSON saved in existing Render staging service
using Save only; no deployment started. Storage-only approval is fulfilled. Agent has
not received/read credential/file/contents or independently inspected protected Render.
Do not repeat key generation or credential entry. Running process has not applied this
saved value; provider authentication/IAM/receipt remain unverified. No sends performed.
NEXT BOUNDARY: separate explicit approval for an exact-SHA staging deployment, then
read-only source/health/local-credential/closed-gate checks. Do not restart, deploy,
change other settings, enroll devices or send under the storage-only authorization.
All push/ordering/live-charge/payout/retention/municipal safeguards unchanged; Stripe
TEST. Existing Android artifacts and accepted Driver GPS/90s preserved. No code change;
documentation diff checked. Resumed clean087c0cd matching remote. Stop awaiting release
authorization; never ask owner to share the key in chat or a screenshot.

# November 27 — Protected Render storage-only step approved, not completed

Owner authorizes storing the ONE existing dedicated sender JSON in existing Render
service variable FIREBASE_SERVICE_ACCOUNT_JSON only. No other variable, deployment,
restart, new key, IAM/billing change or provider send authorized. Source fcm.ts expects
complete raw service_account JSON with project/email/RSA private key, not filename,
base64, client JSON or an outer quoted JSON string. Never receive contents in chat.
Render official environment docs confirm Save only stores without deploy; running
service will not use the value until a later deployment. Owner must inspect dropdown
BEFORE entry and select exact Save only; if unavailable/unclear, STOP without saving.
No Render access/change performed by agent; storage completion awaits owner report.
Next stage after owner confirms Save only: separately approved exact-SHA deployment
and read-only verification, with push OFF. No credential/provider acceptance claimed.
Existing build/GPS/90s and all safeguards unchanged; no runtime edits/tests needed.
Reference: https://render.com/docs/configure-environment-variables (Nov27 reviewed).

# November 27 — One dedicated FCM key downloaded (owner confirmed)

Under explicit single-key generation/download approval, owner reports exactly ONE
JSON key created for rocoeats-staging-fcm in rocoeats-3bd55 and securely retained on
Samsung. No key/file/ID/contents supplied to agent, chat or Git; no independent key
validation/provider acceptance claimed. Do not generate another key or request upload.
No Render entry/save/deploy, IAM/billing changes, enrollment or sends authorized.
STOP: await separate explicit protected Render configuration/deployment authorization.
Keep key private locally; preserve push OFF, all ordering/financial/retention/municipal
gates, Spark, Android artifacts and accepted Driver GPS/90s. No hosted action performed.
Resumed clean remote2a06d02; all3 exact-SHA CI now SUCCESS. Functional4ed3aae also
all3 CI SUCCESS. This update is documentation-only, diff checked; no redundant tests.
Next stage must specify existing Render service, FIREBASE_SERVICE_ACCOUNT_JSON,
approved full source and safe save/deployment sequence; never key contents in chat.

# November 27 — FCM auth options reviewed; local credential readiness corrected

Recovered clean remote/HEAD586d923fb8ce2ce131b0e3198e9303ed08be04fe. All three exact
CI runs SUCCESS45578085479 /45578085298 /45578075878. No unfinished work found in
active tree. Firebase owner evidence preserved: V1 enabled, dedicated
rocoeats-staging-fcm has ONLY FCM API Admin, no server key/Render changes/sends.
Customer257/Driver258 configured signed artifacts preserved; no rebuild or GPS retest.

Official Render docs reviewed: managed GCP OIDC requires Pro WORKSPACE or higher.
Free service instance does not establish workspace plan. Keyless WIF is preferable
if already available, but requires scoped trust/IAM/API/Render changes plus backend
ADC support (currently absent). No upgrade/billing or auth infrastructure changes
made. Current supported alternative: single dedicated sender RSA key, later exchanged
for short-lived scoped OAuth tokens; private key remains long-lived/revocable and must
not enter chat/Git/client APKs. Exact Samsung conditional procedure, key risks and
approval boundaries in docs/PRIVATE_TEST_DELIVERY.md, November27 auth decision.
OWNER NOW CONFIRMS workspace plan Hobby (view only). Managed OIDC is not available
under current no-upgrade constraints. Do not repeat plan/IAM/V1 checks. Supported
fallback is one dedicated sender JSON key, still NOT authorized to generate/download.
NEXT OWNER APPROVAL: create/download ONE JSON key for rocoeats-staging-fcm only,
with existing FCM-only role; no existing account/IAM/Render/deploy/send changes.
Samsung procedure is saved in PRIVATE_TEST_DELIVERY.md; Render entry/deployment,
enrollment and provider sends remain separately approval-gated. No billing upgrade.

Confirmed software defect: Android configured was true for any nonempty credential,
even malformed JSON. Fixed shared FCM parsing with generic sanitized errors; readiness
checks JSON/type/project/email/RSA locally and exposes only missing/invalid/locally_valid
status. Cached by credential hash; changes/removal invalidate visible readiness. No
OAuth/network call from inspection. Operations distinguishes local validity from real
provider acceptance, with old-backend compatibility. Invalid config is not eligible
for Android worker claims. Send gate remains exacttrue/defaultOFF; simulated in-flight
ACK preservation and pending-attempt protection still pass. No authorization changes.

Validation: FCM9 tests PASS (synthetic RSA/EC, malformed/null/array/client JSON,
no-network guarantee, rotation/removal, OAuth/cache/redirect/expiry/ACK safeguards).
Full local API suite275 PASS/1 PostgreSQL-only SKIP, zero failures; includes relational
push gate/token/worker/ledger/role regressions. Initial restricted run hit sandbox
localhost EPERM; permitted local-server rerun passed, no production/provider access.
API/UI typechecks and both production builds PASS (existing nonblocking vendor/
bundle warnings). Existing browser account/signup/homepage/CSP/session/checkout-race
regressions PASS with local mocked Clerk/API; not provider/physical acceptance.
Functional commit4ed3aaea8a25af8e39d9c303b1c2fd2f4d9b851d ALL THREE CI SUCCESS:
45954195139 (PR Validate),45954186752 (push Validate),45954195052 (native). Android
Customer/Driver and iOS Customer/Driver compilation succeeded; signed packaging/device
acceptance is separate. No new install artifact requested. This follow-up only records
CI/owner plan evidence; its documentation CI must not be assumed passed.
No migrations or native source/signing changes. Backend/UI fix requires separately
approved Render deployment to take effect; no deployment done/requested as automatic.
All public/private ordering, push sends, live charges/payouts, retention, municipal
safeguards unchanged/closed; Stripe TEST. Driver240 GPS and server90s unchanged.
Next engineering action after scoped key approval: provide the saved dedicated-account
Samsung JSON download steps, then stop before Render entry/deployment. No credential
contents in chat. No safe need to rewrite auth for unavailable paid OIDC or rebuild
accepted apps. Code is ready for separately approved backend deployment; none done.

# November 25 — Dedicated staging FCM account created (owner confirmed)

Owner completed the explicitly approved account/role setup in rocoeats-3bd55:
rocoeats-staging-fcm exists with single assigned role Firebase Cloud Messaging API
Admin (roles/firebasecloudmessaging.admin). No additional roles assigned, no keys or
credentials generated. No Render configuration changes/deployments or sends made.
This is owner-observed IAM evidence, not independent provider authentication/receipt.
FCM V1 previously confirmed enabled; Spark preserved. Existing SDK/owner IAM unchanged.

Next protected boundary: separate explicit owner approval is required BEFORE any
service-account key generation/download, followed by separately approved Render
credential entry/deployment. Do not create/read/request keys in chat, enable sends,
enroll devices or initiate provider/financial operations. Existing procedure remains
in docs/PRIVATE_TEST_DELIVERY.md; account creation instructions are now completed.
Push delivery OFF; ordering/live charges/payouts/retention/municipal safeguards unchanged.
Customer257/Driver258 artifacts preserved, along with existing physical acceptance
scope, Driver240 GPS and 90-second server expiry. No runtime code changes/tests;
documentation diff check only. Resumed clean fde974c; remote matched. Stop at this
approval boundary; do not repeat account/API checks or rebuild verified APKs.

# November 25 — Existing Firebase Admin SDK identity reviewed

OWNER-OBSERVED IAM in rocoeats-3bd55: Firebase Admin SDK service account has
Firebase Admin SDK Administrator Service Agent and Service Account Token Creator;
no separately listed Firebase Cloud Messaging API Admin role. Personal owner has
Owner (Legacy). View only; no accounts, roles, permissions or credentials changed.
Do not repeat this check. FCM HTTP V1 already confirmed ENABLED.

Assessment: absence of a named FCM role does NOT prove absence of inherited/broader
send permission. Existing account may be technically usable, but effective FCM
permission/key/provider acceptance is unverified. Its broad SDK/token privileges make
it a poor credential to export to Render for messaging alone. Leave its roles and
owner access intact. Prefer dedicated rocoeats-staging-fcm in the SAME project with
only Firebase Cloud Messaging API Admin (roles/firebasecloudmessaging.admin), no
Token Creator, service-agent role, Owner/Editor or broad Firebase Admin. Existing
backend signs with its own RSA key; Token Creator is not needed for this plan.

NEXT OWNER APPROVAL: create dedicated sender and grant that one project role ONLY.
Creation/IAM changes are not yet authorized; provide Samsung steps after approval.
No key generation, Render entry/deployment, enrollment or provider sends included.
Key creation/storage and any Render save/deploy remain separate protected actions.
No credentials generated/read/transmitted, provider calls or runtime changes. All
closed gates, Spark, APKs and accepted GPS/90s preserved. Documentation diff checked;
no redundant tests needed. Remote matched clean b15d7a6 at resume.
Reference: https://docs.cloud.google.com/iam/docs/roles-permissions/firebase
and https://firebase.google.com/docs/projects/iam/roles-predefined-product

# November 25 — Owner confirms FCM HTTP V1 enabled

OWNER-OBSERVED: Firebase Cloud Messaging API (V1) ENABLED in rocoeats-3bd55.
No settings changed or credentials generated. API enablement prerequisite is met;
this is not credential/provider-send/device-delivery acceptance. Do not recheck it.
Next owner action is VIEW ONLY: Google Cloud IAM for the same project; determine
whether a dedicated service account has Firebase Cloud Messaging API Admin
(roles/firebasecloudmessaging.admin), without broad Owner/Editor/Firebase Admin roles.
Report only whether such an account exists; no emails/IDs/keys needed. Do not create
accounts/keys, change roles, enter Render values, deploy or send. Subsequent account/
key creation and Render setup require separate approval. Existing APKs, physical
acceptance scope, Driver GPS/90s and all closed safeguards preserved. Documentation
only; diff check, no redundant runtime tests. Resumed clean at abc3fe2; remote matched.

# November 25 — FCM server requirements verified; planning-only boundary

Owner approved server credential setup PLANNING, not key/account/IAM/API creation,
Render secret entry/save/deployment or sends. Read source fcm.ts/push.ts and official
Google FCM v1/IAM docs. One SERVER JSON for rocoeats-3bd55 serves both Android apps;
FIREBASE_SERVICE_ACCOUNT_JSON requires service_account/project/email/RSA private key.
Recommend dedicated staging sender with roles/firebasecloudmessaging.admin (send
permission cloudmessaging.messages.create), no Owner/Editor/broad Firebase Admin.
Operations configured flag only checks credential presence; not provider acceptance.
Exact protected procedure and references added to docs/PRIVATE_TEST_DELIVERY.md.

Next owner action VIEW ONLY: Firebase project settings -> Cloud Messaging -> report
V1 Enabled/Disabled/Not shown; Service accounts -> inspect whether dedicated FCM-only
sender exists. No keys/JSON/account identifiers in chat; no Generate key or IAM/API
changes. Later account/key creation AND Render entry/deployment require explicit
approval. Push OFF and all financial/ordering/retention/municipal safeguards unchanged.
No runtime edits/tests/provider requests; documentation diff validation only. Configured
Customer257/Driver258 build evidence preserved; physical acceptance of these versions
not established by builds. Driver240 GPS/90s and Customer208 tested scope preserved.
Remote clean9cb3de4 matched at resume; its three CI still running at the one inspection.
Next independent engineering action after owner read-only result: finalize least-
privilege setup instructions for actual existing account/API state, before requesting
protected creation/Render approval. Do not rebuild APKs/repeat accepted GPS tests.

# November 25 — Firebase client-configured signed APKs verified

Owner confirmed both protected repository CLIENT secrets saved. Secret metadata listing
was unavailable (GitHub integration 403); no values were read through GitHub/chat.
The existing protected runner instead successfully validated both client JSONs, same
project/number and exact audience packages before packaging. Owner-confirmed project
rocoeats-3bd55 remains Spark; no server credentials or hosted settings changed.

Exact source: d6da55caa16720ca9ae618629c4521914786520a. All three required source CI
runs succeeded: 45571097802 (push Validate), 45571105737 (PR Validate), 45571105688
(native compile). Signed staging workflow_dispatch builds both SUCCESS:
- Customer v257: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/45572507792
  Artifact RoCoEats-Android-Staging-Test-APK (15002014876).
- Driver v258: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/45572513366
  Artifact RoCoEats-Driver-Android-Staging-Test-APK (15002144004).

Both build/Android lint/native preflight/package checks passed. Driver native ACK lease
regressions passed. Temporary signing/client configuration cleanup succeeded. Independent
static artifact checks passed: GitHub ZIP digest, APK SHA256, exact source/package,
compiled version, manifest security policy, existing pinned signing certificate and
compiled rocoeats-3bd55 resources. BUILD_READINESS reports Firebase client resources
configured and verified True; Driver APK contains native duty/Clerk implementation.
No APK was launched, no device enrolled, no provider lookup/send or financial operation
performed. Actual FCM delivery is NOT verified. Client keys/config were not printed or
committed. Both APKs use existing package/certificate for updates; no uninstall needed.
Driver240's physical GPS/90-second expiry acceptance remains valid, not repeated; new
builds are statically/build verified, not physically accepted. No runtime source change.

NEXT PROTECTED OWNER STEP: separately approve Firebase SERVER setup in existing Render
with push gate still OFF. Only then guide Firebase Project settings -> Service accounts
-> protected server-key creation for SAME project, private Render
FIREBASE_SERVICE_ACCOUNT_JSON entry, and explicitly approved deployment sequence.
Never put server JSON in either client secret/APK/chat/Git. Do not perform this step
under client-build authorization. Keep ROCOEATS_PUSH_DELIVERY_ENABLED absent/false.
Device enrollment, nonfinancial notification test records and real sends require scoped
approval AFTER server setup and closed-gate verification. No new GPS test requested.
All ordering/live-charge/payout/retention/municipal safeguards unchanged; Stripe TEST.
Render remains 644e038; these packaging/docs changes require no backend deployment.
Stop at this protected boundary to preserve limited weekly usage. Next engineering
session can use these exact configured artifacts, not rebuild them unnecessarily.

# November25 — Both Firebase Android apps registered; protected client secrets next

OWNER CONFIRMED: existing projectrocoeats-3bd55 (RoCoEats), Spark No-cost; both apps
registered:com.rocoeats.app.staging (Customer),com.rocoeats.driver.staging (Driver).
Separate google-services.json files downloaded to owner's Samsung. Agent has not
received/read any file or key. No Server credentials, sends or hosted changes made.
This supersedes pending Android-registration instructions below; do NOT repeat them.

Next owner-only step: GitHub pcorey922-bit/LocalEats-Delivery-App -> Settings ->
Secrets and variables -> Actions -> New repository secret. Privately copy COMPLETE
Customer CLIENT JSON into ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON; complete
Driver CLIENT JSON into ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON. Raw JSON,
not filename/base64. Check package/project locally before choosing each file. Never
paste/upload contents in chat or commit files. SERVER service-account JSON does NOT
belong in these secrets; do not generate server private keys/change signing secrets.
Report only both secret names saved. If phone cannot view/copy JSON privately, ask
for safe phone-only help; do not use public JSON viewers or chat uploads.

Then engineering may inspect secret NAME presence only, run existing strict pairing /
package validation in protected runner and prepare configured signed staging APKs
with exact-source CI/certificate/resource verification. Do not produce another
unconfigured APK or claim provider/device receipt from compilation. No source change
needed now; current validated preparation already exists. Keep Spark, no card/Blaze.
Render SERVER credentials, environment deployments, native enrollment/test records
and actual sends still need specific authorization. GateOFF and all financial/
ordering/retention/municipal safeguards preserved. Driver240 GPS/90s unchanged; no
GPS retest. Current step is owner-console/secret-input blocked, preserve limited usage.

# November25 — Owner confirms Firebase project/Spark; Android registration is next

OWNER-OBSERVED: RoCoEats Firebase project successfully created; Spark No-cost$0/month
verified in Console, no billing account/payment method. No Android/iOS app registrations,
provider credentials or sends configured at that report. Agent made no external changes.
This supersedes earlier "no project"/awaiting project confirmation instructions.

Repo resumed clean6d719a4577848056cd71bc9c5e67d2680e995268, remote matched. Functional
5b4a2bf client-pair safeguard already has8 targeted tests/types/all3 CI PASS. No new
runtime defect or independently useful build is established before actual client
configuration exists. Do not rerun passing GPS/staging tests or build unconfigured APKs.

NEXT OWNER ACTION (Samsung): Firebase RoCoEats -> gear Project settings -> General ->
Your apps -> Add app -> Android. Registercom.rocoeats.app.staging, nicknameRoCoEats
Customer Staging; SHA certificate field optional for FCM, leave blank. Download its
google-services.json and keep privately identified as customer file. Continue wizard
without installing/editing SDK code on phone. Repeat IN SAME PROJECT for
com.rocoeats.driver.staging, nicknameRoCoEats Driver Staging; keep its JSON separately
as driver file. Report only both registered/downloaded; do not paste/upload JSON here.
These client registrations do not configure Render or authorize sends. iOS apps,
App Check enforcement, Firebase Auth and billing upgrades are not part of this step.

Then guide protected per-audience GitHub CLIENT JSON steps from saved handoff; no
SERVER service-account keys in client secrets/APKs. Render SERVER credentials and
any deployment still need specific approval. Keep push deliveryOFF; device enrollment,
support test records and actual sends need scoped approval. No keys in chat. Native
Driver240 physical GPS/90s and Customer208 acceptance preserved; deployed644e038
last verified23/23, all other ordering/financial/retention/municipal gatesOFF/StripeTEST.
This turn only records evidence and exact phone action. Stop at genuine owner-console
blocker; do not start another speculative code task within limited weekly usage.

# November25 — Verified limited-usage checkpoint; owner Spark project confirmation next

Functional packaging safeguard5b4a2bf8fe38d4f777d2d4f54314ea3bfbc9a74a ALL THREE CI
SUCCESS45567474700 /45567486014 /45567486041.8 targeted Firebase/native-config tests
and scripts typecheck PASS. Prior00b5a58 native45351629085 recovered SUCCESS on ONE
failed-job-only retry after Maven429; its two Validate runs already passed. No
supply-chain/workflow workaround or native/GPS change introduced.

Owner viewed Firebase Console on Samsung: NO existing RoCoEats project ("Get started
by setting up a Firebase project"); no plan/project/credentials changed at that check.
Owner approved necessary Spark setup PLANNING and requested exact phone creation
steps. Delivered: Create project -> RoCoEats -> keep generated project ID -> optional
Analytics/AI OFF -> no billing/card/Blaze -> Create -> confirm Spark/Free. STOP if a
payment/billing step is required. Await owner's project-created/Spark confirmation;
do not assume creation occurred. Agent created no account/project/app/key.

NEXT OWNER ACTION: create/confirm free project following those steps; report only
ready/Spark (no keys). After that, guide exact Android package registration and
protected CLIENT JSON steps in existing November24 handoff, with authorization
boundaries preserved. Do not touch Render/provider SERVER JSON or redeploy until
separately approved. Sending staysOFF; actual device enrollment/test support records
and sends still need scoped approval. Free-plan/backend-project/provider receipt are
NOT established by the offline client comparison. No configured APK can be built
until real protected client inputs are supplied; do not build another unconfigured
APK or repeat accepted GPS/customer tests.

This final update is documentation-only. Working tree was clean after functional
commit. New documentation CI may run independently; functional source CI above is
verified. No hosted/provider/financial operation, billing, credentials, deployment,
merge/publish or GPS/90s modification. Preserve644e038 verified staging and accepted
Driver240. Prudent limited-weekly-usage stopping point; resume from this checkpoint.

# November25 — Limited-usage Firebase packaging objective completed

Resumed clean00b5a58aab36b67cc306c0c9e49e86cd60b93030; remote matched. Previous
checkpoint Validate push/PR PASS45351622742/45351629117; Native45351629085 FAILED
customer dependency resolution (Maven Central HTTP429, no compilation failure).
Inspected exact job138299220269; retried ONLY failed job once. Retry pending at save;
do not claim success or repeatedly rerun known transport failures. No runtime rollback.

SMALL CHANGE: existing prepare-firebase-android packaging CLI now compares BOTH
provided Customer/Driver configs before writing any file. Requires same Firebase
project ID AND project number because both apps share one existing server sender.
Independent/absent audience setup preserved; different valid app API keys permitted.
Strict existing package/secret validation unchanged, no values logged.8 targeted
Firebase/native-config tests PASS, including real CLI in isolated temporary workspace
rejecting mismatch with no client file/CI metadata written. Scripts typecheck PASS;
diff whitespace PASS. Current exact-source CI must finish before release readiness.
No APK/new service/account/provider lookup/credentials/Render/signing/GPS change.

NEXT OWNER-ONLY ACTION remains protected Firebase Spark setup authorization per
numbered November24 handoff below. User authorized safe repository preparation, NOT
external account actions/hosted credentials/sends. Keep gateOFF. After approval,
phone Firebase Console -> approved FREE Spark project -> add exact staging Android
packages -> private per-audience GitHub CLIENT JSON. SERVER JSON remains Render-only
and needs separate approval/environment-deployment review. Never keys in chat.
Check actual Spark plan/backend service-account project separately: this offline
client-pair comparison does NOT establish billing plan or provider acceptance.
Preserve644e038 verified23/23 staging and Driver240 physical GPS/90s. No repeated
GPS or healthy staging checks needed. Prudent limited-usage stop after CI/checkpoint;
do not start another multi-stage change. CI pending is not a pass.

# USAGE RESET HANDOFF — November24: STOP after saving this checkpoint

Owner requested preservation ONLY; do not begin Firebase implementation/setup now.
Remote/local were clean and matchedd96e6df50f1a495ae47535f5a2d59a551b5078fd before
this documentation update. ALL THREE d96 CI SUCCESS45350118218 /45350127472 /
45350127463. No unfinished runtime changes/worktree work to recover. Functional
source644e038b4532936a6db2e954e34a8bf558166c24 already pushed, ALL THREE targetCI
passed, OWNER DEPLOYED and independently verified23/23 at2026-11-24T07:39:49Z.
Evidence: docs/verification/STAGING_HTTP_2026-11-24_644e038.json. Earlier evidence
preserved. Do NOT redeploy, rerun those checks or repeat Driver240/Customer208
acceptance without a new reason. Driver240 Samsung5min screen-lock/GPS/offline /
restart accepted; native implementation/90s unchanged. No replacement APK built.

RESUME EXACTLY HERE after reset:
1. Fetch current remote branch, read this head/checkpoint and inspect status once.
   Preserve any newer work. Verify new documentation CI once if still pending;
   the functional/deployed644 source CI is already SUCCESS. PR1 remains draft.
2. FIRST OWNER-ONLY STEP: request explicit protected Firebase setup authorization.
   Current deployment approval does NOT authorize account/project creation, hosted
   credentials, server redeployment, sends or test support records. Never ask for
   secret values in chat. User works Samsung Chrome only; no laptop/terminal.
3. After scoped approval, owner opens Firebase Console with existing Google account;
   reuse existing appropriate project or create FREE Spark project ONLY if approved.
   No card, billing, paid upgrade, Analytics/Firestore/Storage requirement or expense.
   Project Settings -> General -> Add app -> Android, separately register
   com.rocoeats.app.staging and com.rocoeats.driver.staging in SAME project.
   Download each matching google-services.json; do not change Clerk identities or
   Android signing. Existing pinned staging signer must remain unchanged.
4. Owner privately enters complete matching CLIENT JSON into GitHub repo -> Settings
   -> Secrets and variables -> Actions -> repository secrets:
   ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON and
   ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON. Ordinary JSON, not base64. Never
   upload server service-account/private key into either client secret, Git, chat or
   an APK. Engineering can check secret NAME presence/build reports, not read values.
5. With approved protected inputs, use existing prepare-firebase-android.mjs /
   verify-native-push-config.mjs and native-validation.yml targetstaging per audience.
   Verify exact build source/CI/package/client resources/digests/existing certificate.
   Do not rebuild unconfigured APKs merely to consume time. Keep installed Driver240
   until meaningful configured updates are ready; no GPS retest requested.
6. SERVER INPUT is another protected owner action: Firebase Project Settings ->
   Service accounts -> private service-account key for SAME project with required
   FCM send permission; only after authorization. Full SERVER JSON belongs ONLY in
   Render protected FIREBASE_SERVICE_ACCOUNT_JSON. Keep
   ROCOEATS_PUSH_DELIVERY_ENABLED absent/false. No key/token contents in chat/logs/Git.
   Adding Render credentials and any environment-triggered deployment require separate
   approval. Review Render save choices first; do not let Save-and-deploy accidentally
   deploy newer docs HEAD. Pin the explicitly approved full source when redeploying.
   This has NOT been performed; do not infer provider connection from configuration.
7. After protected setup, verify closed gates/current source and distinguish valid
   client resources, server config, enrollment, provider ACK and actual device receipt.
   Native enrollment itself is a hosted record change: obtain appropriate scoped test
   approval before owner performs it. New token recovery needs explicit current-app
   consent; it must not auto-enroll another account or override opt-out.
8. Real sends remain separately unauthorized. Only after explicit controlled-window
   AND nonfinancial test-record approval follow existing PRIVATE_TEST_DELIVERY.md
   notification-only orderless Support exercise. No new order/payment/refund/
   reconciliation. Five-minute alert lifetime stays enforced; no timestamp resets.
   Android Force stop blocks push until relaunch, unlike ordinary background/task
   dismissal. Disable sends afterward, confirm gateOFF and preserve evidence.

DEFERRED/OWNER-ONLY: actual FCM receipt; APNs sandbox credentials, Apple signing/team/
provisioning and physical iOS device. Do not purchase memberships/services, publish,
merge PR1 or change signing. Financial provider acceptance and geographic activation
remain separate. No need to invent more runtime refinements while protected inputs
are missing; existing notification software corrections and tests are completed.

SAFETY STATE: public/private orderingOFF, live charges/payoutsOFF, retentionOFF,
municipalOFF, StripeTEST. Owner authenticated Operations confirms pushsendOFF and
both providersconfigurationrequired. No new credentials/configuration, provider
call/send, financial operation, deployment, database change or native/GPS modification
in this checkpoint. Stop after documentation is committed/pushed; no redundant tests
for this documentation-only handoff. Final documentation CI may run independently;
report pending honestly rather than waiting/polling through remaining usage.

# November24 —644e038 staging VERIFIED; protected Firebase setup is next owner action

Owner manually deployed644e038b4532936a6db2e954e34a8bf558166c24, Render Deploy
succeeded/Live/source644e038. Independent existing23 read-only checks PASS at
2026-11-24T07:39:49.060Z: exactSHA, database/auth/pricing/webhook/worker ready, CSP/HSTS,
Clerk proxy origin protection, protected401 routes, native contracts/CORS, trusted
Render client identity. Public/private orderingOFF, liveChargesOFF, testPayoutsOFF,
checkout retentionOFF, municipal enforcementOFF. No failures/unverified safeguards in
that verifier. Sanitized evidence saved as
 docs/verification/STAGING_HTTP_2026-11-24_644e038.json; earlier8aa report retained.
Exact-source CI all3 SUCCESS45347493848 /45347500566 /45347500454. PR1 draft/unmerged.

OWNER-OBSERVED authenticated Operations evidence, Nov24 at2:37AM (timezone not
specified): provider push sendingDISABLED; Android pushconfigurationrequired;
iOS pushconfigurationrequired; test payoutsDISABLED; checkout payload retention
DISABLED; public orderingOFF/TEST MODE. The anonymous suite does NOT independently
inspect private provider credentials, enrolled devices or owner records. No new
owner check requested. No provider/financial transaction, retry, audit-writing verify
or hosted change performed by agent. Deployment performed by owner only.

Software-only notification readiness already completed/tested: disabled send gate,
strict FCM redirects/receipts, consent/account/app-bound stable-ID token refresh,
opt-out/timeout/error recovery and stale-provider-result fences. Current accepted
Driver240 GPS/native auth and90s expiry preserved. No new APK or GPS test requested.
Do not invent more runtime changes or repeat passed suites without a new defect.

NEXT OWNER ACTION: separately authorize protected ANDROID Firebase setup with
provider sendingOFF. Phone-only existing procedure in ANDROID_STAGING_TEST.md now
starts from VERIFIED deployed644e038 (no repeated deployment/migration required).
Use existing/free Spark project only; no billing/card/paid services. Owner privately
supplies matching customer/driver CLIENT JSON through their named GitHub Actions
secrets; SERVER service-account JSON belongs only in Render protected Environment.
No credential changes are currently authorized; never request/paste keys in chat.
After authorization and protected inputs, engineering validates source/configuration,
builds matching signed staging APKs and prepares the existing notification-only
support exercise. Actual sends/test support records remain separately unauthorized.
Signed physical iOS needs owner Apple signing/team/provisioning/device access; no
membership/publishing/paid-service change authorized. Financial provider acceptance
and geographic activation remain separate protected work. No current independent
runtime notification defect established after these corrections.

# November24 —644e038 notification release approved; manual deployment pending

Owner explicitly approved deployment of644e038b4532936a6db2e954e34a8bf558166c24 to
EXISTING Render staging, without provider sends/credentials/financial activation.
Exact remote branch membership verified; PR1 remainsOPEN/DRAFT into main. ALL THREE
required target CI SUCCESS: Validate push45347493848, PR45347500566,
Native45347500454 (both Android/iOS audiences). Local tree was clean before this
approval-only documentation update. No runtime code changed in this preparation.

Prerequisites reviewed against last verified live8aa903bdccbe1da30f7f5fcba8841019c29e5619:
NO changed database migration, Dockerfile, Render blueprint or staging startup scripts;
NO native Driver SDK/GPS/lease source or background-duty controller change. No new
migration or signing operation is required. Existing schema0029/recovery infrastructure
must be preserved. Driver240 physical GPS acceptance and90s expiry remain intact.
Installed240 need not be replaced for this backend deployment; future native token
refresh/client Firebase acceptance requires separately prepared configured APKs.

Manual owner action: existing LocalEats-Delivery-App -> Manual Deploy -> Deploy a
specific commit -> full644e038 SHA above -> wait Deploy succeeded/Live/source644e038.
Use SPECIFIC commit, not newer documentation HEAD or Deploy latest. Do not edit/save
Environment, add provider credentials or change any gate. The deployed defaultOFF
ROCOEATS_PUSH_DELIVERY_ENABLED remains absent/false. No new service/paid resource,
merge, secret/account/data change, provider send or financial action is approved.
After Live, owner may read Operations: Provider push sendingdisabled; both push
providersconfigurationrequired. Do NOT press Verify/Retry/financial controls.

NEXT ENGINEERING ACTION depends on owner Live confirmation: run
node scripts/verify-staging-http.mjs https://localeats-delivery-app.onrender.com/ 644e038b4532936a6db2e954e34a8bf558166c24
and inspect full23 check result, exactSHA/health/DB/auth/CSP/HSTS/native contracts /
public-private ordering/live/payout/retention/municipal gates. Distinguish owner-only
push-status evidence from anonymous checks. No post-deploy verification performed
for644e038 yet; last independently verified deployed revision remains8aa903b.
Protected Firebase/APNs inputs, real sends and physical iOS still require separate
owner authorization/access. Do not repeat physical GPS or invent unrelated tasks.

# November24 — Consent-bound token rotation and stale provider-result recovery

FCM correction10a90233256d0614b17dd4d640767abc8773e151 ALL THREE CI SUCCESS:
45344927146 /45344933446 /45344933525. Staging remains verified8aa903b; NO further
release/configuration/provider/financial operation authorized or performed.

CONFIRMED GAP: pinned Capacitor Android onNewToken emits registration events, but
existing registration listeners were removed after enrollment; no ongoing refresh
handler existed. Added foreground/current-event recovery for EXISTING enrollments
only. Requires explicit persisted consent in this client, current signed-in account,
server ownership proof, matching app/platform, granted permission, provider capability
and tokenRefreshVersion1. No prompt, auto-POST/enrollment, account/app transfer or new
credential. Legacy/unknown consent must explicitly Enable; opt-out is persistent and
immediately fences in-flight callbacks, including storage quota failure. Native errors
are actionable; positive canonical-ID ACK alone updates saved evidence. One-use manual
enrollment retains its existing behavior and cancels competing refresh work.

Server PUT existing-device endpoint preserves canonical ID and locks ownership, fails
404 for unknown/deleted/other account,409 for app change/token conflict, validates
platform/token and never resurrects opted-out enrollment. Worker now preserves a new
token when an old in-flight send reports invalid token; retries only within existing
five-attempt policy, never deletes the new registration or fabricates acceptance.
No schema migration. Device config has additive version capability; older backends
safely skip automatic refresh. Driver240 native GPS/auth/90s implementation unchanged.
This is foreground/event recovery; not proof of continuous background token upload
or real provider receipt while locked/terminated. Actual devices/providers remain
unverified until protected setup and controlled acceptance.

VALIDATION:9 pure controller cases PASS (Android/APNs, no consent/permission/config,
identity/opt-out/cancellation/timeout/late events, strict receipts, latest-event batching
and native errors). Local relational suite106PASS/1PG-onlySKIP, including wrong actor /
app/conflict/deleted ID and stale invalid-token ACK at attempts1 and5. Initial full
API run caught a TEST fixture actor typo (undefined otherCustomer ->401); corrected
to existing authenticated ids.other, preserving security checks; isolated relational
rerun passed. Other API units/8 FCM tests PASS. Workspace types, website/API builds,
existing background/push browsers PASS. Real local authorized API/native-SDK-mocked
browser PASS: stable rotation ID, persistent opt-out, explicit re-enrollment, error
recovery, quota-failure native/server opt-out and no late refresh. No provider sends.
Full real PostgreSQL/native exact-source CI pending this commit.

Next: commit/push and verify CI; then only approved releases/provider inputs should
advance actual notification acceptance. Existing PRIVATE_TEST_DELIVERY.md now prepares
an orderless/nonfinancial general-support alert exercise (separate send/record approval
required), distinguishing inbox/polling, provider ACK and actual device receipt.
Do not repeat accepted Driver240/Customer208 basics. Real FCM/APNs, signed physical
iOS, financial provider evidence and geographic activation remain protected blockers.

# November 24 — Push safeguard staging independently verified; FCM receipt/redirect repair

Owner deployed8aa903bdccbe1da30f7f5fcba8841019c29e5619, Render Live/source8aa903b.
Independent existing23 read-only HTTP checks PASS at2026-11-24T06:55:53Z: exactSHA,
DB/auth/pricing/webhook/worker readiness, correct Render client identity, native CORS /
contracts, CSP/HSTS, Clerk proxy origin protection, public/private orderingOFF,
liveChargesOFF, testPayoutsOFF, retentionOFF, municipal enforcementOFF. No failures /
unverified safeguards reported by that verifier. Saved sanitized report in
 docs/verification/STAGING_HTTP_2026-11-24.json. Anonymous checks do NOT prove private
accounts or a provider transaction. Owner separately observed authenticated Operations:
provider push sendingDISABLED, Android/iOS configurationrequired, payoutsDISABLED,
processed checkout retentionDISABLED, public orderingOFF/TEST MODE. No repeat of those
owner checks requested. No hosted settings/data/credentials/financial operation.

NEXT SOFTWARE CORRECTION (this commit, not deployed): reproduced two FCM unit failures:
fixed-host OAuth/message requests omitted redirect:error, and a2xx receipt containing
only projects/<project>/messages/ incorrectly counted as provider acceptance. Added
strict redirect refusal on BOTH stages, reject already-redirected injected responses,
and require a nonempty same-project message resource ID without extra path/query /
fragment/whitespace. No raw provider errors/credentials logged. Standard FCM IDs incl
colon/percent remain valid.8 focused tests PASS, including actual Node Fetch against
LOCAL307 mock server proving no request reaches redirect target. Synthetic generated
RSA/test credentials only; zero Google/provider lookups/sends. Types/API build required
before push; exact-source CI pending at this save. Driver240 native/GPS/90s unchanged.

NEXT independent investigation: existing SDK token-rotation registration lifecycle;
check whether refreshed tokens reach server outside the explicit enrollment window.
Do not alter accepted GPS, enable sends or create hosted records. Provider setup/
physical notification receipt and signed iOS still require protected owner inputs.
Before real sends, deploy any verified sender correction only with separate approval.

# November 24 — Push activation separated from credentials; native-session inbox verified

Physical acceptance evidence committed115d0a0c1ffa44e617776e93c6095f10530e0b0a;
ALL THREE CI SUCCESS45340405054 /45340412361 /45340412360. Driver240 GPS/session
implementation preserved; no new APK or repeat Samsung GPS test needed.

CONFIRMED SETUP GAP: production push worker previously treated provider credentials
as permission to send. Added `ROCOEATS_PUSH_DELIVERY_ENABLED`, defaultOFF, exacttrue
required BEFORE claiming another delivery. Configuration/device enrollment and in-app
notifications remain independent. Disabled gate preserves attempts/leases; exhausted
final-claim recovery remains possible without sends, and already-in-progress provider
acknowledgements still commit. Operations reports credential configuration separately
from sending status. Old backend status is explicitly unknown, not reported disabled.
Native push preferences explain sending disabled. No migration/credentials required.

INTEGRATION: existing local browser harness now models multiple App listeners (old
single-callback mock hid native-session refresh), correct app identity and native
principal checks. Real local API/DB inbox seeded only in isolated fixture; simulated
receive refreshes inbox, taps ignore arbitrary payload routes, foreground account
change clears old private inbox, signed-out taps cannot restore data. No permission
prompt/enrollment/provider send/hosted write. Native SDK/events still simulated.

VALIDATION: workspace types PASS; web/API production builds PASS (existing bundle-size
warning); isolated relational suite104PASS/1PostgreSQL-onlySKIP incl gate exact values,
credentials-without-consent, untouched attempts, gate-off final recovery and retained
in-flight simulated ACK. All other API unit suites PASS. Initial concurrent full test
hit120s platform runner cap and browser3s timing assertion under contention; reran
relational alone29s PASS (240s test-process ceiling, NO app timeout change), then
background/push browser, native session/inbox browser and native startup browser
serially PASS. Final native inbox/typecheck rerun PASS. Full real PostgreSQL/native
CI required on this commit; pending until exact GitHub conclusion.

DOCUMENTATION: .env example defaults gatefalse; existing deployment/phone provider
setup procedures corrected (0029 already deployed). Historical deployed76a24ed lacks
this gate: DO NOT add server push credentials until owner approves/deploys new release
or explicitly authorizes sends. Future provider setup / enabling delivery / actual
receipt require separate owner-controlled authorization; never secrets in chat.
Current work changes NO hosted setting/data/gates/providers; accepted240 retained.

NEXT: push, verify all exact-SHA CI; fix failures. Then owner-only prerequisite is an
approved staging release of this gate BEFORE protected Firebase/APNs setup; keep gate
OFF until controlled delivery authorization. No other confirmed independently missing
runtime feature identified in this focused pass. iOS signed physical acceptance,
provider financial evidence and geographic activation remain separately blocked;
do not repeat exhausted Geocodio or resolved native auth/GPS investigations.

# November 24 — Driver240 physical Samsung acceptance PASSED (owner evidence)

Owner tested signed Driver240/source83f228015f5725409c4cf1a111cbf57644f11b7e on
Samsung Galaxy S22 Ultra. This supersedes historical GPS-blocked/pending headings.
Observed: went online with explicit background sharing; server heartbeat acknowledgments
and accepted GPS advanced. Dispatch showed RoCoEats owner available, fresh location,
one approved driver online. Phone locked approximately5min WITHOUT reopening Driver.
After unlock, Chrome Dispatch refreshed BEFORE Driver: still available, accepted GPS
1:17:58AM, accuracy7m (times as owner reported; no timezone inferred). Reopening Driver
showed heartbeat1:19:03AM and acceptedGPS1:19:01AM. This provides physical evidence of
native duty continuity across screen lock, not merely foreground recovery.
Go offline produced Offline/background sharing disabled; Dispatch offline/location
not sharing/zero online; ongoing on-duty notification disappeared. Close/reopen restored
Driver workspace OFFLINE and did NOT restart sharing. No new account required.

ACCEPTED SCOPE: Android background GPS/screen-lock continuity, Dispatch visibility,
offline service/notification cleanup, session restoration and off-duty restart state
on this device/build/test interval. NOT blanket acceptance of prolonged duty, all
networks/devices/Android versions, real push, live dispatch offer receipt, full delivery
on240, iOS or commercial readiness. Preserve working native SDK/engine and90s server
expiry; do not repeat the resolved WebView authentication investigation.

Prior final checkpoint e1ce898ffbb5fe0529ac2827ffc5ce7991280be1 all3 CI SUCCESS:
45337863985/45337870880/45337870555. Source83f2280 all3 CI, signing45336250932 and
same-APK emulator45337189007 passed as recorded below. No new build needed for this
acceptance documentation. No hosted/data/provider/payment operation performed here.

NEXT ENGINEERING: verify native-session notification receive/tap/foreground/account
switch integration using existing local browser/API harness (provider/OS simulated),
without altering accepted runtime unless a defect is reproduced. Real Firebase/APNs
configuration and actual receipt remain owner-controlled blockers; no sends authorized.
Signed physical iOS and provider financial/geographic acceptance remain separate.
Customer208 accepted scope, all gates, recovery infrastructure and backup preserved.

# November 24 — Driver240 signed-out emulator PASS; Samsung action now required

APK source83f228015f5725409c4cf1a111cbf57644f11b7e: ALL THREE required CI PASS,
protected signing45336250932 PASS. Exact signed240 bytes tested after harness repair
6a3e517cc2fb85132eb008b2f4ded0d6c4a0a68b: emulator45337189007 SUCCESS,
evidence14894525928 reviewed (results.completed=true,10 passed checks, no native
crash, no business writes, no authenticated account). Signed-out Driver entry screenshot
reviewed; actual APK bundle native-auth gate is Android-native-only with migration ON.
Safe cold/malformed/authority-bearing deep links, navigation, force-stop/relaunch and
permission defaults verified. First attempt45336747590 exit137 remains a FAILED
capture attempt; repaired harness retry used SAME APK and retained capture evidence.
No app rebuild or pass-on-missing-UI workaround. Harness14 regression tests PASS;
required push Validate45337170293 PASS; PR Validate45337177119 and native45337177350
still running at this evidence save. Check final GitHub conclusions on resume.

DOWNLOAD: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/45336250932/artifacts/14893609422
Artifact RoCoEats-Driver-Android-Staging-Test-APK; install extracted
RoCoEats-Driver-Android-Staging-Test.apk as update, version240. Existing signature /
com.rocoeats.driver.staging unchanged. Full checksums/source evidence below.
No Render deployment/configuration/migration needed or performed. Backup remote still
6ce7714574cc17b00167ea7423bb25862b5fdefb; working branch only was modified.

OWNER NEXT: exact five-step procedure at TOP of docs/ANDROID_STAGING_TEST.md. One
browser approval may be needed for new native SDK session; preserve same account.
Reconnect, explicitly consent/enable background, wait advancing receipts/notification,
lock5min, inspect Chrome Dispatch BEFORE reopening Driver, then receipts. On failure
copy native diagnostic BEFORE reconnect/stop. Finally stop background, Go offline,
verify Dispatch then force-close/reopen (auth should restore; sharing stays OFF).
No ordering, payment, geocoding/provider notification send or hosted change needed.
Authenticated native-SDK renewal and physical background GPS remain UNVERIFIED;
never infer them from signed-out emulator or simulated SDK/HTTP/JS-absent tests.

NEXT INDEPENDENT TASK: finish outstanding exact-SHA CI. Functional Android repair and
signed-out integration are complete; any new physical finding must drive the next
correction. Real notification-provider setup/sends, signed physical iOS acceptance,
provider financial/reconciliation evidence and municipal activation remain protected
owner-controlled acceptance items, not permission to change configuration now.
Do not repeat Customer208 acceptance, exhausted Geocodio diagnostic or old Driver233.
Do not start speculative GPS/refactoring work while waiting for actual240 evidence.

# November 24 — Driver240 emulator capture interrupted; harness repair

Signed240/source83f2280 remains verified; NO app rebuild needed or performed.
Emulator45336747590 FAILED after successful installation and default-permission
checks. Before any UI evidence, uiautomator dump exited137; harness propagated
CalledProcessError immediately, results.completed=false, no app verdict/crash capture.
Do NOT describe this as app pass, app defect or established OOM. Evidence artifact
14894530165 preserved. No account/authentication/location/hosted business write.

Corrected existing harness to treat killed/timed-out OS capture as unavailable within
its existing bounded wait loop, with sanitized capture evidence and best-effort
screenshot. Always capture anonymous native-crash boolean even when early UI fails.
No retry of auth/business operations, softened UI assertions or pass-on-missing-XML.
14 APK-policy/capture regressions PASS, Python compile PASS. Next rerun same signed
240 bytes through repaired harness; inspect actual UI/native result before handoff.
Final source83f2280 all3 CI remains SUCCESS; docs294d4a3 pushed (docs CI separate).

# November 24 — Native Driver240 candidate verified; emulator pending

FUNCTIONAL SOURCE83f228015f5725409c4cf1a111cbf57644f11b7e ALL THREE CI SUCCESS:
Validate push45335478710 / PR45335489494, Native45335489509 (Customer+Driver Android
and iOS). Integrated10944ba also passed. Native API/HTTP adapters compiled against
actual pinned Clerk1.5/OkHttp jars locally (6 missing-annotation compiler-stub warnings).
No JS-dependent critical token/HTTP/ACK path remains in the Android native-owned mode.
Exact SDK/provider/physical background behavior is NOT established by those tests.

Protected signed Driver240 run45336250932 SUCCESS; artifact14893609422
RoCoEats-Driver-Android-Staging-Test-APK, packagecom.rocoeats.driver.staging,
compiled version240 /1.0-staging. SourceAPP_IDENTITY, GitHub ZIPdigest, APK checksum,
compiled manifest/security policy, existing protected signer and actual DEX native
ClerkSession/Plugin/SDK/NativeDutyHttpClient/NativeDutyEngine classes verified.
ZIP SHA25600ec1c53cc615a37543c1620e10bc6c73a144f73f76558056c30e1d78205eee8;
APK SHA256a84958b4d5e181c5064ad668bbf4a2c9b2ea541936d8bc62741d76c5c4bbd110.
Protected signerf22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296.
Signing/private service/permission/server-secret scans passed; Firebase remains
unconfigured. Temporary signing material cleanup succeeded. No hosted change.
Run/artifact: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/45336250932/artifacts/14893609422

Existing signed-out emulator smoke45336747590 IN PROGRESS on these exact signed
bytes. Do not claim pass until conclusion/evidence reviewed. Physical Samsung GPS
still BLOCKED. Updated existing docs/ANDROID_STAGING_TEST.md with one five-minute
screen-lock comparison, Chrome Dispatch BEFORE Driver foreground, diagnostic capture
before reconnect, stop/offline and restart checks. SDK migration can require one fresh
browser approval; repeated approval/blank/recovery is a fail. Existing Customer208
acceptance unchanged. No Render deployment/migration/config action required.

Read-only live native preflight PASS: HTTPS/native protocol/app callback, public Clerk
match, both native CORS origins, public/private ordering=false, liveCharges=false.
Initial workspace Node fetch failed; using required proxy resolved it. /livez200 and
public readiness confirmed. This endpoint does NOT independently expose all payout /
retention/municipal settings; no new authenticated verification or changed setting.

NEXT: review emulator result/diagnostics; fix actual failures before owner handoff.
Then owner-only240 physical test using linked procedure. Independently continue
software-only native acceptance; real push provider configuration/sends, iOS signed
physical acceptance and authorized financial/provider evidence remain separate blockers.
All financial records, recovery branch, backup branch, gates and PR1 preserved.

# November 24 — Native activation/logout race closed before signing

Integrated UI/native source10944ba881b45c688ce6784fa7372755b60e9dae pushed; exact CI
running at this checkpoint. Final focused review found a check/commit race in local
native logout intent. NativeAuthFence now atomically commits current activation;
begin/cancel/revoke use the same monitor. Logout provider calls serialize with ticket
activation, and a queued older logout cannot revoke a newer explicit sign-in.
JVM regression covers canceled/current activation commit; native lease/trace/gate/
engine tests PASS. Actual SDK1.5/OkHttp Java API compile PASS (compiler stubs, not device).
No permission/authentication/90s-policy/hosted setting change. Next ALL exact-source
CI then protected signed Driver artifact verification; physical GPS still BLOCKED.

# November 24 — Interrupted native Driver migration recovered and integrated

BASE / backup: 6ce7714574cc17b00167ea7423bb25862b5fdefb, both remote branches
verified. Required Validate push/PR + Native CI succeeded (45137736387,
45137744687,45137744569; later Validate45141859766 also success). Backup untouched.
Surviving tracked/untracked changes copied separately to /workspace/recovery-2026-11-24
before editing. No work discarded or remote history rewritten.

IMPLEMENTED (this commit; CI pending): Driver Android now uses official native Clerk
session as the single UI/auth authority, existing proof-bound browser ticket handoff,
native SDK token renewal and secure persistence. No browser credential extraction,
parallel roles or authorization bypass. MainActivity registers Driver-only plugin;
Customer/website/iOS retain existing Clerk path. One fresh browser approval may be
needed to establish native SDK session after updating; no duplicate account needed.
Native service owns heartbeat/GPS/HTTP/strict ACK independently of WebView. UI only
projects receipts; read-only resume checks also work before first GPS callback.
Logout/cancel/account replacement fence late tokens and activation; private query
cache clears before another identity is published. Old sign-out failure cannot erase
new ticket identity. SDK rejection revokes local intent. Native duty still requires
explicit consent/notification permission; restart never silently restarts tracking.
90-second server expiry and existing native lease/fail-closed policy unchanged.

VALIDATION executed: full pnpm test PASS, workspace typechecks PASS, website/API
production builds PASS (existing bundle-size warning); 19 background +9 native-store
focused cases PASS; 5 reader +4 manifest/audience cases PASS; actual JVM lease/trace/
request/auth fences + native engine4min NO-JS test PASS. Real UI/local disposable API
native-SDK projection/handoff/restart/role-denial/retry browser PASS; native-owned UI
no-JS-telemetry/receipt/resume/stop/expiry browser PASS; existing Driver workflow and
background/push/iOS simulated browser regressions PASS. SDK/provider/OS mocked in
browser/JVM tests; no real Clerk/provider or physical background acceptance claimed.

NEXT: push this atomic change; wait for ALL exact-SHA Validate and Native CI. Fix any
real failures. Then build protected signed Driver staging APK, verify source/package/
certificate and artifact, document one sustained Samsung lock test. No Render update
or migration needed: native work uses existing authorized telemetry endpoints.
Physical GPS remains BLOCKED pending replacement/device evidence. Native API already
enabled, no Android/iOS app registrations; no hosted configuration changed. Retain
existing proof-bound custom callback, no new SDK hosted OAuth callbacks introduced.
All hosted ordering/payment/payout/retention/geographic/provider-send gates unchanged.

# November 23 — Native duty engine/transport implemented, UI migration still OFF

SDK FOUNDATION d096599a15eec7db14219bef2c3e80933543e802 ALL THREE CI SUCCESS:
Validate45133512941/45133518815, Native45133518861 (both Android+iOS audiences).
Official Clerk1.5 bridge compiles on current AGP8.13/Gradle8.14.3; no Kotlin compiler /
major Gradle upgrade needed. Owner Native API enabled, no package registrations;
no configuration change made or requested. Current ticket flow retains existing
proof-bound custom callback, does not introduce SDK hosted OAuth callbacks.

IMPLEMENTED NEXT LAYER (pending commit/Android CI, still NOT activated):
- Actual pure-Java NativeDutyEngine + existing DutyLease run without any JS callback.
  Service native clock invokes SDK-authenticated heartbeat requests and strict native
  ACK; native GPS callback submits approved, fresh/nonmock locations and current
  authorized delivery updates. Independent heartbeat/GPS request slots,30s GPS throttle,
  native stop/account/late-response fences. No permission,75s ACK or90s server change.
- Driver NativeDutyHttpClient uses official SDK token retrieval/one401 renewal plus
  bounded HTTPS, native15s total gate,5s I/O, fixed backend telemetry route allowlist,
  no redirect, strict body/size validation. Dedicated OkHttp NO_COOKIES avoids ambient
  WebView credentials; no Origin spoofing, cookie extraction or alternate auth.
  SDK provider failure distinguished from unavailable transport without raw errors.
- Native-owned service refuses external JS ACK calls. Read-only native receipt/state
  projection for foreground recovery; native token stage diagnostics are nonce-only,
  no token/user/location/header payload. Caller generation/expiry cannot be reset by
  a UI read. Native service still starts only with supervised notification/consent.
- Native plugin/client remains UNREGISTERED in MainActivity and current Driver UI
  still uses existing auth. No signed APK or owner test requested. Migration must be
  atomic: native UI session/ticket source AND native-owned duty option together.

VALIDATION: actual JVM engine+lease4min test has NO JS runtime; authenticated SDK/HTTP
simulated. Tests cover native stop/expiry/cancel/late results, pending-token deadline
slot recovery, strict online JSON/401/403/409, actor change, invalid GPS/server approval
and independent heartbeat during stalled GPS. Existing native lease/trace/request/auth
fence tests PASS. Native SDK+HTTP Java adapters compile against actual public SDK1.5 /
OkHttp jars with Android/compiler stubs (annotation warnings; not Android runtime).
Full Android CI pending for this layer. SDK/client initialization was never executed
against a real account/provider. No Render/config/data/provider/financial operation.

NEXT: complete Driver-only native auth projection hooks/provider and existing ticket
activation; install/register official client; wire native-owned duty receipts/foreground
state read with ZERO JS network/ACK on that path. Test start/restart/role denial/cancel /
SDK failure + full JS absence, then native builds/CI before any signed replacement.
Website/Customer/iOS keep current authentication. Do NOT ship a half-migrated login.

# November 23 — Native API already enabled; official SDK bridge foundation underway

OWNER read-only Clerk evidence: development Native applications ENABLED (Disable
button visible); Android and iOS have NO application registrations. No changes made.
Missing registrations are NOT established as the233 failure: its auth ran through
browser Clerk and native HTTP completed200. No registration/config change authorized.
Official native SDK supports proof-bound ticket consumption; existing browser handoff
can remain. Native hosted OAuth callbacks/production registrations are separate work.
Do not infer that unregistered production/native callback acceptance has passed.

660c76bb41c25419fd9e5edd26f35bc364c3b12c ALL THREE CI SUCCESS:
Validate push45130645949, PR45130651688, Native45130651734.5 bridge-reader/29 focused
units, JVM/browser/types/build and broad Android+iOS CI passed. No signed APK built.
This is the validated scoped reader correction, NOT full native background acceptance.

IMPLEMENTED SDK FOUNDATION ONLY (pending commit/Android CI, not activated in UI/FGS):
- Driver-only pinned official com.clerk:clerk-android-api1.5.0. Inspected public AAR:
  minSDK24/compileSDK36/minAGP1.0 compatible metadata; SDK uses Kotlin2.4.21 /
  coroutines1.11.0. Java continuation bridge avoids a Kotlin compiler or Gradle-major
  upgrade. Public immutable staging SDK key/origin are BuildConfig, never a secret.
- Native ticket -> SDK active session, SDK token renewal, existing principal/task
  checks, native deadlines and operation generation fences; no WebView cookie/token
  extraction. Noncredential persistent logout intent blocks stale SDK restoration if
  provider sign-out fails. Native service stops before sign-out or a new ticket.
- Plugin is NOT registered/initialized yet. Existing UI/auth/FGS therefore unchanged;
  do not package a physical replacement. Next wire a single native principal into
  Driver UI and move heartbeat/GPS scheduling into native service; no parallel login.
- Unused SDK OAuth activities/biometric permission removed in Driver manifest overlay;
  SDK shared-session provider forced private+disabled. Customer manifest/dependencies
  unchanged. API-compatible bridge compiled locally against actual SDK1.5 AAR plus
  Android/compiler stubs (annotation warnings only); this is not an Android build.
  Actual JVM supersession/cancel/logout fence and4 audience/manifest tests PASS.
  Full Android/Gradle compatibility must be verified by CI before activation.

NEXT ENGINEERING: complete native session projection + existing ticket activation for
Driver only, then native-owned token/HTTP/ACK/GPS with fully paused JS tests, strict
roles/consent/generation/deadline/90s behavior. Keep migration off until those pass.
Native API is enabled already; no further owner setting action is currently needed.
No Render/Clerk configuration/deploy/provider/private-session/financial operation.

# November 23 — Driver233 FAILED: Clerk token resolver stalls after native auth200

OWNER physical Samsung evidence supersedes233 acceptance instructions below. Do NOT
repeat233 or claim background GPS passed. Dispatch fresh02:00:10; after3min lock
DISCONNECTED/zero online. Driver DEVICE_RECONNECT_REQUIRED / DUTY_ACK_EXPIRED;
last displayed heartbeat02:00:27, acceptedGPS02:00:10. Full sanitized report reviewed:
last nativeHB start81052/result20081147/ACK81148, JS return81156/body start81157/
ready81159. This supports the233 native body/ACK correction working on that request.
TOKEN_START94492 -> AUTH request17 native start94537/result20096207. Another
TOKEN_START102052 (after pulse102016/JS102051) waits on the token path; no new auth
HTTP start. Both TOKEN_READY only390272. Native/JS pulses122016/122029 and
142016/142027 continue without new HB HTTP. SCREEN_OFF145341; expiry157031
(75883ms after lastACK, lease anchored to challenge issue), nativeGPS156462 /
JS156467. Thus the token wait BEGAN BEFORE SCREEN_OFF; do not blame lock alone,
GPS shutdown, expired credentials, Wi-Fi handoff or battery policy without evidence.
At expiry Wi-Fi validated/wake held, screen noninteractive; idle/power-save false.

SOURCE FINDING / LIMIT: official Clerk getToken caches an in-flight tokenResolver;
concurrent callers can share the same unfinished mint. Its native-Fetch refresh path
awaits Response.json() (or text for allowEmptyBody) before resolving that resource.
Capacitor still constructs a synthetic Response from already-parsed native auth JSON.
No app before/after-response hooks override Clerk. Native auth200 + delayed token is
consistent with that remaining stream dependency, but233 DID NOT instrument the SDK
body-read boundary. It cannot prove whether the exact delayed continuation was JSON
reading, an SDK hook or microtask scheduling. No revoked-session/expiry/network error
was observed. Do NOT claim a fully established internal WebView/Clerk root cause.
Current public SDK source read anonymously for inspection only (no session/provider
mutation); API versions can move, so do not assert an unrecorded233 SDK version.

TARGETED SOFTWARE CORRECTION (pending commit/CI): existing pinned Capacitor Android
patch preloads ONLY configured Clerk session JSON into one-use Fetch readers, avoiding
synthetic stream scheduling. Native-only metadata selects this path, not provider
body fields. Original HTTP/cookies/headers/status/error payload and Clerk SDK mint /
validation/cache/renewal remain unchanged; no token extracted, stored or logged by
adapter. text/json/clone/bodyUsed/locked/consumed/UTF8/binary readers preserve behavior;
invalidJSON and401/403 stay failures. Customer Http remains disabled as configured;
iOS and existing direct telemetry native ACK logic unchanged. Native SDK body-read
START/READY/FAILED observations now correlate by bounded request/generation nonce,
with no credentials, URLs or bodies; cannot forge ACK or repopulate old-account trace.
Late token after abort/native expiry still cannot start another request or renew duty.

VALIDATION:5 actual pinned bridge-reader Node tests +29 focused controller/transport/
redaction tests PASS; JVM trace/lease/gate PASS. Chromium actual-reader/shared-resolver
stalled Response.json regression + existing consent/GPS/push/deadline regressions PASS.
All session/provider/OS-stall behavior simulated; no real Clerk credentials/provider
calls or physical acceptance. UI types and production build PASS. Broad/native CI
pending. No new signed APK or physical retest requested: stream correction is NOT
fully native authentication and must not be presented as the finished GPS solution.
No backend migration/deploy/config/data/financial/provider operation performed.

SECURE NATIVE AUTH DESIGN / NEXT ENGINEERING (not implemented, not activated):
- Use official com.clerk:clerk-android-api, not copied WebView cookies/refresh headers,
  long-lived bearer cache, backend secret in APK or a new custom auth authority.
  Official APIs support auth.signInWithTicket and auth.getToken:
  https://clerk.com/docs/android/reference/native-mobile/auth
  https://clerk.com/docs/android/getting-started/quickstart
- Reuse existing browser approval + proof-bound /api/mobile/auth/redeem one-use ticket;
  Driver native SDK consumes it, owns the active session/secure persistence/renewal.
  Driver UI auth becomes a projection of that same native principal, never two
  independent UI/background logins or duplicate accounts. Website/Customer auth stays
  intact. Backend continues verifying Clerk JWT and current profile/driver approval.
  Existing presence authorization is profile-based (dispatch.ts), not a new local
  claim; no driver or owner permissions may be inferred from UI/native JWT decoding.
- Foreground service owns heartbeat scheduling, SDK getToken, authenticated HTTP,
  strict response ACK and GPS submissions independently of WebView. Attach explicit
  on-duty consent + principal + generation; native token/request deadlines and75s
  ACK watchdog must remain below backend90s expiry. Provider/role/session failure,
  logout, account switch, offline or consent withdrawal stop work and fence all late
  results. No automatic reconnect or token accepted past SDK/backend validity.
- First native regression must suspend ALL JS across token renewal (not merely one
  reader), assert ongoing native receipts, and cover revoke/logout/account switch /
  cold restart, token/HTTP deadlines, consent and native GPS freshness. Fake SDK/provider
  tests are separate from real Clerk and Samsung acceptance. No APK until integrated
  correction passes those tests, builds and CI. Do not layer timeout/retry tweaks.
- Read-only owner question pending: Clerk development Native applications -> Native
  API enabled? Driver staging package listed? Do NOT change it. Official native SDK
  requires this capability; activation/config changes need separate owner approval.
  No Render deployment currently required by this reader change. SDK compatibility,
  minSDK/build versions and same-principal UI migration remain implementation work.

All closed ordering/financial/payout/retention/geographic gates, StripeTEST, customer
acceptance, successful historic order/ledger, signing and Neon recovery preserved.

# November 23 — Driver233 native JSON/ACK repair verified; physical lock test next

FUNCTIONAL SOURCE aac2d9c69943bf349a2cc8e5b7661bd4a045d94f pushed to
feature/rocoeats-launch-readiness. ALL THREE exact-source CI SUCCESS:
Validate push45125355615, Validate PR45125360562, Native PR45125360583.
Broad website/API/container, backup/restore, local payment simulation and browser
regressions PASS; customer+driver Android debug/release/AAB/staging/lint and iOS
simulator/unsigned device builds PASS. Simulations/builds are not provider/device proof.
Signed Driver233 run45125713873 SUCCESS, artifact14796370406:
RoCoEats-Driver-Android-Staging-Test-APK. ZIP SHA256
5a1cda76e484427b885feba2cb7def0b38b23385dc00c1e19f251f209166e703.
APK SHA256849abe5d37afdcb3d7ed3f68f73a508d5198da550daa0fd7583f9fc5ebfb9b0b.
Verified exact source/identity/digest/version233/private location-only service,
unchanged protected v2 signer certificate (CI verifier evidence)
f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296,
actual DEX DutyRequestGate/requestDuty/cancel/strict-native-ACK markers and packaged
native JSON helper. No signing material exposed. This evidence-only checkpoint has
its own CI; the functional source/build evidence above is completed, not pending.

OWNER PHONE — ONE NEW TRANSPORT TEST, no repeated230/225/Customer208 auth testing:
1. Open https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/45125713873
   -> Artifacts -> RoCoEats-Driver-Android-Staging-Test-APK -> download/extract ->
   RoCoEats-Driver-Android-Staging-Test.apk -> Update. Do NOT uninstall or change
   battery/network/permissions/hosted settings for this comparison.
2. Reconnect/Go online if needed. Explicitly consent and Enable background sharing.
   Wait until heartbeat acknowledgement AND accepted GPS receipt times advance and
   Android shows the ongoing notification.
3. Home -> Chrome Administrator Dispatch; verify fresh online position. Lock3min with
   Chrome selected. Unlock into Chrome FIRST; capture status/GPS timestamp before
   resuming Driver (foreground recovery can hide a gap).
4. Driver -> Read screen-lock diagnostics -> Copy sanitized report BEFORE reconnect,
   starting another sharing session, signing out or force-close. Capture receipt
   times and any recovery code. Then Go offline; verify notification/sharing stop.
PASS requires uninterrupted Dispatch eligibility/fresh accepted GPS + native ACKs
through screen-off and correct explicit stop. Physical background GPS remains BLOCKED
until this evidence. The app-level body-reader/serialization defect is fixed/tested;
the underlying WebView scheduling mechanism was not independently instrumented.
Clerk token acquisition and pulse request initiation still use JS. If new evidence
shows those stages stall, securely design native session/renewal before moving them;
never cache an expiring JWT, extend90s, auto-reconnect or accept HTTP200 without body.

NEXT INDEPENDENT ENGINEERING: no speculative change to this repair before new trace.
Compare NATIVE_HTTP_RESULT -> ACK_CONFIRMED -> JS_HTTP_RETURN/BODY_READY in233. Native
ACK now precedes JS reply. If receipts remain fresh, record scoped physical acceptance;
longer/background GPS, real push and complete delivery-device acceptance remain separate.
No backend deployment, migration or Render/config/data/provider/financial operation
was needed or performed. All ordering/payment/payout/retention/municipal gates remain
unchanged; StripeTEST, historical records, Neon recovery and signing are preserved.

# November 23 — Driver230 trace confirms stalled synthetic response-body processing

OWNER PHYSICAL EVIDENCE, not a claimed repair acceptance: signed230 on Samsung
S22 Ultra still disconnected after screen lock. Complete sanitized report reviewed.
SCREEN_OFF139644; last native ACK_CONFIRMED123182; EXPIRED198031 (74849ms after
ACK receipt; lease remains anchored to challenge issue, not delayed HTTP receipt).
Request23 native HTTP200143234 -> JS_BODY_START143247. Request24 native HTTP200151695
-> JS_HTTP_RETURN151704 / JS_BODY_START151705. No BODY_READY until366723/366724
(at least215018ms after second body start,168692ms after expiry). JS body markers
lack request IDs, so do not invent one-to-one delayed-reader pairing. Both readers
were outstanding; no subsequent ACK occurred. Native/JS pulses163020/163035 and
183020/183037 continued, as did226 GPS fixes (last native197466/JS197471). Tokens
14 starts/14 ready; last151444/151452. At expiry validatedWiFi/wakeHeld true;
interactive/deviceIdle/powerSave false; lowPowerExempt true. Wi-Fi active with mobile
enabled; no handoff evidence. This is not a demonstrated GPS shutdown or token failure.

CONFIRMED SOURCE/REPRO: Capacitor patched Fetch constructs a synthetic Response from
already parsed native JSON. customFetch awaits Response.text(); native duty pulseBusy
is held until that reader finishes. More native pulses cannot start another serialized
heartbeat. Timers did not release the request slot during the observed lock. Native200
alone must NOT renew the duty lease. Previous general account-profile body-null fix
is preserved and is separate from this locked synthetic body-reader scheduling issue.

IMPLEMENTED targeted Android DRIVER background-telemetry correction:
aac2d9c69943bf349a2cc8e5b7661bd4a045d94f on primary branch, PR1 unmerged:
- Direct native JSON RPC for existing heartbeat/availability/GPS routes, no synthetic
  Fetch Response/Blob/ReadableStream. Auth stays existing Clerk token retrieval plus
  one fresh-token renewal only on definite401. No stored JWT/refresh credential,
  role bypass, anonymous request or financial endpoint added. iOS transport unchanged.
- Native bounded worker validates HTTP200 AND JSON boolean online:true and acknowledges
  the current live watcher/challenge BEFORE resolving JS. Server body cannot forge
  top-level native acknowledgement metadata. Native15s total deadline + finite I/O,
  bounded concurrency/queue, no redirects, cancellation and late-completion fences.
  Explicit stop/old challenge/expired lease cannot resurrect duty. Server90s unchanged.
- JS still obtains Clerk credentials and initiates subsequent pulse requests. This is
  NOT a fully autonomous native Clerk session implementation or proof against every
  WebView suspension. New evidence of a token/pulse-stage stall would require a secure
  native session design; do not cache an expiring bearer token or weaken expiry.

VALIDATION:28 focused units PASS; actual JVM lease/trace/request gate PASS including
strict native body, deadline/cancel/late outcomes and ACK before JS processing.
Chromium real consent/controller tests PASS with heartbeat Response.text held pending,
8 native JSON pulses across160 simulated seconds, expiry/reconnect/late fences plus
existing GPS/push regressions. Native/API bridge simulated; no physical GPS claim.
Real LOCAL API/PGlite driver role/session/GPS/offline integration PASS; Clerk/native
coordinates simulated. UI typecheck and production build PASS. Android compilation,
exact-SHA CI and signed replacement artifact verification completed (see release evidence above).
No Render/API/schema migration or hosted configuration change required or performed.
All ordering/financial/provider/geographic safeguards and historical records preserved.

NEXT: finish exact-SHA CI + protected Driver signing; verify artifact source/package/
version/signer/actual native JSON worker before ONE meaningful Samsung retest. Update
without uninstalling; same permissions/network/battery conditions, explicit consent,
wait for heartbeat+GPS receipts, lock3min, inspect Chrome Dispatch BEFORE Driver resume,
then copy native report BEFORE reconnect/new sharing/force-close; go offline afterward.
PASS requires continued Dispatch online/fresh accepted GPS and native ACKs through
screen-off, plus correct explicit-stop notification/sharing cleanup. Physical background
GPS remains BLOCKED until that evidence; no repeated225/230 or Customer208 auth tests.

# November 22 — Driver230 native diagnostic APK verified; screen-lock fix NOT claimed

FUNCTIONAL SOURCE c816985e240faaea3df92aab0e05d40cb442d3dc on primary branch,
PR1 unmerged. ALL THREE exact-SHA CI SUCCESS: Validate push44990967370,
Validate PR44990970591, Native PR44990970586 (both customer/driver Android+iOS).
Signed Driver230 diagnostic run44990980560 SUCCESS. Artifact14741932269:
RoCoEats-Driver-Android-Staging-Test-APK. ZIP SHA256
cfdccce5689b21292974dad57235281c9c4da2479930e13d7a69ec01c914b8cf.
Verified source/APK digest/com.rocoeats.driver.staging/version230, unchanged protected
v2 certificate f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296,
private location-only FGS + permission boundaries/no All-time location. Actual DEX
verified DutyTrace/DutyPowerMonitor, native HTTP wrapper, expiry power/native result /
JS body markers + getter; packaged JS verified Read/Copy diagnostic viewer.
Download https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44990980560
Artifacts -> RoCoEats-Driver-Android-Staging-Test-APK -> extract -> APK -> Update.
No uninstall, backend/Render deployment, migration or hosted setting change required.

This is EXPLICITLY AN INSTRUMENTED DIAGNOSTIC BUILD, not a speculative repair or
physical screen-lock acceptance.225 failed Optimized AND Unrestricted; exact native
request/JS/power interruption remains unknown. Initial00:13:36/37 receipts are not
proven final server timestamps. No unobserved network handoff or Doze cause asserted.
Implemented native bounded RAM pulse/GPS/screen/power/HTTP-start/result/timeout traces,
separate JS token/fetch/body stages, native stop reason/request span sequences,
late native outcomes after watchdog expiry and old-session/account clear/fences.
Strict report redaction, local read/copy, bounded failure/retry, no automatic upload.
No tokens/headers/bodies/URLs/coordinates/account IDs/SSIDs/error text retained.
Held wake lock and validated network do not prove CPU/network policy permitted work.
27 targeted units, actual JVM native trace/lease tests, mobile native-bridge/API
browser report/GPS/push regressions, real LOCAL API/PGlite driver role/session/GPS /
offline integration, referenced declarations/UI types/production build PASS. CI broad
API/container/native checks PASS. No physical native diagnostic acceptance yet.

NEXT OWNER PHONE — ONE NECESSARY INSTRUMENTED TEST, not another uninstrumented225 loop:
1. Update230, preserve account/app data. Use the same failed Unrestricted/Power-saving
   OFF/Wi-Fi-active+mobile-enabled/permissions conditions; do not toggle networks.
2. Go online/Reconnect, explicit background consent/Enable while visible. Wait for
   ongoing notification and heartbeat AND accepted GPS receipt times to advance.
3. Home -> separate Chrome Administrator Dispatch. Lock3min. Unlock into Chrome FIRST;
   note Dispatch status/GPS time before resuming Driver (foreground can mask gap).
4. Return Driver -> Your availability -> Read screen-lock diagnostics -> Copy sanitized
   diagnostics. Send this JSON regardless of outcome. Read BEFORE reconnecting,
   enabling a new background session, signing out or force-closing (these reset/lose
   trace). Viewer also available on workspace profile-read error recovery.
5. Then Go offline/Go offline everywhere and confirm notification/sharing stop. No
   order/payment/refund/push/provider test needed. Physical background GPS stays BLOCKED.

NEXT ENGINEERING: inspect native trace BEFORE selecting fix or requesting another run.
PULSE vs JS_PULSE separates native scheduling/bridge delivery; token stages identify
where token retrieval stops. Native HTTP request sequence/start/result/timeout/status
is captured before JS processing. Native200 with no JS fetch/body/ACK is evidence of
handoff/processing gap, NOT license to ACK without validating online:true. Unfinished
native request means no terminal outcome observed, not automatically server rejection.
Native GPS callback/age vs JS_GPS/accepted upload separates FLP/bridge/HTTP paths.
JS stages cover background controller; unrelated foreground/polling requests may have
native-only events. If critical native migration is justified, secure native Clerk
session/refresh must accompany transmission; cached JWTs/expired-duty resurrection /
increased90s are prohibited. Native HTTP does not bypass OS power policy.
All90s/fail-closed/server authorization/GPS validation/hosted ordering/payment/payout /
retention/municipal safeguards, Stripe TEST, historical data/Neon/signing preserved.
No hosted deploy/config/data/financial/provider operations or PR merge performed.
Final evidence-only checkpoint SHA has separate CI; diagnostic source above all PASS.

# November 22 — Unrestricted225 FAILED; native screen-lock diagnostic instrumentation

NEW OWNER evidence: SAME225 on Samsung S22 Ultra also failed with Battery UNRESTRICTED,
Power saving OFF, no Sleeping/Deep sleeping listing, Wi-Fi ACTIVE/mobile enabled,
permissions unchanged, no reinstall/hosted change. Before lock receipts advanced;
INITIAL captures heartbeat00:13:36/GPS00:13:37 (not proven FINAL successes).
After3min lock Dispatch disconnected/zero approved online at00:18; Driver at00:19
reported native duty acknowledgement/location unavailable. Do NOT assert a final
server heartbeat or that battery optimization alone caused this. Both modes failed;
physical locked background GPS remains BLOCKED. No identical uninstrumented retest.
Recovered primary6903de89715d70b596bdbd9c5125c5c008cd85c7 clean, preserved all work.

IMPLEMENTED DIAGNOSTICS, NOT A CLAIMED SCREEN-LOCK FIX:
- Version-pinned observational @capacitor/android8.6 patch wraps EXISTING native HTTP
  handler, retaining original transport/TLS/auth/body/timeouts/exceptions. Opt-in only
  during consented driver background duty, scoped staging driver telemetry + Clerk
  development/proxy session requests; unrelated financial/customer/provider traffic
  excluded. Native start/result/HTTP status/timeout/interruption/error captured BEFORE
  JS receives response. Local numeric request sequence correlates native spans.
- Existing driver plugin captures monotonic native pulse, GPS callback count/age,
  native ack/expiry reason, screen/power/network observations (including actual Doze /
  exemption/Low Power Standby/wakeHeld/validated active transport/data-saver flags).
  Snapshot at native expiry is distinct from later unlocked report-read power state.
  wakeHeld is NOT proof that Android honored the lock. Network callbacks are native
  observations, not automatically proof of a Wi-Fi/cellular handoff.
- Bounded96-event RAM ring + bounded enum counters; retains late native HTTP completion
  after watchdog stop, fences old sessions, clears on sign-out/account changes; process
  death loses evidence. Never stores URLs, tokens, headers, bodies, coordinates,
  account/order/watcher IDs, SSIDs or arbitrary exception text. Native stage-report API
  prevents JS from claiming native ACK/result events.
- Existing customFetch has optional safe enum observations for token getter, fetch
  handoff/return and body-read stages; observer failure cannot alter request behavior.
  Native controller reports JS pulse/GPS receipt and token/HTTP/body stages. No auth
  protocol, refresh/retry rule,90s server expiry or native watchdog decision changed.
- Driver availability includes local Read screen-lock diagnostics / Copy sanitized
  diagnostics, including failed profile-read recovery. Strict JS whitelist before
  display/copy, bounded read/retry, late results fenced. Read does not mutate duty,
  issue HTTP, restart GPS or upload report. Copy fallback is selectable textarea.

VALIDATION:27 targeted units PASS (existing GPS/401/late-token/evidence safety + new
redaction/transport-observer/body-stage proof). ACTUAL Java lease/trace tests PASS:
consent scope, HTTP completion after expiry, request correlation, generation fence,
bounded memory, redaction, native fix receipt and clear/source attribution. Existing
React/Chromium native/API fixture PASS plus mobile report read/copy/no-mutation/hung
read recovery. Real LOCAL API/PGlite Driver role/session/GPS/offline integration PASS.
Shared API-client declarations rebuilt; UI types and production build PASS. Referenced
dist initially stale caused missing exported type; corrected by rebuilding project,
not by bypassing types. Native Android/iOS compilation/signing/exact-SHA CI pending.
PNPM frozen patches/supply-chain validation retained. Patch context-line whitespace
attribute applies only generated unified-diff syntax, not source/security checks.

NEXT: verify exact-SHA CI + protected diagnostic Driver APK; verify actual DEX includes
DutyTrace + native HTTP observation/power collector. This is new diagnostic evidence,
NOT a speculative repair. No Render deploy/backend/migration/config needed.
Owner next ONLY after verified build: update without uninstalling; same failed
Unrestricted/Wi-Fi+mobile/permissions; explicit duty/background consent and receipts;
Chrome Dispatch ->3min lock -> Chrome status BEFORE Driver resume -> Driver Read
screen-lock diagnostics BEFORE reconnect/re-enable/force-close (new background session
resets trace). Copy sanitized report regardless of pass/fail, then Go offline. No
orders/payments/provider sends. Review trace before declaring a fix or asking repeats.

INTERPRETATION: native PULSE with no JS_PULSE -> bridge/JS delivery path; JS token start
without ready -> token retrieval stage. Native HTTP start without result -> no terminal
native outcome observed; timeout/status codes identify actual outcomes where present.
Native HTTP200 before expiry without JS return/body/ACK -> completion/ack delivery gap
(not proof HTTP200 body was valid; native fix must validate online:true). Native fix
callbacks with missing JS_GPS -> bridge; absent callbacks require power/FLP analysis.
JS observations instrument background controller only; foreground/read observers may
have native-only events. Do not label those ordinary native-only reads as stalled JS.
If native critical path migration is justified, secure native Clerk session/refresh
must accompany native HTTP; cached expired JWTs or presence resurrection prohibited.
Native networking still subject to OS policy; do not promise a transport rewrite
bypasses Doze. All hosted data/settings/signing/financial/ordering safeguards preserved.

# November 22 — Driver225 Samsung power observations; controlled same-APK comparison

NEW OWNER READ-ONLY FACTS: Driver Staging Battery=OPTIMIZED; Samsung Power saving=OFF;
NOT in Sleeping or Deep sleeping apps. Both Wi-Fi AND mobile data were enabled,
Wi-Fi active/prioritized during failed lock test. No intentional network switch and
NO evidence of a Wi-Fi/mobile handoff. Do not describe mobile data as disabled or
attribute the gap to an unobserved handoff. No device settings changed for inspection.
Primary remote18d52d74e854625beb10e22727d1290e5788e1b9 recovered clean.

INTERPRETATION: Optimized is a plausible contributor, NOT proof Doze caused failure.
Power saving off and absence from Samsung sleep lists do not rule out Doze/Low Power
Standby. Android documents that standby may disable network/ignore wake locks even
for foreground services. A working ongoing notification is not an exemption check.
https://developer.android.com/training/monitoring-device-state/doze-standby
https://developer.android.com/reference/android/os/PowerManager#isLowPowerStandbyEnabled()
Unrestricted app Battery UI is not proof of every platform/vendor exemption.

SOURCE CONFIRMED: native timer/watchdog schedule pulses, but JS must receive pulse,
obtain/refresh Clerk token, initiate request and relay response acknowledgement.
CapacitorHttp is already enabled (native HTTP worker) and legacy bridge already true.
Simply enabling those again or claiming all HTTP is currently pure browser fetch is
incorrect. Native network execution alone does not remove JS initiation/auth renewal.
Current records cannot distinguish no native request from native HTTP completion whose
JS response processing was deferred. DUTY_ACK_EXPIRED correctly rejects missing/late
native acks, but cannot identify Doze vs JS vs network/401 without additional evidence.
Historical exact server heartbeat still unverified;11:52:19 expiry remains conditional
on11:50:49 actually being final server-processed HB, not merely visible local receipt.

NEXT NECESSARY OWNER COMPARISON — SAME installed signed Driver225, no APK rebuild:
1. Go offline and confirm ongoing service notification stops. Settings -> Apps ->
   RoCoEats Driver Staging -> Battery -> Unrestricted. This changes ONLY that app's
   device power setting; no Render/account/financial/security setting changes.
2. Keep Wi-Fi+mobile data enabled as before; stay on same Wi-Fi, same place/permissions,
   Power saving OFF; do not deliberately toggle networks, force-stop or sign out.
3. Reopen Driver225; Go online/Reconnect; explicitly enable background consent/service.
   Wait until BOTH heartbeat and accepted GPS receipt times advance; note the times.
4. Home -> separate Chrome Administrator Dispatch; verify online/fresh GPS. Lock phone
   THREE minutes (exceeds75s native and90s server windows). Unlock into Chrome FIRST;
   inspect status/GPS time BEFORE reopening Driver. Then capture Driver receipt times
   and any recovery code. A notification/heartbeat alone is NOT physical GPS success.
5. Go offline; confirm notification and sharing stop. Restore Battery -> Optimized
   after recording results; do not leave background test running. No orders/payments.
A successful single comparison supports policy contribution but does NOT establish
root cause or production/physical acceptance across conditions. Failure cannot by
itself distinguish JS suspension, Low Power Standby, HTTP failure or token handling.
Do not perform another repeated broad auth/order/device test.

ARCHITECTURE EVALUATION: production locked-screen critical scheduling, GPS/network IO,
server ack deadlines and stop/cleanup should be owned natively. Any native auth path
must support secure refresh/session revocation compatible with existing Clerk handoff;
never cache expired JWTs, weaken approval, extend90s or copy web credentials. Native
transport still needs valid OS network/power eligibility. No speculative auth rewrite
or APK is justified before this isolated comparison. If it fails, next software task
is narrow native stage/power evidence captured at screen-off/expiry: monotonic pulse /
bridge/HTTP-start/result statuses, PowerManager deviceIdle/powerSave/ignoreOptimizations /
LowPowerStandby flags and sanitized network transport/validation. No tokens/URLs/bodies /
coordinates/SSIDs in diagnostic record. Then select the minimum evidenced correction.

No runtime code changed, new regression claims made, redundant suites rerun or APK
produced in this evidence-only turn. Existing tests/CI evidence preserved. Docs diff
checked; docs CI separate. All hosted config/data/deploy/signing,90s expiry, fail-closed
watchdog, closed ordering/live/payout/retention/municipal gates and Stripe TEST preserved.
Physical Driver225 screen-lock GPS acceptance remains BLOCKED. No provider/financial ops.

# November 22 — Driver225 SCREEN-LOCK physical acceptance BLOCKED

NEW OWNER EVIDENCE (Samsung Galaxy S22 Ultra, signed225):11:48PM on-duty/background
sharing enabled;11:50:17 Dispatch available/fresh GPS; last accepted GPS receipt
11:50:48; last heartbeat receipt11:50:49. After screen-lock segment,11:53 Driver
DRIVER_DEVICE_RECONNECT_REQUIRED + DUTY_ACK_EXPIRED; Dispatch disconnected/zero approved
online. Background with screen UNLOCKED worked. Physical screen-lock GPS FAILED,
not accepted. Preserve successful auth/foreground/unlocked behavior and all safeguards.
Recovered clean remote2d45defd5fd756f647fd36e3bfcdfeb8f15cb58b; its3 workflows
44986182119/44986182120/44986177926 all SUCCESS. No unfinished work lost.

TIMING: if11:50:49 were the last SERVER-PROCESSED heartbeat,90s freshness would close
about11:52:19. That is consistent with disconnection by11:53. However displayed
receipts are phone-side response-processing times, not DB/audit timestamps; later
native requests could have reached server without JS recording their responses.
Do NOT claim an exact final DB heartbeat, native HTTP status, or a401 from these facts.
Native watchdog baseline is challenge ISSUE time before acknowledgement;75s from
that baseline can expire earlier than75s after the visible receipt. DUTY_ACK_EXPIRED
proves missing accepted native acknowledgement, not WHY it was missing or whether
watchdog execution itself was delayed until unlock. No hidden financial/order activity.

SOURCE REVIEW:225 native timer/wake lock are independent of WebView timers, BUT API
request initiation, Clerk token acquisition and response-to-native acknowledgement
still pass through JavaScript. Native GPS also bridges to JS before upload. A native
pulse is NOT an autonomous native HTTP heartbeat. We must not describe225 as having
removed all WebView dependencies. Capacitor8.6 Bridge/Activity keepRunning is true;
no demonstrated explicit screen-off onPause/pauseTimers call in that lifecycle.
Do NOT blindly force WebView onResume or rewrite working authentication.

Android official documentation confirms Doze may defer network and ignore partial
wake locks; foreground service/notification alone does not establish Doze exemption:
https://developer.android.com/training/monitoring-device-state/doze-standby
https://source.android.com/docs/core/power/platform_mgmt
This is a plausible screen-lock cause, NOT yet demonstrated on this Samsung.
Native watchdog remains fail-closed and server90s expiry unchanged. Exact runtime
facts missing: whether native pulses were scheduled/bridged, native HTTP started /
completed/failed/timed out, deviceIdle/powerSaver/optimization exemption/network state.
No authenticated historical request logs or device access available to this session.

SPECIFIC OWNER DIAGNOSTIC REQUEST SENT (read ONLY, no new GPS/sign-in test):
Settings -> Apps -> RoCoEats Driver Staging -> Battery: Unrestricted/Optimized/Restricted;
Settings -> Battery -> Power saving: on/off; Background usage limits: whether Driver
is Sleeping/Deep sleeping; Wi-Fi vs mobile data during failed lock test.
These private device settings cannot be inspected through GitHub or Render. No settings
change requested yet. Do not assume Optimized or a policy exemption from guesses.

NEXT ENGINEERING AFTER ANSWER: if OS restrictions evident, verify precise Android
PowerManager exemption semantics and prepare explicit device-side readiness guidance /
read-only preflight; never silently change device power policy. If already unrestricted,
add narrow native power/pulse/HTTP-stage evidence BEFORE selecting a transport/lifecycle
fix. Existing JS receipt codes cannot distinguish a suspended bridge from completed
native HTTP whose result was delayed. Avoid speculative auth rewrites, expiry increases,
notification-only cosmetics, duplicate permission prompts or another unsupported
"fixed" APK. Produce replacement only for a verified correction or clearly identified
necessary native diagnostic, accurately labeling its purpose/remaining physical gap.

No runtime fix justified yet by these observations alone; no APK rebuild, redundant
passing suites, new provider calls, hosted configuration, deployment or financial
operation performed. Evidence-only checkpoint; automatic docs CI separate/pending.
All public/private ordering/live/payout/retention/municipal gates unchanged; Stripe
TEST, historical data/order/ledger, Neon recovery, signing and PR1 preserved.

# November 22 — Driver225 native liveness candidate verified; physical GPS pending

FUNCTIONAL SOURCE71ca9bc1eb2578c8db7d73c9fdf4e095915a08ba pushed on primary branch,
PR1 unmerged. ALL THREE exact-SHA CI SUCCESS: Validate push44985648388,
Validate PR44985653608, Native PR44985653682 (customer+driver Android/iOS).
Protected signed Driver225 run44985665040 SUCCESS; actual native Java policy test
also ran successfully in signing. Artifact14740400208:
RoCoEats-Driver-Android-Staging-Test-APK. ZIP SHA256
f8a947aa7b011f700699bd8576fc5a12b8448e885d9f6a3000958a8e5162c663.
Verified exact source/APK checksum/com.rocoeats.driver.staging/version225, private
location-only FGS, notification/location/normal WAKE_LOCK permissions, no All-time
location, unchanged v2 signer f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296.
Actual APK DEX contains DutyLease/native pulses/ack method/watchdog/wake-lock tag;
packaged JS includes retained HB/GPS receipt and separate recovery diagnostics.
Download https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44985665040
Artifacts -> RoCoEats-Driver-Android-Staging-Test-APK -> extract -> APK -> Update.
No uninstall, backend/Render deploy, migration, hosted setting or provider setup needed.

REPRODUCED/FIXED: valid-GPS-dependent background heartbeat + unbounded native service
life when JS/requests stop. Native20s pulses now independent of GPS and WebView timers;
strict authenticated server heartbeat ack gates native monotonic lease/wake lock.
Initial30s then75s from native challenge issuance (not response receipt), stale/duplicate
acks rejected; expiry/permission/stop/destruction removes watchers/notification and
releases wake lock/scheduling. Server90s expiry unchanged; stale GPS stays stale.
One bounded401 Clerk renewal only for telemetry, no expired-duty/unknown-outcome /
financial/order replay. Exact physical trigger of222 callback/transport interruption
still UNVERIFIED; do not claim those historical requests were captured or invent401.

VALIDATION:25 targeted Node units, actual patched Java monotonic lease execution,
mocked-native/API real-component browser suite including160s no-GPS keepalive and
watchdog cleanup/retained evidence, real LOCAL API/PGlite driver authorization/session /
restart/GPS/offline integration, UI types/build,2 privacy units PASS. CI broader
API/integration/container + actual native builds PASS. None establishes physical
background Android GPS, real push/provider or physical iOS acceptance.

NEXT OWNER PHONE ACCEPTANCE (Driver ONLY; preserve accepted Customer208):
1. Update225; reconnect while app visible. Check consent and Enable background sharing.
   Wait for ongoing notification AND advancing server heartbeat/accepted GPS receipt.
2. Home -> separate Chrome -> existing Administrator Dispatch. Keep Driver backgrounded
   FIVE minutes, including a two-minute screen lock while Chrome is foreground.
3. Unlock back into CHROME FIRST. Before reopening Driver, verify driver online and
   Dispatch GPS time advancing/fresh. Reopening Driver first can mask background gaps.
4. Return Driver; record last heartbeat/GPS receipt times and safe recovery code if
   failed. Go offline: notification must disappear and Dispatch sharing stop. No
   orders/payments/provider push sends needed. If only heartbeat advances but GPS does
   not, GPS acceptance FAILS; never call this passed from online/notification alone.
Receipt times are phone-local response times; fields survive duty stop only in memory,
are account-scoped and clear on sign-out/process restart. No coordinates/token logging.

NEXT ENGINEERING: inspect exact safe timestamps/codes from this explicit-service test.
If heartbeat fails, distinguish native expiry vs auth401/409 vs transport timeout;
if heartbeat survives but GPS does not, inspect actual native fix delivery/permission /
Fused Location path. Do not increase90s, fake positions, auto-reconnect, repeat accepted
Customer/auth audits or change hosting. Preserve all closed ordering/live/payout /
retention/municipal gates and Stripe TEST, existing order/ledger/Neon recovery/signing.
No hosted data/config/deploy, financial/provider operations or PR merge performed.
This final checkpoint-only commit has separate CI; functional225 source above all PASS.

# November 22 — Driver222 background failure: native liveness correction

NEW OWNER EVIDENCE: v222 background activation produced ongoing RoCoEats on-duty
notification. Administrator Dispatch reported offline/no sharing at11:11PM; returning
at11:12PM showed DRIVER_DEVICE_RECONNECT_REQUIRED, Offline, permission GRANTED.
Background GPS physical acceptance remains FAILED/NOT PASSED. This supersedes earlier
notes limited to hidden activation controls. Exact historical HTTP/GPS/heartbeat ack
traces are unavailable without authenticated evidence; do not invent a401 or OS-kill.
DEVICE_RECONNECT_REQUIRED means local duty intent false (fatal response or new process),
not independently proof of a particular server or Android cause.

CONFIRMED DEFECT reproduced: background heartbeat was conditional on VALID GPS callback;
no GPS/no JS callback meant no presence renewal, despite native FGS continuing. Native
service had no server-acknowledgement watchdog. A late heartbeat after90s correctly409s
and requires explicit reconnect. Two regressions failed before correction. The source
mechanism explains service-vs-server divergence; physical callback interruption reason
remains unverified. Server90s expiry and all authorization/eligibility unchanged.

CORRECTION: pinned pnpm patch to EXISTING background-geolocation1.3.1 Android service,
not a parallel service. Monotonic native20s pulses independent of GPS/WebView timers;
JS uses existing authenticated heartbeat API and acknowledges only strict online:true.
Native initial grace30s, thereafter75s from pulse ISSUE time (not response receipt),
rejecting duplicate/unknown/late acknowledgements. Bounded partial CPU wake lock only
within consented duty, with2s cleanup allowance; missing acknowledgements remove native
watcher/ongoing notification even if JS cannot clean up. Last watcher removal cancels
native scheduling and releases wake lock; process/service destruction cleans everything.
Permission/start/promotion failures propagate sanitized errors and stop tracking.
No All-time location permission; FGS remains private/location-only. Normal WAKE_LOCK
permission added only through driver-excluded plugin; customer native boundaries stay.
No credentials/addresses/coordinates stored in native lease or new diagnostics.

Background transport renews Clerk ONCE only after definite401 for whitelisted telemetry
endpoints; original GPS body preserved. Network-unknown/403/409, availability mutation,
order/payment/financial writes never replayed. Expired duty cannot be resurrected.
Native pulse independent of stalled GPS upload; GPS freshness/accuracy/simulation rules
unchanged. Heartbeat does not fabricate coordinates or turn stale GPS fresh.
Availability now retains per-account MEMORY-ONLY last server heartbeat receipt, accepted
GPS receipt and separate safe failure codes after duty stops; clear on sign-out/process
restart. Times are local-device receipt times, not independent server-clock evidence.

LOCAL VALIDATION:25 focused units PASS (no-GPS pulse/invalid ack/auth/expiry/stalled GPS,
late-result/token fencing, telemetry renewal, evidence isolation). Actual patched Java
lease compiled/run onJVM21 PASS: initial/exact expiry, issue-time anchor, late/duplicate
challenge,4min no-GPS pulses, permanent stop/monotonic rollback. Existing React/Chromium
native/API mocked GPS/push suite PASS plus160s GPS-independent presence, zero fabricated
GPS, expiry reason/last receipts retained. Real LOCAL API/PGlite dedicated Driver role /
session/restart/GPS/offline integration PASS. UI types/build and2 privacy units PASS.
CI now runs native Java policy before Android driver compile and protected signing;
actual Android/iOS compilation, exact-SHA CI and signed APK still need final results.
Never equate JVM/mocks/builds with physical Android service/GPS acceptance.

NEXT: verify exact-SHA CI/native Android service compilation, repair failures, protected
signed Driver candidate; verify source/package/version/hash/private FGS/wake permission /
unchanged signer and DEX pulse/watchdog code. No Render deploy/migration/settings needed.
Owner test: update without uninstalling; reconnect/explicit consent while visible;
wait for heartbeat AND GPS receipt times. Use separate Chrome Administrator Dispatch
while Driver remains backgrounded; inspect BOTH online and GPS timestamps BEFORE
resuming Driver, including lock/unlock with Chrome foreground. Capture receipt times /
failure codes if failed. A living heartbeat alone does NOT establish background GPS.
Then Go offline must remove notification/location. No order/payment/push sends needed.
All closed ordering/live/payout/retention/municipal gates, Stripe TEST, hosted data,
Neon recovery/signing/PR1 preserved. No hosted/provider/financial operations performed.

# November 22 — verified Driver222; physical activation still unresolved

Functional c2e69cbbc6c2f32da8d9118ba2ebee2081d09165 pushed on primary branch.
All THREE exact-SHA CI SUCCESS: Validate push44982517540, PR44982521821,
Native PR44982521815 (both customer/driver Android+iOS). Signed Driver222 run44982533117
SUCCESS. GitHub watcher temporarily returned503; direct run stayed in_progress then
completed SUCCESS, so no build was rerun or workflow failure inferred from watcher.
Artifact14738790940 RoCoEats-Driver-Android-Staging-Test-APK verified ZIP SHA256
fbe02fa2c4d807beb6d9e6c03458aea3355850f907629842d25ecfc36ed28e4f,
packaged source/hash, com.rocoeats.driver.staging/version222, private location FGS,
permission boundaries/no All-time location, unchanged existing v2 signing certificate.
Packaged JS specifically verified to contain Location session, setup link, safe gate
codes and notification-denial recovery. No backend deployment/migration needed.

Download https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44982533117
Artifacts -> RoCoEats-Driver-Android-Staging-Test-APK -> extract -> APK -> Update.
Do not uninstall or rebuild accepted Customer208. NEXT PHONE CHECK is NARROW:
1. Keep Driver open; Reconnect if shown (already physically verified to work in219).
2. Under Your availability read Location session and tap Set up background sharing.
3. If checkbox/button absent, report exact code or field absence, STOP; do not loop
   sign-in/reconnect or start background/order/payment trials.
4. Only if visible, explicitly consent/Enable. Android notification permission can
   be allowed without Firebase/provider enrollment; if denied use app Notifications
   settings then reconnect/re-enable. All-time location is not needed by this design.
Actual physical background notification, GPS timestamp progression and offline stop
remain UNVERIFIED. Do not mark Samsung activation fixed from mocked READY_NATIVE.

Confirmed software fixes: bounded consistent strict availability reads, invalid-field
vs denied-approval distinction, explicit local/session gate feedback and activation
anchor, normal offline409 offers message, precise OS permission denial and permission
cache refresh (no push registration).16 units, actual-component native/API browser
regressions, real LOCAL API/PGlite Driver role/session/GPS/offline integration, UI
types/build PASS. Compile/mocks are not real native GPS/Clerk/provider acceptance.
Root of219 missing controls AFTER successful reconnect still NOT reproduced; owner
must provide safe gate code from222 to identify actual global controller state.219
artifact verified to include component/controls and no remote server URL; no unsupported
claim that permission denial, account authorization or service startup caused absence.

No hosted configuration/deploy/data/financial/provider changes. All closed ordering,
Stripe TEST/live/payout/retention/municipal safeguards, signing and recovery preserved.
Next independent work follows concrete device/provider evidence; do not invent unrelated
features or repeat completed audits. Final checkpoint-only SHA needs separate CI read;
functional/source222 CI above already all SUCCESS.

# November 22 — Driver219 reconnect succeeds; missing activation NOT resolved physically

Recovered clean primary c4fdaf80ddda29e868ff70bb86d1f849c85b16de, remote matched;
checkpoint CI44980872928/44980872969/44980869802 all SUCCESS. No unfinished work lost.
NEW OWNER Samsung219 evidence: reconnect SUCCEEDED, normal Online/Go offline returned;
offers recovered to No paid deliveries. However background checkbox/enable button STILL
ABSENT throughout page; notification permission not granted. Background sharing has
NOT been activated; physical background GPS remains NOT ACCEPTED. This supersedes
any inference that initial reconnect alone explains the current absence.

Confirmed implementation: consent renders in global DriverDutySession only when Clerk
signed in, driver/admin profile, no profile/availability query errors, explicit device
intent, server approved/available/online, dedicated native Driver audience. Notification
permission is requested AFTER choosing Enable; it is not a visibility gate.219 APK
contains the component and activation text, local packaged assets (no server URL),
proper native permissions/private FGS. Deployed76a24ed GET/PUT contracts compatible.
We have NOT captured the failing device's exact gate/response; do not invent a cause.

Corrections: all3 availability observers now share bounded20s session-aware reads
(existing401 renewal/read retry policy; mutations unchanged/no write replay). Query
failure no longer silently removes all explanation. Strict GET response validation
distinguishes missing/coerced flags from actual denied approval; invalid responses
are not automatically retried. Only safe stage/HTTP codes are reported. Global inactive controller shows
safe gate reason; existing device-intent store publishes account/process-local status
only, NEVER grants intent or persists it. Availability shows Location session code
including NOT_STARTED if global controller never reports, READY_NATIVE vs READY_WEB,
approval/profile/read/connection gates, and link to activation section when connected.
Offline offers409 is normal actionable Go-online/reconnect state, not generic account
failure. Background notification denial has precise phone Settings instructions;
permission display refreshes after request, independent of Firebase/APNs registration.
No auth/approval/lease/role/consent relaxation, account or session record changes.

Validation: initial missing-guidance regression failed before correction; new actual
React/Chromium mocked-native/API regression PASS for fresh-process/server-denied /
approved-driver+admin reconnect, denied notification before visible consent, denied
activation/no watcher, subsequent permission grant/cleanup, status refresh with ZERO
provider registration, process reload/explicit intent, approval denial, hung availability.
Existing native GPS/push consent/timeout/opt-out/fencing regression suite PASS.16 focused
background/duty-intent/availability-response units PASS. Real LOCAL API/PGlite Driver integration PASS:
normal409 offers UI, approved/unapproved/admin/customer authorization, reconnect,
foreground GPS/dispatch/offline, stalled session/profile/restart recovery. Native and
Clerk simulated; no physical/native-provider acceptance asserted. UI types/build PASS;
CI/source/artifact final results must still be read after push. Existing chunk warning.

NEXT OWNER CANDIDATE TEST (only after verified signing): install update, keep app open,
tap Reconnect if shown. Read Location session under Your availability, tap Set up
background sharing, report exact code + whether checkbox/button appear. If permission
prompt appears after explicit checkbox+Enable, allow notifications (or Settings→Apps→
RoCoEats Driver Staging→Notifications), reconnect/re-enable as instructed. If controls
still missing, stop and report safe code; no repeated auth/Customer208/order/payment
trial. Only after service notification/upload appears test background/lock/offline.
Do NOT mark acceptance passed from simulated READY_NATIVE or successful compilation.

NEXT INDEPENDENT: exact-SHA CI + protected signed Driver diagnostic/recovery candidate;
then use physical gate result to correct actual remaining Samsung blocker. Do not
repeat broad auth/staging audits or guess native promotion/permission causes. Native
startForeground error propagation remains a source-level review item, NOT established
as the cause (service never activated). Push providers/iOS protected signing/real GPS
and provider financial evidence remain external acceptance gaps. No Render deployment
or migration required for this client-only correction. All hosted gates/data/financial
records, Neon recovery and signing preserved. No provider/financial operation performed.

# November 22 — verified Driver219 physical-background candidate

FUNCTIONAL HEAD 8bf4d04baab5e51a4fbe361283838f252f375284, primary branch
feature/rocoeats-launch-readiness, PR1 OPEN/unmerged. All THREE exact-SHA CI SUCCESS:
Validate push44980349607, Validate PR44980356303, Native PR44980356335 (customer +
driver Android/iOS compile). Signed Driver run44980362815 SUCCESS, version219.
Artifact14737567646: RoCoEats-Driver-Android-Staging-Test-APK,
ZIP SHA256 74a2d648a7ed67752a639e0745825e3d0c7cd30da123e5fd3660ad02d8a2930e.
Verified exact packaged source, APK checksum, com.rocoeats.driver.staging/version219,
app-private location FGS/type8, notification/location permissions, no all-time location,
unchanged public v2 signing certificate f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296.
Download from https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44980362815
Artifacts -> RoCoEats-Driver-Android-Staging-Test-APK -> extract ZIP -> APK -> Update.
No uninstall, Customer208 rebuild, backend deployment or hosted setting change needed.

Completed47eb9f3f720ef1a8fa66abc0fc3d2306a9cca47c: foreground-only warning,
90-second lease-expiry explanation, realistic app-state/lease browser reproduction,
consented simulated background continuity/offline privacy. Completed8bf4d04: reproduced
then fixed unbounded native permission/watcher initialization (15s each), late grant
fence and removal of late-created watcher.12 background units PASS; prior2 duty-intent
+1 server-presence units PASS. Real React/Chromium controller regressions PASS for
foreground/background GPS, new native-step timeouts, consent/cleanup/recovery and
Android+iOS push enrollment/opt-out/fencing. UI typecheck/build PASS. CI additionally
validates local API/database/order/ledger integration with simulated providers; no
new Stripe/Geocodio/push/provider acceptance is asserted.

Owner confirms213 ONLY used Go online: native background consent/service was not
enabled. Two-minute foreground-only expiry is reproduced; actual device timestamps,
process death, notification/service behavior were not captured. Absence of All the
time is expected for this consented foreground-service design; not evidence of cause.
Customer208 accepted sign-in/navigation/permissions/restart preserved. Background GPS
acceptance remains PENDING, not passed by compilation or mocked events.

NEXT OWNER PHONE TEST: update Driver219; Go online; check background-sharing consent;
tap Enable background location for this session WHILE VISIBLE. Allow notifications
and precise While using location. Wait for RoCoEats on-duty notification + successful
upload status, then background/lock for two minutes and resume. Pass: online controls,
fresh upload, no reconnect. Go offline: ongoing notification/service stops, no further
uploads. If absent notification/reconnect/error, report exact status and timing only;
no repeat Customer208/auth investigation. No orders/payments/provider push sends needed.

NEXT ENGINEERING: incorporate actual explicit-service physical result; if it fails,
trace sanitized native promotion/permission/bridge lifecycle and server freshness
without guessing. Dependency internally catches startForeground errors; review exact
error propagation with a native failure test before changing third-party lifecycle.
No evidence that path was exercised in the213 foreground-only trial. No speculative
permission expansion or silent restart/consent persistence. Remaining external gates:
real background GPS/offline privacy; provider push credentials/authorized receipt;
Apple protected provisioning/signed-device+iOS physical; separately authorized real
financial provider reconciliation/refund/payout evidence; geographic acceptance.
All public/private ordering/live charges/payouts/retention/municipal gates and Stripe
TEST unchanged. No hosted config/deploy/data/provider/financial operation performed.
Neon recovery, historical $19.19 order/ledger, signing and recovery worktree preserved.
This final checkpoint-only commit needs its own exact-SHA CI result; functional8bf4d04
and signed219 outcomes above are already SUCCESS. Never equate pending docs CI with pass.

# November 22 — bounded native background initialization

Guidance/lifecycle regression commit47eb9f3f720ef1a8fa66abc0fc3d2306a9cca47c pushed;
its THREE CI runs44980137736/44980247782/44980247792 were still running when read.
Do not mark them passed until exact conclusions are available.

A separate confirmed software defect was reproduced: permission() and native
addWatcher() could remain unresolved forever before the existing API deadlines.
Two new units FAILED before correction. Background controller now bounds each native
step at15 seconds using existing nativeStep, ends the attempt on initialization
failure, fences late permission grants and removes any late-created watcher. No
silent retries, restored consent or privileged requests after stop/timeout. This was
NOT the cause of the owner's Go-online-only213 trial; no device claim is made.
Twelve background-duty units PASS (plus prior duty-intent/presence tests); actual
React/browser stalled-permission and stalled-watcher recovery/late cleanup PASS,
as do existing foreground/background GPS and Android+iOS push controller regressions.
UI typecheck and production build PASS; existing bundle-size warning remains.

Next: push/verify exact-SHA CI, build protected Driver staging candidate from verified
functional HEAD, verify source/version/hash/manifest/certificate before offering it.
Native dependency promotion failures remain a source-level review item; no permission
expansion or dependency changes made. No backend deploy/migration/settings required.
Owner physical explicit-consent/ongoing-notification/background/timestamps/offline
acceptance remains pending; Customer208 acceptance and all closed gates preserved.

# November 22 — recovered checkpoint; Driver213 background path clarified

Recovered clean primary HEAD 6f91c6b5b3125139cc14b0a16dd16fcca37ba801;
final pre-reset checkpoint WAS pushed. Exact-SHA CI all THREE SUCCESS:
Validate PR44889484533, push44889481092, Native44889484559. Recovery worktree,
stashes, signed artifacts, migrations and financial data preserved.

NEW OWNER EVIDENCE: Driver213 test used ONLY Go online. The owner did NOT enable
background-sharing consent/service. Therefore this trial did not exercise native
background GPS and does not prove a background-service defect. Physical acceptance
remains NOT PASSED. The reported permission choices/precise setting are preserved.

SOURCE + LOCAL REPRODUCTION: Go online uses foreground-only GPS/heartbeat. Native
app-state hidden stops these; database heartbeat freshness closes at 90 seconds.
DriverAvailability selects Reconnect whenever availability remains true but online
freshness or device-local intent is absent, and offers Go offline everywhere.
No automatic lease resurrection or persisted tracking consent is permitted. The
observed two-minute foreground-only test is consistent with this designed expiry;
actual hosted heartbeat timestamps/process lifecycle were not captured, so do not
claim those were independently measured on the Samsung.

Small correction: explicit foreground-only/90-second/background-consent instructions
in DriverDutySession; start while visible, await Android ongoing notification;
DriverAvailability explains expired dispatch connection and no offers until reconnect.
No permission/session/role/lease changes. All-time permission is intentionally absent:
Driver uses a consented location-type foreground service, target SDK36, fine/coarse +
FOREGROUND_SERVICE_LOCATION/POST_NOTIFICATIONS, app-private service. Platform guidance:
https://developer.android.com/develop/sensors-and-location/location/permissions
https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
Starting while visible matters; this is not permission to silently start from background.

Validation: new actual-component Chromium regression reproduces Go-online-only hide
for121 seconds, no native background watcher/heartbeat, explicit expired recovery;
reconnect leaves background consent OFF. Explicit consent + simulated native fixes
maintain eligible state beyond two minutes; offline removes watcher and fences late
callbacks. Fixture broadcasts native app-state to ALL subscribers and models server
90-second lease. These are simulated native/API results, not Android/hosted evidence.
Existing background/foreground GPS, Android+iOS push recovery/opt-out browser regressions
PASS; 13 focused background-duty/duty-intent/server-presence units PASS; UI typecheck
and production build PASS (existing large-chunk warning). Exact final CI and signed
candidate details must be read before reporting them passed/available.

OWNER NEXT (candidate after signing): update Driver only without uninstalling; keep
Customer208 accepted. Go online; check background consent; tap Enable background
location for this session WHILE VISIBLE; allow notifications/location While using +
precise. Wait for on-duty notification and an upload status. Background/lock for two
minutes, resume: expected online controls and fresh successful upload, no reconnect.
Then Go offline: notification/service should stop; no further location uploads.
If no notification or reconnect occurs, report those exact observations and status;
do not change Android permissions blindly. No order/payment/push-provider send needed.
Real backend timestamp progression while backgrounded still requires owner-authorized
inspection/device evidence; no actual location submitted by tools.

NEXT INDEPENDENT TASK: finish exact-SHA CI/artifact verification and native GPS service
failure reporting/lifecycle review if concrete gaps are established. Dependency native
service currently catches startForeground failures internally; whether this occurs on
Samsung is UNKNOWN (it was not enabled in reported trial). Do not infer physical
success from watcher creation. Real push providers remain unconfigured; signed physical
iOS needs owner-controlled Apple provisioning; financial provider evidence still needs
separate authorization. Do not repeat Customer208/authentication/23 staging checks.
All hosted settings, data, Neon recovery, completed $19.19 TEST order, security gates,
signing secrets preserved. No deploy/provider calls/financial operation/PR merge.

# USAGE-RESET CHECKPOINT — November 21: Driver213 physical background acceptance NOT PASSED

NEW OWNER-OBSERVED Samsung Galaxy S22 Ultra / signed DRIVER213:
- Android location settings offer ONLY "Allow only while using the app", "Ask every
  time", and "Don't allow". "Allow all the time" is NOT offered.
- Precise location is enabled.
- After going online and backgrounding approximately TWO minutes, returning showed
  "Reconnect on this device" and "Go offline everywhere".
- Background GPS acceptance has NOT passed. Exact root cause is UNKNOWN.
These are observations, not evidence that a particular permission, foreground service,
lease, watcher or device-session mechanism caused the failure. Absence of "Allow all
the time" alone does not prove a defect in a foreground-service location design.
Whether explicit background-sharing consent/enable was used, an ongoing Android
notification was visible, GPS timestamps advanced while backgrounded, or the OS killed
any process is NOT established by this report. Do not invent those facts or blame user.

PRESERVED VERIFIED WORK:
- Primary branch feature/rocoeats-launch-readiness, PR1 unmerged. Pre-checkpoint HEAD
  9ae8a13dc8e222598e81588a43d26633301953e2 all THREE CI SUCCESS:
  Validate PR44887800085, Native44887800086, push44887796256.
- Driver213 functional source73f85c7f0e218f839b2e860951e38e837fe96e7f,
  protected signed run44887092509/artifact14700009888. Source/hash/package/version/
  existing signing certificate verified. No replacement/rebuild produced this turn.
- GPS timeout/fix/ack recovery, notification deadline/opt-out/fencing fixes, real LOCAL
  GPS/API/database/dispatch integration remain tested as recorded below; simulations
  and builds do NOT establish physical background operation.
- Customer Android208 remains PHYSICALLY ACCEPTED for tested sign-in/customer landing,
  authorized Admin/Driver navigation, identity/permissions, close/reopen/session recovery
  and no observed startup/navigation failure. Do NOT repeat without regression evidence.
- Recovery worktree/stashes, native signing, database migrations, Neon recovery and
  completed $19.19 TEST order/financial records preserved. No runtime edits this turn.

EXACT NEXT ENGINEERING ACTION AFTER RESET:
1. Fetch remote branch, inspect tree/history and this top checkpoint. Verify latest
   exact-SHA CI; do not call pending/empty checks passed. Do not repeat completed audits.
2. Investigate Android PERMISSION / FOREGROUND-SERVICE CONFIGURATION and DRIVER
   DEVICE-SESSION RECOVERY together. Inspect compiled Driver213 manifest/native plugin
   service setup, Android OS foreground-service rules and actual explicit-consent path.
   Do NOT blindly add ACCESS_BACKGROUND_LOCATION or assume "Allow all the time" is needed.
3. Trace DriverDutySession/useAppForeground/dutyIntent, BackgroundDutyRecovery/watcher
   lifecycle and transport, server heartbeat/online lease/GPS freshness and reconnect
   conditions. Explain how the two displayed controls are selected. Treat causes as
   hypotheses until source, diagnostics or controlled reproduction establishes one.
4. Reuse existing offline/native/browser tests; add only focused evidence/reproduction.
   No rerun of known Launcher ANR or exhausted provider tests without concrete fix.
   If device-only details remain necessary, ask only the missing targeted observation,
   not a blanket repeat of accepted Customer or Driver sign-in acceptance.
5. Make the smallest justified correction, preserve explicit tracking consent/privacy/
   server authorization, run targeted checks, push and verify CI, then sign replacement
   Driver APK ONLY if native/runtime change actually requires it. Physical background
   GPS stays NOT PASSED until real owner evidence supports acceptance.

STOP POINT: clean verified checkpoint only; no large investigation started before
usage reset. Current commit changes docs only; no runtime tests rerun for documentation.
Its automatic CI may still be PENDING at turn end; check exact result on resume.
No Render deployment, hosted settings/data changes, new provider/financial operations,
credentials/permissions changes or activation. Public/private ordering, live charges/
payouts, retention cleanup and municipal enforcement stay OFF; Stripe TEST. Real
notification-provider sends remain unauthorized. Contractor/income/Plaid/letters deferred.

# November 21 — verified Driver213 recovery candidate + real local GPS/dispatch integration

Customer Android208 physically ACCEPTED for owner's sign-in/customer-first landing,
Admin/Driver menu, unchanged identity/permissions, close/reopen/session recovery and
no observed startup/navigation failure. Do not ask to repeat these accepted workflows.
No claim of Customer push/checkout or physical iOS/background GPS acceptance.

Functional73f85c7f0e218f839b2e860951e38e837fe96e7f ALL THREE CI SUCCESS:
Validate push44887092191, PR44887096569, Native44887096549. Protected DRIVER213 build
44887092509 SUCCESS; artifact14700009888 RoCoEats-Driver-Android-Staging-Test-APK.
Exact source/ZIP+APK hash/package com.rocoeats.driver.staging/version213/manifest and
unchanged protected v2 certificate independently verified. No physical installation/
GPS acceptance inferred.34c1175 and0a29655 also all THREE CI SUCCESS. No Render deploy,
migration, provider setup or Customer208 rebuild required for this continuation.

New test-only integration: simulated native foreground fix through REAL local role-
authorized driver controller/API/PGlite/dispatch. Fresh lat/lon visible to admin;
Go offline removes dispatch coordinates and late native callback creates NO request.
PASS existing dedicated Driver eligibility/owner exception/auth-failure regressions
in same changed-component harness. Not real GPS/Clerk/provider or hosted data proof.
Current test-only commit does not change Driver213 runtime; do not rebuild it merely
because documentation/test HEAD is newer. Latest exact-SHA CI must still be read.

Completed code: bounded background/foreground GPS and heartbeat requests, fresh-fix
retry after stall, late-response fencing, no heartbeat overlap, reject invalid fixes
before slot/ISO conversion, strict location acknowledgement. Notification pre-token
setup/read/status/opt-out deadlines; app-identity refresh; revocation retry evidence
retained and newer-registration fence. Android+iOS push controllers simulated PASS,
iOS uses owned APNs topic with no Android channel, no actual sends/receipt claim.
Ten GPS units, relevant browser integration/consent/permission/cancellation/late-event
regressions, UI types/production build PASS. Full CI already includes real local order
through delivery/ledger workflow with SIMULATED payments; no reason to rerun it by
hand or call it new Stripe TEST evidence. App auth/navigation code untouched.

NEXT OWNER-ONLY ACCEPTANCE: Driver213 install UPDATE without uninstalling when ready
for explicit on-duty/background-location consent test; no orders/payments/provider
push sends needed. Link:
https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44887092509
artifact RoCoEats-Driver-Android-Staging-Test-APK. Actual locked-screen/network-loss
GPS and off-duty/privacy behavior require physical evidence; never start operations
from tools. Keep Customer208 installed/accepted, no blanket auth retest requested.
Android/iOS push owner-observed configuration required; protected provider setup and
real receipt need separate authorization. iOS compile/simulator evidence preserved,
signed-device packaging/signing and physical acceptance remain INCOMPLETE and need
owner-controlled Apple team/provisioning inputs/device access, not compilation proof.

NEXT ENGINEERING: inspect exact-SHA CI, preserve this checkpoint, incorporate new
physical/provider results when available. Do NOT repeat known Android Launcher ANR,
iOS installer failures or exhausted Geocodio without a concrete correction. No other
confirmed independently missing runtime workflow established in this focused work;
do not invent features/audits. Contractor/income/Plaid/verification letters deferred.

No hosted settings/deployments/data, ordering/payment/payout/cleanup/municipal gates,
credentials, signing infrastructure, Neon recovery, historical financial/test order
or PR1 changed. Stripe TEST, public/private ordering/live/payout/geographic activation
remain closed. No actual provider calls/financial operations or new paid resources.

# November 21 — foreground driver transport recovery completed; Customer208 accepted

Customer Android208 OWNER physical sign-in/navigation/identity/permissions/restart
acceptance remains scoped and VALID below; no repeated Customer phone test requested.

Confirmed related foreground defects: never-resolving location request held inFlight
forever; heartbeat interval could accumulate requests; malformed timestamp threw
before cleanup and poisoned upload slot; truthy non-boolean acknowledgement could
be treated as success. Reproduced foreground hang and timestamp exception beforefix.

Small correction reuses bounded nativeStep with per-request abort for foreground
position/order uploads and heartbeats. Heartbeat has single-flight guard; cleanup
cancels pending work. Validate native fix before occupying slot (same finite/range/
accuracy/freshness bounds as background; NOT municipal enforcement), require strict
boolean acknowledgement, encode active order path. No change to backend authorization,
assignment, role, pricing or location privacy policy. No real GPS test performed.

Focused mocked browser PASS: invalid/stale/out-of-range timestamps/fixes never send
or poison slot; hung GPS aborts, fresh fix recovers; old late acknowledgement cannot
forward a position to an order; malformed ack never reports new success; hung heartbeat
errors then next interval recovers without overlap. Existing changed GPS consent/
stop/authorization and Android+iOS notification status/enrollment/opt-out/account-
fencing regressions PASS. UI types/production build/diff PASS. Background10 unit
regressions already PASS in34c1175; native CI0a29655 SUCCESS, Validate pending at writing.
No actual provider receipt/background/physical-iOS acceptance inferred.

Next: push, verify exact-SHA CI and build protected DRIVER staging candidate containing
these GPS/notification fixes. Verify source/version/hash/cert/manifest; do not rebuild
accepted Customer208 just to repeat its completed auth tests. Native updates only,
no Render deploy or hosted settings/migration needed. Background/locked-screen GPS
acceptance needs owner's explicit device consent/on-duty actions; never start from
tools. Push providers still owner-observed unconfigured; no real sends authorized.
No ordering/financial/geographic activation, credentials or paid resources changed.

# November 21 — notification status/opt-out recovery and iOS controller verified

Customer208 physical sign-in/navigation/session acceptance below remains VALID;
no repeat phone test or new Customer install requested.34c11752136b6cabaa8eaad8133a192cd15bdb8b
all THREE CI SUCCESS (44885865086/44885868987/44885868919).

Confirmed next defects: notification status queries could hang indefinitely with
Refresh disabled, and a hung server revocation prevented native opt-out. Added
bounded reads with cancellation and explicit app-identity refresh; bounded revocation
still attempts native opt-out during server failure, retains unconfirmed handles
for retry, and generation/snapshot fence prevents late cleanup erasing newer enrollment.
No provider setup, permissions/roles or backend API changes.

Browser reproduction FAILED on original initial configuration hang; corrected tests
PASS for config/permission/app identity/device-status deadlines, manual refresh with
no enrollment, server/native removal timeout and retry, aborted transport, identical-
token newer-registration fence. Existing consent/GPS/registration/legacy opt-out/
account-switch regressions PASS. Additional simulated iOS path uses owned APNs topic,
no Android channel, status survives reload, opt-out and late-setup fencing PASS.
No real APNs/FCM receipt claimed. UI types/production build/diff PASS. All tests use
mock native/API, no actual provider/GPS or hosted write. Provider sends remain OFF.

Next independently confirmed related gap from source: foreground DutyLocation also
holds inFlight on a never-resolving upload; foreground heartbeat interval lacks
bounded requests. Reproduce with existing consent/browser fixture and fix without
retesting accepted Customer auth. Then run final CI and prepare Driver candidate
for separately owner-controlled background GPS acceptance. No deployment/settings/
financial operations, credentials or paid resources authorized or changed.

# November 21 — OWNER PHYSICAL ACCEPTANCE: Customer Android208

Samsung Galaxy S22 Ultra, signed Customer208/source9c91fdc3940b7e69be0724babfd2cdc044b45f0e:
owner confirms sign-in opens restaurant browsing, Administrator/Driver menu functionality
remains accessible, same account/permissions preserved, closing/reopening and session
recovery work, no startup timeout/navigation failure observed. PHYSICALLY ACCEPTED
for those tested workflows ONLY. Supersedes older208-PENDING notes below; do NOT
repeat accepted sign-in/navigation/session tests without regression evidence.
Not evidence of background GPS, push delivery, physical iOS, checkout/payment or
complete native delivery lifecycle. Driver154 prior physical evidence preserved.

VERIFIED SOFTWARE CONTINUATION: hung background GPS request held inFlight forever;
reproduced beforefix, now existing bounded nativeStep + per-request cancellation
releases slot after15s, retries only a fresh fix with fresh eligibility, and ignores
late acknowledgements. Preflight timeout cannot start GPS later; explicit stop still
cancels without false failure. Ten background-duty units PASS, including existing
consent/eligibility/revocation/stale-fix/assignment/stop guards. No real GPS acceptance.
Push enrollment timer previously started after configuration/permission/channel/app
identity; reproduced stalled pre-token setup, moved existing15s budget to enrollment
start. Four pre-token browser cases plus existing enrollment/account fences/opt-out/
configuration and GPS consent/stop regression PASS. Native/provider APIs SIMULATED;
UI types/production build/diff PASS. No accepted Customer sign-in retest performed.

Next independent confirmed gap: bound notification status reads and opt-out requests,
which can otherwise remain pending on a hung transport. Preserve revocation evidence
and attempt native opt-out even if server is unavailable. Hosted settings/deployments/
provider sends/financial operations remain unauthorized; safeguards unchanged.

# November 21 — verified Customer208 multi-role landing release

Functional9c91fdc3940b7e69be0724babfd2cdc044b45f0e ALL THREE CI SUCCESS:
Validate push44883913574, PR44883917369, Native44883917377. Protected signed CUSTOMER208
run44883913561 SUCCESS; artifact14698664941 RoCoEats-Android-Staging-Test-APK exact
source/ZIP/APK hashes, package com.rocoeats.app.staging, version208, permission/
manifest safeguards and unchanged protected v2 signing certificate independently
verified. No physical208 acceptance claimed. Latest documentation commit does not
require rebuilding this artifact; read its own exact-SHA CI rather than assuming.

Root cause and fix: shared WEBSITE admin-first AccountSetup policy lacked native
Customer presentation override; NativeSignIn completion also returned inconsistently
to account/setup. Native Customer ordinary sign-in now selects restaurant discovery
using SAME verified profile ID/role. Actual customer checkout intent still restores
cart; explicit partner onboarding, WEBSITE role routing and Driver app priority
preserved. Admin/Dispatch/Driver menu privileges remain; server authentication,
authorization and checkout eligibility unchanged. NO new account/profile or role
grant. This is navigation, not expansion of purchasing permissions.

PASS before/after browser reproduction of /account/setup -> /admin; corrected four-role
Customer landing, owner admin/dispatch/driver access, profile identity/role unchanged,
zero profile creates, active saved-owner handoff with zero new approval calls,
reload/session and explicit partner routes. Existing waiting-handoff/cancel/expiry/
interrupted activation/timeout tests PASS; Driver native bootstrap and dedicated
owner/approved/unapproved role regressions PASS.13 mobile API/routing/body-reader
units, UI typecheck/production build/diff PASS; full standard CI PASS. Native/Clerk
simulated with real disposable local APIs, not physical or real-provider acceptance.

PHONE CHECK (same existing MULTI-ROLE account, no separate customer/driver account):
https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44883913561
Artifacts -> RoCoEats-Android-Staging-Test-APK -> extract ZIP -> install208 UPDATE,
never uninstall existing app/data. From Home use Sign In (active session may skip
browser) -> expect restaurant browsing rather than automatic Admin dashboard.
Menu -> Administrator and Driver remain accessible; return Find food and close/
reopen to check session remains. Role can still display Administrator: correct,
identity/permissions unchanged. No need to log out solely to test, toggle availability,
submit forms/orders, press finance controls or change hosted settings. Physical208
result PENDING. Record only observed scope; preserve prior205 identity/menu evidence.

NEXT: fetch latest branch/CI, incorporate208 phone result and fix only reproducible
remaining defect. No Driver APK rebuild, Render deployment, migration, credential or
host configuration needed. No backend code/hosted data/provider/financial operations
performed. Existing public/private ordering, live/payout/cleanup/geographic controls
remain closed, Stripe TEST. PR1 unmerged, recovery worktree/stashes/signing preserved.
Remaining real-device GPS/push, authenticated/signed iOS, authorized provider finance,
geographic/legal/hosting acceptance remains distinct; no more known Launcher ANR/
installer or exhausted Geocodio retries without concrete fix. Contractor/income/
Plaid/verification letters remain deferred. Do not reopen resolved154 auth or repeat
completed audits merely to create work. Current actionable routing fix is complete;
new independent application changes should follow concrete acceptance evidence.

# November 21 — owner Customer205 multi-role evidence and audience landing correction

OWNER-OBSERVED Samsung205: existing multi-role identity recognized; Find food,
Dashboard, Orders, Driver, Notifications, Account, Administrator, Dispatch & orders
menu entries present. Signing in lands on Administrator dashboard. Record ONLY
this scope; no background GPS/push/payment or complete physical lifecycle inferred.

Confirmed cause: AccountSetup applies shared accountDestination(role,checkout),
which intentionally prioritizes admin for WEBSITE, while Driver audience already
has its own override. NativeSignIn completion/active-handoff return also needed
consistent customer presentation to avoid competing Account vs setup destinations.
Focused actual-bootstrap regression failed beforefix, showing /account/setup ->
/admin instead of expected /restaurants.

Minimal correction: optional customer-app presentation flag in existing route
helpers. Native CUSTOMER ordinary sign-in returns through setup to restaurant
discovery for existing roles; actual customer checkout intent still restores cart.
Explicit restaurant/driver onboarding remains, Driver build still prioritizes driver,
WEBSITE staff routing unchanged. Identity/profile role/permissions/server checks,
checkout authorization and saved one-use handoff protections unchanged. No duplicate
account/profile created or required for the navigation correction. No backend change.

PASS: multi-role native Customer browser verifies all four existing roles land on
discovery, same profile ID/role, zero profile-create requests, admin/dispatch links
and owner Driver controls accessible, ordinary customer gets no staff links, restart
and active saved-owner handoff need no new approval, explicit partner routes retained.
Existing saved-handoff/cancel/expiry/timeouts and native Driver bootstrap PASS;
dedicated Driver owner/approval/role-preservation regression PASS;13 mobile API/route/
response-reader units, UI typecheck/production build/diff PASS. Auth/native provider
simulated with real disposable local APIs, not physical acceptance of replacement.

Next: push, exact-SHA standard CI + protected replacement CUSTOMER staging APK;
verify exact source/signature/hash/version before phone test. No Driver APK rebuild,
Render deployment, migration, hosted settings or provider/financial action required.
All existing controls/data/signing infrastructure preserved. New phone criterion:
ordinary sign-in opens customer discovery; Menu still reaches authorized Admin and
Driver; close/reopen preserves session. Do not repeat older resolved auth investigation.

# November 21 — Customer205 ready for FIRST physical acceptance; software CI verified

Latest functional0ca6023eea4ab7575f814296621c40add3100115 all THREE CI SUCCESS:
Validate push44881554543, Validate PR44881558191, Native44881558248. Protected signed
CUSTOMER205 run44881554243 SUCCESS, artifact14698008854. ZIP/APK hashes, exact source,
version205/package com.rocoeats.app.staging, compiled security/permission policy and
unchanged protected v2 certificate independently checked. No installation/physical
or real-Clerk redemption acceptance inferred from build. Driver187 remains valid;
no new Driver build needed. No Render deploy/migration/host configuration required.

Verified fix: native Customer restart at Home now resumes a saved WAITING handoff
through existing SignInPage/NativeSignIn, preserving same ID/verifier and sanitized
role/checkout intent, without another auth/begin request/approval. Beforefix regression
failed; restored customer/restaurant/driver hints across TWO document restarts,
waiting beyond31s, active-session shortcut, cancel/expiry, stalled redemption timeout
and interrupted one-use activation protections PASS. Existing Driver session/profile/
retry browser regressions, four native startup/two navigation unit tests, UI types/
production build PASS. OS/Clerk/redemption simulated in browser, not provider evidence.
This does NOT establish the cause of the separate earlier unsigned cold-callback
failure. No blind bridge change. Prior final docs5f7a52f also all THREE CI SUCCESS.

PHONE ACTION (replaces prior async request's193 download; do not repeat basics if
owner already completed them):
https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44881554243
Artifacts -> RoCoEats-Android-Staging-Test-APK -> extract ZIP -> install APK UPDATE,
never uninstall existing app/data. Leave Home35s, use EXISTING CUSTOMER credentials
in secure browser, return and confirm customer account/controls; close/reopen and
confirm session restoration. Report version and visible code/behavior only, no IDs/
credentials. No order/guest form submission, settings, availability or payment test.
Physical acceptance remains PENDING until actual owner result. Driver154 acceptance
is preserved separately; do not reopen its resolved response-reader investigation.

Other completed work this continuation: fresh staging23 PASS onlive76a24ed with actual
render_cdn_chain and closed gates; retention/ledger/push dashboard evidence is OWNER
OBSERVED. Bounded Maven429 backoff and launcher infrastructure classification verified.
iOS safe-area6c80db0 all standard CI PASS; actual Customer cold/restart screenshots
show logo below status bar; same optional run44880141514 FAILED overall because Driver
installation failed BEFORE launch (no new Driver UI claim). No further known launcher/
installer retry without concrete correction. Do not request exhausted Geocodio calls.

EXACT NEXT: fetch branch and read exact-SHA CI for any newer documentation checkpoint,
then incorporate FIRST Customer205 physical result. If it fails, reproduce the exact
visible stage before modifying app code; if it passes, record only observed scope.
Remaining acceptance: background/locked GPS, real push configuration/receipt, signed/
authenticated physical iOS, separately authorized provider settlement/refund/payout
and geographic/legal/hosting acceptance. No other confirmed independent missing core
workflow currently established after this recovery correction. Do not invent features
or repeat broad audits. Contractor/income/employment/Plaid/letters remain DEFERRED.

No hosted settings/deployment, financial/provider operations, secret/signing changes,
DB destruction or PR merge. Public/private ordering, live charges/payouts, cleanup
and municipal enforcement remain closed; Stripe TEST. Recovery worktree/stashes and
all prior data preserved. An additive retention public-status release may wait for
separate approval; none of these native fixes require a Render deployment. Final
checkpoint is docs-only; do not rebuild205 because documentation HEAD is newer.

# November 21 — confirmed saved Customer native handoff recovery fixed

A focused source/test review found an independently reproducible missing path:
Customer native restart lands on Home with a valid saved waiting request; previous
Router suppressed READY but never remounted NativeSignIn, then timed out/cleared
request. Existing test incorrectly expected timeout. New intended recovery regression
FAILED before correction (no /sign-in navigation within5s), now PASS.

Minimal native CUSTOMER Home guard redirects a valid saved request through existing
SignInPage/NativeSignIn, preserving role/checkout via accountEntryLinks normalization.
No new begin/approval request, new handoff implementation, transport switch, server
or role/nonce/ticket authorization change. Web/driver routes untouched. Expired
requests do not resume; interrupted redeem/activation still fails visibly without
replaying one-use work. This is NOT a proven explanation of the earlier Android
cold-callback failure, whose later evidence was blocked by OS Launcher ANR.

Focused real-bootstrap browser PASS: customer/restaurant/driver intent and same saved
ID/verifier across two document restarts, zero auth/begin calls, waiting survives31s,
cancellation clears saved request, stalled redemption yields NATIVE_REDEEM_TIMEOUT,
already active customer clears stale request without any auth API call and reaches
checkout, expired requests ignored, interrupted activation yields NATIVE_HANDOFF_INTERRUPTED
without API replay. Native/Clerk/redemption SIMULATED, local disposable backend only.
Existing Driver bootstrap/profile/session/retry browser regressions PASS; four native
startup plus two navigation unit tests PASS; UI typecheck/production build/diff PASS.

Next: push, exact-SHA CI and protected CUSTOMER staging build. New Customer APK needed
for this JS recovery fix; no Driver rebuild or Render deploy/migration/config change.
The earlier async first-basic-phone check193 remains useful if already performed;
if not yet started, prefer forthcoming replacement once verified. Do not ask owner
to repeat unchanged basics or mark physical/real-Clerk redemption acceptance passed.
Do NOT rerun known Launcher ANR merely to chase callbacks. iOS safe-area Customer
screens and standard CI6c80db0 remain valid for unchanged native inset setting;
latest unsigned native compilation still required. Owner/provider acceptance gates
and all closed ordering/payment/retention/geographic controls unchanged. Contractor/
income/Plaid/verification letters remain deferred; no hosted/provider/financial action.

# November 21 — verified software checkpoint; remaining acceptance gates

STAGING: fresh existing23 checks PASS on76a24ed542e85c42e8a85d42d59dfd3e20e46ead.
Observed actual render_cdn_chain; health/DB/workers/auth config/Stripe TEST/CSP/HSTS/
native contracts PASS. Public/private ordering, live charges, TEST payouts and
municipal enforcement OFF. Retention absent from OLD public response, explicitly
unverified by tool; OWNER confirmed disabled, both push providers configuration
required, balanced ledger and zero missing baselines. Do NOT repeat owner checks.
NODE_USE_ENV_PROXY=1 is required for this Codex environment's read-only HTTP tools.

VERIFIED SOFTWARE:
-1981a05462764c85b1e08bb01a961304cf7ced0e: bounded dependency429 backoff30s/60s,
 same three attempts, compiler/403 immediate failure. Reproduced regression beforefix,
 fixture verifies exact waits without actual delays. All THREE CI SUCCESS.
-1d8b364933ddc62e143528bcbabc1810ac622229: known Android-owned Launcher ANR fails
 promptly as infrastructure; no dismissal/retry/protected actions. App ANR/text
 cannot be misclassified. Twelve policy tests PASS; all THREE CI SUCCESS.
-6c80db07e89d1e96b228ca031b1dda4bc6d0bad1: supported native iOS automatic safe-area
 inset fixes logo under status bar, preserving approved homepage/CSS/Android/auth.
 Real bundled config before/after regression; three audience/seven simulator/two
 permission tests, UI types/production build PASS. All THREE CI SUCCESS:
 push44880141096, PR44880144968, native44880144967.

ACTUAL iOS44880141514 is PARTIAL/FAILED overall, never call it wholly successful.
CUSTOMER job136773423126 SUCCESS: packaged safe-area config/identity, installation,
cold/restart35s process+offline OCR checks PASS; both screenshots visually reviewed,
logo clearly below system status bar. Artifact14696849846 source/ZIP digest verified.
DRIVER job136773422878 failed INSTALL before launch; packaged config/identity passed,
artifact14698120435 checked. No driver visual, physical, auth, GPS/push/provider or
financial acceptance inferred. Do not increase timeouts/retry known infrastructure
without a concrete fix. Previous BOTH-audience signed-out smoke d4b62ac remains
separate valid evidence. No iOS signing/device acceptance from unsigned builds.

ANDROID: signed Driver187/source3170b04 and Customer193/source7559c7c signatures,
source/package/hashes verified; artifacts remain valid (latest app setting iOS-only).
Driver emulator44704067532 ten checks PASS; owner physical154 auth/GPS indicator/
restart observations preserved, never reopened as a new auth defect.
Customer44704889327 cold callback failure remains unexplained. Later diagnostics
44879245710 were ALL obscured by Pixel Launcher ANR, so do NOT infer an app bridge
cause, switch transports blindly, or repeat that emulator investigation. Controlled
React cold/warm/malicious-link + account/startup guards PASS. Customer193 is NOT
physical/end-to-end accepted. No new Android rebuild or backend deploy warranted.

OWNER ACTION already requested once through async question: first read-only Samsung
CUSTOMER193 acceptance, install as update without uninstalling, leave Home35s, sign
in with EXISTING CUSTOMER via browser, return and reopen; report visible code or
behavior only. No order/guest form submission/settings/availability/payment tests.
https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44704171924
artifact RoCoEats-Android-Staging-Test-APK. No owner credential/ID request.
Driver187 optional update link44701171498/artifact RoCoEats-Driver-Android-Staging-Test-APK.

EXACT NEXT ENGINEERING ACTION: fetch latest branch/CI, read owner Customer193 result;
if failure, use visible stage plus existing diagnostics to reproduce and fix ONLY
confirmed cause. If no reply, keep physical acceptance pending, do not claim pass or
rerun blocked OS/provider tests. Remaining external gates: background/locked GPS,
real push configuration/receipt, authenticated/signed physical iOS, separately
approved Stripe provider reconciliation/refund/payout evidence, municipal accuracy/
activation and owner/legal/hosting acceptance. No additional confirmed independently
missing core workflow established; respond to concrete acceptance evidence.
Contractor/employment/income verification, Plaid and verification letters DEFERRED.

No Render deploy/settings, provider sends/lookups, financial operations, database or
signing changes, PR merge or costs. All work on feature/rocoeats-launch-readiness;
recovery worktree/stashes intact, PR1 OPEN. No urgent Render deployment required;
additive retention status can wait for separately approved release. Final docs-only
checkpoint commit CI must be checked on its exact SHA; do not rerun passing local
suites or rebuild valid APKs merely because documentation is newer.

# November 21 — iOS safe-area correction prepared for actual simulator review

Actual earlier iOS cold/restart screenshots showed customer logo under status-bar
clock. Upstream Capacitor CAPInstanceDescriptor defaults content inset to NEVER;
CAPBridgeViewController assigns that value to WKWebView scroll adjustment. Use the
supported ios.contentInset=automatic for both native audiences. No website CSS,
homepage/buttons, authentication, Android transport or permissions changed.

Real bundled-config regression fails original missing inset, passes corrected
customer+driver config, preserving IDs, debug OFF, driver-only HTTP/background plugin.
Seven simulator-policy tests (including compiled capacitor.config.json inset guard),
two existing native permission tests, three audience tests, UI typecheck/production
build and diff check PASS. Actual iOS smoke/screenshot validation still required;
no physical or authenticated acceptance inferred. Android193/187 do not need rebuild
for an iOS-only configuration setting. No Render deployment or new credentials.

Next: push and run existing ios-smoke on this source once, inspect both screenshots/
reports and exact-SHA CI. Known Pixel Launcher Android failure must NOT be rerun.
Customer cold auth remains uncertain; bridge unchanged. All23 staging checks fresh
PASS; retention/ledger/push dashboard evidence owner-observed, no repeated request.
No hosted/provider/financial operation, data or signing changes.

# November 21 — callback diagnostic BLOCKED by OS Launcher, not proven app bridge fault

Actual44879245710 report coldAuthIntentVisible=true, cold/warm sign-in=false,
no native bridge/plugin/crash log categories. Crucially ALL inspected XML/screens
were covered by Android's "Pixel Launcher isn't responding" modal. Artifact14696873589
ZIP digest/source checked; image visually reviewed. These booleans are NOT evidence
of an app bridge defect. Do NOT blindly change modern/legacy transport or rerun the
known launcher failure. Earlier44704889327 callback failure remains unexplained;
Customer193 is source/signature verified, not physical/end-to-end accepted.

Existing smoke now detects ONLY Android-owned launcher ANR as infrastructure,
fails immediately with system_launcher_unresponsive, skips callback probes when
blocked. It never dismisses dialogs or grants permissions. App-owned text/app ANR
cannot be reclassified by this check. Twelve policy regressions/Python syntax PASS.
No new APK or backend deployment required for this correction; no more emulator
reruns warranted merely for known OS ANR. Last successful Driver emulator/iOS runs
remain separately recorded; no regression in previously accepted Driver154 proven.

1981a05 native CI44879461533 SUCCESS after bounded dependency429 handling;
Validate workflows still running at writing. Current staging23 freshly PASS on76a,
all owner evidence preserved. Next independent native usability defect from actual
iOS screenshots: safe-area header/logo overlaps system status bar. Review supported
native container inset setting (default is never) and test without homepage redesign.
Physical Customer193/Android callback evidence may ultimately require owner phone;
no request for credentials or previously failed owner test, no new device acceptance
claimed. All hosted/provider/financial settings/data unchanged.

# November 21 — confirmed Maven429 retry defect corrected

7636dd9 native CI44878811006 failed Android customer dependency resolution because
Maven Central returned HTTP429, not a compiler/app test failure. Existing transport
helper retried5xx/timeouts but skipped429. Offline regression failed before fix.
HTTP429 now uses bounded30s/60s backoff within the same THREE-attempt maximum;
5xx backoff unchanged,403/compiler failures still immediate. Official repositories,
checksums/signing and all hosted settings unchanged. Offline fixture verifies exact
waits/attempts and persistent outage failure without real sleeps/downloads; PASS.
Bash syntax/diff check PASS. Not proof Maven service recovered; final exact-SHA CI
must still be read honestly. Do not rerun the old failed source while new CI runs.

Customer193 callback diagnostic44879245710 still running at writing; inspect its
sanitized report once complete. No native behavior change made speculatively.

# November 21 — fresh staging checks PASS; native callback still under diagnosis

Fresh existing read-only verifier: 23/23 PASS, exact live76a24ed542e85c42e8a85d42d59dfd3e20e46ead,
actual render_cdn_chain, DB/worker/auth/Stripe TEST/native/security contracts healthy,
ordering/live/TEST payout/municipal gates closed. Old readiness lacks retention flag;
retain OWNER-OBSERVED disabled evidence, no repeated owner request. Environment Node
fetch initially bypassed required proxy; rerun with NODE_USE_ENV_PROXY=1 succeeded.
This was tooling network setup, not a staging outage or hosted change.

Customer193 diagnostic44878807414 failed BEFORE callback at global
NATIVE_STARTUP_TIMEOUT_RESTORING after public Home rendered. callbackDiagnostics empty;
therefore this run establishes NO callback rejection cause. Source/ZIP digest and
sanitized report/XML reviewed; no accounts/provider/financial actions performed.
Bounded SDK failure is preserved, not bypassed. Previous44704889327 cold-callback
failure remains real; browser cold/warm/malicious URL regressions pass.

Existing smoke failure collection now probes only fixed public auth URI even after
an earlier acceptance failure, records cold intent visibility, cold/warm sign-in,
SDK timeout and fixed native error-category booleans. Original acceptance failure
still fails run. Raw log/intent data is never saved in report. Eleven policy tests
(including secret-free diagnostics), Python compile and diff check PASS. No app or
configuration change. Next: one diagnostic run against SAME193 APK; inspect booleans
before any native transport correction. Do not invent a bridge root cause or mark
physical Customer acceptance passed. No Render deployment required for tooling.

# November 21 — resume actual Customer cold-callback failure (do not request physical retest yet)

Remote/local HEAD4838d3f8a96ca07d34a75e142a716dd1bb4f447f matched, clean on recovery.
All THREE ordinary CI SUCCESS (44704888563/44704896191/44704896157); recovery worktree
and prior stashes preserved. Nov20 staging76a24ed 23/23 and actual render_cdn_chain
verification already complete; owner retention/payout/push/ledger observations are
recorded below. No reason to repeat owner checks or the resolved Driver154 auth work.

IMPORTANT correction to earlier next steps: actual Customer193 emulator44704889327
FAILED. Install, permissions, public homepage >35s and guest recovery passed; cold
rocoeats://auth callback then remained on homepage rather than native sign-in.
Signed artifact193 remains signature/source verified, NOT full acceptance verified.
Do not ask owner to install/retest Customer193 as a completed candidate yet.

Exact native route parser intends /sign-in for signed-out/no-pending auth callback;
React MobileLifecycle reads getLaunchUrl and appUrlOpen. Controlled native App-plugin
fixture now verifies cold and warm auth routing, malicious role-bearing URL denial,
public startup and existing private/account deadlines; CUSTOMER and DRIVER browser
regressions PASS. Therefore no demonstrated route-parser/auth-role defect and no
basis to weaken security or change user permissions. Actual Android native intent/
plugin bridge delivery remains uncertain. Driver starts on sign-in anyway, so its
signed-out callback screenshots alone do not establish that customer callbacks work.

Added ONLY sanitized existing-emulator diagnostics on the reproduced failure: whether
Android task contains the fixed public auth intent, bridge/plugin error-category
booleans, app-specific native crash and warm-callback comparison. No raw intents/logs/
IDs/tokens persisted; original cold failure still fails run. Ten APK policy tests,
Python compile, both native browser regressions and diff check PASS. App/native/
backend/authentication code unchanged. No new APK or Render deployment required
for these diagnostics. Next: push and run existing android-smoke once against SAME
Customer193 source-run44704171924; inspect results.callbackDiagnostics and screenshots,
then implement the smallest evidence-supported correction. Do not just accept Home
in place of the intended callback or blindly switch bridges before comparison.

Owner-only gates remain deferred while independent callback diagnosis proceeds.
No contractor/income verification, Plaid or verification letters are in scope.
All ordering/payment/payout/cleanup/geographic protections remain OFF; no hosted
settings/deployments/provider calls/financial operations or database changes.

# November 20 — native acceptance checkpoint: actual simulator evidence preserved

Functional customer startup d4b62acc29df60f0509d292f0e06709b0bbeb896 all THREE ordinary
CI SUCCESS (44703367524/44703373477/44703373450). Actual macOS iOS smoke44703368279
SUCCESS for BOTH audiences on iOS26.5: exact compiled identity/public staging bundle,
install, cold launch/restart, 35-second process checks AND offline Vision acceptance.
Artifacts customer14613704136/driver14613589734 source+ZIP digests verified; both
cold/restart PNG pairs visually reviewed. Customer homepage remains visible after
restart; driver sign-in has Driver access and no customer guest links. Report limits
remain explicit: no auth/UI input/permissions/GPS/push/physical/financial acceptance.
Minor customer iOS status-bar/logo overlap is visible; record for later safe-area
review, not an authorization or startup failure. Approved homepage unchanged.

Actual Android Driver187 emulator44704067532 SUCCESS: ten checks including install,
signed-out driver navigation, cold/malformed/untrusted links, restart and no crash;
no authenticated session or hosted business writes. Source3170b04, QA artifact
14613239432 digest/report checked. Previous44703441877 failure was stale guest-link
expectation, resolved in7559c7ceee9cd21580324fd420708bfc08f3afcc (nine policy tests).
7559c7c both Validate workflows SUCCESS; native CI44704075248 pending at writing.

Signed CUSTOMER193 run44704171924 SUCCESS, source7559c7ceee9cd21580324fd420708bfc08f3afcc.
Artifact14613868537 RoCoEats-Android-Staging-Test-APK, exact ZIP/APK hashes/package/
source/manifest and unchanged protected v2 certificate verified. This replaces173
for physical startup acceptance. Driver187 remains valid; no rebuild needed.

Customer emulator's old Find food/Guest order homepage expectations were also stale
against the actual approved five-button page. Corrected to existing Sign In -> native
sign-in -> guest recovery navigation; public homepage and restart must each survive
35 seconds without startup recovery. Ten policy tests/Python compilation PASS.
Next: run existing android-smoke once against CUSTOMER run44704171924, inspect real
report/screenshots; verify final exact-SHA CI. No native/app/backend code changes in
this test-only checkpoint, so193/187 artifacts remain valid across this commit.

OWNER PHONE ACTION after final checks: open the linked workflow -> Artifacts ->
RoCoEats-Android-Staging-Test-APK (customer193) or
RoCoEats-Driver-Android-Staging-Test-APK (driver187), extract ZIP and install APK as
UPDATE without uninstalling existing data. Customer: leave homepage visible >35s,
browse, sign in to existing customer, close/reopen and verify session/account/cart
reads. Driver: verify existing session/dashboard/menu and restart; no availability
changes, order/payment/financial/GPS/push tests requested. No Render deploy required.
Customer link: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44704171924
Driver link: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44701171498

Current deployed76a24ed: all23 checks PASS, actual render_cdn_chain observed, ordering/
live/TEST payout/municipal gates closed, Stripe TEST, health/DB/native/CSP/HSTS good.
Retention closure/ledger/push status is OWNER-OBSERVED evidence as recorded below.
No hosted change/deployment/provider/financial operation or migration performed.
No urgent backend deployment required; optional additive retention readiness status
can ship only in a separately approved release. Recovery branch/stashes preserved.

Remaining OWNER/PROVIDER gates: physical customer193/driver187 acceptance (v154
successful auth evidence preserved), background/locked GPS, real push/configuration,
authenticated iOS/signing/device, authorized Stripe provider settlement/reconciliation,
municipal accuracy/activation, legal/business/hosting backup acceptance. Do NOT
repeat provider calls or resolved native response-reader investigation. Once current
smoke is complete, no other confirmed missing core workflow is established; next
software-only task should follow concrete new acceptance evidence, not speculation.

# November 20 — Driver187 verified; emulator expectation corrected

Signed Driver version187, source3170b047861e1eb0035fd80ceb1c2d100bb22b07,
workflow44701171498 SUCCESS. Artifact14612324985 exact ZIP digest, packaged source,
APK checksum/package/manifest safeguards and protected v2 signing certificate checked.
Retrieve from https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44701171498
artifact RoCoEats-Driver-Android-Staging-Test-APK. No backend deployment required.
Physical update/navigation acceptance still pending; v154 auth acceptance remains.

Actual Android emulator44703441877 installed/launched Driver187, denied unauthenticated
controls for cold/untrusted links, then failed because the old test tried the removed
CUSTOMER guest link. This is a stale test expectation, not a driver app failure.
Corrected smoke now requires dedicated driver identity, rejects guest/authenticated
controls, and tests Driver access navigation back to safe sign-in. Nine APK-policy
regressions and Python compilation PASS. Run the existing smoke against the SAME
already verified Driver187 artifact; do not rebuild it or loosen app authorization.

Customer startup correction d4b62acc29df60f0509d292f0e06709b0bbeb896 is pushed;
three ordinary CI and optional iOS smoke44703368279 still pending at this writing.
No hosted/provider/financial operations. Next: exact-SHA CI, actual iOS OCR/screens,
corrected Driver emulator run, then protected corrected Customer APK and physical
public startup/restart acceptance. Keep live76a24ed safeguards unchanged.

# November 20 — customer native restart defect reproduced and corrected

Actual simulator screenshots from run 44700216739/source3170b04 exposed a customer
restart NATIVE_STARTUP_TIMEOUT_RESTORING despite a usable public homepage. Process
survival alone was insufficient evidence. Driver job failed at cold_launch; this
run is PARTIAL/FAILED overall, not full iOS acceptance.

Root cause: public customer routes had no profile request to signal READY after
Clerk restoration. Router now completes startup only for loaded public customer
routes with no pending native handoff. Private/driver guards, SDK/handoff deadlines,
strict profile checks and authorization remain unchanged. Controlled-clock browser
regression FAILED before correction, now PASS for customer public navigation/reload,
stalled SDK, pending handoff and private-account timeout. Existing driver native
bootstrap/account/session/retry regression PASS. UI typecheck/production build PASS;
six simulator-policy tests and workflow YAML validation PASS.

Optional iOS smoke now requires local Vision screenshot recognition of the expected
signed-out audience entry after both launches; startup errors/blank/wrong-audience
screens fail even if the app process survives. Recognized text is never logged or
sent externally. Actual macOS compile/self-test and both-audience execution are next;
Linux/offline fixtures do NOT establish iOS UI or physical acceptance.

3170b047861e1eb0035fd80ceb1c2d100bb22b07 has all THREE ordinary CI SUCCESS.
Signed Driver run44701171498/version187 SUCCESS; artifact/source/signature review
in progress. This driver entry correction needs a native update, no backend deploy.
Customer v173 must not be offered as a restart-accepted candidate: build replacement
only after this startup correction passes exact-SHA CI. No hosted settings, database,
permissions, provider, financial or deployment operation performed. Live76a24ed
safeguards and owner-observed retention/ledger evidence remain as recorded below.

Next: push correction, verify all-three CI, execute existing ios-smoke once on that
source and inspect sanitized reports/screenshots; build corrected Customer staging
APK using existing protected signer. Distinguish simulator process/UI from physical
auth/background GPS/push/delivery acceptance. Never repeat the resolved v154 auth
investigation, Geocodio calls or hosted financial actions.

# November 20 — actual iOS smoke exposed dedicated-entry navigation gap

589aaf4f8f8016f1e8b3f7c9237d2700c149c811 all THREE ordinary CI workflows SUCCESS.
Manual iOS smoke 44698220337 is PARTIAL/FAILED overall: driver on iOS-26-5 installed,
cold-launched and restarted with 35-second process survival/screenshots; customer
failed auxiliary boot_ready wait BEFORE app installation. Both fresh simulator
resources cleaned up. Driver evidence artifact 14612261757, customer failure report
14611408280; source/digest/identity checked and driver screenshots visually reviewed.
Cold image partly obscured by OS welcome notification; restart image shows sign-in.
No authenticated/physical/GPS/push/delivery acceptance inferred.

Actual driver screenshot showed generic Home + customer guest-checkout links on
native sign-in. Minimal audience-only correction: Driver access link and no guest
links for driver builds; customer Home/guest paths remain. Browser regression failed
before fix, now dedicated-driver role/recovery and customer checkout/guest-entry
checks PASS, UI types/production build PASS. Authentication/roles/session state are
unchanged. Native binary update will be needed to display this UI correction;
no Render deployment is required for it.

CoreSimulator correction does NOT extend timeout: on inconclusive bootstatus, only
this owned simulator with observed Booted/isAvailable state may proceed to actual
bounded installation/launch/process/screenshot checks. Unknown/Shutdown states fail.
Five offline tests PASS, including fallback guard and failure cleanup. One new
actual smoke run is warranted for this concrete change; do not blindly repeat the
old failed run or claim customer launch until actual evidence succeeds.

Next: push this tested fix, run exact-SHA CI + existing ios-smoke target, review both
artifacts. Preserve current live 76a24ed verified safeguards, owner-observed retention/
ledger/push evidence and no hosted changes. Retention-status ea82e2f all-three CI
SUCCESS; additive public diagnostic remains undeployed and nonurgent.

# November 20 — optional iOS simulator process smoke prepared

Existing iOS matrix now supports manual target ios-smoke for BOTH audiences.
Uses public staging configuration/read-only native preflight; no signing credentials
or provider setup. Validates compiled ID/name/scheme/source hash and public bundle
settings, creates an available compatible temporary iPhone simulator, installs,
cold launches, waits 35 seconds, captures screenshot, terminates/restarts and
repeats. Only its own created simulator is deleted; no erase-all/permission/account/
order/payment/UI-input actions. Sanitized source/binary-hash/report/screenshots are
uploaded separately. Ordinary compile/signed Android jobs remain unchanged.
Four offline tests (both audiences, identity/config rejection, failure cleanup,
runtime availability) plus existing 2 privacy/8 APK policy tests and YAML syntax
PASS. ACTUAL macOS simulator run still required; no iOS process/UI/physical/auth/
background GPS/push acceptance claimed yet. Next: push and dispatch existing
native-validation.yml target=ios-smoke, inspect actual stages and screenshots.

# November 20, 07:39 UTC — staging 76a24ed independently verified

Deployed full SHA 76a24ed542e85c42e8a85d42d59dfd3e20e46ead independently
matched; all 23 read-only checks PASS. All-three exact-SHA CI SUCCESS (44694326325,
44694326104, 44694318276). ACTUAL Render client identity source is render_cdn_chain,
including read-only forged forwarding-prefix probe. Guest/native limits use the
same helper; limits were NOT exhausted and no auth/order mutation was issued.
Public/private/effective ordering, live charges, TEST payouts and municipal
 enforcement OFF; Stripe TEST, DB/auth/pricing/webhook config/workers healthy.
Fixed CSP/HSTS/native customer+driver contracts also PASS under forged host/proto.
No new migration; hosted migration journal not directly queried. Clerk production
forwarding remains TEST-key bypassed; origin protection is deployed-source/local-
fake-upstream verified, not real production Clerk acceptance. Unsigned roles denied;
actual signed-in workspace operations not repeated from an unauthenticated session.

OWNER-OBSERVED authenticated Operations evidence: processed checkout retention
DISABLED, TEST payouts DISABLED, Android+iOS push configuration required, balanced
trial balance/zero missing payment baselines, no reconciliation-required webhook
matches. Owner pressed no Verify/Retry/financial buttons. This is owner testimony,
not an engineer-authenticated financial inspection or provider reconciliation.

One verification gap corrected in source: public readiness lacked cleanup status.
Public/admin status and worker now share the same pure effective-flag helper.
Verifier rejects advertised enabled/malformed retention and explicitly reports
legacy missing evidence as unverified, never false. Read-only status cannot run
cleanup; regression snapshots inbox/audit state unchanged even with enabled flag
in isolated fixture. 13 tooling tests, 103 relational API PASS/one PG-only skip,
all typechecks and API production bundle PASS. No cleanup/configuration/deployment
occurred. This small additive diagnostic update does NOT require an urgent repair
deployment; publish only in a separately approved release. Current hosted retention
closure is established by owner observation above.

Next independently actionable native gap: existing iOS matrix compiles but never
launches simulator apps. Extend same job with optional manual process-smoke target,
validate identity/source, temporary simulator cold launch/restart/screenshots;
no sign-in, permissions, background GPS, provider sends, orders or payments. Do not
claim UI/auth/physical acceptance from process survival. Preserve signing/jobs and
keep actual app/device/provider acceptance separately pending.

# November 20 — final acceptance checkpoint and safe release gates

Current functional source **d2cae2c0f4d8337335c060c2cc67c3e7689525cd** is pushed
on feature/rocoeats-launch-readiness. Validate push 44693512261 and Validate PR
44693518910 SUCCESS; native matrix 44693518942 pending at writing (both iOS builds
already SUCCESS). A CLI watcher hit GitHub HTTP 503; the underlying workflow was
independently confirmed SUCCESS, not rerun. Earlier payout 36b14d3, proxy 8ef5f54,
Clerk 83a5e86 and retention/arrival 9cd84ea each have all THREE CI SUCCESS.
Final tooling/checkpoint commit requires its own exact-SHA CI; inspect actual
conclusions before release, never infer from an empty/pending result.

Staging verifier now REQUIRES render_cdn_chain when a new deployment advertises
clientIpPolicy=render-cdn-chain-v1. Socket fallback/malformed/unknown source fails
verification; legacy absent policy is explicitly unverified. Twelve local verifier/
container tests PASS. No extra hosted requests/provider probes performed. This
closes the verification gap without assuming an observed Render hop count.

Completed source work: separately default-off TEST payout gate with in-flight ACK
preservation; shared trusted-chain guest/native IP identity and anonymous mutation
limits; protected Clerk proxy origin; default-off, matched-receipt checkout PII
compaction preserving holds/idempotency; honest driver-arrival attestation/body
validation; exact full provider reversal evidence. Final local 227 app/API PASS,
one PG-only skip; full builds/types, four-role website and native bootstrap/driver
browser checks PASS. Provider/payment/Clerk/native SDK tests remain simulations.
No migrations introduced. Protected signing infrastructure/recovery branch/branding
and historical order/financial records preserved. No Render deployment/settings,
real provider send, financial operation, municipal activation or PR merge.

Owner-only next gates:
1. Review/approve a specific final verified SHA for existing Render staging; keep
   configuration unchanged. No new variable is needed: test payouts and retention
   default OFF if absent. Do NOT activate retention with routine deployment.
2. After owner reports Live, engineer runs existing 23 read-only checks against full
   SHA; require new clientIdentity.source=render_cdn_chain and testPayoutsEnabled=false,
   closed ordering/live/municipal gates, health/CSP/native contracts. If source is
   socket, STOP release acceptance and investigate actual forwarding topology via
   owner-controlled access, without weakening trust or exhausting hosted buckets.
3. Existing signed Driver v172/Customer v173 remain compatible; no new APK required
   for these backend fixes. Physical customer/session and consented background GPS,
   real push receipt (providers still unconfigured), iOS signing/device and full
   native delivery lifecycle remain unverified. No repeat auth investigation.
4. Real Stripe settlement/refund/dispute/payout evidence, full legal retention/
   privacy/contact policy, geographic ground truth/activation and reliable hosting/
   recovery require their existing owner/provider approvals. No financial retry.

Next independent action: verify newest exact-SHA CI and repair any real regression.
If green, respond to new physical/provider/hosted forwarding evidence. No further
confirmed independent core defect remains after this targeted work; do not invent
features, repeat broad audits, or spend time retrying the known emulator Launcher
ANR/exhausted Geocodio test. All work must remain committed and branch clean.

# November 20 — financial reversal evidence correction

New confirmed defect: execution/read-only reconciliation accepted reversal IDs
without validating full amount, USD currency, transfer identity or committed
order/operation metadata. Mocked SDK reproduction returned a partial reversal as
success before fix (Missing expected rejection). Both paths now require exact
receipt evidence against immutable committed payout amount/order/transfer. Expanded
live transfer evidence, foreign/missing metadata, wrong IDs/currency and partial
amounts fail closed into review, never fabricated full recovery. Existing request
parameters/idempotency keys and historical operation payloads are unchanged.
No provider transaction or hosted reconciliation was attempted.

Final local validation: 227 app/API PASS / one PostgreSQL-only skip; types and
production builds PASS. Four-role mobile website workflow (including paused hours,
menus/modifiers, guest support/cancel, simulated payment, preparation, dispatch,
pickup/handoff, balanced ledger and disabled payout controls) PASS. Native bootstrap
and driver navigation/session-recovery browser regressions PASS; authentication,
provider/native SDK behaviors simulated. No physical acceptance inferred.

Verified earlier source CI: 36b14d352d2a9a9ea38eaff7bf072ffa4e5d7d1a payout and
8ef5f5465ab0ff3504793418c9c7620e4a1352dc proxy each all THREE SUCCESS. Clerk
83a5e869673be49f9a943fcc732a1e107276923e also all THREE SUCCESS. Retention/
arrival 9cd84ea65207ffdf29d1bbd24750759003452dd7 CI pending last observation;
check exact conclusions. Current reversal commit requires its own exact-SHA CI.
All work on feature/rocoeats-launch-readiness, PR #1 remains unmerged.

Owner gates: any Render deploy remains separately approved; no new migration is
required for these fixes. Keep all current settings/gates unchanged. New payout
flag defaults OFF if absent; retention defaults OFF and requires separate explicit
policy/backup/activation approval. After approved deployment, inspect /readyz
clientIpPolicy/clientIpSource (no IPs exposed), testPayoutsEnabled=false and closed
ordering/live/municipal gates. Actual Render XFF chain is UNVERIFIED until that
read-only source check; fallback is safe but may retain shared buckets. Do not claim
an actual hosted proxy configuration change or confirmed per-client isolation yet.
Driver v172/customer v173 physical checks, locked/background GPS, push credentials/
real receipt, iOS signing/device, authorized Stripe settlement/refund/dispute/payout
provider evidence, geographic acceptance and legal/hosting approval remain open.
Neon recovery branch and completed $19.19 order/financial history untouched.

Next independent action: inspect exact-SHA CI for newest commits; repair genuine
failures. If green, use targeted new evidence/acceptance inputs rather than broad
re-audits or speculative refactors. No further demonstrated independent core
workflow defect remains in this focused investigation. Do not repeat exhausted
Geocodio, resolved driver authentication, or emulator Launcher ANR investigations.

# November 20 — webhook privacy retention and driver evidence

Implemented opt-in ROCOEATS_WEBHOOK_RETENTION_ENABLED (default OFF, no hosted
setting changed). Only processed successful checkout events older than 30 days,
with matching normalized Stripe TEST session/payment-intent/gross/currency/paid
receipt, no lease, active financial hold or unfinished/failed financial operation,
may compact excess raw PII. Keep event ID/type/state/timestamps, normalized financial
references/amounts, canonical JSON payload digest and append-only audit receipt.
No records deleted; no replay/idempotency reset. Refund/dispute/unmatched/unknown/
recovery/newer events remain raw. Order-then-event locks and rechecks fence races;
concurrent runs compact once. Actual hosted cleanup requires separate approval of
policy and recovery backup, then explicit protected flag activation. Do not enable
it with a routine deployment. This is scoped checkout minimization, NOT a complete
legal retention policy or deletion of all provider PII.

Driver arrival remains authorized driver attestation; no trusted restaurant
coordinates exist for secure proximity proof. Reject client-supplied arrival GPS/
verification fields; return/audit driver_reported with gpsVerified=false and replace
misleading customer 'arrival confirmed' label. Existing GPS bounds/DB-time freshness,
assignment ownership, pickup custody and cryptographic handoff remain enforced.
Coordinates do not grant role/order transition authority. No rigid geofence, mock-
proof guarantee, municipal activation or physical GPS acceptance is claimed.

Local app/API 224 PASS / 1 PG-only skip, production builds and typechecks
PASS. Native bootstrap/session-recovery and dedicated driver browser regressions
PASS with simulated Clerk/native; actual local API. Retention race/hold/queue/raw-
PII/mismatched amount/deduplication and arrival regressions PASS. Initial retention
fixture left recoverable local queue rows affecting later tests; isolated fixture
cleanup corrected it. No hosted/provider operations occurred. CI for current SHA
must be read, not inferred. Payout and proxy commits have all three workflows PASS;
Clerk commit exact CI pending last observation.

Next independent financial task: provider reversal receipts currently accept an
ID without checking full amount/currency/transfer against committed earnings;
inspect and reproduce offline before correcting. Native/provider/physical acceptance
remains as documented; do not reopen resolved driver auth or exhausted Geocodio.

# November 20 — Clerk proxy origin spoof corrected

Local fake-upstream reproduction showed forged X-Forwarded-Host/Proto changed
Clerk-Proxy-Url to http://evil.example/api/__clerk. Fixed production origin to
protected PUBLIC_APP_URL; malformed/missing production origin refuses proxying
before upstream contact. Caller Host/forwarded host/protocol cannot choose auth
origin; upstream XFF uses validated rate-only client identity. Direct-host fallback
is nonproduction only. Four focused compatibility/spoofing/bypass tests and API
typecheck PASS. Mounted paths, cookies, gzip, bodyless responses, secret isolation
and TEST-key production bypass preserved. No real Clerk/provider call or hosted
change. Existing CSP already blocks inline script/object/framing and scopes Clerk/
Stripe; no separately demonstrated CSP bypass established. Do not weaken it.

# November 20 — Render rate-limit identity corrected

Proxy finding reproduced with real local Express HTTP: default req.ip identical
for different forwarded clients; guest create and native auth used that value.
Anonymous mutation middleware also skipped unauthenticated callers. Fixed via one
rate-only client identity helper: Render-assigned HTTPS service context, trusted
private transport and pinned official Cloudflare ranges, bounded right-to-left
chain, first untrusted public client. No trust-proxy=true/fixed hop assumption;
forwarded Host/protocol/CF-Connecting-IP do not authorize identity or auth. Direct
connections/unknown/malformed chains fall back to socket. IPv6 /64 buckets prevent
privacy-address churn; stored database keys remain hashed.

All guest/native IP guards share the helper; anonymous mutations now use atomic
per-client buckets BEFORE private-staging admission, separate from per-user signed
limits. Signed raw Stripe webhook remains before these middleware and unchanged.
/readyz reports policy/source only, never IP/header contents; actual deployed
forwarding topology remains UNVERIFIED until approved deployment and read-only
inspection. If CDN anchor absent, fallback is safe but clients may share a bucket.
Render's private network is an owner-controlled trust boundary; outside Render,
forwarded identities are not trusted. Public ingress port is not directly exposed
per Render docs. Sources checked 2026-11-20:
https://render.com/articles/how-render-handles-ddos-attacks
https://render.com/docs/web-services#port-binding
https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6
https://expressjs.com/en/guide/behind-proxies/

Local 220 app/API PASS, 1 PG-only skip; five focused client-address tests PASS
including actual socket/protocol/host behavior; production build/types PASS.
Existing 36b14d352d2a9a9ea38eaff7bf072ffa4e5d7d1a contains recovered payout fix.
No deployment/settings/provider/financial operation performed. Next: driver GPS/
arrival integrity targeted review and processed raw webhook PII retention, while
preserving idempotency/evidence and requiring separate hosted cleanup approval.

# November 20 — interrupted payout safety recovered

Primary baseline 79c5e46bf3fcad7812fadb1ab0ab5f11a5d9ed62 equals remote;
all three exact-SHA workflows SUCCESS (44491713653, 44491713606, 44491703164).
Owner independently confirmed BOTH hosted push providers remain configuration
required after deployed d2e79f7; no settings changed. Previous unsigned/physical
acceptance distinctions and recovery branch remain unchanged.

Recovered default-OFF TEST payout gate across request admission, worker claiming,
provider writes and operator controls. ROCOEATS_TEST_PAYOUTS_ENABLED is absent/false
by default; no hosted variable set. Only explicit private Stripe TEST configuration
(or isolated local simulator) may opt in after separate authorization. Queued/
expired/pending unknown transfer records stay untouched while closed; dependent
writes cannot bypass unknown transfers. In-flight receipt recording and explicit
refund/reversal recovery are preserved. No migrations or historical adjustments.
Public readiness now reports the gate and read-only verifier rejects an open or
malformed advertised gate, leaving old deployment's absent field unverified.

Before-fix regressions demonstrated admission was not separately gated and worker
mutated queued records while payouts supposed closed. Local full app/API: 216 PASS,
1 PG-only skip; extended relational cases 99 PASS/1 skip; 11 tool tests, full types
and production builds PASS. Four-role mobile browser validation PASS, including disabled settlement buttons; no
real-provider evidence claimed. Initial sandbox disallowed loopback test listeners;
reran with authorized local test-server access. Existing test fixture needed to
await asynchronously rendered settlement buttons before checking disabled state.

Current next priority: reported Render client-IP/anonymous rate-limit defect.
No trust-proxy=true or fixed hop count will be introduced. Official Render confirms
Cloudflare/load-balancer path, but XFF prefix cannot be assumed sanitized; inspect
trusted-chain handling and cover malicious prefixes/direct clients offline.

# CURRENT SIGNED NATIVE ARTIFACTS — November 19 post-deployment

Read-only hosted verification below remains current at approved d2e79f7; no further
backend deployment occurred. Independent builds from already CI-verified primary
**3e8afdf9fb45949d788b02234595962131d8e033** both SUCCESS:

- Driver **v172**, run **44490907162**, artifact **14513076061**,
  `RoCoEats-Driver-Android-Staging-Test-APK`:
  https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44490907162/artifacts/14513076061
  APK SHA256 dbc5a86ead3ec58636ba2fc091ce98cb985dcffe6d510bb845b3970ed151d657.
  ZIP SHA256 424a4956bc846632deaf16c48e9cd5892a72c7ff449271b66a88b2a1669e52fa.
- Customer **v173**, run **44490912804**, artifact **14513605155**,
  `RoCoEats-Android-Staging-Test-APK`:
  https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44490912804/artifacts/14513605155
  APK SHA256 d14e68daa187ecb754cd71b13a104c5ca2c0fc8dfbef0fbc8ec9714593c40429.
  ZIP SHA256 5c23498a346fc5a0a7a351b9f57d054fd7e6a2f7a057a70672c839b2af89cc6d.

Both downloaded through the GitHub connector after CLI artifact transport was
blocked; independently verified GitHub ZIP digest, APK checksum, exact source,
respective staging package/manifest/version, v2 signing report and existing public
certificate f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296.
No signing credentials read or changed. Protected runner verified compiled native
push presentation, backend contract/CORS, permissions and credential absence;
temporary signing/client material cleanup SUCCESS. Firebase CLIENT resources are
explicitly **unconfigured** in BOTH artifacts. No real notification receipt claim.

These main-source artifacts now include the GPS, push enrollment/opt-out and
presentation fixes with the deployed notification API, superseding compatibility
v165/v168 for future approved acceptance. No further backend deployment needed.
They are not physically accepted merely because v154 was accepted. Preserve v154
observed dashboard/session/foreground GPS result; new customer/background GPS,
real push, live offer/native lifecycle and all physical iOS checks remain open.

Phone artifact retrieval: signed-in GitHub link -> download ZIP -> Samsung My Files
-> extract -> matching APK -> update existing respective app without uninstalling.
Keep device security protections. Do not enable ordering, submit checkout, alter
availability, consent to background GPS or configure providers as part of the
read-only deployment verification. Separate supervised device exercise/consent
remains required. No new independent missing core workflow identified; next
engineering action is act on device evidence or protected provider inputs, not
repeat auth/provider/emulator investigations. Existing Operations provider-status
read-only owner question remains pending; no audit-writing or retry buttons.

Deployment-evidence checkpoint pushed as
**ec1e92940aa77321baa3ad250893e13486dfbb9c**; its three CI workflows must be
reported from actual results, never inferred from source-build success. This
artifact record is documentation only; no repeated local full suite is necessary.

# POST-DEPLOYMENT READ-ONLY VERIFICATION — November 19, 08:48 UTC

Owner reports existing Render service Live at approved functional source
**d2e79f73ad942c2ddd189714a8f755c909f8ad49**. Before deployment, owner created
Neon recovery branch `rocoeats-pre-migration-0029`, auto-delete Never, and confirmed
Android/iOS sandbox providers both configuration required. No agent deployment,
configuration change, provider send or financial operation was performed.

Independent existing staging verifier: **23/23 HTTP requests passed**, exact full
SHA match; database/auth/pricing/Stripe TEST/webhook configuration and all five
worker heartbeats ready. Public/private/effective ordering OFF; live charges OFF;
municipal enforcement OFF, provisional postal mode. CSP and one-year HSTS present;
Clerk source allowed, native origins allowed, untrusted origin/unsigned/forged admin
requests denied. Customer/restaurant/driver/admin route shells return 200. Public
`/api/healthz` requires private staging access (401, expected); `/livez` and
`/readyz` return 200. No authenticated role/session acceptance inferred from shells.

Hosted native readiness now advertises notificationDeviceStatusVersion=1 and both
customer/driver return schemes. Migration 0029 is consistent with successful
migration-before-start free-staging launcher and healthy push worker: its query
selects notification_devices including new app_id even with no eligible messages.
The migration journal/allowlist constraint were NOT directly queried with hosted DB
credentials. No missing-column failure observed. Existing order/ledger content,
current provider configuration, queued financial operations and authenticated roles
are inaccessible to these public reads. No public payout-disable switch exists:
TEST-only provider safety is verified, not a claim that authorized TEST settlement
could not be requested. Do not attempt one. Owner read-only Operations confirmation
of both providers still configuration required has been requested; pending.

Next independent action started: existing protected signed staging workflows for
both audiences at primary source **3e8afdf9fb45949d788b02234595962131d8e033**,
whose code/config equals deployed d2e79f7 (only docs/reference evidence differ).
These artifacts include current GPS/push fixes and require no further deployment.
Do not claim successful build/install/provider/physical acceptance until verified.
No new core feature gap established; preserve existing physical Samsung v154
acceptance and pending customer/background GPS/iOS/real push/financial/geographic
acceptance. Do not repeat completed provider calls or emulator Launcher ANR audit.

# OWNER DEPLOYMENT APPROVAL RECORDED — November 19

Owner explicitly approved functional commit **d2e79f73ad942c2ddd189714a8f755c909f8ad49**
INCLUDING notification migration 0029 to the EXISTING Render staging service,
after the existing backup/recovery review, with configuration/gates unchanged and
NO provider sends or financial tests. Do not ask for the same approval again.
This does NOT authorize later commits, provider credential changes, activation,
financial operations or merging. Functional SHA all-three CI SUCCESS as below.

No connected Render deployment capability is available; owner must use authenticated
phone dashboard. Deployment has NOT been performed/claimed. Owner instructions:
1. Existing /operations -> Service health and recovery: Android push and iOS sandbox
   push should say configuration required. If configured, pause/report; do NOT clear
   or change secrets (explicit no-send requirement). Do not press retry/verify buttons.
2. Confirm existing database backup/restore point. Do not create paid resources or
   destroy/change database. If this cannot be confirmed, stop deployment handoff.
3. Render -> existing LocalEats-Delivery-App -> Manual Deploy -> Deploy a specific
   commit -> full approved d2e79f73... SHA. No Environment edit/save/deploy-latest,
   new service, billing, root paid blueprint or PR merge. Keep gates OFF, TEST only.
4. On Live, owner reports exact source/status; engineer runs existing READ-ONLY
   23 staging checks, health/SHA/native notification capability/CSP/gates. Do not
   call signed Stripe/provider verification that writes audit, reconciliation or
   any payment/refund/transfer/financial retry. Preserve $19.19 order/ledger.

This approval supersedes older approval-pending text below for d2e79f73 ONLY.
Customer v165 check remains pending; GPS v168 background acceptance remains
separately owner-controlled/unverified. Primary/recovery worktrees are clean.

# CURRENT VERIFIED CONTINUATION — November 19, 2026

This section supersedes historical pending/failed acceptance instructions below.
Primary functional source: **d2e79f73ad942c2ddd189714a8f755c909f8ad49**.
ALL THREE exact-SHA workflows SUCCESS: Validate push 44485823122, PR 44485832924,
native matrix 44485832915 (actual customer/driver Android+iOS compilation).
Prior functional 89ec27c / 16036c6 / d16be56 / 3c5769d also all-three SUCCESS.
No new Render deployment, hosted environment/role/data change, provider message,
geocoder request, ordering activation, financial operation or PR merge occurred.
Public/private ordering, live charges and municipal enforcement remain unchanged/OFF;
Stripe TEST. Existing successful $19.19 order/financial records preserved.

## Completed this session

- Recorded owner-reported physical Samsung v154/d0cf7b8 acceptance: installed update,
  driver dashboard and owner/admin recognition, availability controls/online status,
  empty offers, historical delivery, navigation buttons, foreground GPS success
  indicator and close/reopen without reauthentication; empty-profile error absent.
  Do NOT reopen this resolved investigation without regression evidence.
- 57090a8: existing signed Android smoke now supports both audiences with strict
  source/artifact/package/hash/certificate checks and signed-out navigation/restart.
  2ced65f fixed absolute SDK ADB startup; 17a0d34 fixed early missing UI captures.
  Actual driver install and no pre-granted permission checks passed; subsequent UI
  execution blocked by OS "Pixel Launcher isn't responding" (44481651431). Rest of
  emulator flow is NOT passed. Preserve evidence; do not endlessly retry infrastructure.
- 89ec27c: fresh server eligibility before background watcher creation; cancel/
  revocation/error paths fail closed; malformed acknowledgements cannot fake upload.
- 16036c6: push registration deadline/account-change cancellation, abort/listener/
  late-result fencing, and retryable pending-token opt-out without false confirmation.
- d16be56: optional protected per-audience Firebase CLIENT JSON validation/private
  runner handoff/cleanup/compiled-resource check; no server credentials in an APK.
- 3c5769d: consent-created HIGH/private Android channel, configured iOS/Android
  foreground presentation, HIGH user-visible FCM messages, generated-config checks.
- d2e79f7: creation-based existing 5-minute push lifetime across worker/FCM/APNs;
  no old-queue burst after provider activation; expired admin retry denied; in-app
  history intact. No new SQL beyond already pending 0029 notification app identity.
- Saved one independent official USGS City Hall centroid reference (2021 load),
  12.649 m from saved CSV point, clears approved server margin. No activation/accuracy
  acceptance claimed. See delivery-area/usgs-city-hall-reference-2026-11-19.json;
  historical office-unit response still insufficient to establish exact rejection.

## Validation and exact ready artifacts

213 local app/API tests PASS, one PostgreSQL-only local skip; CI PostgreSQL checks
PASS. Production builds/typechecks, native-entry/account/browser regressions,
background consent/revocation, push race/opt-out/channel tests, 4 Firebase-config
Node tests, 8 Python policy/resource tests and generated native config checks PASS.
Reproduced regressions before corrections: startup from stale eligibility, late push
ack overwriting timeout, missing FCM priority, and historical queue send. Provider/
Clerk/native browser behavior remains simulated; unsigned compilation is not store
or physical-device acceptance. Real-provider financial acceptance is unchanged.

Customer compatible APK **v165**, source d0cf7b88164e25b5962fea4d06f7e918e45e195c:
https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44482969353/artifacts/14510280728
Signer SUCCESS; source/package/cert/v2-report/hash/no-driver-service independently
verified. Customer package com.rocoeats.app.staging installs separately from Driver.
APK SHA256 317cc7fa2009fb157cd1f28effd31fe520c2a00f12a0ef7428247a3f36c00fd4.
Owner nonfinancial login/menus/cart/saved-address/reopen test requested; pending.
Use intended existing customer browser identity, not owner approval by accident.

Driver GPS compatible APK **v168**, source 575ee0364ae6247a92f6fec7daa58de573439af4:
https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44484420131/artifacts/14510805880
Validate+signer SUCCESS; source/package/cert/hash and packaged GPS preflight verified.
APK SHA256 99ae03f6912bbd4ddf1e558bd63c7879f00a3849df4a3bbab9ae150d2b053ae5.
Update existing Driver without uninstalling. Requires separately owner-authorized
background/locked-screen/offline GPS exercise; do NOT toggle availability remotely.
These compatibility artifacts deliberately exclude new main push capabilities and
migration 0029, and require NO Render deployment. Do not merge recovery over main.

## Remaining owner-only gates / next exact engineering action

1. Customer physical check above, then controlled GPS v168 test with explicit consent,
   fresh eligibility, visible ongoing indicator, several minutes background/locked,
   and explicit offline/permission-revocation stopping. No orders/payments needed.
2. Approve a specific verified main backend deployment incl. migration 0029 after
   existing backup/restore review; existing Render service/configuration only, all
   ordering/live/municipal gates closed. 0029 adds notification_devices.app_id with
   customer default/allowlist; no order/financial table changes. NOT authorized or run.
3. Protected Firebase client/server inputs, APNs sandbox/Apple team/signing/device
   and authorized real receipt tests. Phone-only steps already in ANDROID_STAGING_TEST.md.
   No account, billing, secret or real send configured by engineering. Once backend
   capability is deployed/verified, build MAIN APKs via existing preflight/signer.
4. Explicit Stripe availability + separate authorization before any settlement,
   refund/dispute/transfer/payout exercise; geographic current ground truth/owner
   review + activation approval; always-on hosting/hosted recovery and approved
   contact/Privacy/Terms before commercial launch. Do not invent those decisions.

Resume by fetching latest primary/recovery refs and checking doc-only HEAD CI;
functional source above is verified. Act on new device/provider evidence or approved
release inputs, then fix confirmed failures. No additional missing core business
workflow was established; do not restart broad audits, re-test completed simulations
or invent features to avoid external acceptance. Emulator continuation is blocked by
its OS launcher ANR; actual Samsung acceptance is recorded separately, not inferred.

## November 19 — creation-based push expiry and verified GPS candidate

Confirmed before correction: existing worker sent a ten-minute-old queued alert
when a simulated provider became available (real disposable local DB test, sender
mock only). Enforce the EXISTING five-minute push lifetime from notification
creation, using database time before provider I/O. Expired attempts become failed /
NOTIFICATION_EXPIRED with no send or fabricated acknowledgement; inbox/history
retained. FCM gets remaining TTL (rechecks after OAuth), APNs gets original absolute
expiration. Admin retry returns 409 for expired alerts instead of refreshing them.
No new migration, financial/order mutation, provider send or hosted configuration.

Full local app/API checkpoint PASS: 213 tests, one PostgreSQL-only local skip.
Includes failing-before historical-queue regression, inbox preservation/denied
retry, clock/claim recovery regressions and sender deadline tests. Production
build/typechecks and final API bundle PASS. Existing TEST/provider simulation
limits remain; real device/FCM/APNs receipt NOT verified. Exact CI pending after push.

Main native-push policy 3c5769d9e509e565a32480f6ac5f7230d65dfc13 has all THREE
workflows SUCCESS (four native builds included). GPS compatibility source
575ee0364ae6247a92f6fec7daa58de573439af4 has Validate 44484419039 and protected
signer 44484420131 SUCCESS. Signed Driver GPS candidate v168 independently checked:
artifact 14510805880, package com.rocoeats.driver.staging, same certificate, v2,
GitHub ZIP digest/APK checksum and packaged fresh-eligibility preflight.
APK SHA256 99ae03f6912bbd4ddf1e558bd63c7879f00a3849df4a3bbab9ae150d2b053ae5.
Download https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44484420131/artifacts/14510805880
This is GPS-only on the deployed-compatible branch; it preserves v154 auth and
EXCLUDES newer main push APIs/Firebase/presentation changes. No Render deploy or
migration 0029 needed for this candidate. Physical background GPS NOT accepted;
owner-authorized explicit consent/online/locked-screen/offline test still required.
Do not automatically change driver availability or request real coordinates.
Customer v165 compatible artifact remains ready; physical check requested, pending.

Next: inspect exact pushed CI; preserve clean primary/recovery branches. Remaining
high-value acceptance requires owner devices, provider inputs, approved Render push
capability/migration 0029, Apple provisioning, approved financial exercises,
geographic ground truth/approval and production hosting/recovery. Do not invent
new core rewrites or endlessly retry blocked Pixel Launcher emulator ANR.

## November 19 — timely visible native push policy and customer artifact

Verified gaps: raw FCM Android payload omitted priority (normal may be deferred in
Doze), and native config omitted foreground presentation (installed iOS plugin
returns no presentation without it). New shared policy pairs user-visible FCM
messages with HIGH priority, existing short TTL/dedup and a fixed delivery-update
channel. After explicit notification permission, Android enrollment creates HIGH-
importance PRIVATE-lockscreen channel before token registration. Customer/driver
native configs request badge/sound/banner/list; iOS makes no Android channel call.
User/system notification preferences remain authoritative; no delivery guarantee.

FCM regression failed before change, three sender tests PASS after; consent/channel/
registration-race browser suite PASS; production builds/typechecks PASS; generated
Android AND iOS configs copied/verified for customer and driver. New config check
runs after mobile:sync in existing native jobs. Actual FCM/APNs receipt remains
unverified; no provider message, credential change or backend deployment occurred.
Sources 16036c67bed0afbe52253047cfa1a14fd2a54561 (cancel) and
 d16be5675aa29228008549f64b377ea03015a9a5 (Firebase handoff) each ALL THREE CI SUCCESS.

Compatible CUSTOMER APK v165 built on existing signer, source d0cf7b88164e25b5962fea4d06f7e918e45e195c,
run 44482969353 SUCCESS; artifact 14510280728 (RoCoEats-Android-Staging-Test-APK),
expires December 19. Independent ZIP/GitHub digest, APP_IDENTITY, customer package
com.rocoeats.app.staging, same public signing certificate, v2 signature report,
APK digest and absence of driver service verified. APK SHA256:
317cc7fa2009fb157cd1f28effd31fe520c2a00f12a0ef7428247a3f36c00fd4.
Download https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44482969353/artifacts/14510280728
It intentionally uses deployed-compatible recovery source, not newer main push/
GPS features. Does not replace Driver; no Render deployment/migration 0029 needed.
Customer physical installation/account/menu/guest/session acceptance NOT verified.
No automatic payment/order/availability test. If browser shows the wrong existing
account, do not approve; sign into intended customer browser account first.

Next: inspect current exact CI; ready owner-only gates are customer device check,
controlled background GPS, optional provider inputs/approved push backend migration,
Apple provisioning/device and financial/territory/hosting acceptance. Do not reopen
resolved Samsung auth or endlessly retry Pixel Launcher ANR. Keep all gates closed.

## November 19 — optional secure Android Firebase build handoff

Confirmed missing build input: Gradle applies Google Services only if
android/app/google-services.json exists, but protected staging signing had no
client-config input. Now optional audience-isolated repository secrets
ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON / ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON
are read only in the existing staging job. No secret was created/configured.
Helper rejects invalid/duplicate/wrong-package/project config and ANY server private
credentials; emits only minimal required public client fields to a new mode-0600
runner file, refuses overwrites, no values in output. File ignored by git and
always cleaned. Existing signing key/permissions untouched. APK verifier checks
compiled matching Google app/project resources if configured, and BUILD_READINESS
reports configured/unconfigured separately from actual receipt.

Four Node configuration tests + eight Python policy/resource tests + Python compile
and workflow YAML checks PASS. No real config supplied, configured binary/FCM/APNs
receipt NOT verified. No paid services/provider calls or hosted changes. Owner phone
steps are in ANDROID_STAGING_TEST.md. Main backend push capability/migration 0029
requires separate approved deployment; never bypass its packaging preflight.
Next independent action: build the compatible customer staging APK from d0cf7b8
against existing backend (no push acceptance claimed), then check final source CI.

## November 19 — push enrollment cancellation and acknowledgement recovery

Reproduced BEFORE change: delayed mocked enrollment POST completes after its
15-second deadline and still saves a device ID, despite the UI reporting timeout.
Fix scopes the shared enrollment to the initiating screen/account AbortSignal;
abort on account change/unmount/opt-out, stop pending authenticated requests,
fence late SDK callbacks/results and remove late-created listener handles. First
registration event wins; old cleanup cannot erase a newer operation. No timeout
extension, provider send or server authorization bypass.

A pending token is retained separately before POST because a lost acknowledgement
may still have committed. It is never displayed/logged. Explicit disable revokes
both confirmed and pending handles, still attempts native unregister during API
failure, and clears handles only after confirmed success. No false claim that a
timed-out enrollment is absent. Completed registration still requires server status;
provider acknowledgement is not actual device receipt.

PASS: reproduced race and late-listener/account-change/opt-out component tests,
existing background consent/revocation/legacy opt-out tests, native-entry and full
account/native-handoff browser regressions, production/typechecks. Local app/API
checkpoint: 210 PASS / one PostgreSQL-only skip. Native/provider APIs in browser
fixtures are mocked; real Firebase/APNs delivery is NOT verified.

Driver emulator: 17a0d34 fixed invalid early UI captures; source/signature/manifest,
actual APK install and no pre-granted permission checks passed. Run 44481651431
then blocked on OS dialog "Pixel Launcher isn't responding"; no startup/deep-link
acceptance claimed. Stop repeated emulator work and continue independent product
readiness. Physical Samsung v154 acceptance above remains separate and valid.
GPS source 89ec27ca34510dd1102f69464186fb02b4853b88 has ALL THREE CI SUCCESS.

Next: prepare optional protected Firebase Android client configuration handoff;
current build applies Google Services only when an untracked google-services.json
exists, while signing workflow has no input for it. Do not create provider accounts,
change hosted secrets or claim compiled Firebase support before checking APK output.

## November 19 — fresh background GPS authorization preflight

Confirmed regression before change: watcher startup succeeded even when the
server would report offline/unapproved state; cached UI intent was its only gate
until a later GPS fix. Now, after explicit consent/device notification permission,
read fresh existing /api/driver/availability and require boolean approved/available/
online plus a valid assignment shape before creating any background watcher.
Offline, revoked, malformed/unavailable responses fail closed; stopping during this
read never starts GPS. Every subsequent position retains heartbeat, current-state,
server authorization and timestamp/stale/mock-fix checks. Location acknowledgements
must be actual booleans; malformed successes cannot report upload or forward GPS.
No new endpoint, role, permission, tracking-on-restart or secret. Existing Android
location-only foreground service/notification and iOS declarations are preserved.

Eight controller tests PASS (including failing-before preflight, cancel/revocation,
outage/fresh-fix recovery and malformed acknowledgement), background-consent/push
browser regressions PASS, production builds/typechecks PASS. These are simulated
native/API tests; physical background/locked-screen GPS remains unverified. No
hosted availability/locations/records changed. Full CI to verify after this push.
Next independent priority: reproduce/correct late push-enrollment completion after
its deadline or account change using existing registration component/fixtures.

## November 19 — driver emulator execution correction

Smoke source 57090a8 passed both Validate workflows and three native jobs; driver
compile hit Maven HTTP 429 before compiling, retried only that job. Manual driver
smoke 44478459873 verified exact artifact/source/hash/certificate/manifest but never
installed the app: boot loop could not execute adb. Saved emulator evidence shows
Android DID boot in 35 seconds, while boot-completed.txt says "timeout: failed to
execute process: No such file or directory". Fix uses installed SDK's absolute adb
path, exported for Python, and starts daemon before emulator. No relaxed deadline,
permission/signature checks or signing changes. Six policy tests, Python compile,
shell syntax/YAML checks passed. Re-run existing driver smoke against v154 signing
run 44468084935 after push; no app/device acceptance is inferred from boot.

## November 19 — owner-reported Samsung version 154 acceptance

Owner physically tested signed Driver APK v154, source
 d0cf7b88164e25b5962fea4d06f7e918e45e195c, on Samsung Galaxy S22 Ultra.
Observed: update installed without uninstalling; dashboard rendered; owner/admin
privileges recognized; availability controls appeared and reported online; offers
loaded the normal empty state; previously completed test delivery appeared;
restaurant/customer Google Maps buttons were visible; app reported successful
foreground GPS upload; close/reopen restored dashboard without another sign-in;
ACCOUNT_PROFILE_RESPONSE_INVALID_EMPTY did not recur during this test.
This supersedes older failed/unverified auth/dashboard acceptance below. Do not
repeat the resolved investigation without new regression evidence. These are owner
observations, not independently inspected hosted permissions or GPS records.

NOT verified: background/locked-screen GPS, actual push delivery, receipt of a live
assignment, navigation app execution, full native delivery lifecycle, physical iOS.
Existing completed $19.19 TEST order and financial records remain unchanged.

Driver signed-APK smoke implementation completed: shared audience/source/input
policy, strict same-repo successful packaging run, exact identity/hash and existing
public certificate, compiled manifest validation; customer paths preserved, driver
safe signed-out entry/deep links/navigation/restart and explicit evidence limits.
No signing job/key/permission changes. Six offline policy tests, Python compilation,
shell syntax, workflow YAML and actual version-154 source metadata selection PASS.
Actual emulator run/CI pending: dispatch existing native-validation.yml target
android-smoke, audience driver, apk_run 44468084935. This does not start auth or
business operations. All ordering/live/municipal gates OFF.

## NEXT SESSION — accelerated completion plan, November 19, 2026

Supersedes historical pending/build-next instructions below. Planning-only update;
no tests rerun, hosted changes, deployments, provider calls or financial operations.
One-time CI inspection: fix 4c44ab66188475dce41975cc79ea03a1f4436776 and checkpoint
06a378c081feeacf208e28cd05645beafe106222 each have all THREE workflows SUCCESS.
Compatible APK d0cf7b88164e25b5962fea4d06f7e918e45e195c has Validate 44468084570
and protected signer 44468084935 SUCCESS. No rebuild/backport is needed.
Signed artifact: run 44468084935 / artifact 14502534790,
RoCoEats-Driver-Android-Staging-Test-APK, source d0cf7b8, expires December 19.
GitHub ZIP digest: 5c49281d7b287e43c9b8fee301895dcb5900fe5b55c1e8b971867301ddd5d7c8.
Binary has NOT yet been independently unpacked/verified for this artifact; do that
before owner handoff. Verify APP_IDENTITY source, package, version >152, same cert,
APK hash and packaged reader fix. Physical driver acceptance remains UNVERIFIED.

### Five highest-priority unfinished launch requirements

| Priority | Requirement | Existing state | What remains |
| --- | --- | --- | --- |
| 1 | Usable customer/driver native apps | Shared auth, menus, checkout, tracking, driver operations, navigation and consent-based background GPS implemented; four native builds and simulated/browser tests verified. Android driver installation/browser approval physically verified. | Driver controls/session restore after reader fix; real background GPS/battery recovery; customer native device acceptance; signed iOS distribution and physical customer/driver evidence. Driver signed-APK emulator target is MISSING. |
| 2 | Reliable customer/restaurant/driver notifications | In-app notifications, durable outbox/retry, account-scoped device enrollment/opt-out and distinct APNs audiences implemented and automated-tested. | Deployment/verification of newer push capability and migration 0029 requires separate approval; actual Firebase/APNs receipt and background delivery unverified. Do not deploy or claim receipt from mocks. |
| 3 | Complete provider financial acceptance | TEST checkout, signed idempotent webhooks, ledger, earnings, refund/dispute/Connect/payout/reconciliation controls implemented and automated-tested; one real $19.19 TEST delivery completed. | Provider fee/net settlement evidence plus separately authorized refund/dispute/transfer/payout acceptance. Historical balance/order must not be changed to manufacture proof. |
| 4 | Approved Rockwood geographic acceptance | Boundary/exclusions, ZIP 37854, 30 m margin, strict Geocodio adapter/caching/fail-closed checks implemented and tested; limited real-provider evidence preserved. | Independent ground truth, unresolved historical office-unit evidence, owner accuracy acceptance and separate activation approval. No repeat exhausted provider suite; no expansion. |
| 5 | Operable public launch and recovery | Customer discovery/menus/guest checkout/tracking/cancellation/support; restaurant onboarding/menu/inventory/capacity/fulfillment; admin dispatch/refunds/reporting/recovery are implemented and regression-tested. Backup/restore and deployment tooling tested locally/CI. | Always-on hosting decision and authorized hosted restore/operational drill; approved contact/Privacy/Terms content is MISSING; hosted cross-role acceptance for newer code and commercial activation approval remain unverified. Render Free is not always-on dispatch. |

These are completion/acceptance gaps, not proof that the underlying business APIs
are missing. Do not restart a broad audit or rebuild working checkout, restaurant,
dispatch or finance flows. Existing review found no additional missing core API.

### Single highest-value independent implementation: signed driver APK emulator smoke

Confirmed gap: scripts/android-staging-smoke.py hardcodes customer package,
activity, APK filename and customer-only guest paths. The android-smoke job in
.github/workflows/native-validation.yml explicitly exits for audience=driver.
Reuse the existing isolated emulator and protected signed artifacts; no new service.

Files/components: scripts/android-staging-smoke.py,
.github/workflows/native-validation.yml (android-smoke job only),
scripts/staging_apk_policy.py + scripts/test_staging_apk_policy.py,
config/native-audiences.json, scripts/start-android-qa-emulator.sh only if required;
update docs/ANDROID_STAGING_TEST.md with the actual resulting evidence/limits.
First implement pure audience/artifact selection with offline tests, then the
existing smoke flow. Keep signing jobs, keys and workflow permissions unchanged.

Acceptance criteria:
1. Explicit customer/driver input maps only to reviewed package/activity/filename/
   artifact/scheme. Wrong audience, package, source, hash or certificate fails closed.
2. Preserve existing customer smoke checks; driver uses its own signed APK and
   renders secure signed-out entry, navigation and bounded recovery instead of
   expecting customer guest/order controls. No role elevation via driver branding.
3. Driver cold-start return link, malformed/authority-bearing links and force-stop/
   relaunch recover safely; no automatic permission grants or GPS/push enrollment.
4. CI installs/exercises the actual signed driver APK on the disposable emulator,
   records screenshots/results/crash checks and exact source/package. Do not claim
   authenticated-session, physical Samsung/iOS, push receipt or GPS acceptance.
5. No accounts, bearer tokens, auth approvals, guest capabilities, hosted writes,
   orders, payments or provider sends. Do not relax private staging or APK security.

After reset: verify the ready artifact for owner handoff, then implement this
narrow missing smoke target while the owner separately tests the meaningful reader
fix. Do not ask for tests of older APKs. If emulator infrastructure is concretely
blocked, preserve tested pure selection/manifest changes and record the exact error;
do not spend another session troubleshooting emulators without a concrete fix.
All ordering/live/municipal gates stay OFF; Stripe TEST; no deploy/merge/launch.

### Saved release pointers before weekly reset — November 19

Functional fix committed/pushed: 4c44ab66188475dce41975cc79ea03a1f4436776.
Compatible APK source committed/pushed: d0cf7b88164e25b5962fea4d06f7e918e45e195c.
Both sources PASS 20 focused transport/account tests, production/typechecks and
native main-entry streamless-response/controls/access/navigation/reload regressions.
Main CI runs 44467913137 (push Validate), 44467919196 (PR Validate),
44467919195 (four native jobs) were pending when saved. APK Validate 44468084570
and protected driver signer 44468084935 were initiated and pending, NOT passed.
Signing run: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44468084935

NEXT SESSION: no investigation/reimplementation or backport is needed. Fetch the
latest branch and inspect these exact-SHA workflow conclusions. Fix genuine
failures only. After APK Validate/signing success, verify APP_IDENTITY source d0cf7b8,
package com.rocoeats.driver.staging, new version >152, same public certificate and
APK checksum, and packaged reader correction before offering phone installation.
Do not offer an older artifact or claim physical acceptance. One meaningful phone
test then checks existing sign-in, permissions, availability controls (do NOT toggle
availability), menu and force-close/reopen. If still empty, collect only the new
sanitized transport facts, never credentials or payloads. No Render deployment or
migration 0029 needed. Public/private ordering, live charges, municipal enforcement
stay OFF and Stripe TEST. No hosted changes/financial/provider operations performed.
This section supersedes the historical backport/signing-next instructions below.

### November 19 — confirmed response-reader defect fixed; physical verification pending

Physical v152 returns ACCOUNT_PROFILE_RESPONSE_INVALID_EMPTY. Before editing the
transport, the actual native-entry browser regression reproduced that EXACT code
with valid authorized driver JSON from the local API: only the Response.body
property was null; text() still held the payload. The shared custom-fetch helper
incorrectly discarded it using the stream/Content-Length hints. Evidence:
/tmp/roco-native-body-code-repro.log. This establishes the client defect; Samsung's
actual stream/header properties and raw authenticated response remain unobserved.

Fix: determine forbidden bodies only from HEAD/204/205/304 semantics; otherwise
read through text()/blob(). Null/unavailable streams and stale Content-Length: 0
no longer discard readable data. Preserve real empty payloads, strict profile/
access validation, one-401 session renewal, bearer scoping and all server roles.
Optional account-read diagnostics expose only status, media category, stream
presence, declared length, decoded character count and redirect boolean. No URLs,
identities, headers, tokens, cookies, body contents or persistent logs.

Validation PASS: 20 focused transport/account tests (12 mobile + 8 account),
production build/typechecks, actual native main-entry regressions with streamless
real local authorized API JSON, driver controls, access/menu navigation and reload.
Native/Clerk/response-stream properties are simulated; API/DB disposable local.
Logs: /tmp/roco-stream-mobile-direct.log, /tmp/roco-stream-account-direct.log,
/tmp/roco-stream-native-browser.log, /tmp/roco-stream-build.log.

Resume: inspect exact main HEAD CI; apply this commit's seven-file source/test
patch to fix/driver-staging-session-recovery (currently 744ecb09) without newer
notification APIs/migration 0029. Run its focused checks, push, dispatch existing
native-validation.yml target=staging audience=driver, verify exact-SHA Validate
and signing. No backend deploy is needed for this client transport correction.
Do not ask for another phone test until a verified replacement APK is available.
Then install as update (same signing identity, preserve data), verify Account
Access fields and Driver availability controls, force-close/reopen once. Do not
toggle availability/order/payment settings. Physical acceptance is NOT yet passed.
No hosted settings/data, role grants, provider lookups, financial action or deploy.
Keep public/private ordering, live charges and municipal enforcement OFF, TEST only.

### CI fixture correction — November 18

Initial blank-workspace repair Validate failed at the background-GPS browser test:
its mocked profile omitted createdAt (required by the existing real API contract).
Correct the test fixture, do NOT relax profile validation. Protected APK run
44268689778 built version 148, but its source 6d2d5a2 failed that fixture check;
do NOT hand that artifact to the owner. Build the replacement from the corrected
supplemental HEAD after focused GPS tests and exact-SHA Validate pass. Product
client code remains identical to the locally tested repair. No backend deployment.

### November 18 — version 144 physical blank-workspace investigation

Supersedes the earlier request to test v144 as a candidate: owner physically
confirmed browser sign-in completes and Account Access shows signed-in identity.
Driver controls are NOT accepted. Driver workspace appears blank; Access page
shows identity/copy/refresh but no Profile/Role/Driver access fields. No evidence
establishes that server permissions changed; do not grant access or change IDs.

Before app changes: actual-main native browser regression reproduced the Access
screen silently omitting permissions after HTTP 200 JSON null, with no error.
Normal account/menu/access -> Driver navigation passed. Source confirms profile
and access readers trusted TypeScript types without runtime response validation;
legacy /dashboard could render a header without dashboard data. This proves UI
failure paths, NOT that the handset actually received null. Its raw authenticated
HTTP response is unavailable; exact native transport cause remains unverified.

Client-only correction: validate existing profile/permission response contracts;
empty/text/malformed successes fail closed with sanitized ACCOUNT_PROFILE or
ACCOUNT_ACCESS_RESPONSE_INVALID_{EMPTY,TEXT,SHAPE} codes. No role inferred or
changed. Access reads now use the existing bounded sessionRead/one-401-refresh
path and explicit loading/error/retry. Mark a resolved Access screen ready so the
outer startup watchdog does not later replace it. Dedicated driver /dashboard
and Access back link route to /driver; website/customer routing is preserved.

Local validation: 203 app/API tests PASS, one PostgreSQL-only local skip; production
build/typechecks PASS; actual native-entry browser regressions PASS (null profile
and permissions, stalled Access read, 403, explicit recovery, legacy route/menu,
restart). Existing account/native-handoff and full driver browser regressions PASS.
Native/Clerk and interrupted responses are simulated; local API/DB are disposable.
No hosted mutation, backend deployment, migration 0029, provider lookup or financial
action. Ordering/live/municipal protections remain unchanged.

Current main functional source: 1c3b0d16286d8b847dbc22fd7a6ecab77507b697.
Main CI: Validate push 44268650570, PR 44268656412, four native builds 44268656320.
Exact compatible APK source: 6d2d5a2e6c92abc3cfb194c547904bbf995685aa.
Its Validate 44268653080, four native builds 44268683728 and protected signer
44268689778 were dispatched and running when this checkpoint was written.
Inspect their actual final conclusions; pending is not success. No signing
initialization or credential/permission changes. All seven repair files match
main exactly. Compatible local build/types and native-entry regressions pass.
Download after SUCCESS: GitHub -> Actions -> run 44268689778 -> artifact
RoCoEats-Driver-Android-Staging-Test-APK. This is a client repair; NO Render
redeploy or migration 0029. Verify source/certificate/new version before phone
retest; do not use the older v144 artifact. Samsung acceptance requires
usable approved-driver controls and restart restoration OR exact visible safe
ACCOUNT_* / NATIVE_* code. Do not repeat account creation, change allowlists or
claim provider/device acceptance from automated tests. Continue GPS/push acceptance
after real authenticated workspace evidence; no speculative auth rewrite.

### VERIFIED replacement APK and recovered checkpoint — November 18, 2026 UTC

This section supersedes older pending/outage/artifact instructions below.
- Final main functional source: **cfaf340ecbc7b57eb845271d7a54d454001df8f4**.
  All three exact-SHA workflows SUCCESS: Validate push 44263848163,
  Validate PR 44263856079, native matrix 44263856139 (four actual builds).
- Final supplemental APK source: **61b23965c2009097e3aca2b2bfdbb355a1239989**.
  Validate 44263733677, four native builds 44264142874 and protected driver
  signing 44264149130 all SUCCESS. No signing initialization or permission changes.
- Download: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44264149130/artifacts/14409687170
  Artifact RoCoEats-Driver-Android-Staging-Test-APK, expires December 18.
  APK source/package checked independently against APP_IDENTITY.json; version
  code 144 (prior installed 135), package com.rocoeats.driver.staging, same
  public certificate SHA256 f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296.
  APK SHA256 e553014414fb5245d4b3b1652e8daecbe2fefa9c0578276e1782b918b1154024.
  Downloaded ZIP matches GitHub digest; packaged JS includes FINAL cancellation
  fence NATIVE_START_CANCELED_RELOAD, outside-provider watchdog and recovery UI.
  Signing job verified v2 signature, package/permissions, absence of packaged
  server credentials, and removal of temporary private signing material.
- Runtime recovered. Both local worktrees were compared to remote, duplicate
  patches saved as native-fence-recovery-main/native-fence-recovery-apk stashes,
  then fast-forwarded cleanly. Preserve those backups; do not blindly reapply.
  Agent dispatched the FINAL signing job; owner does not need to run a workflow.
- Final backport account/handoff/browser checks passed again after recovery.
  Main: 202 local app/API passes, one PG-only skip; backport: 198 passes, one
  PG-only skip. CI uses PostgreSQL. Production audits, typechecks/builds,
  startup entrypoint tests and four-platform compilation passed. Native/Clerk
  browser behavior is simulated; this is not physical handset acceptance.
- Read-only hosted checks: 23/23 PASS on existing deployed 6cc3c784 source;
  ordering/public/private/live/municipal gates remain closed, Stripe TEST.
  No deployment, hosted writes, provider lookups or financial action performed.

Next necessary owner action (Samsung only): open the artifact above while signed
into GitHub, download ZIP, extract in My Files, install the enclosed APK as an
UPDATE without uninstalling/clearing app storage. It is the same signing identity.
Open RoCoEats Driver. A saved active session should restore; otherwise complete
one browser approval and return. Keep app foreground for up to 30 seconds.
Record usable controls OR exact visible NATIVE_* recovery code, then force-close
and reopen once to verify restoration. Never share tokens/cookies/credentials.
Do not change availability, order, payment or geographic settings for this test.
No Render deploy or migration 0029 is necessary for this APK; supplemental branch
intentionally excludes newer notification APIs. Do not deploy it over main.

Actual Samsung promise that stalled remains unknown. Reproduced defects include
Browser.close blocking navigation BEFORE account timeout, unbounded SDK ticket/
activation, replay across remount/callback, and late auth-start opening a browser
after timeout. Fixes preserve one-use proof, Clerk finalization/tasks and server
roles; no authorization bypass. Outer watchdog uses cumulative FOREGROUND time,
survives provider withholding children, preserves first safe phase diagnostic,
and quarantines late completions. Unhandled optional plugin failures are caught.
Physical dashboard/session acceptance is the next blocker; do not claim it fixed
on-device before owner evidence. Next independent work should follow that evidence,
then driver foreground/background GPS, push delivery and iOS physical acceptance.
Do not repeat Geocodio calls, activate territory or perform provider transactions.

### Final cancellation fence preserved after command-service outage — November 18

Earlier repair candidate 4c247335583fd24022650dc5bac64d63ab987845 passed Validate,
four native compile jobs and protected signing, but is SUPERSEDED before physical
handoff. A focused check then reproduced one late browser open after the startup
watchdog had shown recovery. The final fence preserves the first diagnostic,
cancels expired handoffs, prevents duplicate starts and rejects late auth-start
results before saving/opening another approval. The new regression passed locally
on main (zero late opens), along with all account/handoff/browser checks and the
production build/typechecks. Do NOT install the older 4c APK for this retest.

The cloud command service disconnected during exact-backport final validation:
"exec-server transport disconnected". Environment status reported running; that
does not prove shell availability. Tested changes are preserved through the
connected GitHub API with parent/expected-head checks; no force push. Exact new
CI must pass before release. No backend/settings/migration 0029 or financial
operation occurred. The signed APK for THIS final source still needs a NEW run
of existing native-validation.yml, target=staging, audience=driver on
fix/driver-staging-session-recovery. Rerunning an old job retains its old SHA and
is NOT a substitute. Do not change signing workflow permissions or credentials.

Agent resume when shell returns: main local HEAD may still be cf1cca9 with four
dirty fenced files; repair local HEAD may be 4c24733 with those four files plus
checkpoint/backlog edits. Fetch remote, compare the four source/test files with
remote (the verified patches should match), preserve dirty files in a recovery
stash before fast-forwarding each branch, then verify the resulting tree. Do NOT
force reset, overwrite work, pop duplicate patches blindly, or force push. Keep
the recovery stash until remote/local equivalence is verified. Owner needs no
terminal/laptop: if dispatch remains unavailable, use GitHub Actions on Samsung,
Run workflow -> branch fix/driver-staging-session-recovery -> target staging ->
audience driver. Verify the NEW run/source/signature/artifact before installation.
Physical handoff, session restore and bounded-code acceptance remain unverified.
Historical checkpoints below are superseded by this final fence.

Final supplemental APK source: **61b23965c2009097e3aca2b2bfdbb355a1239989**. Its
exact-SHA CI must pass; no signed APK for this SHA is yet verified. A new protected
staging/driver dispatch is required. Primary code below contains the same four
locally tested fence changes, preserving all other main work.

# RoCoEats resumable engineering checkpoint

## READ FIRST — website and native continuation, November 17, 2026 UTC

This section supersedes the historical checkpoints below. Resume the existing
repository/branch; preserve all completed work. Do not restart completed checkout,
authentication, homepage, delivery or Stripe investigations. The owner explicitly authorized customer and dedicated driver Android/iOS development
on November 17. This supersedes historical native deferral notes. Shared website/
backend completion comes first; reuse existing native code and signing infrastructure.

### Current release pointers — November 18, physical acceptance still pending

Main functional/security source **bbdf34edf37eb669cb5590d5d1a4c9ae041d0c31**
has ALL THREE workflows SUCCESS:
- Validate push: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44259901101
- Validate PR: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44259910004
- Four native jobs: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44259910020
Prior 29551e9 audit failures are historical, not successful validation.

Replacement APK source **4c247335583fd24022650dc5bac64d63ab987845** on existing
supplemental branch **fix/driver-staging-session-recovery** (18bb parent). It
contains the tested client handoff/actual-entry guard and necessary audit fix,
but EXCLUDES notification migration 0029 and newer notification APIs. Existing
Clerk TEST proxy remains bypassed; no hosted/backend deployment is required.
Do not deploy/merge this supplemental branch over main. No signing setup changed.

Exact repair runs were pending when this checkpoint was written; check real
conclusions before claiming ready:
- Validate: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44260685822
- Both customer/driver Android/iOS compile: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44260755182
- Actual protected DRIVER signer: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44260761946
Signing initialization is skipped by design; android-staging itself must succeed.
Artifact name: RoCoEats-Driver-Android-Staging-Test-APK. After success, inspect
APP_IDENTITY.json (4c247335... / com.rocoeats.driver.staging), manifest versionCode
higher than installed 135, v2 signature/existing owner certificate, APK checksum,
startup recovery literals and key-material cleanup. No credential may be printed.

Local exact APK source: 198 app/API passes, one PG-only skip; production builds/
typechecks, full account/handoff tests and actual native-entry restored/withheld
provider cases PASS. Production security audit clear. Main source: 202 passes,
one local PG skip, plus full customer/driver/browser regressions. These simulate
SDK/native/provider behavior; no physical success, push receipt or GPS acceptance.
Hosted 6cc3c784 again passed 23 read-only checks; all ordering/live/municipal gates
closed. No provider, financial, settings, permissions or database operation.

After all checks/signing: Samsung → successful signer run → download NEW artifact
ZIP → My Files → Extract → open APK to UPDATE existing app. No uninstall/storage
clear/security bypass. Restore existing session, or approve one fresh browser
request. Callback must not demand repeated approval; controls or a fixed NATIVE_*
error with reload/cancel recovery must appear within 30 FOREGROUND seconds. Share
only visible code/text; no tokens, cookies or credentials. If a prior one-use
activation was interrupted, use cancel pending sign-in/reload explicitly; never
silently re-consume it. Then verify a fresh request once. GPS/background/push work
remains blocked on this physical outcome. No Render deploy or 0029 approval needed
for this APK. This documentation commit also triggers CI; inspect its exact runs.

### November 18 CI security correction — separate from handset defect

Native repair source 29551e94c17948cf08b247e0dcc3f7c5f2463a47 was pushed; its
Validate runs 44258685115/44258691610 failed BEFORE tests on a newly reported
HIGH picomatch advisory GHSA-fc5q-39xc-vjpf (<=4.0.7; no patched published release).
Do not call those workflows successful or attribute this dependency issue to the
phone. The existing proxy used no glob matching; removed http-proxy-middleware's
unused matcher layer and use its EXACT pre-existing httpxy 0.5.5 engine directly.
Fixed Clerk HTTPS target, key forwarding/isolation, mounted path/body forwarding,
gzip/cookies/content lengths and HEAD/204/304 semantics are preserved by local
real-HTTP compatibility tests. Network failure produces an empty 502, no secrets.
Private TEST credentials still bypass the proxy; actual Render is unchanged.

Production audit now reports NO known vulnerabilities, with no audit exceptions,
policy weakening or advisory suppression. 202 app/API passes, one local PG-only
skip, typechecks/production builds pass. This source dependency/middleware repair
must be included in the isolated APK branch to pass unchanged CI. It changes NO
business API, database or migration and requires NO backend deploy for this APK
(auth uses the already deployed TEST endpoints, proxy remains inactive there).
Future deployment of newer main, including migration 0029, remains separate.

### November 18 — 18bb repair FAILED physical acceptance; native handoff repair

Authoritative main HEAD at resume: a6f22ef578297ce37cad575dc1b2070a4842849a.
Installed APK: 18bbca77700e5d2ea4c0d8ba3b10b065608d45cf, version code 135.
Owner confirms installation and browser approval, then another approval request
and indefinitely skeletons, NO ACCOUNT_* error. The previous account-read fix is
NOT physical acceptance and did not cover this observed startup failure. Preserve
it as bounded-read protection, not a claimed handset root-cause explanation.

Before changing app source, reproduced an earlier boundary with the unchanged
18bb-compatible source: successful ticket/finalize followed by Browser.close()
never resolving prevented account navigation. Browser regression failed waiting
for account/setup (4 s); no profile request/deadline ever began. Source also
awaited ticket/finalize without deadlines, persisted no consumption phase, and
always routed auth callbacks back to sign-in. Static public Clerk 6 source confirms
finalize awaits setActive/getToken before session emission; don't invent a default
redirect/network explanation or claim the exact handset promise was observed.

Current client-only correction:
- Browser dismissal no longer gates navigation or auth callbacks.
- Ticket redemption/activation have bounded, sanitized per-stage errors, with
  active-session confirmation and incomplete session tasks rejected (not bypassed).
- One in-flight operation per saved request survives route/StrictMode reattachment.
  Duplicate auth callbacks preserve pending/active sessions instead of reopening
  sign-in. Persisted phase distinguishes waiting from consumed/activating; interrupted
  consumption fails closed, while an already active restored session is reused.
- Polling pauses in background. No ticket is persisted or placed in a deep link.
- Native startup watchdog wraps the ACTUAL main.tsx lazy app outside Clerk and
  routing: 30 foreground seconds, phase changes do not extend it. SDK loading or
  unmounting cannot bypass recovery. Late completion cannot clear a latched error;
  reload is explicit. Existing role/profile/20-second account guards are preserved.
- Unavailable optional native/push listeners are handled without unhandled startup
  rejections. This is not proof of push delivery/configuration.
- Diagnostics contain fixed NATIVE_* phase/error codes only, no IDs, URLs, provider
  errors, tokens or cookies. No hosted diagnostic endpoint or logging was added.

Local validation completed: 199 app/API passes, zero failures, one PG-only skip;
production/typechecks and final account/native handoff tests passed. Actual main-entry
browser test verifies withheld Clerk produces recovery and a restored/restarted
approved session reaches controls without auto-starting GPS (simulated SDK/native,
real disposable local API). Full driver and customer order-through-delivery browser regressions also pass;
exact-SHA CI must complete. No physical success claim yet. No provider calls/transactions,
permissions/settings changes or migration deployment. Existing order/ledger untouched.

Release: preserve main's newer notification work and un-deployed migration 0029.
Backport ONLY this client repair onto existing supplemental staging repair branch
fix/driver-staging-session-recovery (18bb parent) and use protected signer. No
backend deployment is required by this patch. Check compiled package, certificate,
higher versionCode and packaged startup codes before physical handoff. Do not
initialize signing or deploy the supplemental branch over main.

Next: complete regression validation, commit/push main and backport, inspect all
exact-SHA CI/actual signing steps, record artifact identity and give phone update
steps. Owner retest must establish controls OR a bounded NATIVE_* error before
GPS/background/push acceptance continues. No repeat Geocodio/financial operation.
November 18 read-only hosted verification: exact 6cc3c784 revision, 23/23 PASS,
public/private/effective ordering false, live charges false, municipal enforcement
false, Stripe TEST and database/auth dependencies ready.

Historical checkpoints below are superseded by this physical rejection.

### Confirmed physical driver blocker — November 17 continuation

Owner physically installed/launched signed driver APK from **6cc3c7848b7196aa00a26fc40676d939aa0c0a56** on Samsung Galaxy S22 Ultra. Browser sign-in initially
failed but later SUCCEEDED. Driver workspace remains skeletons after restart.
Installation is accepted; native authenticated dashboard/GPS/push are NOT accepted.
Latest remote at investigation start was d0d3a738ad9fd73893a70c46b9cc43a31c0d1db0,
with all three workflows successful. Do not assume its notification changes are
hosted: read-only verification again confirmed actual hosted **6cc3c784**, 23/23
checks passed, all ordering/live/municipal safeguards closed. No hosted data or
configuration was changed and no financial/provider operation performed.

Reproduced software defect: sessionRead's HTTP request had a timeout, but the
subsequent Clerk getToken({skipCache:true}) after 401 had NONE. A stalled refresh
therefore left profile/dashboard promises pending forever, outside the fetch
abort deadline. Default query network mode could also pause a read behind a stale
native offline hint. Phone's exact failing authenticated request/response is not
observable without its session; do not claim the offline reproduction proves that
specific physical transport/provider cause. Earlier initial sign-in failure is
not independently diagnosed and must not be explained as bad internet.

Current fix: bound full account read/renewal to 20 seconds, propagate abort and
fence late credentials, no automatic retries after deadline, use bounded reads
independently of offline hints, sanitize API-versus-session timeout codes. Driver
profile/offers/deliveries retain server role checks and show retry/access/actual
sign-out recovery. No role grants, auth protocol, database migration or financial
rules changed. Customer dashboard and saved-address reads share cancellation.
Regression tests reproduce never-settling Clerk renewal and API transport, restart,
explicit retry, 403 denial and successful recovery with real local role APIs and
SIMULATED Clerk. 195 app/API tests passed, zero failures, one local PG-only skip;
typechecks/production build, account/signup and driver browser checks passed.
Customer full order/delivery/ledger and checkout regressions also passed with simulated payments. Exact-SHA CI must finish before release claims.

Release requirement: owner has NOT authorized deploying migration 0029 for this
repair. Preserve latest main development work; backport ONLY this tested UI/session
fix to an isolated staging-repair branch based on deployed 6cc. Its signed APK
must use the existing protected signer and existing public staging settings, with
no notification-capability gate bypass or hosted deployment. Inspect backport's
changed files/migrations and build identities. Record source SHA/run/artifact and
CI before handoff. Physical retry and sanitized timeout code, if any, remain owner
acceptance; never request private tokens or weaken role checks. Keep all gates OFF.

### Repair release pointers — no Render deployment required

Primary fix: **adbefc65a953fe42afbc7fc3059d8ea345b97e26**. Its three CI runs:
44069984094 (push Validate), 44069995211 (PR Validate), 44069994748 (four native
compile jobs); pending at this record, inspect exact conclusions before release.
Full customer order-through-delivery browser regressions also passed locally.

Baseline-compatible APK backport: **18bbca77700e5d2ea4c0d8ba3b10b065608d45cf**
on supplemental branch **fix/driver-staging-session-recovery**, based on deployed
6cc3c7848b7196aa00a26fc40676d939aa0c0a56. This is packaging isolation only; main
work stays on feature/rocoeats-launch-readiness. Do not merge/deploy the repair
branch over main. Only session/UI/tests/docs changed: NO API handler, schema,
migration, notification-capability bypass, role grant or financial change.
Local backport: 191 API/app passes, one PG-only skip; production/typecheck and
actual driver recovery browser checks pass. Main source has 195 passes/one skip.
Real PostgreSQL, native builds and signer must complete in GitHub:
- Validate: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44070539424
- Customer/driver Android/iOS compile: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44070575802
- Protected DRIVER staging signer: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44070581572
Signing initialization was NOT run. No signing credential read/displayed. Actual
android-staging job must succeed (not skipped); its existing signature/package/
privacy/secret scans and cleanup must pass. Download the artifact named
RoCoEats-Driver-Android-Staging-Test-APK from that signer run after success; inspect
APP_IDENTITY.json for this exact backport SHA and com.rocoeats.driver.staging.

Samsung acceptance after signer/CI success: GitHub signer run → artifact → download
ZIP → My Files → Extract → open driver APK and update the existing installation.
Keep security protections; do not uninstall or clear app storage. Open existing
session: verify controls or bounded error within ~20 seconds (Clerk initialization
already has its own ~15-second fallback). If error, report only ACCOUNT_API_TIMEOUT,
ACCOUNT_SESSION_TIMEOUT, ACCOUNT_401 or ACCOUNT_403 and visible text; never send
tokens/cookies. Retry once; explicit sign-out/sign-in is available. Restart and
check session recovery again. No order/payment or availability change needed for
this diagnostic. Physical controls/GPS/push remain unverified until owner evidence.

No Render deploy, Environment edit or migration 0029 is necessary for this repair.
Newer main notification work still requires separate approval/deployment; preserve
it. Hosted 6cc passed 23/23 checks; all ordering/live/municipal gates OFF. No hosted
business data, provider, financial or configuration operation occurred. Do not
repeat Geocodio or settlement. Next action: inspect all exact-SHA CI and signer,
preserve artifact identity/certificate evidence and obtain physical update result.

### Resume pointer — source d430e9f, November 17

Latest functional source: **d430e9ff8c29ef281cae437c5382e774ea3af5d8**,
following notification implementation 43d9f467deba30820cd561cbdcfc1e8dabc7e849.
Source d430's push Validate completed SUCCESS, including PostgreSQL, strict
backup/restore, browser regressions, container migration/startup and health checks:
https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44044790407 .
PR Validate 44044800393 and native matrix 44044800367 also completed SUCCESS;
all FOUR native customer/driver Android/iOS jobs actually succeeded. Signed and
emulator jobs were intentionally skipped in this compile matrix (the 6cc signed
artifact below is separate). Documentation checkpoint d250ddec18fd57d2c451b47dc9b0fd45ac46eae3
preserves the source handoff. Current follow-up fixes legacy token-only native
push opt-out: older devices can revoke enrollment without first granting
permission/re-enrolling. Browser regression proves token revocation with denied
OS permission, local retry state and native unregister. Production build and
typechecks pass. Inspect this follow-up commit's exact-SHA CI before release.
No new application deployment occurred. Hosted source and verified signed driver
APK remain 6cc3c7848b7196aa00a26fc40676d939aa0c0a56 as detailed below.

Next owner-only actions: install the signed 6cc driver artifact on Samsung and
verify sign-in/background GPS without ordering; separately approve deployment of
the final CI-verified source to enable new notification status/app-topic support
and additive migration 0029. Keep Environment unchanged and every safety gate
closed. Re-enroll existing staging push devices after that deployment to record
their actual staging app identity. Actual Firebase/APNs setup/receipt and physical
Apple signing/device verification require owner access. No independent missing
core workflow is currently established beyond these documented acceptance gates.

### Current continuation — deployed verification and signed driver artifact

Owner-deployed source **6cc3c7848b7196aa00a26fc40676d939aa0c0a56** independently
passed all 23 read-only staging checks November 17. Public/private/effective
ordering, live charges and municipal enforcement are OFF; Stripe TEST. Real
390px browser checks rendered homepage, About, How It Works, Support, FAQ, legal
publication placeholders and Restaurants without overflow or page errors. All
five homepage links and navy/gold branding remain. Anonymous restaurant discovery
shows the intentional private-staging invitation state; no authorization weakened.
No hosted write request, provider lookup or financial operation was performed.
All three exact-6cc CI workflows succeeded, including four native build jobs.

**Signed driver APK now exists**, built from that exact deployed source through
existing protected signing (no key initialization/rotation/disclosure):
- Run: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44039742923
- Artifact: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44039742923/artifacts/14308852404
- Name: RoCoEats-Driver-Android-Staging-Test-APK; expires December 17, 2026 UTC.
- APK: RoCoEats-Driver-Android-Staging-Test.apk, com.rocoeats.driver.staging,
  4,999,253 bytes; SHA256 a787fe6fc497c72fe16362f419ab91dcfc8c4f026f3a095e0e3c7e2ec161a8ba.
- v2 signature verified against existing owner's public certificate; private
  location-only foreground service and packaged-secret checks passed. Temporary
  signing files were removed. Independently verified downloaded archive identity,
  APK hash and certificate evidence. Signing job succeeded, not skipped.
Samsung: open artifact while signed into GitHub, download ZIP, My Files → Extract,
open APK with normal security protections. No laptop required. Driver installation,
Clerk return, lock-screen GPS/session renewal and push receipt still need physical
acceptance. This artifact DOES NOT include notification changes below.

**Current source work: notification enrollment/status and dedicated APNs identity.**
Native notifications now distinguish OS permission, platform configuration,
current-account server registration and unverified receipt; enrollment survives
reload and failed opt-out remains retryable while native opt-out is still tried.
Browser users see in-app inbox guidance. Dedicated driver workspace exposes the
same controls. New status API is authenticated/account-scoped, no-store and
returns no token. Revocation accepts the saved device ID with legacy token support.
APNs previously hard-coded the customer topic; enrollment now records actual app
ID from the native bridge using a four-owned-app allowlist, and the worker passes
that stored identity to APNs. No provider sends were performed during development. Legacy staging devices must explicitly re-enroll to record their staging app topic; defaults preserve the original customer identity.

Migration **0029_notification_app_identity** is additive: existing devices default
to the original customer app, all order/financial records untouched. Driver and
customer staging identities are distinct; database and server reject unknown IDs.
Deploy through the existing migration runner only after approval. New signed app
packaging fails closed until deployed readiness advertises notification status/app
identity support; don't package this new source against old 6cc backend. Existing
6cc signed APK remains a valid background/device acceptance candidate.

Validation: 192 app/API tests passed, zero failures, one local PostgreSQL-only
skip (CI must exercise PostgreSQL); includes account isolation/reassignment,
legacy revocation, four APNs identities, migration record preservation/constraint,
and injected routing without provider requests. Native bridge browser checks pass
registration reload, outage retry/native opt-out and configuration states. Final
build/browser/CI conclusions must be checked for the pushed SHA before release.

Next: finish regression validation, push this grouped improvement and inspect all
three exact-SHA workflows. Owner-only gates remain existing Render deployment,
physical Samsung/iOS acceptance, app-specific Firebase/APNs setup and Apple
provisioning. Do not repeat Geocodio or historical settlement operations. Municipal
enforcement and ordering remain OFF. Historical notes below are superseded.

Local validation for current notification source completed: production API/website
build and all typechecks; 192 app/API passes, zero failures, one PG-only local
skip; native staging/audience preflight tests; background/notification browser
fixture, mobile account/signup/browser recovery and full simulated customer and
dedicated-driver delivery workflows. These are offline/local simulations, not
real push/GPS/payment acceptance. GitHub CI is pending until this source is pushed;
inspect both Validate workflows and all four native jobs for its exact SHA.

CI correction after 43d9f467deba30820cd561cbdcfc1e8dabc7e849: both Validate
runs passed API/PostgreSQL tests but failed strict backup schema comparison.
PostgreSQL deparsed the varchar IN-list constraint into different equivalent array
casts after restore. Migration 0029 and schema now use explicit app_id::text;
new regression reparses pg_get_constraintdef and requires exact equality. The
backup guard remains strict. Local REAL disposable PostgreSQL now passes all
**193 tests, zero skips/failures**, then backup/restore verifies exact rows,
sequences, schema and balanced/immutable journal guards. No hosted database touched.
Typechecks pass. Inspect the corrective commit's three workflows before release;
43d9's Validate failures are historical and must not be called successful.

### VERIFIED RELEASE HANDOFF — November 17, 2026

Code SHA 9e1a1622c2cad674ed04fa003718793dde968bb5 is pushed with ALL THREE CI
workflows completed SUCCESS:
- Validate push: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44034287757
- Validate PR: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44034295800
- Native matrix: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44034295741
All FOUR native jobs succeeded: customer/driver Android and customer/driver iOS.
Debug/release/staging Android variants, iOS simulator/device release compilation,
actual package IDs, return schemes and permission boundaries were verified.
The driver log proves the earlier false failure: decoded service type was 0x8,
Android's location-only flag. The corrected checker passed along with private
service/permission and staging package/security checks. No safeguard was bypassed.

This handoff commit changes documentation only; source remains the verified code
above. Inspect its automatic CI conclusions as usual before choosing a deployment
SHA. Latest deployed staging was independently confirmed 4934f24 at session start,
23/23 read-only checks passed, closed ordering/live/municipal gates. No agent
Render deployment, signer dispatch, hosted mutation or provider operation occurred.

Next action requires owner's existing Render session: Manual Deploy → Deploy a
specific commit from feature/rocoeats-launch-readiness, using the final verified
SHA reported for this checkpoint. Preserve all Environment values; no new variable,
migration, service or resource is required. Wait for Live and let engineering run
read-only checks. Then the existing protected workflow can build target=staging,
audience=driver without reinitializing signing. Do not use unsigned CI artifacts
for phone acceptance. See ANDROID_STAGING_TEST.md for exact browser/phone steps.

Remaining acceptance gates are owner/device/provider controlled: locked-screen GPS
and Clerk renewal/battery, app-specific real push, Apple signing/provisioning and
physical iOS, approved legal/contact content, geographic accuracy/office evidence,
authorized fee settlement/refund/dispute/payout evidence and production uptime/
hosted recovery. The website/shared lifecycle and native candidate implementations
are not a claim of commercial launch readiness. Keep public/private ordering,
live charges and municipal enforcement OFF; Stripe TEST only; no Geocodio repeat,
historical reconciliation or financial operation without separate authorization.

### November 17 staging APK handoff and Android verifier correction

Completed source checkpoints: 91ee3eab21c1a3b70a0e393f3edfa1f6fbd0cac4 (public
customer information/access/branding) and ee14a3093170aa1e916fda362cc8fcbc4c867416
(dedicated apps). Both have all three CI workflows SUCCESS; ee14 has FOUR actual
native debug/release compilation/identity jobs successful.
Background candidate 8868e0dccaf00e23b224fa4a3d8b94a57a28fd3f passed both Validate
workflows, both iOS builds and customer Android. Driver Android compiled all
variants, then failed its verifier's symbolic foregroundServiceType comparison.
The correction accepts only symbolic location or its exact Android ServiceInfo
flag 8 (decimal/hex); it still rejects missing/unrelated/combined flags and requires
an app-private service. New CI prints the decoded flag to confirm the evidence.
Do not describe 8868's native workflow as successful or deploy it as the final SHA.

Existing manual signed staging workflow now selects customer (unchanged default)
or driver, preserving owner key handling and customer artifact names. Driver APK
has its own package/artifact and APP_IDENTITY.json source SHA. Actual compiled
staging manifests are checked in unsigned CI too; signature/secret scans stay in
the existing owner-controlled signing job. No signing workflow was dispatched.
The old emulator fixture remains explicitly customer-only; no emulator repair.

Read-only native readiness now reports fixed app return schemes. Signed driver
packaging requires deployed rocoeats-driver support, exact false public/private/
effective ordering and live-charge flags, and matching public Clerk TEST config.
Missing/string/falsy substitutes cannot pass. Old configured customer packaging
remains compatible. No auth protocol, account role, owner permission or financial
record changed. Background consent now explicitly includes authorized active order
participants as well as dispatch, matching actual delivery-location visibility.

Local PASS: 189 app/API cases (188 pass, PostgreSQL-only concurrency skip), full
build/typecheck, native metadata/preflight tests, four Python permission/APK-policy
tests and updated consent browser test. Full customer/driver/account/CSP browser
regressions passed for the background candidate immediately before this focused
readiness/policy change. Logs /tmp/rocoeats-signed-driver-{tests,build,cli,consent}.log.
For THIS commit, inspect both Validate runs and ALL FOUR native jobs after push.
Pending, absent, skipped signing or unsigned builds are not signed/device evidence.

Resume: fetch branch and compare tree; inspect latest exact-SHA CI. Prioritize any
actual failure. Once green, owner must deploy the final SHA to the existing Render
service (no direct Render account access here), preserve all env values/closed
safeguards, then engineering repeats 23 GET/OPTIONS checks. No migration or new
hosted variable is required. After deployment, the existing workflow can produce a
configured signed driver APK with target=staging/audience=driver; never reinitialize
owner signing. Owner phone instructions are in docs/ANDROID_STAGING_TEST.md.

Implemented/verified vs actual acceptance:
- Website/shared backend: broad local integration/browser/PG CI coverage, one
  owner-confirmed historical real Stripe TEST delivery; new source NOT deployed.
- Customer + driver Android/iOS: native compilation baseline verified; background
  plugin iOS compilation verified, corrected final Android permission check pending.
- Background consent/controller: simulated bridge/API verified; real locked-screen
  HTTP, Clerk renewal, permission recovery and battery remain device gates.
- Signed driver APK: workflow prepared; actual artifact blocked until new shared
  staging deployment. Customer signing identity preserved. Signed iOS distribution
  requires owner Apple provisioning/account access and physical iOS device.
- Push: outbox behavior tested; app-specific Firebase/APNs setup and actual receipt
  remain owner/provider gates. No provider lookup or account created.
- Legal/contact, municipal accuracy/office evidence, historical fee settlement and
  commercial payouts, always-on hosting/hosted recovery remain owner/real-evidence
  gates. Keep all ordering/live/municipal controls OFF. No financial retry allowed.
No new deployment, hosted records/settings, financial operation, external provider
lookup, domain migration, paid resource or PR merge occurred.

### November 17 opt-in background driver location checkpoint

Dedicated app baseline ee14a3093170aa1e916fda362cc8fcbc4c867416 completed all THREE
CI workflows SUCCESS, including android(customer), android(driver), ios(customer)
and ios(driver). Those are actual unsigned native debug/release compilations and
binary identity/scheme checks, NOT physical-device or signed release acceptance.

Implemented a driver-only opt-in background location candidate using free MIT
@capacitor-community/background-geolocation 1.3.1 (pinned). Explicit session consent
and OS location/Android notification permission precede watcher creation. Existing
Clerk authentication and driver approval/presence/ownership checks authorize every
heartbeat/location request; no new bypass endpoint, credentials or migration.
The controller fetches the current assignment instead of retaining an old order,
throttles uploads to 30s, rejects stale/invalid/simulated fixes, serializes uploads,
recovers transient failures and stops on 401/403/409. Stop/offline/session loss
abort further uploads, including requests interrupted before later pipeline steps.
Restart requires explicit reconnect/consent; saved watch IDs (not tokens/positions)
allow cleanup of a watcher left by WebView reload. Foreground sharing is preserved.

Customer builds exclude the plugin/background permission declarations. Driver
builds alone enable the documented native HTTP/legacy bridge required beyond
Android's WebView background throttling. Driver iOS permission plist and Android
manifest are generated from customer files (ignored artifacts, no duplicated core
source). Upstream exported Android tracking service is overridden app-private;
notification uses a transparent white utensil icon. Native CI inspects compiled
Android export/FGS permissions and iOS location-purpose/background-mode boundaries.
No background sharing was activated on a real device or hosted account.

Local PASS: 189 app/API cases (188 pass, one PostgreSQL-only skip), metadata/manifest
CLI tests, two native privacy-checker tests, full typechecks/production builds,
sequential driver then customer Capacitor synchronization (customer generated native
files unchanged), frozen lockfile install, customer/API/PGlite delivery workflow,
driver/account/homepage/CSP browser suites, and dedicated background consent UI.
Native bridge/API/GPS in consent tests are simulated. Actual screen-locked HTTP,
Clerk renewal, OS restart/permission behavior, battery and device push remain
unverified. See /tmp/rocoeats-background-* logs and scripts/verify-background-browser.mjs.
The new plugin's real native compilation/merged-permission CI is pending push;
inspect all four native jobs and both Validate conclusions, fix actual failures.

Next exact engineering action: finish exact-SHA CI; then prepare the existing
owner-controlled signed staging workflow for the dedicated driver audience without
changing customer defaults or exposing signing keys. Keep iOS signing/provisioning
owner-controlled. Use docs/ANDROID_STAGING_TEST.md's consent/background acceptance
steps only after a configured signed driver build, shared website deployment and
separate supervised device-test authorization. Never install unsigned/unconfigured
CI artifacts or claim simulated GPS establishes physical behavior.
No Render deployment/configuration, hosted records, payment/refund/transfer/
reconciliation, Geocodio call, geographic activation or PR merge occurred.

### November 17 dedicated-driver native build checkpoint

Website release 91ee3eab21c1a3b70a0e393f3edfa1f6fbd0cac4 has all THREE CI
workflows completed SUCCESS. Staging remains 4934f24; no new deployment performed.

Added separate customer/driver app build identities using existing Capacitor,
Android and iOS projects. Default customer ID/name/scheme/signing remain unchanged.
Driver: com.rocoeats.driver / RoCoEats Driver / rocoeats-driver. Public metadata
lives in config/native-audiences.json; ROCOEATS_NATIVE_AUDIENCE=driver selects it
at build time only. Unknown audiences fail packaging. No hosted env change.
Android namespace remains compatible with existing Java activity; iOS uses scoped
app build settings. CI matrices compile BOTH audiences on Android and iOS, inspect
actual APK/Info.plist IDs/schemes, and keep separate unsigned artifacts. Existing
owner signing jobs and private keys are untouched. Real compile conclusions must
be checked after push; local Linux builds do not establish iOS compilation.

Driver app root/sign-in/setup enter the existing driver workspace and offer driver
navigation. Selecting this build grants no permission: server approval, current
roles and owner-driver exception remain authoritative. Customer accounts stay
customers and are denied driver controls. Existing explicit reconnect after reload
prevents silent GPS resumption. No background GPS capability is claimed.
Distinct callback schemes reject wrong-app/decorated links. Browser auth flow uses
a sanitized app hint in the URL fragment only to choose a fixed return link;
approval body stays id/state, proof-of-possession and server auth unchanged.
Deploy this shared website revision before real driver callback acceptance.

Local PASS: 184 app/API cases (183 pass, one PostgreSQL-only skip), identity/unsafe
input CLI checks, full typechecks/production build, driver web production build,
account/homepage/CSP browser suite, complete customer website/API/PGlite delivery/
ledger regression, and dedicated driver browser approval/duty/reconnect/role-denial/
owner-exception tests. Simulated browser approvals verify fixed customer/driver
return schemes without transmitting an app role as authorization. No real account,
provider call, native installation, signed release or physical device acceptance.
Logs /tmp/rocoeats-{native-audience-*,driver-app-browser.log,driver-web-build.log,
native-customer-workflow.log}; tests in scripts/driver-app-browser-checks.mjs.

Next: inspect exact-SHA CI including ALL FOUR native matrix jobs; fix real failures.
Then implement explicit opt-in background driver tracking with scoped, revocable
server authorization and native privacy/foreground-service controls, using existing
location APIs where appropriate. Foreground location, heartbeat and on-duty rules
already exist; do not replace them or claim background delivery from browser mocks.
Independent native blockers: app-specific push configuration, launcher asset
review, signed driver/iOS releases and real-device consent/background/push evidence.
No financial transactions, geographic activation, hosted writes or PR merge.

### November 17 recovery and customer-information release

Recovered clean remote HEAD f31aac9a27a7731bf7ab66f1cb1d65da903e084e; all three
exact-SHA workflows completed SUCCESS (Validate push/PR and unsigned native).
No interrupted edits were lost. PR #1 remains open/draft/unmerged.
Independent staging verification on November 17: 23/23 GET/OPTIONS checks passed,
deployed 4934f2413756e0b88bc0da333ec7f906569de906 matched. Database/auth/pricing/
Stripe TEST/webhook/worker configuration ready; public/private ordering, live
charges and municipal enforcement OFF. No provider call or hosted write occurred.

External review findings verified against implementation:
- Anonymous /api/restaurants 401 is intentional private-staging protection. With
  private staging disabled, approved directory/menu reads already work while
  ordering remains closed. New API regression verifies safe directory fields,
  protected addresses/order history, blocked creation and staging 401 restoration.
- Website misleadingly called access denial a restaurant outage. New 401/403
  invitation/session guidance and distinct network error/retry preserve all gates.
- logo.svg was a legacy green heart, while workspace headers used gold utensils.
  Homepage/auth/workspaces now share one navy/gold utensil SVG; five homepage
  actions/layout unchanged. Native launcher assets still require separate review.
- Added public About, How It Works, Contact & Support, FAQ and explicit unpublished
  Privacy/Terms integration routes with accessible links. Actual support uses
  existing authenticated orders/private guest capabilities. No contact details,
  legal terms, restaurant counts or service promises were invented. Owner/legal
  approval of actual policies/contact details remains a launch/store gate.

PASS: 184 app/API cases (183 pass, one PostgreSQL-only local skip), full typechecks/
production builds, account/homepage/CSP browser tests and complete real local
website/API/PGlite delivery+ledger/menu/guest-support regression. New public pages
pass at 320/390/768px; simulated 401/403/503 recover correctly. Clerk/payments are
simulated in browser tests, not provider acceptance. Logs /tmp/rocoeats-nov17-*
include staging JSON and info-{build,tests,browser,account,workflow}.log.

Next engineering action: verify this release's three pushed CI conclusions; add
separate driver native app identity/entry/return scheme using existing shared
Capacitor implementation, preserving customer identifiers/signing. Validate real
Android/iOS compilation in CI; builds are not signed/store/device acceptance.
No deployment access currently available; provide final verified SHA for owner's
existing Render service. No schema/environment changes required by website work.
All financial/geographic/ordering safeguards and historical acceptance blockers
remain. Never repeat the exhausted Geocodio diagnostic or historical reconciliation.

### November 15 guest-service acceptance and cancellation correction

Completed/pushed menu commits:
- 1424ea197e7903b2876c086de933feec3a3bfde1 — item descriptions and phone editor.
- 810d0049b4cebe69410589b277c978c98b64f386 — category forms and menu errors.
All THREE GitHub workflows completed SUCCESS for each exact SHA (push Validate,
PR Validate, existing unsigned native workflow; no native changes).

Confirmed core defect: OrderActions cancellation invalidated registered history
and payment details but not guest order, restaurant confirmation or tracking.
An already-cancelled order could retain stale status/payment controls until its
10-second poll. Successful cancellation now awaits invalidation of all affected
order/history/guest/confirmation/tracking/payment caches. Backend cancellation,
refund authorization and financial behavior are unchanged.

New browser acceptance covers actual guest menu/cart/address/quote/order creation,
private tracking, support request, administrator decision, guest reply and unpaid
cancellation with interval polling paused. Cancellation immediately updates tracking
and confirmation, removes payment/cancel controls and persists across reload.
The same test against a temporary bundle of PREVIOUS committed commerce-pages
fails waiting for the immediate tracking GET; fixed code passes. Working sources
were never reverted. Only disposable local data/simulated Clerk are used; no
payment/checkout/provider call is made by this guest-service test.

Validation PASS: 183 app/API cases (182 pass, one PostgreSQL-only local skip),
14 CLI/readiness/config tests, full typechecks/API+web production builds, complete
mobile website/API/PGlite delivery+ledger workflow and account/homepage/CSP browser
regressions. Separate existing delivery/payment fixture uses the local simulator,
not Stripe TEST acceptance. Only preexisting build chunk/annotation warnings.
Logs: /tmp/rocoeats-core-final-{build,workflow,account}.log and
/tmp/rocoeats-guest-service-{baseline,after}.log. Focused modes:
ROCOEATS_MENU_ONLY=true or ROCOEATS_GUEST_SERVICE_ONLY=true with
scripts/verify-website-workflow.mjs and existing Playwright environment paths.
CI for this cancellation commit must be checked after push; pending is not success.

Current staging stays 4934f2413756e0b88bc0da333ec7f906569de906, independently
verified 23/23 read-only checks, all closed safeguards and municipal inactive.
No migration/env changes are required for these UI improvements. No deployment,
provider lookup, hosted record/financial mutation, native edit or PR merge occurred.

Next exact engineering action: fetch/inspect this commit's THREE CI conclusions;
repair any actual failures. Once green, await owner approval for the exact final
SHA deployment to the existing service, then repeat read-only verification and
owner Samsung acceptance. Do not invent more feature work: currently reviewed
core lifecycle/support/finance workflows are implemented. Remaining launch gates
are geographic real-evidence acceptance/activation, authorized real-provider
financial scenarios and settlement, production uptime/hosted backup acceptance,
and owner device/operations policy approval. Historical payment reconciliation
requires explicit provider availability evidence AND separate owner authorization.
Do not repeat the one-run Geocodio suite or open ordering for UI verification.

### November 15 menu-management completion follow-up

Pushed 1424ea197e7903b2876c086de933feec3a3bfde1: menu descriptions/mobile item
form. Exact-SHA CI was running when this follow-up was prepared; inspect all three.
Category create/rename now use accessible inline forms with name validation,
explicit cancel, disabled pending controls and retained drafts on failed saves.
Menu visibility/removal/category-deletion errors are visible; destructive controls
cannot race an open editor or duplicate their own pending request.

Targeted real local API/mobile browser PASS: category create/rename/cancel, blank
name rejection, pre-commit 503 recovery, denied deletion preserves category,
successful retry clears errors, failed visibility update preserves availability.
Prior item editor regressions also PASS. Full typechecks/production build PASS.
No schema, hosted record/settings, provider call or homepage/native changes.
Logs: /tmp/rocoeats-category-{typecheck,build,browser}.log.
Next: browser acceptance of existing guest support and cancellation, followed by
full local browser regression and exact-SHA GitHub CI. Do not rebuild guest support:
shared OrderActions already renders it with guest-capability authorization.

### November 15 core-completion checkpoint — restaurant menu descriptions

Current deployed SHA: 4934f2413756e0b88bc0da333ec7f906569de906. Remote HEAD was
verified clean at that SHA; all three exact-SHA workflows completed successfully.
Independent GET/OPTIONS staging report: 23/23 passed on November 15 at 07:31 UTC,
revision matched, database/auth/pricing/Stripe TEST/webhook/worker configuration
ready. Public/private ordering, live charges and municipal enforcement OFF.
Positive owner-session/provider behavior was not tested; no hosted writes occurred.

Confirmed core gap: menu-item create/edit prompts exposed only name/price, despite
the existing API supporting descriptions. New accessible inline form supports
name, optional description and exact decimal price, clearing descriptions, explicit
cancel, retained input/error on failed saves and one in-flight submit. Partial
updates preserve modifier groups, visibility, inventory and existing order snapshots.
No migration/configuration/API change. Homepage and native code untouched.

Validation: full typechecks and production builds; 183 app/API cases (182 passed,
one PostgreSQL-only case skipped locally). Mobile browser regression uses the real
local API/migrated disposable PGlite database, with simulated Clerk/payments; it
covers invalid prices, create/edit/clear/cancel, pre-commit 503 recovery, duplicate
in-flight submits, customer-visible descriptions and unchanged inventory/modifiers.
Check the exact pushed commit's CI conclusions before deployment; pending is not pass.
Logs: /tmp/rocoeats-menu-{build,tests,browser,browser-focused}.log.

Scope review: guest support is already included in shared OrderActions on the guest
order page, with capability-authorized endpoints. Do NOT duplicate it. Core order,
dispatch, cancellation, support, inventory and financial workflows already exist.
Next engineering action: finish the phone-friendly category management controls and
surface failed menu-management mutations; then update the prioritized launch gates.
Real provider refunds/disputes/Connect payouts, historical settlement, hosted backup
recovery, always-on hosting, geographic accuracy approval and device acceptance are
verification/owner gates, not evidence that these implemented workflows are absent.
Preserve the completed $19.19 order and all closed safeguards; no deployment approved.

### November 15 current checkpoint — financial request authority

Verified deployed c44d2228e5a8c7757659172acd896565fa638dd3 with 23/23 read-only
checks at session start. Public/private ordering, live charges and municipal
enforcement remain OFF; Stripe TEST configuration ready. No hosted settings,
records, provider lookup, native source or migration changed this session.

Commits already pushed: a6feb5ec4bf356efbed7b94183959c3f97a7172b (financial queue
identity), 3b4f6e35b167c2529f022658978be57b1609524e (driver authority), and
fc9b09c0e12df6bb3ae06ca0c75d2664a3dbaa28 (reconciliation authority). All three
workflows passed for each, including real PostgreSQL FK-lock compatibility.

Final follow-up revalidates current account authority before checkout/cancellation
transactions and current administrator authority before transfer/partial-credit
requests. Cancellation uses the locked current role with the same ownership and
refund rules. A request that loses authority while waiting cannot mutate orders,
payments, financial jobs, credits, payouts, ledger or audit state. Requests validly
committed BEFORE a permission change are preserved, not retroactively cancelled.
No new role grants, financial policy, provider call or client protocol introduced.

Regression covers six deterministic HTTP interleavings (customer checkout/cancel,
restaurant cancel, administrator cancel/transfer/credit). A temporary test bundle
using the PREVIOUS committed source reproduced revoked checkout accepted with
202; the working tree was never reverted/overwritten. New code returns 403 with
exact financial snapshots unchanged. Logs:
/tmp/rocoeats-financial-request-auth-{before,tests,build,workflow}.log.

Local PASS: 183 app/API cases (182 pass, one PostgreSQL-only concurrency skip),
14 CLI/staging tests, full typechecks/production builds and local browser/API/
PGlite delivery regression. All provider/payment/account responses in development
tests are simulated. Latest commit CI is pending push at checkpoint creation;
inspect its exact three conclusions, never infer success from pending.

Resume: fetch branch/tree; inspect latest CI and fix actual failures first.
All currently reproduced defects from this focused authority/queue review are
fixed. Next release gate is owner-approved staging deployment of the verified
SHA, then GET/OPTIONS readiness and owner-session review with ordering closed.
No extra environment variables or migrations required. Do not re-run provider
tests, alter the one-shot allowance, or perform permission/payment mutations on
hosted accounts without separate authorization. Geographic building ground truth,
missing office response components and real Stripe settlement evidence remain
external/owner-controlled acceptance blockers; do not invent them or weaken rules.

### November 15 reconciliation authority follow-up

Financial identity fix a6feb5ec4bf356efbed7b94183959c3f97a7172b and driver race fix
3b4f6e35b167c2529f022658978be57b1609524e both have all three CI workflows passed.
PostgreSQL CI exercised the notification FK lock-compatibility regression.

Reproduced charge evidence being recorded after the fake provider reader revoked
the administrator's role. Manual payment/dispute/operation reconciliation now
rechecks active administrator permission under NO KEY UPDATE after provider reads,
before order locks or financial writes. Provider I/O remains outside transactions;
no evidence is fabricated and original immutable accounting checks remain.
Tests cover role loss/deactivation during charge reads and role loss during
dispute/operation reads, preserving ledger/balance/hold/job/audit state on denial.
Existing legitimate reconciliation tests still pass. No real provider read or
reconciliation of the completed staging order was performed.

Local PASS: 182 app/API cases (181 pass, one PostgreSQL-only skip), 14 CLI/staging
tests, typechecks/build, isolated website/API/PGlite delivery browser workflow.
Logs /tmp/rocoeats-admin-reconciliation-{before,tests,build,workflow}.log and
/tmp/rocoeats-core-integrity-cli.log. Exact pushed CI must complete before release.
Next inspect the same stale-authority boundary when financial requests are queued
(transfer/checkout/cancellation/partial credit), preserving existing role and
ownership rules. Do not execute those operations against staging.

### November 15 next deployment verified; financial request identity

### November 15 transactional driver authorization

Financial request identity fix committed as a6feb5e (inspect exact CI on GitHub).
Reproduced an authenticated driver request completing release after an admin had
revoked approval while it waited to enter its transaction. Release, arrival,
pickup and delivery now recheck active role, current application/approval and
license under a profile lock before the order lock. The existing configured
owner-driver exception is preserved. NO KEY UPDATE serializes permission writes
without blocking notification FK checks; a multi-connection PostgreSQL-only
regression verifies that compatibility (skipped in single-connection PGlite).
No client protocol, custody rule, role grant or provider operation changed.

Local PASS: 182 app/API tests total, 181 passed/one PostgreSQL-only skip, full
typechecks/build and website/API/PGlite browser workflow. Four deterministic
revocation interleavings return 403 without custody/proof/timestamp/earnings
changes. Logs /tmp/rocoeats-driver-authorization-{before,tests,build,workflow}.log.
CI must complete and exercise the multi-connection check before deployment.
Next: inspect manual financial reconciliation authorization after provider-read
latency; no real reconciliation or provider request is authorized.

Session started at clean remote c44d2228e5a8c7757659172acd896565fa638dd3; all three
CI workflows passed. Owner deployed it. Independent 23/23 GET/OPTIONS checks now
confirm that full SHA, healthy dependencies, public/private ordering OFF, live
charges OFF and provisional_postal with municipal enforcement inactive. Report:
/tmp/rocoeats-c44d222-postdeployment.json. No provider/diagnostic/financial calls.

Reproduced two financial queue invariant failures with new local fixtures: same
request ID accepted a different resource ID, and a job labelled for another
provider reached an execution callback. Queue idempotency now binds provider and
resource as well as order/kind/payload. Unsupported-provider jobs are held with
OPERATION_PROVIDER_MISMATCH before attempts/I/O; Stripe execution and manual
reconciliation reject them too. Original request identity/payload remains intact;
no historical financial record is corrected or fabricated. No schema changes.

Local PASS: 180 app/API tests, full typechecks/build, website/API/PGlite browser
delivery regression (simulated payment/Clerk/provider only). Existing geography
bypass fixtures now include explicit Stripe TEST provider identity so they still
reach the intended geographic guard. Logs:
/tmp/rocoeats-finance-identity-{before,tests,build,workflow}.log. Exact pushed CI
must complete; pending is not success.

Next actionable audit: driver release/arrival/pickup/delivery check permission
before their transaction. Reproduce permission revocation between authentication
and mutation; preserve owner-driver exception, custody and lock ordering. No
hosted changes, provider lookup, ordering/enforcement activation or native work.

### November 15 post-deployment continuation

Remote HEAD at session start was 4b2cea8fde2657b0b6d0dba5ecc0f39da7681b9a,
clean tree and all three CI workflows successful. Owner deployed that exact
commit and reported Stripe TEST/webhook/pricing ready, ordering closed and
Geocodio diagnostic disabled/completed. Engineering independently reran all
23 read-only staging checks: exact SHA, health/database/auth/pricing/workers ready,
public/private ordering and live charges false, geographic mode provisional_postal,
municipalEnforcementEnabled=false. Report /tmp/rocoeats-4b2cea8-postdeployment.json.
This verifies deployed code/configuration, NOT real driver timing, push receipt,
financial settlement or another provider transaction. Do not repeat provider calls.

Found manual webhook/push recovery scheduling still used application time while
workers use database time. Changed both audited retry routes to clock_timestamp();
no authorization, reason requirement, retry state, financial or allowance changes.
Regression uses isolated held jobs/fake sender; PostgreSQL CI tests +/-1h host
clock drift with a Date constructor proxy, PGlite verifies ordinary behavior.
Local PASS: 177 app/API tests, full typechecks/build. Logs:
/tmp/rocoeats-retry-clock-{tests,build}.log. Push and inspect exact commit CI.
Next independent task: customer-visible delay notifications for existing order
timeout incidents; preserve current timeout policies and no-show custody guards.

### November 15 customer delay follow-up

Retry scheduling fix committed as 366020905d2efcb85a459b80e0f5bb12ce7c8b44;
inspect its exact workflow conclusions on GitHub. Existing timeout incidents now
send one transactional, deduplicated delay notice per incident/version to the
order's affected members (customer, restaurant and assigned driver). Confirmation
and unassigned-ready delays reuse current policy thresholds. Retained-arrival
pickup delays notify without releasing custody; pre-arrival automatic expiration
keeps its existing reassignment notice, avoiding a redundant pickup-delay alert.
No policy, fee, order/payment state, territory or permission change.

Local PASS: 178 app/API tests and typechecks/production builds. The new regression
repeats/concurrently runs timing workers through confirmation, dispatch and arrived
pickup phases, checks recipient scope/deduplication, then completes normal pickup,
customer handoff and two earnings records. Logs:
/tmp/rocoeats-delay-notifications-{tests,build,workflow}.log. Local website/API/
PGlite browser workflow also passed; exact pushed CI remains pending at commit
creation. Provider/payment responses remain simulated.

### November 15 earlier checkpoint — notification recovery verified locally

Completed preserved/recovered geographic work (a4f0caf2cfba2b324f4db15d2cd7813be108e0ff),
dispatch database-time safety (a52385ffd609c3f882dd9e9335145d1a8dbf18de) and handoff
expiry/idempotency (ba92d0f61b5e29393ba0c65b0a240def1fb98e20). First two commits'
three workflows passed. Check handoff/latest exact-SHA workflow completion on GitHub.

Reproduced an exhausted fifth push claim stranded in processing after lease expiry:
the old selector excluded attempts >=5 forever, so admins could not use failed-job
recovery. Fix transitions expired final processing claims to failed with generic
unconfirmed-acknowledgement code, clears the lease token (late acknowledgements
cannot overwrite it), and summarizes the notification. No sixth provider send.
Notification-before-delivery lock order matches completion/admin retry; active
leases remain untouched. Recovery works without provider configuration. Existing
audited administrator retry remains the only way to send again; it does not claim
that a device did/did not receive the earlier attempt. In-app inbox is preserved.
This is shared backend work, not native development or provider/device acceptance.

Local PASS: 176 app/API tests, 14 CLI/staging tests, full typechecks/production
builds and local website/API/PGlite browser workflow. Mobile/account/CSP browser
suite passed for the recovery commit; no later UI changes. All payments, Clerk,
push responses in these tests are simulated. Reproduction failure log:
/tmp/rocoeats-push-exhaustion-before.log. Passing logs:
/tmp/rocoeats-push-exhaustion-{tests,build,workflow}.log. Latest CI pending push at
checkpoint creation; never treat pending as success. Keep branch and PR unmerged.

Focused audit of existing financial queue, webhook inbox, dispute holds, provider
fee validation, stock reservation expiry and notification retries found existing
coverage for locks, replay, durable leases and unknown-provider outcomes; preserve
these implementations. No further confirmed defect from this focused review.
Do not invent provider evidence or repeat prior end-to-end payment to fill gaps.

Remaining blockers: office historical rejection cannot be uniquely determined
from sanitized summary lacking returned components/reason; independently verify
public-building locations using existing evidence/free official maps; owner must
confirm temporary diagnostic flag false through Operations (no key sharing),
review actual evidence and separately approve geographic activation/deployment.
Stripe settlement for the completed $19.19 order still requires actual available
provider evidence plus separate reconciliation authorization; do NOT retry now.
Latest verified deployed SHA remains 13717a36e27967e60167764d1e7358c90e256a78.
No hosted record/settings, payment, provider lookup, native source or migration
changed. Public/private ordering and live charges stay OFF; Stripe TEST only.

Resume: fetch branch/tree without overwriting changes; inspect exact latest SHA's
three CI runs. Fix any genuine regression first. Otherwise owner-approved staging
deployment and authenticated acceptance of the saved changes are the next gate;
do not repeat local suites absent code changes/failures or reset one-shot lookup.

### November 15 handoff expiry follow-up

Dispatch fix committed as a52385f (exact CI status must be read from GitHub).
Customer handoff issuance/expiry and arrival/pickup/delivery/proof timestamps now
use database time. A slow application clock cannot extend an expired handoff;
a fast clock cannot prematurely reject valid proof. Existing code secrecy,
five-attempt limit, customer-only issuance and idempotent completion remain.
Local PASS: 175 app/API tests, typechecks/build, website/API/PGlite delivery browser
regression (simulated payments). Concurrent valid retries produce one delivery
event and exactly two earnings records; expired proof produces no earnings.
PostgreSQL CI tests +/-1h host clock skew; PGlite shares the host clock locally.
Logs /tmp/rocoeats-handoff-clock-{tests,build,workflow}.log. No financial/provider
calls, deployed changes or historical record edits performed.

Next audit: a push worker crash during its fifth attempt may strand an expired
processing lease at the retry cap. Reproduce offline, preserve late-ack fencing,
and require existing audited admin retry rather than an automatic sixth send.

### November 15 dispatch follow-up

Recovered geographic code committed as a4f0caf2cfba2b324f4db15d2cd7813be108e0ff.
Its push/PR Validate workflows passed; existing automatic native workflow must be
checked for final completion (native development remains deferred).

Dispatch now uses database time for online status, heartbeat writes, assignment
timestamps, driver claims/declines, GPS timestamp windows, freshness/cooldown and
operator waiting times. A shared presence check rejects future/invalid heartbeats
and expires at exactly 90 seconds. Explicit reconnect restores duty; no penalty
or profile-status change for optional declines. Availability/heartbeat/duty GPS
also recheck application authorization inside the profile-locked transaction.
No schema/hosted changes. Local PASS: 174 app/API tests, full typechecks/build,
website/API/PGlite browser delivery regression (simulated payments). New HTTP
regression covers future/stale presence, reconnect and optional offer/assignment
flows; PostgreSQL CI additionally exercises +/-1h host clock skew (local PGlite
shares JS host time). Logs /tmp/rocoeats-dispatch-clock-{tests,build,workflow}.log.

Next: handoff-code expiry still compares database values with application time;
investigate cross-instance expiry enforcement and idempotent completion. Do not
perform hosted financial operations or repeat provider tests.

### November 15 recovery — sanitized geographic decisions

Fetched branch at 2b1ef590769e8325a979b5114f898977c3776f6e (all three CI workflows
completed successfully). Recovered four uncommitted geographic code/test files;
no prior work overwritten. Latest independently verified deployed SHA remains
13717a36e27967e60167764d1e7358c90e256a78, which passed 23 read-only checks.

Recovered changes add typed, finite rejection codes to the existing validator;
HTTP 409 text/eligibility remains unchanged. Version 2 diagnostic reports include
only sanitized reason codes, never returned street/unit text or raw errors. The
forestry case now expects rejection because its known point lies in an excluded
hole, not an unresolved review outcome. No one-run claim key/reset changed; old
stored reports are never rewritten or backfilled.

Office investigation: CSV Ste 1 and Suite 1 pass the unchanged normalization.
Offline variants prove malformed component types, street/locality mismatches and
missing/different units can each reproduce the saved rejected summary. The live
report omitted those fields and the rejection reason. Exact historical cause is
NOT recoverable from that summary; a unit mismatch is a hypothesis, not proven.
See delivery-area/geocodio-live-api-review-2026-11-14.md. Do not repeat lookups.

Validation logs /tmp/rocoeats-recovered-geography-{tests,build,cli,account,workflow}.log.
Local PASS: 172 app/API tests, 14 CLI/staging tests, typechecks, production builds,
both mobile/account and website/API/PGlite delivery browser suites (simulated
Clerk/payments only). Exact pushed commit CI must still complete after push.
Next independent task: audit dispatch presence/assignment timing against database
time and interrupted-request recovery. Preserve native code, all financial data,
closed ordering/live gates and inactive municipal enforcement. Owner still needs
to confirm diagnostic flag false and independent building ground truth; no keys
in chat and no laptop/terminal requirements.

### Phone-only owner workflow — November 14, 2026

Owner requires Samsung browser/cloud-dashboard management. Do NOT direct the owner
to a laptop, local Python/Node install, terminal or GitHub secret entry. Retain the
legacy local script for compatibility; it is no longer the recommended owner path.
Continue from verified b3bd9017cff045f30e39e75adf0455ff5c267b9f. Current managed
runtime status confirms no configured secret bindings; no secret-entry tool exists.
Never request keys through chat, GitHub, attachments or public forms.

Prepared owner-only Operations panel and GET/POST /api/admin/geocodio-public-test.
Clerk-authenticated active admin AND configured-owner identity required. Diagnostic
defaults OFF; future protected Render GEOCODIO_API_KEY plus
ROCOEATS_GEOCODIO_PUBLIC_TEST_ENABLED=true require separate owner approval. No
hosted settings/deployment happened. Requires closed public/private ordering,
Stripe TEST and provisional municipal mode. Fixed five-public-case runner only,
no custom inputs or key form, no automatic POST/retry. Existing unique
platform_settings geocodio_public_api_v1 claim commits before provider I/O and
persists across tabs/processes/restarts; interrupted/unknown runs stay consumed.
Sanitized reports persist for GET recovery; existing nonfinancial audit entries
on run start/completion. No schema migration, finance/pricing/order changes.

Decision/review and exact Samsung steps in docs/delivery-area/README.md. Recommended
path reuses existing Render service; no new cloud account/paid resource required.
Local validation PASS: 170 app/API tests (including owner/non-owner, inactive owner,
untrusted origin, explicit confirmation, missing config, unsafe gates, concurrent
single-use claim and interrupted-run consumption), 14 CLI/staging tests, full
typechecks/production builds, mobile account/CSP/cart regressions including new
lost-response panel recovery, local browser/API/PGlite order-to-delivery workflow
(simulated payments only), offline verifier and deterministic pinned map. Logs:
/tmp/rocoeats-phone-geocodio-{tests,build,cli,account,workflow}.log. Exact pushed
SHA's three GitHub workflows must finish successfully; pending is not success.
Actual Geocodio API evidence remains unverified; tests use mocks only. Boundary,
normalized exclusions, ZIP 37854, 30 m margin and all closed gates remain preserved.
Next owner action: approve the verified code deployment and protected Render
diagnostic configuration separately. Do not activate municipal enforcement.

### Direct API hardening / owner-local test path — November 14, 2026

Continuation of verified 9c90d00ba4c347da529e73ea19b6f947b2b39d9d. Owner accepts
the real CSV as preliminary evidence; this does not approve activation. Preserve
approved boundary/hash, normalized exclusion geometry, ZIP 37854 and 30 m margin.

Transport now accepts only HTTP 200 with an exact (case-insensitive) JSON media
type, strictly decodes UTF-8 and rejects duplicate decoded JSON member names at
any nesting depth. This prevents last-key-wins hiding extra candidates/precision.
Existing fixed US endpoint, Bearer header, 256 KiB body cap, 5 s timeout, redirect
rejection, no raw error logs, ambiguity/street/unit/locality/precision matching,
frozen evidence, full-address/key/boundary cache, bounded concurrency, rolling
30/minute and 500/UTC-day process budgets remain. Credential omission, no-store
and no-referrer transport options are explicit. New real local HTTP stalled-body
test verifies the timeout covers body consumption, not merely response headers.

Geocodio public unauthenticated OPTIONS on Nov 14 allows origin * but NOT the
Authorization request header. No key or address was sent; no geocoding lookup.
Do not build a browser workaround using API keys in URLs. Secure developer secret
entry remains unavailable. Prepared scripts/verify-geocodio-owner.py for a trusted
owner-local interactive terminal: masked getpass with no unmasked fallback, free
tier confirmation, no key arguments/files, temporary child environment, existing
five-public-case production verifier. Four mocked wrapper tests make no provider
calls. Python 3 plus installed Node/pnpm repo dependencies are required. Exact
steps/limitations in docs/delivery-area/README.md. Never run a real key through the
shared Codex terminal. Phone-only owner still needs a trusted local terminal or
secure developer secret-entry facility. Do not ask for a key in chat/GitHub/Render.

Validation: 169 app/API tests, 14 CLI/staging tests, four owner-wrapper tests,
typechecks, production builds, default offline verifier and deterministic pinned
map all pass. Mobile browser/account regressions pass (simulated Clerk/API).
Full local browser/PGlite delivery workflow also passes (simulated payments only).
GitHub CI is pending the push at this checkpoint; inspect the exact pushed SHA's
three completed results, never infer success from pending.
Logs: /tmp/rocoeats-geocodio-hardening-{tests,build,cli,account,workflow}.log.
Sandbox blocks loopback: rerun local server/browser checks with authorized
loopback access; this was an environment failure, not an application defect.

Resume: first inspect branch/tree and the exact commit's three workflows. Do not
repeat the completed CSV job or existing simulated flows absent changes/failures.
Next required evidence: owner-local direct Bearer/API report, independent public
building/entrance confirmation, owner acceptance then separate activation approval.
In-memory quotas reset on restart and are not account-wide free-tier guarantees;
confirm provider free-only hard limits and multi-process/restart usage protection
before activation. No hosted configuration, database, migration, boundary change,
real provider lookup, deployment, payment or financial operation performed. Deployed
revision remains 9c095d3; public/private ordering and live charges stay OFF, Stripe
TEST. Preserve the completed $19.19 order and all financial records.

### Actual Geocodio public CSV evaluated — November 14, 2026

Owner attached the COMPLETED five-public-address Geocodio result CSV. Source
SHA-256 f9dbbcbda4620ba49453596aa3f7787219cae616b70be81f502c1e21677a3728.
No API credential is present; Stable Address Key is not an authentication key and
is excluded from committed observations. Real selected data, not synthetic
provider acceptance: City Hall and public office are inside/clear (>800 m);
airport outside (~3.83 km); forestry office inside excluded hole (~13.5 m from
edge); no-house-number Chamberlain query street_center/score 1.0 must reject.
All five scores are 1.0, demonstrating why score alone cannot authorize delivery.
Detailed table and exact public coordinates: docs/delivery-area/README.md and
geocodio-public-observations.json; map geocodio-results-map.svg. No private input
was transmitted, no further lookup or financial operation was initiated.

Independent Shapely 2.1.2/GEOS + pyproj 3.7.2 UTM16N reference agrees with production
point/margin decisions. It found an invalid pinched source hole. Implemented a
representation-only repeated-vertex split into two touching holes. Derived polygon
is GIS-valid and equals GEOS make_valid(source); every original directed edge and
boundary point set is identical. Approved raw data/hash/map/physical footprint are
unchanged. See README proof/limitations. No dependency/migration/Render change.
New actual-provider and topology regressions pass alongside existing functionality.
The normalization is source-only, not deployed; deployed revision remains 9c095d3.

Best-match CSV does NOT verify API candidate counts, JSON types, direct Bearer
requests, exact physical rooftop positions or suite existence. Mark these unknown;
never reconstruct a unique API claim from one selected row. The two suitable points
remain conditional candidates, three are rejected. Actual near-edge public data
is now observed, but overall accuracy acceptance and separate activation remain
pending. Do not ask the owner to repeat this completed five-row spreadsheet job.
No secure developer key field/key is available. Do not request key in chat or move
it to GitHub/Render. Account creation and boundary/ZIP/30 m approval are already done.

Local validation for this follow-up: 166 app/API tests, 14 CLI/staging tests,
typechecks/production builds; browser regressions and exact new commit CI must be
checked at completion. Logs /tmp/rocoeats-provider-csv-*. Offline GIS scripts and
reference libraries live under /tmp/rocoeats-gis-reference only. Preserve the
checkpoint and new public regression fixture; do not redo completed provider calls.

### Geocodio implementation authorization — November 14, 2026

Owner now authorizes free Geocodio account creation/use, integration and real
accuracy testing of public/nonprivate Rockwood-area addresses. Do not request
that permission again. Paid billing/credits/expenses, private address transmission,
Render changes/deployment, enforcement activation and financial operations remain
unauthorized. Boundary/ZIP/30 m policy already approved. Activation still requires
actual accuracy acceptance and separate owner approval.

Owner subsequently confirmed the free account is ready and this Codex session
has no secure environment Secrets field. No authenticated Geocodio session or API
key is available to engineering. Do not ask the owner to create another account. An asynchronous
question requested account readiness and whether development environment settings
offer a secure Secrets field for GEOCODIO_API_KEY. Never ask for a key in chat.
The runtime offers no request_changes/secret-entry tool here; owner must use a
secure environment Secrets field when offered. If no secure entry is available,
keep the key in Geocodio and report that direct provider testing remains blocked.
Do not put it in GitHub, CLI arguments, Render, logs or a chat attachment.

New implementation: shared fixed-origin bounded Geocodio transport, rolling
30/minute and 500/UTC-day process budgets (failed attempts included), immutable
cache and shared in-flight results retained. Limits are local and restartable,
not an account-wide billing guarantee; use a free-only/no-card account and confirm
at least five free lookups before evaluation. Runtime/ordering settings unchanged.

`node scripts/verify-geocodio-public.mjs` is an offline, no-key dry-run. Once the
owner supplies a secure development key and confirms free-only remaining quota,
run with `--live --confirm-free-tier` (NODE_USE_ENV_PROXY=1 behind the inherited
proxy). Six fixed public cases, at most five calls, no custom address/file/URL
arguments, no retry after transport/quota failure, no database or hosted changes.
It reuses the actual production transport and validator. Reports omit raw payload,
key, returned addresses and exception text. Live reports remain not activation-ready
until independent public footprint/near-edge evidence and owner review are complete.
See delivery-area README for sources, report semantics and exact steps. No real
provider acceptance has been claimed from the offline/simulated tests.

### Current Geocodio candidate verification and next action

164 app/API tests, 14 CLI/staging tests, full typechecks and production builds
passed locally. Existing mobile account/CSP/cart browser regression and full
website/API/PGlite delivery/ledger regression passed with simulated Clerk/payments.
Provider fixtures are synthetic; offline public runner made zero requests and
correctly remained not activation-ready. Transport now uses documented Bearer
authentication, with no key in URLs; explicit country=US and no data appends avoid
non-US/extra-feature lookups. The fixed public CSV for an owner dashboard fallback
is `/workspace/shared/rocoeats-public-geocodio-cases.csv` (five rows, no key/private
address); do not confuse a geocoding result CSV with a usage export containing keys.

Latest logs: `/tmp/rocoeats-geocodio-release-tests.log`, `-release-build.log`,
`-cli-tests.log`, `-account.log`, `-workflow.log` with the same prefix. Verify the
exact new commit and all three CI workflows after push, not the older 9c095d3 jobs.
No deployment, hosted mutation, real provider lookup, payment/refund/transfer or
reconciliation was performed. Deployed version remains verified 9c095d3, both
ordering windows OFF, live charges OFF and Stripe TEST configured. No database
migrations, environment changes or native source changes were added.

Do not repeat completed engineering while awaiting the owner. Implementation
commit 0a86e032a7367716cd2ee0bd7c9b17943aa70599 passed all three workflows:
Validate push 43557984968, Validate PR 43557989731, existing native 43557989733
(optional signing/device jobs skipped). The account is ready, but there is no
secure development key field. Owner was guided to upload the provided five-public-
address CSV in Geocodio, US only/no extra data appends, confirm five rows/free $0
usage, and attach the geocoding RESULTS CSV (not usage/billing export). File:
docs/delivery-area/public-geocodio-cases.csv; original download copy remains at
/workspace/shared/rocoeats-public-geocodio-cases.csv. Results have now been received and evaluated; see the newer section above.
Do not request the API key in chat or use GitHub/Render to work around this restriction.

Next input is that public-only results CSV. Analyze offline against the pinned
boundary/margin. Best-match CSV output does not prove API candidate counts, exact
JSON field types or Bearer authentication; mark missing evidence unverified and
never manufacture it. Direct API tests remain blocked until a secure development
key path is genuinely available. Then perform at most the fixed authorized public
suite with at least five remaining free lookups, inspect actual precision,
unit/ambiguity and independent near-boundary ground truth, add regression coverage
for real discrepancies, and keep municipal activation OFF until separately approved.

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
key, live lookup or expense has been performed. Public provider testing is now
authorized as described above; private address transmission and paid usage remain
unauthorized. Keep all ordering and financial safeguards closed.

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
  No account or real lookup was made. Owner authorized and is creating a
  free account; secure development key entry is still needed; never request keys in
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


## November 14 — owner live Geocodio diagnostic preserved

Owner supplied complete sanitized real-provider report (5/5 requests, boundary SHA-256 e1ebc348ed9cc92ffe8ba8ba0d00873486c9fec851233d4190daad3538289d1f). City Hall accepted; airport, ambiguous street and unsupported ZIP safely rejected. Public-office-unit unexpectedly rejected despite one rooftop/building-centroid result, inside/clear at 807.2 m; reason unresolved, not yet a proven software defect or justified suite-level unit rejection. Forestry office is outside the approved footprint within its excluded hole, 13.4 m from edge; rejection is safe but expected review status needs offline classification inspection. Accuracy acceptance and activation remain false. Full transcribed evidence and investigation criteria: docs/delivery-area/geocodio-live-api-review-2026-11-14.md. No provider calls repeated. Disable the temporary diagnostic in Render via ROCOEATS_GEOCODIO_PUBLIC_TEST_ENABLED=false and redeploy configuration; preserve persisted report, ordering/enforcement off and Stripe TEST-only. No owner activation authorization.
