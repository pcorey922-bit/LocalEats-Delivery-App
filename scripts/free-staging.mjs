import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { containerEnvironment } from "./container-environment.mjs";

const require = createRequire(new URL("../artifacts/api-server/package.json", import.meta.url));
export const { Client } = require("pg");

export function freeStagingEnvironment(env) {
  if (env.ROCOEATS_FREE_STAGING !== "true" || env.ROCOEATS_PRIVATE_STAGING !== "true")
    throw new Error("Free startup requires explicit private free staging configuration");
  const result = containerEnvironment(env);
  let url;
  try { url = new URL(result.DATABASE_URL); } catch {
    throw new Error("Configure DATABASE_URL in the host's protected environment settings");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname.endsWith(".neon.tech") || url.hostname.split(".")[0].endsWith("-pooler") ||
      !url.username || !url.password || url.pathname.length < 2 ||
      !["require", "verify-full"].includes(url.searchParams.get("sslmode")))
    throw new Error("Free staging requires a direct Neon PostgreSQL connection with TLS");
  return result;
}

function migrateProcess(env, signal) {
  return new Promise((resolve, reject) => {
    // Run the packaged JS CLI using the already-running Node executable. Do not
    // depend on PATH, executable pnpm shims or a root-owned package-manager cache.
    const child = spawn(process.execPath, [
      fileURLToPath(new URL("../lib/db/node_modules/drizzle-kit/bin.cjs", import.meta.url)),
      "migrate", "--config", "./drizzle.config.ts",
    ], {
      env, signal, stdio: "inherit",
      cwd: new URL("../lib/db/", import.meta.url),
    });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve() : reject(new Error("Staging migration failed; server was not started")));
  });
}

// Session-level lock serializes migrations across overlapping cold starts/deploys.
// Use a direct endpoint: transaction poolers cannot preserve session locks.
export async function migrateFreeStaging(env, { connect = options => new Client(options), run = migrateProcess } = {}) {
  const client = connect({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  const abort = new AbortController();
  client.on("error", () => abort.abort());
  try {
    await client.connect();
    await client.query("SET statement_timeout = '120s'");
    await client.query("SELECT pg_advisory_lock(724663290)");
    await run(env, abort.signal);
    if (abort.signal.aborted) throw new Error("Database connection lost during staging migration");
  } finally {
    // Closing the session releases its lock even when a migration fails.
    await client.end();
  }
}
