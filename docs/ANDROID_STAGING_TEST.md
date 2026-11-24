Driver240/source83f2280 completed the owner Samsung screen-lock/offline/restart
procedure on November24. No repeat GPS acceptance test is requested for the
notification-only changes below; the procedure remains for future justified regressions.

## Native-owned Driver candidate — controlled Samsung acceptance

Use only the new exact-source signed artifact listed in the engineering checkpoint;
old Driver233 is known to fail. This candidate moves Driver authentication and duty
requests to the official native SDK; Customer208 remains physically accepted for its
previously tested scope. No Render deployment, migration or hosted setting change
is required for this native-only candidate.

1. Install as an **update**, keeping the existing app and its data. Do not uninstall
   or create an account. A single browser approval with the existing owner/driver
   account may be needed to establish the new native SDK session. Confirm Driver
   controls and existing permissions. A loop, blank page or recovery code is a fail;
   record the code and stop instead of repeating authorization.
2. Reconnect explicitly if requested. Check the background-sharing consent box and
   tap **Enable background location for this session** while the app is visible.
   Allow notifications/location if requested. Wait for the ongoing on-duty
   notification and advancing heartbeat/GPS receipt times. Existing Android
   “while using” location permission supports the foreground service; do not change
   battery/network settings for this comparison. This does not enroll Firebase push.
3. Lock the phone for **five minutes**. Unlock into Samsung Chrome **Dispatch before
   reopening Driver**. Pass requires available/eligible driver and recent accepted
   GPS, not merely a notification. Then open Driver and compare receipt times. Native
   token renewal/HTTP/ACK must continue without foreground JavaScript processing.
4. If disconnected or receipts stopped, read/copy the sanitized native diagnostic
   report **before** reconnecting, stopping, signing out, or force-closing. Report
   visible codes/times only; no credentials. Do not repeat the same failed run.
5. Stop background sharing, then **Go offline**; verify Dispatch is offline and no
   fresh location is accepted. Force-close/reopen: sign-in should restore, background
   sharing stays OFF and reconnect remains explicit. No order, payment, provider
   send, geocoding lookup or financial operation belongs to this test.

Automated native/JVM/browser builds are prerequisites, not physical acceptance.
Recheck actual source/signature/version in the checkpoint before downloading.

## Real push readiness — owner-controlled setup, no credentials in chat

Software preparation does NOT mean actual push works. The signed staging workflow
can now consume optional customer/driver Firebase CLIENT JSON separately, validate
its exact staging package/project, write a private runner file, and verify compiled
Google app/project resources. Missing input explicitly produces an unconfigured
build. Client files are ignored by git and removed from the runner. Never put a
Firebase service-account private key in either Android client secret or APK.

When the owner separately approves provider setup (all steps work in phone dashboards):
1. Notification migration0029 was already approved/deployed; do not repeat it.
   Before adding SERVER push credentials, approve a verified backend release that
   includes the separate `ROCOEATS_PUSH_DELIVERY_ENABLED` gate. Keep it absent/false.
   Historical staging76a24ed has configuration-as-activation, so do not add a server
   key there without separately approving sends. New Operations must report
   **Provider push sending: disabled**, with all ordering/payment/municipal gates OFF.
2. In an existing/free Firebase Spark project, register staging Android packages
   `com.rocoeats.app.staging` and `com.rocoeats.driver.staging`. Use the SAME project
   as backend FCM credentials. No billing/card/paid upgrade or new project is created
   by engineering. Download the matching google-services.json for each app.
3. GitHub repository -> Settings -> Secrets and variables -> Actions -> New repository
   secret. Put each downloaded CLIENT JSON privately in its matching field:
   `ROCOEATS_FIREBASE_CUSTOMER_ANDROID_CONFIG_JSON` or
   `ROCOEATS_FIREBASE_DRIVER_ANDROID_CONFIG_JSON`. No base64, laptop, terminal,
   public upload, source commit or chat is needed. Do not change signing secrets.
4. Backend sending separately needs `FIREBASE_SERVICE_ACCOUNT_JSON` in protected
   Render Environment, with authorized FCM sending access to the same project.
   This is a SERVER secret; never upload it to GitHub source/client configuration.
   Setting it and redeployment require separate owner authorization; not done here.
