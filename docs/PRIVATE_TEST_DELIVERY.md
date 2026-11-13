# Real private TEST delivery acceptance

Use https://localeats-delivery-app.onrender.com/ with real Clerk sessions and the
persistent staging database. This procedure must not be replaced with the old demo
or the component fixtures. Keep live keys, real bank details and paid services out.

## Website release to the existing service (approval required)

Do not create another service, deploy the paid root `render.yaml`, reset Neon,
change existing credentials, or enable ordering as part of this release.

1. Confirm every GitHub workflow for the chosen full commit SHA has finished with
   conclusion **success**. A queued/running/missing result is not a pass; skipped
   signing/device jobs do not verify those capabilities. Keep PR #1 draft/unmerged.
2. After deployment approval, open the **existing** Render service for
   `localeats-delivery-app.onrender.com`. Confirm branch
   `feature/rocoeats-launch-readiness`, Dockerfile `./Dockerfile`, Docker Command
   `node --enable-source-maps scripts/start-free-staging.mjs`, `/livez` health
   check, auto-deploy off, and the existing Neon database. Use **Manual Deploy →
   Deploy a specific commit** with the approved full SHA. Preserve all environment
   values, including `ROCOEATS_PRIVATE_STAGING=true`, `PAYMENT_PROVIDER=stripe_test`,
   `ROCOEATS_ORDERING_ENABLED=false`, and
   `ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED=false`.
3. Wait for migrations and Render **Live**, then run from this repository (replace
   the placeholder with the approved 40-character GitHub SHA):

   ```sh
   node scripts/verify-staging-http.mjs https://localeats-delivery-app.onrender.com/ APPROVED_FULL_COMMIT_SHA
   ```

   Require `verificationPassed: true`, `revisionMatches: true`,
   `dependenciesReady: true`, and empty `missingConfiguration`,
   `unverifiedDependencies`, and `failures` arrays. The verifier uses only GET and
   OPTIONS requests. A wrong release still reports the observed SHA and all
   independent checks. Missing configuration is distinct from unavailable health
   evidence. Reports contain no keys, cookies, guest capabilities or provider
   payloads. HTTP 200 for a website route verifies its HTML shell, not a Clerk
   login or completed business action. A 503 readiness response can be diagnosed
   with ordering closed; it is not acceptance readiness.
4. In separate private browser sessions, use homepage **Sign In** with the invited
   customer, restaurant, driver and administrator accounts. Confirm server roles
   at `/account/access` and the authorized workspace destinations. The owner must
   be able to switch Administrator → Driver → Administrator without losing admin
   access. A non-admin must be denied `/operations`. Test guest browsing using
   **Private guest test access** from Operations in a separate signed-out session;
   ordinary anonymous visitors cannot create staging guest access.
5. Review `/operations` → **Stripe TEST setup** and **Verify Stripe TEST connection**
   using the existing configuration. Both provider TEST mode and the exact enabled
   webhook URL/version/events must be verified. Review saved test pricing, ZIPs,
   restaurant hours/stock/approval, and driver approval/availability. Do not replace
   existing settings simply because this procedure mentions setup below.
6. Stop with both ordering switches off. Only a **separate explicit approval**
   authorizes the private acceptance window described below. During that window,
   run the same verifier with `--private-test-window` after the approved SHA; after
   closing it, rerun the command without that option.

The acceptance below is a supervised website exercise: no Android/iOS build,
installation or device-signing step is required. A signed Stripe sample event
checks intake only. Actual payment acceptance requires the Checkout transaction,
matching processed signed event, delivery receipt and per-order reconciliation.

## Set up RoCoEats Test Kitchen with both ordering switches off

1. Use separate browser sessions for the customer, restaurant operator and owner.
   Sign the customer and operator into staging. At `/account/access`, copy each
   Clerk User ID. Add those IDs, comma-separated, to the existing
   `ROCOEATS_STAGING_TESTER_CLERK_USER_IDS` in Render and apply the changes.
   Preserve existing invitees. Keep both ordering switches false. If using a
   separate driver rather than the owner-driver, invite that account too.
2. In the operator session, select **Restaurant** during account setup. Open
   `/restaurant`, enter **RoCoEats Test Kitchen**, description
   **Fictional staging test only**, and a fictional address such as
   **100 Test Kitchen Way, Kingston, TN 37854**. Leave phone blank and select
   **Submit for review**. This account owns the listing automatically.
3. In the administrator session, open `/admin` → **Restaurants**, find the
   Test Kitchen, verify the displayed owner, and select **approved**.
