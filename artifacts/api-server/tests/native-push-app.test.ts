import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { nativePushTopic } from "../src/lib/native-push-app";
test("native push topics admit only the four owned app identities", () => {
  for (const id of [
    "com.rocoeats.app",
    "com.rocoeats.app.staging",
    "com.rocoeats.driver",
    "com.rocoeats.driver.staging",
  ])
    assert.equal(nativePushTopic(id), id);
  for (const id of [
    "",
    "com.untrusted.app",
    "com.rocoeats.driver.evil",
    "com.rocoeats.app\nInjected",
  ])
    assert.throws(() => nativePushTopic(id));
});
test("device identity migration preserves legacy registrations and rejects unknown topics", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "CREATE TABLE notification_devices(id text PRIMARY KEY, token text NOT NULL, profile_id text NOT NULL, platform text NOT NULL); INSERT INTO notification_devices VALUES ('legacy','fixture-token','fixture-profile','ios');",
    );
    const before = (await db.query("SELECT * FROM notification_devices")).rows;
    await db.exec(
      await readFile(
        "../../lib/db/drizzle/0029_notification_app_identity.sql",
        "utf8",
      ),
    );
    assert.deepEqual(
      (
        await db.query(
          "SELECT id,token,profile_id,platform FROM notification_devices",
        )
      ).rows,
      before,
    );
    assert.equal(
      (
        await db.query<{ app_id: string }>(
          "SELECT app_id FROM notification_devices",
        )
      ).rows[0].app_id,
      "com.rocoeats.app",
    );
    // pg_dump restores the deparsed expression; its second deparse must match.
    // Explicit text input avoids PostgreSQL rewriting varchar-array casts.
    const definition = async () =>
      (
        await db.query<{ definition: string }>(
          "SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname='notification_device_app_id_allowed'",
        )
      ).rows[0].definition;
    const originalDefinition = await definition();
    await db.exec(
      "ALTER TABLE notification_devices DROP CONSTRAINT notification_device_app_id_allowed",
    );
    await db.exec(
      `ALTER TABLE notification_devices ADD CONSTRAINT notification_device_app_id_allowed ${originalDefinition}`,
    );
    assert.equal(
      await definition(),
      originalDefinition,
      "restored constraint must retain the exact schema fingerprint",
    );
    await db.exec(
      "INSERT INTO notification_devices VALUES ('driver','other-token','fixture-profile','ios','com.rocoeats.driver');",
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO notification_devices VALUES ('invalid','token','profile','ios','com.untrusted.app');",
      ),
      /notification_device_app_id_allowed/,
    );
  } finally {
    await db.close();
  }
});
