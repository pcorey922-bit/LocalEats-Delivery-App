// Fixed public cases only. Default is offline dry-run. Never accepts keys/addresses
// as arguments, never reads customer records, never changes hosted configuration.
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
export function publicAccuracyArguments(args) {
  if (args.length === 0) return { live: false, freeTierConfirmed: false };
  if (
    args.length === 2 &&
    new Set(args).size === 2 &&
    args.includes("--live") &&
    args.includes("--confirm-free-tier")
  )
    return { live: true, freeTierConfirmed: true };
  throw new Error(
    "Use no arguments for dry-run, or --live --confirm-free-tier. Custom addresses, keys, files and URLs are not accepted.",
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let folder;
  try {
    const options = publicAccuracyArguments(process.argv.slice(2));
    const root = fileURLToPath(new URL("../", import.meta.url));
    const { build } = createRequire(
      root + "/artifacts/api-server/package.json",
    )("esbuild");
    folder = await mkdtemp(join(tmpdir(), "rocoeats-public-geocoding-"));
    await build({
      entryPoints: [
        root + "/artifacts/api-server/src/lib/geocodio-accuracy.ts",
      ],
      outfile: folder + "/runner.mjs",
      bundle: true,
      platform: "node",
      format: "esm",
      logLevel: "silent",
    });
    const { runPublicAccuracy } = await import(
      pathToFileURL(folder + "/runner.mjs")
    );
    const report = await runPublicAccuracy({ ...options, env: process.env });
    console.log(JSON.stringify(report, null, 2));
    if (
      options.live &&
      (report.coverageGaps.length ||
        report.cases.some((c) => c.expectationMet === false))
    )
      process.exitCode = 2;
  } catch {
    console.error(
      "Public geocoding verification could not complete. Use dry-run by default; live testing requires --live --confirm-free-tier and a securely configured development GEOCODIO_API_KEY. No raw provider errors are printed.",
    );
    process.exitCode = 1;
  } finally {
    if (folder) await rm(folder, { recursive: true, force: true });
  }
}
