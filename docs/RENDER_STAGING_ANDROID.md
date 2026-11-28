# Put RoCoEats staging online from an Android phone

**Paid option retained for future use. The owner's current budget is $0/no card:**
use [FREE_STAGING_ANDROID.md](FREE_STAGING_ANDROID.md) instead. Do not deploy this
paid Blueprint under the current authorization.

Recommended: a business-owned **Render Hobby workspace**, one always-on Docker web
service and one managed PostgreSQL database. The root `render.yaml` prepares both
in Ohio, with PostgreSQL 17, private database networking, automatic migrations,
HTTPS, graceful shutdown and manual application deployment. No Cloudflare change
is required. The website/API and background jobs run together; there is no extra
worker subscription. GitHub supplies source for builds, not daily business operation.

**Single next action:** open https://dashboard.render.com/register in Chrome and
create your own free Render account using the GitHub account that owns this repo.
Account creation does not deploy the prepared paid resources.

## Cost and ownership

Checked November 7, 2026: web compute `0.5c-512mb` is $7/month; PostgreSQL compute
`0.1c-256mb` is $6/month. Budget approximately **$13–$14/month** for this small
staging setup before taxes, excess usage or additional services. The Blueprint
explicitly requests only 1 GB of database storage, with storage autoscaling off.
The pricing page lists 1 GB included and additional database storage at $0.30/GB;
confirm the actual quote in your dashboard before deploying. Set a billing alert
and check usage; an alert is not a hard spending cap. Keep the workspace on Hobby;
the application and database have separate paid compute charges. Upgrade capacity
only after measurements. This minimum staging size has no high-availability replica.

Free web services sleep and cannot run reliable continuous dispatch/expiry workers;
free Postgres expires after 30 days. Neither is recommended for this staging setup.
No paid resources have been provisioned by engineering. Clicking Render's paid
deployment confirmation is your purchase decision. Use a business email, enable
MFA, save recovery codes privately and retain billing/repository ownership.

