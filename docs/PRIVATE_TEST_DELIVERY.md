# Real private TEST delivery acceptance

Use https://localeats-delivery-app.onrender.com/ with real Clerk sessions and the
persistent staging database. This procedure must not be replaced with the old demo
or the component fixtures. Keep live keys, real bank details and paid services out.

## Owner setup before an order

1. Deploy the latest verified branch in Render. Leave
   `ROCOEATS_ORDERING_ENABLED=false` during setup. Confirm owner access at
   `/account/access`; Google sign-in must match the configured owner identity.
2. Open `/operations`. **Stripe TEST setup** shows the exact webhook URL, installed
   SDK's snapshot event API version, required subscriptions, and whether the
   signing secret/pricing are present. **Verify Stripe TEST connection** makes only
   server-side read requests to Stripe Balance and Webhook Endpoints APIs. It does
   not create charges, endpoints, recipient accounts or transfers. Both the actual
   TEST-mode result and endpoint configuration result must be Yes. Authentication,
   permission and network failures are redacted; no key or provider payload returns
   to the browser. A restricted/mismatched account key may fail these read checks.
3. In Stripe's **same sandbox** as the platform secret key, use **Workbench →
   Webhooks → Add destination → Your account → Webhook endpoint**. Use the URL/API
   version/events shown in the app. This is a snapshot endpoint, not a thin event
   destination or connected-account-only destination. Copy that endpoint's signing
   secret into Render **Environment → STRIPE_WEBHOOK_SECRET**, save and redeploy.
   Never paste keys into chat or app forms. Stripe publishable keys are not needed
   by the existing hosted Checkout integration. Full setup is also in
   FREE_STAGING_ANDROID.md and RENDER_STAGING_ANDROID.md's TEST webhook section.
4. Save reviewed **test** delivery fee, service percentage, tax rate/base,
   restaurant commission, driver share and service ZIPs in `/operations` →
   **Pricing and service policy**. There is no automatic business tax default.
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
7. **Stop until the owner has verified these private safeguards and authorized
   private ordering.** Only then may the owner change the Render ordering gate for
   this private sandbox. No engineering endpoint automatically changes it. This
   never authorizes public orders or live payments. Leave the gate false otherwise.

## Complete the actual business workflow

- Customer chooses an approved available restaurant, selects real menu items and
  modifiers, saves a service-area delivery address and reviews the server quote.
  Confirm stock/capacity and all fees/tip before submitting. Use hosted Stripe
  Checkout in TEST mode with Stripe's documented sandbox payment methods. Do not
  submit real card information or claim a simulated return page proves payment.
- Stripe's signed event must match the saved session, order, total and currency.
  Confirm collected payment and a processed inbox event. A browser redirect alone
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
- Run the provider reconciliation action and verify fee/net evidence. Recipient
  hosted Connect onboarding and transfers are separate TEST exercises. A transfer
  into a connected balance is not proof of bank payout or live banking readiness.

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
