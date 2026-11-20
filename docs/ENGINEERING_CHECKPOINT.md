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