5. After readiness verifies backend capability and closed gates, use the existing
   signer for each audience. Check BUILD_READINESS client flag and exact source;
   compiled resources/configuration still do not prove device receipt.
6. Only after separate owner authorization, enable `ROCOEATS_PUSH_DELIVERY_ENABLED=true`
   for the controlled device exercise, then return it to false afterward. New sends
   stop; already-in-progress acknowledgements remain auditable. In that exercise: explicit notification consent,
   enroll current account, confirm its server registration, then verify one existing
   authorized notification in foreground/background/terminated states. No test
   payment/order creation is implied. In-app inbox remains authoritative; never
   infer delivery from a provider acknowledgement. Restaurant/admin profiles use
   their authorized shared app/in-app inbox; no browser system-push support is claimed.

APNs stays sandbox/development only. Existing Apple team access, matching customer/
driver App IDs/provisioning with push entitlement, protected server
`APNS_PRIVATE_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`, and a real iOS device are required.
No Apple account/billing/signing change or membership purchase is authorized here.
Physical iOS/background receipt remains blocked until those owner-controlled inputs.

## Driver emulator smoke (no authenticated account)

Use the existing **Native validation and signed staging** workflow: target
`android-smoke`, audience `driver`, APK run `44468084935` (v154/d0cf7b8, owner-tested).
The workflow revision must include audience-aware smoke support. It validates the
successful same-repository packaging run, exact artifact source/audience, checksum,
owner public certificate and compiled staging manifest before installing bytes.
Driver uses its own package/return scheme and safe signed-out entry/navigation/
restart checks. Customer selection retains its guest/navigation checks. Neither
flow starts browser approval, creates an account, submits an order or makes payment.

Evidence is `RoCoEats-driver-Android-Emulator-QA` (or customer), with exact source,
package, permission defaults, screenshots and crash checks. This is actual signed
APK/emulator evidence, NOT physical Samsung, authenticated session, background GPS
or push-delivery acceptance. No signature/key initialization is required.

# Owner-controlled Android staging test

## Verified driver APK available — November 17

The existing protected signer completed successfully for deployed source
**6cc3c7848b7196aa00a26fc40676d939aa0c0a56**. No new key or paid service.

1. On Samsung Chrome, sign into GitHub and open
   [the driver artifact](https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44039742923/artifacts/14308852404).
2. Download **RoCoEats-Driver-Android-Staging-Test-APK** ZIP. In **My Files →
   Downloads**, extract it and open **RoCoEats-Driver-Android-Staging-Test.apk**.
   Keep normal security protections enabled; stop if installation is blocked.
3. The app is **RoCoEats Driver**, package **com.rocoeats.driver.staging**.
   Use your existing approved owner/driver identity. Do not create another account
   or order, enable ordering, or initiate a payment.
4. Record installation/sign-in and then follow the supervised background-location
   checks below when ready. Binary verification does not establish physical GPS,
   session renewal, notification delivery or store approval.

[Successful run](https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/44039742923).
Artifact expires December 17, 2026 UTC. APK SHA256:
`a787fe6fc497c72fe16362f419ab91dcfc8c4f026f3a095e0e3c7e2ec161a8ba`.
APK is 4,999,253 bytes, v2 signed, existing owner's certificate matched. Actual
private location-only service and secret scans passed; temporary signer removed.
This build precedes the newer push-status/APNs-identity work. That work requires
an approved backend deployment before producing a replacement APK. Do not repeat
signer initialization. Older instructions below describe the reusable workflow.

## November 17 customer and dedicated driver build identities

Customer identity/signing below remains unchanged. The shared native projects now
also support ROCOEATS_NATIVE_AUDIENCE=driver during development builds:
com.rocoeats.driver, RoCoEats Driver, rocoeats-driver://auth. CI compiles separate
customer/driver Android and iOS variants and verifies actual IDs/schemes. Unsigned,
unconfigured CI artifacts are compile evidence, not phone-installable staging
releases. Do not replace the existing signed APK or repeat signing initialization.

