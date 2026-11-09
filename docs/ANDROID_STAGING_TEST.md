# Owner-controlled Android staging test

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
https://developers.google.com/android/play-protect/warning-cls .

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
