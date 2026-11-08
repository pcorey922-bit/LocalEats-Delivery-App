# $0 owner testing: Render Free + Neon Free

Use **one Render Free Docker web service** for the existing website/API and
**one Neon Free PostgreSQL project** for persistent data. No application rewrite,
separate frontend subscription, Render database or paid worker is required. Keep
both accounts on Free/Hobby and **do not add a card, start a paid trial or upgrade**.
The existing paid `render.yaml` is preserved for later use; do not deploy it now.

**Your first action only:** on your Samsung phone, open
https://console.neon.tech/signup and tap **Continue with GitHub** to create your
free Neon account. Do not send its connection string or any keys in chat.

## Verified offering and limits — November 8, 2026

Published recurring price: **$0/month**, with no card needed for the selected free
offerings. Availability of your specific Render account has not been tested: use
**New → Web Service → Free**, not the paid Blueprint. If even that Free creation
flow requires a card, stop and report that account-verification blocker. Never
enter payment details or bypass a provider restriction.

Render provides HTTPS and 750 running instance hours per workspace/month. It
sleeps after 15 minutes without inbound traffic; waking can take about a minute.
There is no persistent local disk or free pre-deploy job. Bandwidth/build limits
can suspend deployment/service; without a payment method they cannot silently bill
overages. High outbound traffic, including external database traffic, may also
cause suspension. [Official limits](https://render.com/docs/free).

Neon Free currently provides 1 GB PostgreSQL storage and 100 CU-hours/project/month,
plus 5 GB public network transfer. It has no fixed trial expiry. Compute sleeps
after five idle minutes; storage survives suspension. Quota exhaustion can suspend
compute or block writes without deleting data. Free recovery history is limited;
keep separate owner-controlled exports before important changes. Terms can change.
[Pricing/no-card policy](https://neon.com/pricing),
[quotas and exhaustion](https://neon.com/docs/introduction/plans).

This is **intermittent private owner testing**, not reliable live delivery hosting.
Jobs, dispatch updates, stock expiry and notification retries pause while Render
is asleep; existing durable jobs resume after wake. Stripe retries failed webhook
deliveries, which can be delayed by cold starts. Close test browser tabs after use;
do not add uptime pings or a keep-alive service. Workers keep Neon active while
Render is awake, so watch CU-hours even when no orders are being placed. If available,
keep Neon compute fixed at 0.25 CU rather than autoscaling to larger sizes.

## Why this combination

| Option checked in official documentation | Decision |
| --- | --- |
| Render Free web + Neon Free DB | Selected: existing Docker/Express/PostgreSQL stack, persistent DB, free HTTPS; sleeps and quotas apply |
| Render Free web + Render Free DB | DB expires after 30 days; unsuitable for retaining owner test data |
| Supabase Free PostgreSQL | Viable DB alternative, 500 MB, can pause after a week of low activity; Neon has more storage and no fixed trial expiry ([limits](https://supabase.com/pricing), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing)) |
| Railway Free | $1/month resource credit after trial, not a guarantee this polling Node service will fit; avoid relying on expiring/limited credits ([plans](https://docs.railway.com/pricing/plans)) |
| Koyeb Free | Card validation required; fails your no-card condition ([official FAQ](https://www.koyeb.com/docs/faqs/pricing)) |
| Static-only hosting | Cannot run this Node API or its workers; splitting into serverless functions would require unnecessary architecture changes |

## After your free Neon account exists

Follow one numbered step at a time; no shell, laptop or card is needed.

1. Neon: choose **New Project** (or its first-project form). Name:
   `rocoeats-owner-test`; choose **Free**, **AWS Ohio/us-east-2** if offered, and
   expand **Postgres database** to select version **17**. Enable only PostgreSQL,
   then **Create project**. Keep the default database/role. Do not enable AI gateway,
   paid compute or billing. A default branch named `production` in this separate
   free project does not connect it to the real RoCoEats production business.
2. Neon: tap **Connect**, choose the primary database and owner role, and turn
   **Connection pooling OFF**. Copy the PostgreSQL connection string, retaining
   `sslmode=require` (and `channel_binding=require` if present). It contains a
   password: paste it only into Render's protected `DATABASE_URL` setting below.
3. Render: open https://dashboard.render.com → **New + → Web Service** → your
   connected `pcorey922-bit/LocalEats-Delivery-App` repository → **Connect**.
   Use Chrome **⋮ → Desktop site** if dashboard fields are hidden.
4. Name `rocoeats-owner-test`; branch `feature/rocoeats-launch-readiness`;
   runtime **Docker**; region **Ohio**; instance type **Free ($0)**. Leave Root
   Directory empty and Dockerfile Path `./Dockerfile`. Under **Advanced**, set
   **Docker Command** to `node --enable-source-maps scripts/start-free-staging.mjs`.
   Health Check Path: `/livez`; Auto-Deploy: **Off**. No persistent disk, paid
   pre-deploy command, extra service or custom domain.
5. Under **Environment Variables**, add the settings below. Use separate tabs for
   the Clerk/Stripe dashboards and long-press **Paste** into each value box.
   These are protected runtime settings, except the intentionally public Clerk
   publishable key, which is also used during the frontend build.

| Key | Value/source |
| --- | --- |
| `DATABASE_URL` | Neon direct TLS connection string from step 2 |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk RoCoEats **Development → Configure → API keys**, `pk_test_…` |
| `CLERK_SECRET_KEY` | Same Clerk instance's secret `sk_test_…` |
| `LOCALEATS_ADMIN_CLERK_USER_IDS` | Your existing owner User ID from Clerk **Users** |
| `ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS` | Same owner User ID |
| `STRIPE_SECRET_KEY` | Your Stripe sandbox secret `sk_test_…`; not a Clerk key |
| `PAYMENT_PROVIDER` | `stripe_test` |
| `ROCOEATS_PRIVATE_STAGING` | `true` |
| `ROCOEATS_FREE_STAGING` | `true` |
| `ROCOEATS_ORDERING_ENABLED` | `false` |
| `PG_POOL_MAX` | `2` |

6. Confirm **$0**, no card and no paid resources, then **Deploy Web Service**.
   The startup command safely serializes and applies existing migrations before
   starting the actual server; failed migrations prevent startup. The same
   persistent Neon database is reused on cold starts and redeploys. The reference
   configuration is `deploy/render-free.yaml`; manual creation avoids the paid
   root Blueprint. Neither configuration contains actual credentials.
7. When **Live**, tap Render's assigned **HTTPS URL**, then **Sign in**. Use your
   existing Clerk owner account. If asked to finish profile setup, enter a display
   name and choose **Neighbor**; server-side bootstrap grants your configured owner
   administration regardless of the client choice. Open `/dashboard`, then `/admin`.
   `/livez` should return 200; `/readyz` remains 503 until webhook/pricing setup.
   No real URL can be supplied before these owner-controlled resources exist.

## What works and what still needs setup

The actual customer, restaurant, driver and administrator interfaces use the real
API and database. Owner-driver access remains available without self-approval.
All business APIs require a verified Clerk identity in the owner/tester allowlist;
the landing/sign-in pages and static assets remain public. Ordinary tester roles
still need normal business approvals. Invite safe test accounts by adding their
Clerk IDs to `ROCOEATS_STAGING_TESTER_CLERK_USER_IDS` in Render Environment and
saving/redeploying; do not give them owner flags. Use no real customer data.

Stripe-hosted **TEST** Checkout needs no Stripe publishable key and uses no real
money. After the URL exists, follow the test webhook steps in
[RENDER_STAGING_ANDROID.md](RENDER_STAGING_ANDROID.md#finish-stripes-test-webhook-after-the-website-has-a-url)
to enter `STRIPE_WEBHOOK_SECRET` through Render **Environment**, then configure
test pricing, menus, hours, stock and approved restaurant/driver accounts. Keep
ordering disabled during initial private-access checks. Only after those checks
may you explicitly enable ordering **for admitted test users**; live keys remain
rejected. Stay awake in an active browser session for end-to-end order testing.

No simulator is enabled. Push/Google dispatch maps still need their provider
configuration; Google Maps billing is outside this $0 deployment. Existing Google
Maps/Apple Maps destination navigation links are separate from the paid map API.
Background/device notification delivery, real owner login, signed Stripe round
trips and actual Neon persistence need deployed verification. Free Render has no
shell: use deployment logs and Neon Console for diagnosis. Never print secrets.

For rollback use a compatible previous Render deploy; never reverse financial SQL
automatically or erase the DB to fix migration failures. Export Neon data before
important changes and retain it privately. A later paid move uses the same code,
SQL and Docker image; change hosting/settings after authorization, not business logic.

## Redeploy after the migration launch permission fix

If the first deploy failed with `spawn pnpm EACCES`, keep the existing service,
Neon database and protected environment values. Startup now invokes the installed
Drizzle JavaScript CLI with Node directly; it does not execute a pnpm shim.
In Render, open this web service, confirm its branch is
`feature/rocoeats-launch-readiness`, then tap **Manual Deploy → Deploy latest commit**.
Keep Docker Command `node --enable-source-maps scripts/start-free-staging.mjs` and
`ROCOEATS_ORDERING_ENABLED=false`. Do not reset the database or switch plans.
Wait for successful migrations and **Live**, then open the service's existing
HTTPS link. Incomplete webhook/pricing settings can still make `/readyz` return 503.