4. In the operator session, open **Menu management** → **Add category** and
   name it **Test Menu**. Use **Add item** three times with prices in dollars.
   Add Cheeseburger at 8.99, French Fries at 3.49, and Soda at 2.00. A visible
   item has a **Hide** button. In **Menu inventory**, enter 5 available units
   and reason **Initial staging test stock** for each item, then **Save stock**.
5. Under **Business profile** → **Ordering and opening hours**, set the test
   day's hours to cover the supervised run (Eastern time), clear **Closed**
   for that day, select **Accept test orders during opening hours**, set
   **Maximum open orders** to 1, and select **Save opening hours**.
6. Use the owner account at `/driver` to **Go online** or **Reconnect on this
   device**. Check Operations dispatch shows that driver available with no
   active assignment. If blocked, check owner-driver access at
   `/account/access`. A separate ordinary driver must have an approved
   application before going online.
7. As the invited customer, open the menu and review a quote using a fictional
   address in an enabled ZIP. One of each item should show a $14.48 food
   subtotal before fees, tax and tip. Ordering should still be disabled.
   Leave the gates closed until the owner verifies these prerequisites.
   Simulate arrival and handoff without traveling to the fictional address.

## Owner setup before an order

Rockwood launch restriction: new quotes and checkout require restaurant and delivery
address locality Rockwood, state TN/Tennessee, ZIP 37854 (or a valid 37854 ZIP+4), and 37854 enabled in
the saved service policy. Do not change historical test records to make them pass.
An older Kingston/locality test address can still be read and reconciled but cannot
start another checkout under this policy. Postal/locality checks are not physical
city-limit verification; approve trusted geocoding and a municipal boundary check
before public launch. Existing order/payment/receipt access remains unchanged.

1. Deploy the latest verified branch in Render. Leave
   `ROCOEATS_ORDERING_ENABLED=false` throughout and leave
   `ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED=false` during setup. Confirm owner access at
   `/account/access`; Google sign-in must match the configured owner identity.
2. Open `/operations`. **Stripe TEST setup** shows the exact webhook URL, installed
   SDK's snapshot event API version, required subscriptions, and whether the
   signing secret/pricing are present. **Verify Stripe TEST connection** makes only
   server-side read requests to Stripe Balance and Webhook Endpoints APIs. It does
   not create charges, endpoints, recipient accounts or transfers. Both the actual
   TEST-mode result and endpoint configuration result must be Yes. Authentication,
   permission and network failures are redacted; no key or provider payload returns
   to the browser. A restricted/mismatched account key may fail these read checks.
   The app also saves a `payment.setup_checked` audit entry when this button is
   used. Although Stripe calls are read-only, the button is not a strictly
   read-only hosted-data operation; obtain approval for that audit write first.
3. Reuse the existing Stripe destination if step 2 passes. Only if the destination
   is missing or mismatched, and after owner approval, in Stripe's **same sandbox**
   as the platform secret key use **Workbench →
   Webhooks → Add destination → Your account → Webhook endpoint**. Use the URL/API
   version/events shown in the app. This is a snapshot endpoint, not a thin event
   destination or connected-account-only destination. Copy that endpoint's signing
   secret into Render **Environment → STRIPE_WEBHOOK_SECRET**, save and redeploy.
   Never paste keys into chat or app forms. Stripe publishable keys are not needed
   by the existing hosted Checkout integration. Full setup is also in
   FREE_STAGING_ANDROID.md and RENDER_STAGING_ANDROID.md's TEST webhook section.
4. Review the saved **test** delivery fee, service percentage, tax rate/base,
   restaurant commission, driver share and service ZIPs in `/operations` →
   **Pricing and service policy**. There is no automatic business tax default.
   Preserve existing reviewed settings. Save changes only after owner approval.
   These settings are server-validated; existing orders retain their snapshots.
5. Create separate safe customer, restaurant and driver Clerk test identities.
   Admit their IDs through Render's protected
   `ROCOEATS_STAGING_TESTER_CLERK_USER_IDS`, not either owner list. Each signs in and
   selects its role. The restaurant submits business information; the owner approves
   it and the driver application using genuine sandbox verification records.
   Publish menu categories/items/modifiers, stock, accepting status and seven-day
   operating hours. The ordinary driver still needs approval and explicit duty/GPS
   consent. The owner may drive using the separately configured owner exception.
6. Verify signed webhook delivery in Stripe and the app's inbox. A Stripe sample
   event can test the signature/HTTP route only; it is not a real customer payment
   and may be quarantined because its order metadata does not belong to this DB.
   Historical accepted-event time does not verify a newly changed signing secret.
   Real payment evidence comes from the actual Checkout transaction below.