The driver app uses existing approval, duty, offers, navigation, handoff, earnings
and support. A reload still requires explicit reconnect; background location and
push receipt remain physically unverified. Driver-specific Firebase/APNs identity,
signed releases, iOS provisioning and physical-device acceptance remain separate.
The shared website containing the driver browser-return link must be deployed
before an authorized real driver app sign-in test. Keep ordering/live/municipal
safeguards OFF; do not repeat payment or geocoding acceptance for native builds.

## Prepare a current signed driver APK entirely from the phone

First require the final source SHA's CI success and owner deployment of that exact
SHA to the EXISTING Render service. Manual Deploy → Deploy a specific commit; do
not edit environment variables or enable ordering. After Render reports Live,
engineering performs read-only verification. Driver packaging refuses an older
website lacking the dedicated return scheme, even if its general health is good.

Then open GitHub Actions → native-validation.yml → Run workflow. Select branch
feature/rocoeats-launch-readiness, target **staging**, audience **driver**. Leave
signing initialization alone. Engineering can trigger this existing workflow after
readiness is verified; the owner need not use a terminal. No signing secret should
be displayed or copied into chat. Customer remains the default and its old artifact
name is unchanged. Do not select the customer-only emulator smoke target for driver.

After actual workflow success, open **RoCoEats-Driver-Android-Staging-Test-APK**.
APP_IDENTITY.json records the source SHA and com.rocoeats.driver.staging package;
SHA256SUMS.txt and signing-certificate.txt accompany the verified APK. Download the
ZIP in Samsung Chrome, extract it in My Files, and install the driver APK while
keeping normal device security protections enabled. A skipped signing job or an
unsigned/unconfigured artifact does not satisfy this step. Do not start a payment
or order. Driver device acceptance below remains separate from artifact creation.

## Future supervised driver background-location acceptance

Do not begin until the latest shared website is deployed, the configured signed
**driver** staging APK is available, and the owner authorizes this device exercise.
Unsigned/unconfigured compile artifacts are not a substitute. Keep both ordering
flags OFF, Stripe TEST/live charges OFF and municipal enforcement OFF. No order,
payment, provider verification or customer address is needed for this exercise.

1. On Samsung, open the driver app and use the existing approved driver or owner
   identity. Verify the existing role; do not submit another owner application.
2. Go online explicitly. Review session background-location consent, enable it and
   grant the required device permissions. Android must show its ongoing location
   notification. Declining permission must leave background sharing stopped.
3. Keep owner Operations open in a separate Chrome session. Observe fresh location,
   then leave the driver app backgrounded for MORE than five minutes. Confirm GPS
   updates continue in Operations, not just an online badge.
4. With Chrome last active, lock the screen for over five minutes. Unlock back into
   Chrome and refresh Operations BEFORE opening the driver app. Check that the
   latest GPS timestamp was updated during the locked interval and is fresh. A
   foreground refresh after returning to the driver app is not background evidence.
5. Stop background sharing, then go offline. Verify the notification disappears and
   dispatch position clears. Reopen/restart the app: it must not silently resume GPS;
   explicit reconnect and fresh consent are required. Restore prior availability.
6. Record app SHA/build, Android/One UI version, permission choice, timestamps,
   locked-screen results and battery observations. Report failures without sharing
   private coordinates/tokens. Separate iOS physical acceptance is still required.

This candidate uses existing authenticated driver APIs; expired/revoked/off-duty
access stops sharing. Android uses native HTTP to avoid WebView throttling; actual
Clerk session renewal and OS behavior remain device acceptance gates. The customer
app deliberately does not acquire the driver background plugin/permissions.

**Physical Samsung installation and launch passed (owner-confirmed, November 9).**
The owner installed this exact signed APK on a Samsung Galaxy S22 Ultra; Play Protect
allowed installation, the app opened, and appearance matched the website. Android/
One UI versions were not supplied. This verifies only installation, launch and the
reported appearance—not native sign-in, maps, permissions, push, payment or delivery,
and not general Google developer certification. Keep security protections enabled.

**Verified signed testing build is available.** Signing setup and native backend
configuration are complete; do not repeat initialization below.

