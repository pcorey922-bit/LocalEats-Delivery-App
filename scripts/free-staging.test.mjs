import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Client, freeStagingEnvironment, migrateFreeStaging } from "./free-staging.mjs";

const valid = () => ({
  ROCOEATS_FREE_STAGING: "true", ROCOEATS_PRIVATE_STAGING: "true",
  DATABASE_URL: "postgresql://qa:fixture@ep-qa.us-east-2.aws.neon.tech/neondb?sslmode=require",
  CLERK_PUBLISHABLE_KEY: "pk_test_fixture", CLERK_SECRET_KEY: "sk_test_fixture",
  LOCALEATS_ADMIN_CLERK_USER_IDS: "user_QAOwner", STRIPE_SECRET_KEY: "sk_test_fixture",
  PAYMENT_PROVIDER: "stripe_test", ROCOEATS_ORDERING_ENABLED: "false",
});
test("free staging requires private test mode, direct persistent database and TLS", () => {
  assert.equal(freeStagingEnvironment(valid()).ROCOEATS_ORDERING_ENABLED, "false");
  for (const change of [
    { DATABASE_URL: undefined }, { DATABASE_URL: "not a URL" },
    { DATABASE_URL: valid().DATABASE_URL.replace("sslmode=require", "sslmode=disable") },
    { DATABASE_URL: valid().DATABASE_URL.replace("ep-qa.", "ep-qa-pooler.") },
    { DATABASE_URL: valid().DATABASE_URL.replace("neon.tech", "neon.tech.attacker.example") },
    { ROCOEATS_FREE_STAGING: "false" }, { ROCOEATS_PRIVATE_STAGING: "false" },
    { STRIPE_SECRET_KEY: "sk_live_fixture" }, { ROCOEATS_ORDERING_ENABLED: "true" },
  ]) assert.throws(() => freeStagingEnvironment({ ...valid(), ...change }));
});
test("startup waits for migration lock and completion; failures close the lock session", async () => {
  for (const failing of [false, true]) {
    const events = [];
    const connect = () => ({
      on() {}, connect: async () => events.push("connect"),
      query: async sql => events.push(sql.includes("pg_advisory_lock") ? "lock" : "timeout"),
      end: async () => events.push("close"),
    });
    const result = migrateFreeStaging(valid(), { connect, run: async () => {
      events.push("migrate"); if (failing) throw new Error("fixture failure");
    } });
    if (failing) await assert.rejects(result, /fixture failure/); else await result;
    assert.deepEqual(events, ["connect", "timeout", "lock", "migrate", "close"]);
  }
});

// CI uses a separate disposable database; never apply these tests to owner data.
if (process.env.TEST_DATABASE_URL) test("real PostgreSQL migrations bypass EACCES pnpm and preserve data through concurrent startup and restart", async () => {
  const testUrl = new URL(process.env.TEST_DATABASE_URL);
  assert.equal(testUrl.pathname, "/rocoeats_test", "Disposable CI database only");
  const control = new Client({ connectionString: testUrl.toString() });
  await control.connect();
  const database = "rocoeats_free_test";
  const smokeUrl = new URL(testUrl); smokeUrl.pathname = `/${database}`;
  const deniedPath = await mkdtemp(join(tmpdir(), "rocoeats-denied-pnpm-"));
  try {
    await writeFile(join(deniedPath, "pnpm"), "This shim must never be executed", { mode: 0o600 });
    const denied = spawnSync("pnpm", ["--version"], { env: { PATH: deniedPath } });
    assert.equal(denied.error?.code, "EACCES");
    await control.query(`CREATE DATABASE ${database}`);
    const env = { ...process.env, PATH: deniedPath, DATABASE_URL: smokeUrl.toString() };
    await Promise.all([migrateFreeStaging(env), migrateFreeStaging(env)]);
    const first = new Client({ connectionString: smokeUrl.toString() });
    await first.connect();
    await first.query("INSERT INTO profiles (clerk_user_id, display_name, role) VALUES ('user_FreeQA', 'Free staging persistence QA', 'customer')");
    await first.end();
    await migrateFreeStaging(env);
    const restarted = new Client({ connectionString: smokeUrl.toString() });
    await restarted.connect();
    const saved = await restarted.query("SELECT display_name FROM profiles WHERE clerk_user_id='user_FreeQA'");
    assert.equal(saved.rows[0].display_name, "Free staging persistence QA");
    await restarted.end();
  } finally {
    await control.query(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`);
    await control.end();
    await rm(deniedPath, { recursive: true, force: true });
  }
});
