# Browser verification fixtures

These fixtures exercise actual React components with explicitly simulated identity
and API responses. They are never production routes and do not certify real Clerk,
Stripe, GPS or push behavior. The normal website build does not import them.

For account/access/permission controls, first build production CSS with `pnpm build`.
Use developer-provided Playwright Core and Chromium tooling, then run from the repo:

```sh
PLAYWRIGHT_CORE_PATH=/absolute/path/to/playwright-core \
CHROMIUM_PATH=/absolute/path/to/chromium \
node scripts/verify-account-browser.mjs
```

No runtime dependency or provider account is added. If Playwright Core is already
resolvable by Node, omit PLAYWRIGHT_CORE_PATH. Linux Chromium defaults to
/usr/bin/chromium. The runner builds a temporary fixture, uses only loopback HTTP,
verifies the 390x844 UI, and closes the browser/server. Its temporary directory
contains generated files and a screenshot. Identity match/recovery, account save
payloads, owner grant/revoke version payloads, security-settings delegation and
horizontal layout checks are distinct from authenticated deployed acceptance tests.

Real staging read-only checks:

```sh
NODE_USE_ENV_PROXY=1 node scripts/verify-staging-http.mjs \
  https://localeats-delivery-app.onrender.com/ <expected-full-commit-sha>
```

The optional proxy flag is for managed development environments. This script never
logs in, requests secrets or submits orders/payments. Owner-assisted sign-in and
business operation acceptance evidence belongs in PRODUCTION_BACKLOG.md.