- APK source: `5c687ac102adfe622f11403239398ec43fc84e15`.
- Successful signed run: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/42583769896 .
- Download: https://github.com/pcorey922-bit/LocalEats-Delivery-App/actions/runs/42583769896/artifacts/13658705753 .
- Artifact: **RoCoEats-Android-Staging-Test-APK**, expires December 9, 2026.
- App: **RoCoEats Staging**, package `com.rocoeats.app.staging`.
- APK Signature Scheme v2 verified; RSA-3072 owner-controlled test identity.
- Certificate SHA-256: `f22e58f4da4e5d64f9ac5d4f0fc8abfe2595e395511552f7fb385205c7d18296`.

Open the ZIP in Samsung **My Files → Downloads → Extract**, then open
`RoCoEats-Android-Staging-Test.apk`. Keep Play Protect/Auto Blocker enabled. Use a
security scan if Google offers one; stop if installation is blocked. Signing/static
checks do not mean Google has approved the developer or this APK.

This is the real app, not the old interactive demonstration. Keep public ordering
false and Stripe TEST. The owner's verified webhook and temporary 0% sandbox tax
must not be changed. A real sandbox payment/signed event and device tests remain.

## Why the old APK was not a testing release

The previous workflow built without the API origin or real public Clerk Development
key. Android debug packages are cryptographically signed with a temporary debug
identity; that is not a stable owner-controlled staging signing setup. An unknown
or new developer/app can receive a Play Protect warning. Signing alone does not
establish Google reputation, prove absence of malware, or remove a warning. The
exact warning classification has not been inspected on the owner's Samsung.
Official references (read November 9):
https://support.google.com/googleplay/answer/2812853 and
https://developers.google.com/android/play-protect .

## Signing setup — owner-only, no passwords or tokens in chat

The current GitHub integration can push code and read Actions but receives HTTP 403
on repository secrets/variables management. A stable private key cannot safely be
kept in source, an APK, public artifacts, or a developer-owned account.

One-time owner setup on your Samsung:

1. Open https://github.com/settings/personal-access-tokens/new in Chrome while
   signed into the repository owner account. Create a fine-grained token named
   **RoCoEats one-time staging signer**, expiring in **1 day**, limited to **Only
   select repositories → LocalEats-Delivery-App**. Under repository permissions set
   **Secrets → Read and write**. Do not grant organization or other repositories.
2. Generate the token and copy it directly into the protected repository setting:
   https://github.com/pcorey922-bit/LocalEats-Delivery-App/settings/secrets/actions .
   Press **New repository secret**. Name: `ROCOEATS_SIGNING_SETUP_TOKEN`. Paste the
   token into **Secret** and press **Add secret**. Never paste it into chat/issues.
3. Tell the engineer only **Saved**. The engineer runs the existing native workflow
   on `feature/rocoeats-launch-readiness` with target `initialize-staging-signing`.
   This generates an RSA-3072 PKCS12 staging key and random 256-bit password only on
   the ephemeral GitHub runner, writes two encrypted owner repository secrets and
   deletes its bootstrap secret. No private-key artifact or source commit is made.
   Then revoke the temporary personal token in GitHub Settings; it is no longer needed.

Stable secrets: `ROCOEATS_STAGING_KEYSTORE_BASE64` and
`ROCOEATS_STAGING_KEYSTORE_PASSWORD`. Alias: `rocoeats-staging`. Never delete/rotate
these once the staging app is installed unless deliberately changing test identity.
A partial bootstrap fails closed rather than overwriting a possible installed key;
an owner must review both secret names before resetting a failed initial setup.
Owner account access is the trust boundary. Restrict repository write/workflow access,
enable account MFA and plan a secure owner-controlled backup before production use.
These are TEST signing keys, not production app-store release keys.

## Build and deployment

Deploy the latest branch in Render before device testing: select the web service,
**Manual Deploy → Deploy latest commit**. Native-origin CORS is enabled only for
private Stripe TEST staging and does not grant any role or bypass authentication.
No protected environment values are overwritten. Public/native configuration is
versioned in `config/native-staging.json`: HTTPS Render origin and public `pk_test_`
Clerk key only. No Clerk/Stripe secret, database credential or signing password is
allowed there. Production origin/live Clerk keys are rejected by the build preflight.

