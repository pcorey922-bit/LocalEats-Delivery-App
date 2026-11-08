import { build } from "esbuild";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
await mkdir("tmp", { recursive: true });
const outputDirectory = await mkdtemp("tmp/tests-");
try {
  for (const [name, entry] of [
    ["dashboard-sections", "src/lib/dashboard-sections.test.ts"],
    ["order-lifecycle", "src/lib/order-lifecycle.test.ts"],
    ["customer-cart", "tests/customer-cart.test.ts"],
    ["cart-line", "tests/cart-line.test.ts"],
    ["duty-intent", "tests/duty-intent.test.ts"],
    ["navigation", "tests/navigation.test.ts"],
    ["mobile-api", "tests/mobile-api.test.ts"],
    ["commerce-policy", "src/lib/commerce-policy.test.ts"],
    ["stripe-setup", "src/lib/stripe-setup.test.ts"],
    ["availability", "src/lib/restaurant-availability.test.ts"],
    ["platform", "tests/platform.test.ts"],
    ["recovery-safety", "tests/recovery-safety.test.ts"],
    ["worker-loop", "src/lib/worker-loop.test.ts"],
    ["web-hosting", "src/lib/web-hosting.test.ts"],
    ["fcm", "src/lib/fcm.test.ts"],
  ]) {
    const outfile = path.join(outputDirectory, `${name}.mjs`);
    await build({
      entryPoints: [entry],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      external: [
        "@electric-sql/pglite",
        "stripe",
        "express",
        "pg",
        "cors",
        "pino",
        "pino-http",
        "http-proxy-middleware",
        "@clerk/shared/*",
        "firebase-admin/*",
      ],
      plugins:
        name === "platform"
          ? [
              {
                name: "test-only-services",
                setup(b) {
                  b.onResolve({ filter: /^@workspace\/db$/ }, () => ({
                    path: path.resolve("tests/database.ts"),
                  }));
                  b.onResolve({ filter: /^@clerk\/express$/ }, () => ({
                    path: path.resolve("tests/clerk.ts"),
                  }));
                },
              },
            ]
          : [],
    });
    const result = spawnSync(process.execPath, ["--test", outfile], {
      stdio: "inherit",
      timeout: 120000,
      killSignal: "SIGKILL",
      env: { ...process.env, LOG_LEVEL: "silent", NODE_ENV: "test" },
    });
    if (result.status !== 0) process.exitCode = 1;
  }
} finally {
  await rm(outputDirectory, { recursive: true, force: true });
}
