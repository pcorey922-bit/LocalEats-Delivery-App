import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { checkStagingEnvironment } from "./check-staging-environment.mjs";
const fixture = () => ({
  ROCOEATS_DB_PASSWORD: "a".repeat(64),
  CLERK_PUBLISHABLE_KEY: "pk_test_qa",
  CLERK_SECRET_KEY: "sk_test_clerkqa",
  LOCALEATS_ADMIN_CLERK_USER_IDS: "user_QAOwner",
  STRIPE_SECRET_KEY: "sk_test_stripeqa",
  STRIPE_WEBHOOK_SECRET: "whsec_qa",
  PUBLIC_APP_URL: "https://staging.rocoeats.com",
  CORS_ORIGINS:
    "https://staging.rocoeats.com,https://localhost,capacitor://localhost",
  ROCOEATS_ORDERING_ENABLED: "false",
});
test("staging preflight accepts explicit private-test settings and loopback; rejects live keys, placeholders, unsafe origins and weak database passwords", () => {
  assert.deepEqual(checkStagingEnvironment(fixture()), []);
  assert.deepEqual(
    checkStagingEnvironment({
      ...fixture(),
      PUBLIC_APP_URL: "http://localhost:3001",
      CORS_ORIGINS: "http://localhost:3001",
    }),
    [],
  );
  for (const change of [
    { STRIPE_SECRET_KEY: "sk_live_qa" },
    { STRIPE_SECRET_KEY: "rk_test_qa" },
    { CLERK_SECRET_KEY: "" },
    { CLERK_PUBLISHABLE_KEY: "pk_live_qa" },
    { PUBLIC_APP_URL: "http://public.rocoeats.com" },
    { PUBLIC_APP_URL: "https://user:password@staging.rocoeats.com" },
    { PUBLIC_APP_URL: "https://staging.rocoeats.com/path" },
    { CORS_ORIGINS: "*" },
    { CORS_ORIGINS: "https://other.rocoeats.com" },
    { ROCOEATS_DB_PASSWORD: "password" },
    { ROCOEATS_ORDERING_ENABLED: "yes" },
    { VITE_GOOGLE_MAPS_API_KEY: "qa" },
    { LOCALEATS_ADMIN_CLERK_USER_IDS: "owner@rocoeats.com" },
    { STRIPE_SECRET_KEY: "sk_test_REPLACE_ME" },
  ])
    assert.ok(
      checkStagingEnvironment({ ...fixture(), ...change }).length,
      JSON.stringify(Object.keys(change)),
    );
  const marker = "sk_live_sensitive_marker_must_never_print",
    result = spawnSync(
      process.execPath,
      ["scripts/check-staging-environment.mjs"],
      {
        cwd: new URL("..", import.meta.url),
        env: { ...process.env, ...fixture(), STRIPE_SECRET_KEY: marker },
        encoding: "utf8",
      },
    );
  assert.equal(result.status, 1);
  assert.equal((result.stdout + result.stderr).includes(marker), false);
  assert.ok(result.stderr.includes("Stripe TEST"));
});