Engineer command after signing setup:
`gh workflow run native-validation.yml --ref feature/rocoeats-launch-readiness -f target=staging`

The configured build produces only after signature/security checks succeed:
**RoCoEats-Android-Staging-Test-APK**, containing
`RoCoEats-Android-Staging-Test.apk`, its SHA-256 checksum, merged manifest and review
limits. Package `com.rocoeats.app.staging`, label **RoCoEats Staging**, non-debuggable,
HTTPS-only, backup/device transfer excluded, narrow non-exported FileProvider,
foreground location only. The staging key is restored only to runner temporary
storage, is not bundled, and is removed even on failure. Artifacts expire after
30 days; source and owner signing secrets remain so the owner can rebuild.

## Download and installation on Samsung Galaxy S22 Ultra

1. Open the successful Actions run supplied by the engineer while signed into
   GitHub. Scroll to **Artifacts** and tap **RoCoEats-Android-Staging-Test-APK**.
2. In Samsung **My Files → Downloads**, tap the downloaded ZIP, choose **Extract**,
   and open `RoCoEats-Android-Staging-Test.apk`.
3. Proceed only through the normal Android installer and any permitted per-source
   authorization. Keep Play Protect and Samsung Auto Blocker enabled. If either
   blocks installation, stop; do not choose **Install anyway**, disable protection,
   or change developer/ADB settings to get around it. Use Google's offered security
   scan/review if available and give the engineer only the exact warning wording.
   Google developer/app verification or false-positive review may require the owner
   to use their Google account. No Play Protect approval is claimed from our checks.
4. Open **RoCoEats Staging**. Do not use real cards or rely on the app for live
   deliveries. Use the private tester/guest process and collect the evidence below.

If the platform will not permit a reviewed sideload, use the existing HTTPS staging
website while the owner completes an approved distribution/Google review path.
No paid store account, app publication or security bypass is authorized here.

## Acceptance evidence still required on actual devices

Record app/version, Android/One UI version, device permission decisions, network,
actual observed outcome and sanitized error. Never share tokens/private links/keys.
Check launch/navy design, public/private guest access, real menus/cart, Clerk sign-in,
owner admin/driver permissions, Google Maps, denied location, network loss/restart,
Stripe TEST browser return, guest tracking/handoff and no live/unauthorized ordering.
Push and background location remain unverified and must not be described as working
from compile/static tests. iOS still requires signing/provisioning and physical-device
verification; unsigned compilation is not App Store or TestFlight readiness.

## Native sign-in and guest access

Native sign-in deliberately uses the system browser so Google authentication is not
performed in an embedded WebView. The app creates a random PKCE verifier/challenge;
the browser explicitly approves the currently signed-in Clerk identity using a
separate protected state value. The app alone redeems its proof. A database-locked,
five-minute grant is consumed once, then the server requests a 60-second Clerk
sign-in ticket outside the SQL transaction. No JWT/ticket/verifier appears in a
return URL; `rocoeats://auth` only navigates back. Transport failures require restarting
sign-in rather than duplicating credentials. Existing role/approval/owner checks
remain server-side. This needs deployed migration 0028 and real Clerk/device testing.

The app handles both warm links and cold launch URLs, refreshing records on resume.
Native guest testers can open **Guest order → Use a private guest link** and paste
the owner's safe test invitation without signing in. Only the exact approved HTTPS
origin/path and fragment token are accepted; the API verifies access before it is
saved. Guest capabilities are never transferred using an interceptable custom scheme.
The signed build refuses packaging until the real deployed mobile contract, Clerk
public key, native CORS and closed ordering are verified. This prevents another
apparently configured APK being handed off against an incompatible backend.

Signing initialization was completed successfully in run 42581883152. Do not repeat
initialization: the two stable encrypted signing secrets now exist and must be kept
for staging updates. Revoke the temporary one-day personal token in GitHub Settings.
Normal staging builds no longer need that token. The normal engineering integration
still cannot read/manage those secrets. The native backend is now deployed and the configured build's mandatory connectivity preflight passed.