7. Once the owner has authorized the test and verified the safeguards, set
   `ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED=true` in the existing Render service
   and deploy the revision that supports this flag. Keep
   `ROCOEATS_ORDERING_ENABLED=false`, `ROCOEATS_PRIVATE_STAGING=true` and
   `PAYMENT_PROVIDER=stripe_test`. Leave all credentials as configured. Before
   submitting, verify `/api/mobile/readiness` reports `privateTestStaging: true`,
   `publicOrderingEnabled: false`, `privateTestOrderingEnabled: true` and
   `liveChargesEnabled: false`. Verify an uninvited identity is denied. The read-only
   staging verifier accepts `--private-test-window` after the exact deployment SHA
   to check this state without credentials or test transactions.

## Complete the actual business workflow

- Customer chooses an approved available restaurant, selects real menu items and
  modifiers, saves a service-area delivery address and reviews the server quote.
  Click **Calculate test total**, review every amount, then **Create order** →
  **Prepare secure test payment** → **Open Stripe test checkout**. For the initial
  successful card test use Stripe's documented TEST Visa `4242 4242 4242 4242`,
  a future expiry and any three-digit CVC, only on Stripe's TEST checkout page.
  Confirm stock/capacity and all fees/tip before submitting. Do not
  submit real card information or claim a simulated return page proves payment.
- Stripe's signed event must match the saved session, order, total and currency.
  Confirm collected payment and a processed inbox event. When the latest signed
  event in Operations matches the Stripe event ID, its state distinguishes
  receipt from processing. If a later event supersedes it, use the relevant event
  in the Stripe dashboard and the matching order payment record. A browser redirect alone
  cannot mark an order paid. Record the real test payment/order IDs privately.
- Restaurant accepts the paid order, prepares it and marks it ready. Owner dispatch
  assigns an eligible online driver, or the driver claims the offer. Confirm there
  is only one active delivery and the other driver cannot claim the same order.
- Driver launches Google/Apple navigation where supported, confirms arrival and
  pickup, and uses authorized foreground GPS. Check customer/restaurant tracking
  and admin stale-location behavior. Do not infer background/native reliability
  from browser foreground location or deep-link generation.
- On handoff, the customer uses **Generate handoff code** only after receiving the
  order; the driver enters it to complete delivery. Do not post the handoff code
  in chat. Confirm the customer receipt, completion event, earnings/tip allocations,
  restaurant/driver dashboards and administrator financial records.
- Administrator: in `/operations`, find this order, enter a **Review reason**
  of at least ten characters and select **Reconcile Stripe test charge**. Verify
  the returned charge, fee and net evidence against that payment in Stripe.
  In **Operational ledger**, enter the order ID in **Filter by order ID**, select
  **Apply filter**, and require **Trial balance is balanced** with zero missing
  payment baselines. Compare the saved quote/charged total and pricing snapshot
  with the restaurant and driver earnings, including tip. Record discrepancies;
  a balanced ledger alone does not prove correct allocations or provider evidence.
  If balance evidence is missing or pending, leave this order and its payment
  intact. Stripe can supply the balance transaction after asynchronous capture,
  and its funds can remain pending afterward. Review the existing transaction's
  status/availability in Stripe; retry reconciliation manually only when available.
  A reported availability date is informational, not proof of settlement. Invalid
  or mismatched evidence requires investigation; never estimate fees, override
  the guard, repeat payment or create a replacement order to clear reconciliation.
  Recipient
  hosted Connect onboarding and transfers are separate TEST exercises. A transfer
  into a connected balance is not proof of bank payout or live banking readiness.

## Close the private acceptance window

When the test or any failed attempt ends, restore `ROCOEATS_PRIVATE_TEST_ORDERING_ENABLED=false`
on the same private Render service and wait for the redeploy. Keep the Stripe TEST
provider and existing credentials. Confirm `/livez` still reports the expected
revision and `/api/mobile/readiness` reports private staging, closed ordering and
disabled live charges. The public ordering switch stays false throughout. Leave existing test records available for reconciliation.

Record the order ID and the Stripe TEST Checkout/payment/event references privately.
For the order, compare the displayed and stored subtotal, delivery/service fees,
tip, tax and charged total. Compare the restaurant commission and driver
allocation against the order pricing snapshot, including the tip. Check the
settlement recipients and the balanced administrator ledger. Confirm the signed
webhook inbox entry is processed and compare the Stripe fee and net balance
transaction to the reconciliation report. Record each stage separately and
mark any missing provider evidence or mismatched cents as an open item.

