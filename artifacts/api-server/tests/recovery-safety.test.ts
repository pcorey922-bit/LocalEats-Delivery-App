import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
test("recovery drill refuses production names and never drops an existing restore target", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "rocoeats-recovery-safety-"),
  );
  const log = path.join(directory, "calls");
  try {
    await writeFile(
      path.join(directory, "docker"),
      `#!/bin/sh\nprintf '%s\\n' "$*" >> "$RECOVERY_TEST_LOG"\ncase "$*" in *pg_dump*) printf fixture-dump; exit 0;; *createdb*) test "$RECOVERY_TEST_CREATE_OK" = 1; exit $?;; *pg_restore*) exit 1;; *dropdb*) exit 0;; *) exit 99;; esac\n`,
      { mode: 0o700 },
    );
    const env = {
      ...process.env,
      PATH: directory + path.delimiter + process.env.PATH,
      POSTGRES_CONTAINER: "fixture",
      PGUSER: "fixture",
      PGPASSWORD: "test-only",
      RECOVERY_TEST_LOG: log,
    };
    const run = (extra: Record<string, string>) =>
      spawnSync("bash", ["../../scripts/verify-postgres-recovery.sh"], {
        env: { ...env, ...extra },
        encoding: "utf8",
      });
    assert.equal(
      run({
        SOURCE_DATABASE: "production",
        RESTORE_DATABASE: "rocoeats_recovery_probe",
      }).status,
      2,
    );
    assert.equal(
      run({ SOURCE_DATABASE: "rocoeats_test", RESTORE_DATABASE: "production" })
        .status,
      2,
    );
    const existing = run({
      SOURCE_DATABASE: "rocoeats_test",
      RESTORE_DATABASE: "rocoeats_recovery_existing",
    });
    assert.equal(existing.status, 1);
    const calls = await readFile(log, "utf8");
    assert.match(calls, /pg_dump/);
    assert.match(calls, /createdb/);
    assert.doesNotMatch(calls, /dropdb|pg_restore|psql/);
    await writeFile(log, "");
    const failedRestore = run({
      SOURCE_DATABASE: "rocoeats_test",
      RESTORE_DATABASE: "rocoeats_recovery_new",
      RECOVERY_TEST_CREATE_OK: "1",
    });
    assert.equal(failedRestore.status, 1);
    const cleanup = await readFile(log, "utf8");
    assert.match(cleanup, /pg_restore/);
    assert.match(cleanup, /dropdb --if-exists --force rocoeats_recovery_new/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