Sources: [pricing](https://render.com/pricing),
[free-service limits](https://render.com/docs/free),
[Blueprint setup](https://render.com/docs/infrastructure-as-code),
[environment settings](https://render.com/docs/configure-environment-variables).

## First deployment in Chrome

1. Sign in to Render. If a button is hidden, Chrome **⋮ → Desktop site** can expose
   the full dashboard. You can rotate the phone to landscape for the setup form.
2. Select the free **Hobby** workspace. Connect GitHub when prompted. Authorize
   access only to `pcorey922-bit/LocalEats-Delivery-App` where GitHub offers that
   choice. You do not need to give ChatGPT a hosting password or API token.
3. Tap **New + → Blueprint**, choose this repository, and choose branch
   `feature/rocoeats-launch-readiness`. Blueprint path: `render.yaml`.
   Name the Blueprint `rocoeats-staging`. Do not choose the default branch by mistake.
4. Render asks for the five protected environment values below. In a second Chrome
   tab, open the corresponding provider dashboard, copy one value, return to
   Render, long-press its value box and **Paste**. Do not put secrets in GitHub,
   screenshots, chat, browser URLs or any `VITE_` variable. The one exception in
   the table is Clerk's intentionally public publishable key.

| Render setting | Where its value comes from |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk → your existing RoCoEats app → **Development** → **Configure → API keys** → Publishable key (`pk_test_…`) |
| `CLERK_SECRET_KEY` | Same Clerk Development app → Secret key (`sk_test_…`); do not use a Stripe key here |
| `LOCALEATS_ADMIN_CLERK_USER_IDS` | Clerk Development → **Users** → your existing owner identity → copy User ID |
| `ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS` | The same owner User ID; enables your explicit owner-driver exception |
| `STRIPE_SECRET_KEY` | Stripe → the sandbox containing your test keys → **API keys** → Secret key (`sk_test_…`); do not use a Clerk key here |

5. Review the preview: **one web service and one PostgreSQL instance**, both Ohio;
   web 512 MB / $7 compute; database 256 MB / $6 compute and **1 GB storage**.
   Do not enable preview environments, add extra services or connect rocoeats.com.
   Only if you approve the displayed charges, tap **Deploy Blueprint**. Render
   builds the actual application, runs migrations, and starts the website/API/jobs.
6. Open the web service, wait for **Live**, then tap its assigned **HTTPS URL**.
   This actual link is your staging website; no URL exists before provisioning.
   `/livez` should report `alive: true`. `/readyz` intentionally reports 503 until
   webhook and pricing setup are finished. A Live status alone is not launch approval.
7. Open **Blueprint → Settings** and turn **Auto Sync off** if enabled, so a future
   infrastructure commit cannot silently change billing/configuration. Application
   auto-deploy is already off. Future verified releases use web service →
   **Manual Deploy → Deploy latest commit** after reviewing CI and a DB backup.

The container automatically uses Render's assigned HTTPS origin for checkout
returns and CORS, and the same Clerk publishable key on frontend and backend.
Leave `VITE_API_ORIGIN` and `VITE_CLERK_PROXY_URL` unset. Clerk Development supports
host-provided preview domains without production Clerk DNS setup. Keep the existing
Development instance so its owner User ID continues to match; a new instance has
different users. See [Clerk staging options](https://clerk.com/docs/guides/development/deployment/staging-alternatives).

Your Stripe publishable key (`pk_test_…`) is **not needed** by this application:
payments use Stripe-hosted Checkout. Do not confuse it with Clerk's publishable key.
Neither bank credentials nor a live Stripe key is needed for staging.

## Finish Stripe's test webhook after the website has a URL

1. Keep Stripe in the **same sandbox** as `STRIPE_SECRET_KEY`. Open **Workbench →
   Webhooks → Add destination** (some dashboards label this **Developers → Webhooks**).
2. Select events from **your account**, a **webhook endpoint** destination and
   snapshot events. Endpoint URL: append `/api/webhooks/stripe` to the real HTTPS
   website URL. Do not use a connected-account destination or CLI-only secret.
3. Subscribe to these exact events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `refund.created`, `refund.updated`,
   `refund.failed`, `charge.dispute.created`, `charge.dispute.updated`,
   `charge.dispute.closed`, `charge.dispute.funds_withdrawn`,
   `charge.dispute.funds_reinstated`.
   Use the API version matching the installed Stripe SDK: `2026-10-28.endive`.
4. Open that endpoint's **Signing secret → Reveal** and copy its `whsec_…` value.
   Return to Render → **rocoeats-staging web service → Environment → Edit →
   Add Environment Variable**. Key `STRIPE_WEBHOOK_SECRET`; paste the value.
   Tap **Save, rebuild, and deploy**. Never paste it into the public Clerk setting.
5. Sign in at `/sign-in` with your existing Clerk owner account. Server-side
   bootstrap grants administration; choosing a client-side role never grants it.
   Open `/admin`, configure reviewed **test** pricing and service ZIP codes.
   Your driver access uses the same owner account and still requires explicit
   on-duty/location consent and normal safe delivery state transitions.
6. Keep `ROCOEATS_ORDERING_ENABLED=false`. For an authorized private Stripe TEST
   delivery, use the separate test window documented in
   [PRIVATE_TEST_DELIVERY.md](PRIVATE_TEST_DELIVERY.md).

See [Stripe webhook setup](https://docs.stripe.com/webhooks).

## Invite testers without making them administrators

The landing/sign-in pages and static website assets are internet-accessible. All
business API routes require a verified Clerk session and a server-side staging
allowlist entry. Only configured owner identities are initially admitted. Health
checks and Stripe's signature-protected webhook remain reachable independently.
This is application access control, not a private network or whole-site password.

Let each tester create a Clerk Development account. Copy their IDs from Clerk
**Users**, then add `ROCOEATS_STAGING_TESTER_CLERK_USER_IDS` in Render Environment
as a comma-separated list. Save/redeploy. This grants staging admission only:
restaurant and driver approval and admin authorization still apply separately.
Never add ordinary testers to either owner setting. Removing an admission entry
blocks that tester on subsequent API requests. Suspensions still apply.

## Recovery and remaining verification

- Environment changes: use the web service's **Environment** page; secrets added
  to the Blueprint after initial deployment are not automatically prompted again.
- Migration failure: inspect redacted deployment errors, preserve the DB and fix
  the migration; never erase the database or substitute schema push.
- Before updates: create/download a database export from the Postgres dashboard;
  store it in owner-controlled encrypted storage. Paid Render Postgres includes
  backup/recovery features; check the actual retention window and rehearse restore
  into a separate staging DB. See `DEPLOYMENT.md` for restore safeguards.
- Rollback application code through Render's deploy history only when compatible
  with the current schema. Never automatically reverse financial migrations.
- Database external IP allowlist stays empty; the app uses Render's internal URL.
  Do not open the database to all IPs for debugging from a phone.
- Maps, push delivery, Connect onboarding, real Clerk/Stripe round trips, external
  health monitoring, deployed restore and device testing still need their accounts
  or running infrastructure. They are not certified by local tests. Maps/push
  credentials are not required to bring up the initial signed-in website.
- No production DNS, live payments, bank linking or store publication is part of
  this procedure. Do not enter real customer data in this Development environment.