## Failure acceptance and evidence

Exercise decline/abandoned checkout, duplicate submission/webhooks, restaurant
rejection, no drivers, stale GPS, reconnect, reservation expiry, cancellation,
delivered-order platform-funded partial credit and remaining full refund. Verify
stock releases exactly once before acceptance and paid/unknown outcomes remain
recoverable. Test refunds/Connect only against sandbox transactions you own.

Record date, deployed SHA, role, actual order/payment/event references, expected
versus observed state and UI/DB/provider evidence. Keep actual-device, provider,
owner-assisted, HTTP, automated and simulated-component results distinct in
PRODUCTION_BACKLOG.md. No complete delivery is verified until all real steps pass.
Free Render sleeps and pauses workers; keep the browser active during a supervised
test, without adding keep-alive services. Never reset Neon to resolve a failure.

## Guest and telephone-managed restaurant acceptance (November 9)

These are real shared application workflows, not the old interactive demo. They
still require deployed/provider/device acceptance. Keep ordering closed until the
existing private-test safeguards are reviewed and explicitly authorized.

In Operations, create **Private guest test access** with safe test contact details.
Copy the link and open it in a separate private browser with no Clerk session.
The capability is in the fragment (not an HTTP query); the app strips it and saves
it on that device. It expires after seven days. Anyone holding it can access and
request permitted changes to that single order. Do not post it publicly. Revoke
it when done. Guest cart storage is separate from every registered account. Do
not delete browser/app storage during an active test without saving the link.
Email alone never retrieves or associates orders. Optional account association
requires both authenticated customer access and possession of the live capability.

Guest API authentication does not authorize restaurant/driver/admin APIs. Private
staging accepts guest capabilities only on listed customer/browsing routes. Normal
anonymous visitors cannot mint sessions in private staging. In-app support and
tracking do not depend on push. Guest email-link delivery and verified receipt mail
remain external setup work; no mail/SMS subscription was activated. Stripe receives
the guest receipt email, but actual receipt delivery needs owner/provider testing.
Android/iOS use the same guest screens and saved app-webview access. After hosted
Stripe checkout use **Return to mobile app**; the existing `rocoeats://orders` route
returns to guest tracking when saved guest access exists. This requires real device
verification, including suspended/restarted apps. No native success is inferred
from the browser fixture or CI typecheck.

For a restaurant preferring phone orders, save its real test contact phone in the
restaurant profile, then use Operations → Telephone restaurant confirmation →
Configure restaurant receipt modes. The switch affects future orders only.
Existing orders retain their original mode. Electronic confirmation stays intact.

Telephone orders reserve stock and enter the durable queue **before payment**.
Dispatch must call and record contact, verify every item/quantity/modifier and the
exact approved food subtotal, then record genuine acceptance plus preparation
estimate. Tell the kitchen to wait for verified payment before preparation. The
customer sees pending/contacting messages until that action. Checkout is blocked
server-side until acceptance. Once payment is verified, the same order enters
accepted → preparing → ready → driver pickup/delivery. Operators may use existing
order controls for preparation/readiness and normal cancellation/refund recovery.

This implementation deliberately requests no card authorization or capture before
the phone confirmation. It does not claim Stripe manual-capture authorization,
funds reservation or automatic authorization extension. Existing TEST hosted Checkout
captures only after genuine confirmation. If a restaurant cannot wait for payment,
do not represent that restaurant's workflow as supported without an agreed policy.
Price discrepancies/unavailable items must be noted and the unpaid order rejected;
the customer must approve a fresh quote/order. No silent substitution or increased
charge is supported. Rejection releases reserved stock once and records no payment;
late payments on cancelled orders retain existing refund recovery. After acceptance
use existing cancellation controls, never overwrite the confirmation decision.

Pending-call ages, contact/decision timestamps, dispatcher identity, command versions
and audit records persist. Conflicting actions return 409; identical last-command
retries replay safely. Existing restaurant-response escalation now includes unpaid
pending phone confirmation, and ordinary reservation expiry releases unconfirmed
orders. Render Free sleeping delays workers and alerts: this remains private testing,
not always-on production telephone dispatch. Keep the queue open and reconcile it
on wake. No proprietary tablets, automated paid calls or SMS are required.

After rejection, expiry or delivery, use **Start another guest order** on the guest
tracking page. Save the previous private link first, then enter contact details for
the next order. The new token cannot retrieve the previous order; the previous link
remains valid for support/refund updates. Active orders must finish or cancel before
restarting. This does not create a charge, enable ordering or reopen a cancelled order.
