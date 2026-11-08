import { test } from "node:test";
import assert from "node:assert/strict";
import { containerEnvironment } from "./container-environment.mjs";

const valid = () => ({
  RENDER: "true", RENDER_EXTERNAL_URL: "https://qa-rocoeats.onrender.com",
  ROCOEATS_PRIVATE_STAGING: "true", LOCALEATS_ADMIN_CLERK_USER_IDS: "user_QAOwner",
  ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS: "user_QAOwner",
  VITE_CLERK_PUBLISHABLE_KEY: "pk_test_fixture", CLERK_SECRET_KEY: "sk_test_fixture",
  PAYMENT_PROVIDER: "stripe_test", STRIPE_SECRET_KEY: "sk_test_fixture",
});
test("Render boot derives same-origin HTTPS configuration without exposing secrets", () => {
  const source = valid();
  const result = containerEnvironment(source);
  assert.equal(result.PUBLIC_APP_URL, source.RENDER_EXTERNAL_URL);
  assert.equal(result.CORS_ORIGINS, source.RENDER_EXTERNAL_URL);
  assert.equal(result.CLERK_PUBLISHABLE_KEY, source.VITE_CLERK_PUBLISHABLE_KEY);
  assert.equal(source.CLERK_PUBLISHABLE_KEY, undefined);
  assert.equal(containerEnvironment({ PORT: "4000" }).PORT, "4000");
});
test("private staging fails closed on missing owners, non-development keys and unsafe origins", () => {
  for (const change of [
    { RENDER_EXTERNAL_URL: "http://qa.onrender.com" },
    { RENDER_EXTERNAL_URL: "https://qa.onrender.com.attacker.example" },
    { RENDER_EXTERNAL_URL: "https://secret@qa.onrender.com" },
    { RENDER_EXTERNAL_URL: "https://qa.onrender.com/path" },
    { RENDER_EXTERNAL_URL: undefined },
    { LOCALEATS_ADMIN_CLERK_USER_IDS: "" },
    { LOCALEATS_ADMIN_CLERK_USER_IDS: "invalid subject" },
    { ROCOEATS_OWNER_DRIVER_CLERK_USER_IDS: "user_Stranger" },
    { ROCOEATS_PRIVATE_STAGING: "false" },
    { VITE_CLERK_PUBLISHABLE_KEY: "pk_live_fixture" },
    { CLERK_SECRET_KEY: "sk_live_fixture" },
    { STRIPE_SECRET_KEY: "sk_live_fixture" },
    { PAYMENT_PROVIDER: "sandbox" },
    { ROCOEATS_ORDERING_ENABLED: "true" },
  ]) assert.throws(() => containerEnvironment({ ...valid(), ...change }));
  assert.doesNotThrow(() => containerEnvironment({ ...valid(), ROCOEATS_ORDERING_ENABLED: "true", STRIPE_WEBHOOK_SECRET: "whsec_fixture" }));
});
