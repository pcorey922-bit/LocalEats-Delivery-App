// Developer-only real-component QA. Requires production web CSS and Playwright tooling.
// Authentication/API are explicitly simulated; this does not verify staging login.
import { createRequire } from "node:module";
import { mkdtemp, writeFile, readFile, readdir } from "node:fs/promises";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const require = createRequire(root + "/artifacts/api-server/package.json");
const { build } = require("esbuild");
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH || "playwright-core",
);
const target = await mkdtemp(join(tmpdir(), "rocoeats-account-ui-"));
await build({
  entryPoints: [root + "/artifacts/localeats/tests/account-browser.tsx"],
  outfile: target + "/app.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "qa-clerk",
      setup(b) {
        b.onResolve({ filter: /^@clerk\/react$/ }, () => ({
          path: "clerk",
          namespace: "qa",
        }));
        b.onLoad({ filter: /.*/, namespace: "qa" }, () => ({
          contents: `export const useAuth=()=>({isSignedIn:true,userId:'user_QA'});export const useClerk=()=>({openUserProfile:()=>{window.securityOpened=true}});`,
          loader: "js",
        }));
      },
    },
  ],
  logLevel: "silent",
});
await writeFile(
  target + "/app.css",
  await readFile(
    root +
      "/artifacts/localeats/dist/public/assets/" +
      (await readdir(root + "/artifacts/localeats/dist/public/assets")).find(
        (name) => name.endsWith(".css"),
      ),
  ),
);
await writeFile(
  target + "/index.html",
  '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div id="root"></div><script type="module" src="/app.js"></script></html>',
);
const server = http.createServer(async (req, res) => {
  try {
    const file =
      req.url === "/app.js"
        ? "app.js"
        : req.url === "/app.css"
          ? "app.css"
          : "index.html";
    res.setHeader(
      "content-type",
      file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : "text/html",
    );
    res.end(await readFile(target + "/" + file));
  } catch {
    res.statusCode = 500;
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.getByText("Driver: QA courier", { exact: true }).waitFor();
  await page.evaluate(() => {
    window.qaTracking = {
      ...window.qaTracking,
      status: "delivered",
      deliveryStatus: "delivered",
      locationStatus: "not_active",
      deliveredAt: "2026-11-08T12:15:00Z",
    };
  });
  await page
    .getByRole("button", { name: "Refresh tracking", exact: true })
    .click();
  await page
    .getByText("This order is closed. Live location sharing has ended.", {
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", { name: "Verify Stripe TEST connection", exact: true })
    .click();
  await page
    .getByText("Stripe confirmed TEST mode: Yes", { exact: true })
    .waitFor();
  await page
    .getByText(
      /These are configuration checks, not payment or webhook-delivery certification/,
    )
    .waitFor();
  await page
    .getByText("Super Administrator (owner)", { exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Administrator controls", exact: true })
      .getAttribute("href"),
    "/admin",
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Driver workspace", exact: true })
      .getAttribute("href"),
    "/driver",
  );
  await page
    .getByLabel("Display name", { exact: true })
    .fill("Updated QA name");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page
    .getByRole("status")
    .getByText("Your name has been saved.")
    .waitFor();
  assert.deepEqual(await page.evaluate(() => window.qaWrites), [
    { displayName: "Updated QA name", expectedDisplayName: "QA profile" },
  ]);
  await page
    .getByRole("button", { name: "Sign-in and security settings" })
    .click();
  assert.equal(await page.evaluate(() => window.securityOpened), true);
  await page
    .getByLabel("Staff account", { exact: true })
    .selectOption("staff-fixture");
  await page
    .getByLabel("Reason recorded in audit log", { exact: true })
    .fill("QA owner approved operator access");
  await page
    .getByRole("button", { name: "Grant administrator access", exact: true })
    .click();
  await page
    .getByRole("option", { name: "QA staff · admin", exact: true })
    .waitFor({ state: "attached" });
  await page
    .getByLabel("Staff account", { exact: true })
    .selectOption("staff-fixture");
  await page
    .getByLabel("Reason recorded in audit log", { exact: true })
    .fill("QA owner removed operator access");
  await page
    .getByRole("button", { name: "Revoke administrator access", exact: true })
    .click();
  await page
    .getByRole("option", { name: "QA staff · customer", exact: true })
    .waitFor({ state: "attached" });
  assert.deepEqual(
    (await page.evaluate(() => window.qaAdminWrites)).map((row) => [
      row.enabled,
      row.expectedRole,
      row.expectedVersion,
    ]),
    [
      [true, "customer", "v1"],
      [false, "admin", "v2"],
    ],
  );
  await page.evaluate(() => {
    window.qaAccess = {
      ...window.qaAccess,
      ownerMatched: false,
      ownerDriverMatched: false,
      administrator: false,
      superAdministrator: false,
      driver: false,
      role: "customer",
    };
  });
  await page.getByRole("button", { name: "Refresh access" }).click();
  await page
    .getByText(/Google may have created a different Clerk identity/)
    .waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Administrator controls", exact: true })
      .count(),
    0,
  );
  await page.screenshot({ path: target + "/account-ui.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({ path: target + "/account-ui.png", fullPage: true });
  console.log(
    "390x844 real component QA PASS: owner/driver links, mismatch recovery, strict profile payload, owner grant/revoke controls, security delegation, no horizontal overflow. Authentication/API simulated.",
  );
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
