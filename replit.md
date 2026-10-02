# LocalEats

LocalEats is a Roane County, Tennessee food-community app with account registration, sign-in, and starter dashboards for neighbors, restaurants, drivers, and administrators.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Clerk keys are managed by Replit; do not copy them into source files.
- To designate administrators, set `LOCALEATS_ADMIN_CLERK_USER_IDS` to a comma-separated list of Clerk user IDs in the app's environment. A signed-in user can find their own Clerk user ID on the Account page. Public profile setup cannot grant admin.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/localeats` — responsive public homepage, Clerk sign-in/sign-up, account setup, account view, and role dashboards
- `artifacts/api-server/src/routes` — authenticated profile and dashboard API
- `lib/api-spec/openapi.yaml` — source API contract; regenerate clients with the codegen command above
- `lib/db/src/schema` — Drizzle schema and inferred database types

## Architecture decisions

- Replit-managed Clerk handles sign-in; PostgreSQL stores each Clerk user ID, LocalEats role, and display name.
- The saved profile role is the authorization source for dashboard access; the dashboard API does not accept a caller-selected role.
- New accounts can choose customer, restaurant, or driver. Administrator access is assigned only through the server-side Clerk user ID allowlist or a trusted database operation.
- The schema prepares for later marketplace features, but does not activate ordering, payments, payouts, restaurant enrollment, driver dispatch, or GPS tracking.

## Product

Visitors can learn about LocalEats and its Roane County service area. Signed-in users can create a profile, return to their account, log out, and see dashboard sections matched to their saved role. Operational features are not active.

## User preferences

- Preserve the existing responsive homepage and LocalEats branding.
- Do not invent restaurant listings or imply that real payments have been processed.
- Do not build ordering, payment processing, or GPS tracking until the authentication and database foundation is complete.

## Gotchas

- Development and published Clerk user stores are separate; a development account will not automatically exist in production.
- Never add an admin choice to public sign-up. Add the account owner's Clerk user ID to `LOCALEATS_ADMIN_CLERK_USER_IDS` to bootstrap an administrator.
- `pnpm --filter @workspace/db run push` updates the development database only. Use the Replit Publish flow for managed production schema changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
