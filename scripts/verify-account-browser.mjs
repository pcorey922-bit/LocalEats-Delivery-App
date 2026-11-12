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
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env.VITE_API_ORIGIN": '"https://qa.onrender.com"',
    "import.meta.env.BASE_URL": '"/"',
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": '"fixture"',
    "import.meta.env.VITE_CLERK_PROXY_URL": "undefined",
    "import.meta.env.DEV": "false",
    "import.meta.env.VITE_DEMO_MODE": "undefined",
    "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": "undefined",
    "import.meta.env.VITE_GOOGLE_MAPS_MAP_ID": "undefined",
  },
  plugins: [
    {
      name: "qa-browser",
      setup(b) {
        b.onResolve({ filter: /^@capacitor\/browser$/ }, () => ({
          path: "browser",
          namespace: "qa-browser",
        }));
        b.onLoad({ filter: /.*/, namespace: "qa-browser" }, () => ({
          contents: `export const Browser={open:async({url})=>{window.qaNativeOpened.push(url)},close:async()=>{}};`,
          loader: "js",
        }));
      },
    },
    {
      name: "qa-clerk",
      setup(b) {
        b.onResolve({ filter: /^@clerk\/react\/internal$/ }, () => ({
          path: "internal", namespace: "qa-internal",
        }));
        b.onLoad({ filter: /.*/, namespace: "qa-internal" }, () => ({
          contents: 'export const publishableKeyFromHost = (_host, key) => key;',
          loader: "js",
        }));
        b.onResolve({ filter: /^@clerk\/react$/ }, () => ({
          path: "clerk",
          namespace: "qa",
        }));
        b.onLoad({ filter: /.*/, namespace: "qa" }, () => ({
          resolveDir: root + "/artifacts/localeats",
          contents: `
            import React from "react";
            const account = () => ({isLoaded:true,isSignedIn:window.qaSignedIn,userId:window.qaSignedIn?'user_QA':null,getToken:async()=>null});
            export const useAuth=account;
            export const useUser=()=>({isLoaded:true,user:window.qaSignedIn?{id:'user_QA',fullName:'Signup Fixture'}:null});
            export const ClerkProvider=({children})=>children;
            const start=({forceRedirectUrl})=>React.createElement("button",{onClick:()=>{
              sessionStorage.setItem("qa-signup-session","signed-in");
              location.assign(forceRedirectUrl);
            }},"Complete simulated Clerk sign-in");
            export const SignUp=start, SignIn=start;
            export const useSignIn=()=>({signIn:{ticket:async({ticket})=>{window.qaNativeTickets.push(ticket);return{error:null}},finalize:async()=>{window.qaSignedIn=true;return{error:null}}}});
            export const useClerk=()=>({
              openUserProfile:()=>{window.securityOpened=true},
              addListener:()=>()=>{},
              signOut:async({redirectUrl})=>{sessionStorage.removeItem("qa-signup-session");location.assign(redirectUrl)},
            });
          `,
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
  const origin = "http://127.0.0.1:" + server.address().port;
  for (const width of [320, 390, 768, 1440]) {
    const home = await browser.newPage({ viewport: { width, height: 900 } });
    await home.goto(origin + "/home-fixture");
    await home.getByRole("heading", { name: "Good food. Closer to home." }).waitFor();
    const actions = home.getByRole("navigation", { name: "Get started with RoCoEats" }).getByRole("link");
    assert.deepEqual(await actions.allTextContents(), ["Sign In", "Order as Guest", "Browse Restaurants & Menus", "Partner With RoCoEats", "Drive With RoCoEats"]);
    let previousBottom = 0;
    for (const link of await actions.all()) {
      const box = await link.boundingBox();
      assert.ok(box.height >= 48 && box.y >= previousBottom);
      previousBottom = box.y + box.height;
      await link.focus();
      assert.equal(await link.evaluate(el => el === document.activeElement), true);
    }
    assert.equal(await home.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await home.getByRole("link", { name: "Order as Guest", exact: true }).click();
    await home.waitForURL(url => url.pathname === "/restaurants" && url.searchParams.get("guest") === "1");
    await home.getByRole("heading", { name: "Local food, right around here." }).waitFor();
    await home.goto(origin + "/");
    await home.getByRole("link", { name: "Partner With RoCoEats", exact: true }).click();
    await home.waitForURL(url => url.pathname === "/sign-up" && url.searchParams.get("join") === "restaurant");
    await home.goto(origin + "/");
    await home.getByRole("link", { name: "Drive With RoCoEats", exact: true }).click();
    await home.waitForURL(url => url.pathname === "/sign-up" && url.searchParams.get("join") === "driver");
    await home.goto(origin + "/");
    await home.screenshot({ path: target + `/homepage-${width}.png`, fullPage: true });
    await home.close();
  }
  for (const [role, destination] of [["customer", "/dashboard"], ["restaurant", "/restaurant"], ["driver", "/driver"], ["admin", "/admin"]]) {
    const member = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await member.goto(origin + "/home-fixture");
    await member.evaluate(role => {
      sessionStorage.setItem("qa-signup-session", "signed-in");
      sessionStorage.setItem("qa-signup-profile", JSON.stringify({ id: "fixture-profile", role, displayName: "QA member", createdAt: new Date().toISOString() }));
    }, role);
    await member.reload();
    await member.getByRole("link", { name: "Sign In", exact: true }).click();
    await member.waitForURL(url => url.pathname === destination);
    assert.equal(await member.evaluate(() => sessionStorage.getItem("qa-signup-writes")), null);
    await member.close();
  }
  console.log("Homepage PASS: five stacked actions, keyboard focus and no overflow at 320/390/768/1440px; server-profile routing for all four roles (simulated Clerk/API).");
  for (const [intent, role, destination, heading] of [
    ["", "customer", "/dashboard", "Welcome, Signup Fixture."],
    ["?join=restaurant", "restaurant", "/restaurant", "Bring your business to the table."],
    ["?join=driver", "driver", "/driver", "Local deliveries."],
  ]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    page.on("pageerror", error => console.error("Signup fixture error:", error.message));
    await page.goto(origin + "/signup-fixture" + intent);
    await page.getByRole("button", { name: "Complete simulated Clerk sign-in" }).click();
    try {
      await page.waitForURL(url => url.pathname === destination, { timeout: 10000 });
    } catch (error) {
      console.error("Signup destination", role, page.url(), await page.locator("body").innerText());
      throw error;
    }
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem("qa-signup-profile")).role), role);
    await page.reload();
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    assert.equal(await page.evaluate(() => Number(sessionStorage.getItem("qa-signup-writes"))), 1);
    await page.close();
  }

  const deniedPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  deniedPage.setDefaultTimeout(10000);
  deniedPage.on("pageerror", error => console.error("Denied fixture error:", error.message));
  await deniedPage.goto(origin + "/signup-fixture?join=restaurant&deny=1");
  await deniedPage.getByRole("button", { name: "Complete simulated Clerk sign-in" }).click();
  try {
    await deniedPage.getByRole("alert").filter({ hasText: "Private staging requires an invitation" }).waitFor();
  } catch (error) {
    console.error("Denied signup state:", deniedPage.url(), await deniedPage.locator("body").innerText());
    throw error;
  }
  assert.equal(await deniedPage.evaluate(() => sessionStorage.getItem("qa-signup-writes")), null);
  await deniedPage.goto(origin + "/restaurant");
  await deniedPage.getByRole("alert").filter({ hasText: "Private staging requires an invitation" }).waitFor();
  await deniedPage.getByRole("button", { name: "Retry", exact: true }).click();
  await deniedPage.getByRole("alert").filter({ hasText: "Private staging requires an invitation" }).waitFor();
  await deniedPage.getByRole("link", { name: "Check account access" }).click();
  await deniedPage.getByText("You are signed in. This private staging account still needs an invitation.").waitFor();
  await deniedPage.goto(origin + "/dashboard");
  await deniedPage.getByRole("alert").filter({ hasText: "Check your connection or account access" }).waitFor();
  await deniedPage.getByRole("button", { name: "Try again", exact: true }).click();
  await deniedPage.getByRole("alert").filter({ hasText: "Check your connection or account access" }).waitFor();
  await deniedPage.close();
  console.log("Signup UI: three member paths, session reload, and stable restaurant/dashboard staging denials passed (simulated Clerk/API)");

  const expiredPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await expiredPage.goto(origin + "/signup-fixture?join=restaurant&expired=1");
  await expiredPage.getByRole("button", { name: "Complete simulated Clerk sign-in" }).click();
  await expiredPage.getByRole("button", { name: "Sign in again to continue" }).click();
  await expiredPage.waitForURL(url => url.pathname === "/sign-in" && url.searchParams.get("join") === "restaurant");
  assert.equal(await expiredPage.evaluate(() => sessionStorage.getItem("qa-signup-session")), null);
  await expiredPage.close();

  const cartSignup = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await cartSignup.goto(origin + "/signup-fixture?checkout=1");
  await cartSignup.evaluate(() => localStorage.setItem("rocoeats-guest-cart:v1", JSON.stringify([{
    menuItemId: "11111111-1111-4111-8111-111111111111", name: "Guest cart fixture", priceCents: 899,
    quantity: 1, restaurantId: "22222222-2222-4222-8222-222222222222", restaurantName: "Fixture kitchen",
  }])));
  await cartSignup.getByRole("button", { name: "Complete simulated Clerk sign-in" }).click();
  await cartSignup.waitForURL(url => url.pathname === "/cart" && !url.search);
  await cartSignup.getByText("Guest cart fixture", { exact: true }).waitFor();
  assert.equal(await cartSignup.evaluate(() => JSON.parse(localStorage.getItem("rocoeats-guest-cart:v1")).length), 0);
  await cartSignup.reload();
  await cartSignup.getByText("Guest cart fixture", { exact: true }).waitFor();
  await cartSignup.getByLabel("Delivery address").selectOption("fixture-address");
  await cartSignup.evaluate(() => sessionStorage.setItem("qa-hold-quote", "1"));
  await cartSignup.getByRole("button", { name: "Calculate test total" }).click();
  await cartSignup.waitForFunction(() => typeof window.qaReleaseQuote === "function");
  await cartSignup.getByRole("button", { name: "Add one Guest cart fixture" }).click();
  await cartSignup.evaluate(() => {
    sessionStorage.removeItem("qa-hold-quote");
    window.qaReleaseQuote();
  });
  await cartSignup.getByRole("button", { name: "Calculate test total" }).waitFor();
  await cartSignup.waitForFunction(() => !Array.from(document.querySelectorAll("button")).find(button => button.textContent === "Calculate test total")?.disabled);
  assert.equal(await cartSignup.getByRole("button", { name: /Create order/ }).count(), 0);
  await cartSignup.getByRole("button", { name: "Calculate test total" }).click();
  const createOrder = cartSignup.getByRole("button", { name: "Create order · $17.98" });
  await createOrder.click();
  await cartSignup.getByRole("alert").filter({ hasText: "Simulated order retry" }).waitFor();
  await cartSignup.getByRole("button", { name: "Calculate test total" }).click();
  await createOrder.click();
  await cartSignup.waitForFunction(() => JSON.parse(sessionStorage.getItem("qa-order-writes") ?? "[]").length === 2);
  const writes = await cartSignup.evaluate(() => JSON.parse(sessionStorage.getItem("qa-order-writes")));
  assert.deepEqual(writes[0], writes[1]);
  assert.ok(writes[0].key);
  assert.equal(writes[0].body.items[0].quantity, 2);
  assert.equal(writes[0].body.expectedTotalCents, 1798);
  await cartSignup.close();
  console.log("Signup UI: expired-session recovery, guest cart restoration and checkout quote races passed (simulated Clerk/API)");

  const nativePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await nativePage.goto(
    "http://127.0.0.1:" + server.address().port + "/?native=true&join=restaurant",
  );
  await nativePage
    .getByRole("button", {
      name: "Sign in or create account in browser",
      exact: true,
    })
    .click();
  await nativePage.waitForURL(url => url.pathname === "/account/setup" && url.searchParams.get("join") === "restaurant");
  assert.deepEqual(await nativePage.evaluate(() => window.qaNativeTickets), [
    "qa-one-use-ticket",
  ]);
  const opened = await nativePage.evaluate(() => window.qaNativeOpened);
  assert.equal(opened.length, 1);
  assert.equal(new URL(opened[0]).origin, "https://qa.onrender.com");
  assert.equal(opened[0].includes("ticket"), false);
  assert.equal(
    (await nativePage.evaluate(() => window.qaNativeStart)).challenge.length,
    43,
  );
  assert.equal(
    await nativePage.evaluate(() =>
      localStorage.getItem("rocoeats-native-auth:v1"),
    ),
    null,
  );
  await nativePage.close();
  const importPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await importPage.goto(
    "http://127.0.0.1:" + server.address().port + "/?importGuest=true",
  );
  await importPage
    .getByLabel("Private guest tracking link", { exact: true })
    .fill("https://evil.example.test/guest/order#access=" + "A".repeat(43));
  await importPage
    .getByRole("button", { name: "Open my private guest order", exact: true })
    .click();
  await importPage.getByRole("alert").waitFor();
  assert.deepEqual(
    await importPage.evaluate(() => window.qaGuestImportHeaders),
    [],
  );
  await importPage
    .getByLabel("Private guest tracking link", { exact: true })
    .fill("https://qa.onrender.com/guest/order#access=" + "A".repeat(43));
  await importPage
    .getByRole("button", { name: "Open my private guest order", exact: true })
    .click();
  await importPage.waitForFunction(
    () => localStorage.getItem("rocoeats-guest-access:v1") === "A".repeat(43),
  );
  assert.deepEqual(
    await importPage.evaluate(() => window.qaGuestImportHeaders),
    ["A".repeat(43)],
  );
  await importPage.close();
  const guestPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await guestPage.goto(
    "http://127.0.0.1:" + server.address().port + "/?guest=true",
  );
  await guestPage.evaluate(() =>
    localStorage.setItem(
      "rocoeats-guest-cart:v1",
      JSON.stringify([
        {
          menuItemId: "11111111-1111-4111-8111-111111111110",
          restaurantId: "11111111-1111-4111-8111-111111111111",
          restaurantName: "QA guest kitchen",
          name: "QA guest meal",
          priceCents: 1000,
          quantity: 1,
        },
      ]),
    ),
  );
  await guestPage.getByLabel("Your name", { exact: true }).fill("Guest QA");
  await guestPage
    .getByLabel("Receipt email", { exact: true })
    .fill("guest-ui@example.test");
  await guestPage
    .getByLabel("Delivery phone", { exact: true })
    .fill("8655550100");
  await guestPage
    .getByRole("button", { name: "Continue as Guest", exact: true })
    .click();
  await guestPage.getByText("QA guest meal", { exact: true }).waitFor();
  assert.deepEqual(await guestPage.evaluate(() => window.qaGuestContacts), [
    { name: "Guest QA", email: "guest-ui@example.test", phone: "8655550100" },
  ]);
  await guestPage.reload();
  await guestPage.getByText("QA guest meal", { exact: true }).waitFor();
  await guestPage
    .getByRole("button", { name: "Add address", exact: true })
    .click();
  await guestPage
    .getByLabel("Street address", { exact: true })
    .fill("QA guest street");
  await guestPage.getByLabel("City", { exact: true }).fill("Kingston");
  await guestPage.getByLabel("ZIP code", { exact: true }).fill("37854");
  await guestPage
    .getByRole("button", { name: "Save address", exact: true })
    .click();
  await guestPage
    .getByRole("button", { name: "Calculate test total", exact: true })
    .click();
  await guestPage
    .getByRole("button", { name: "Create order · $15.50", exact: true })
    .waitFor();
  assert.equal(
    await guestPage
      .getByRole("button", { name: "Create order · $15.50", exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(
    await guestPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await guestPage.close();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page
    .getByText(
      "Your order has been received. We're contacting the restaurant to confirm it.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("button", { name: "Guest delivery contact", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("link", { name: "Call guest", exact: true })
      .getAttribute("href"),
    "tel:8655550199",
  );
  await page
    .getByLabel("Call notes / unavailable items / price discrepancies", {
      exact: true,
    })
    .fill("Reached restaurant for order review");
  await page
    .getByRole("button", { name: "Save telephone response", exact: true })
    .click();
  await page
    .getByText("We're confirming your order with the restaurant.", {
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("combobox", { name: /^Telephone action/ })
    .selectOption("accept");
  await page
    .getByLabel("Call notes / unavailable items / price discrepancies", {
      exact: true,
    })
    .fill("Restaurant confirms all items; preparation waits for payment");
  await page
    .getByLabel("Preparation estimate (minutes, acceptance only)", {
      exact: true,
    })
    .fill("20");
  await page
    .getByLabel("Restaurant-confirmed food subtotal ($, acceptance only)", {
      exact: true,
    })
    .fill("10");
  await page
    .getByLabel(
      "Restaurant verified every item, quantity, modifier and price; preparation waits for payment",
      { exact: true },
    )
    .check();
  await page
    .getByRole("button", { name: "Save telephone response", exact: true })
    .click();
  await page
    .getByText(
      "The restaurant has confirmed your order. Complete test payment before preparation begins.",
      { exact: true },
    )
    .waitFor();
  const phoneRequests = await page.evaluate(() => window.qaTelephoneWrites);
  assert.equal(phoneRequests.length, 2);
  assert.equal(phoneRequests[1].version, 2);
  assert.equal(phoneRequests[1].confirmedSubtotalCents, 1000);
  assert.equal(phoneRequests[1].allItemsAvailable, true);
  await page
    .getByRole("button", { name: "Declined offers", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reconsider offer", exact: true })
    .click();
  await page
    .getByText("No declined unassigned offers.", { exact: true })
    .waitFor();
  assert.deepEqual(await page.evaluate(() => window.qaReconsiderRequests), [
    { expectedDeclineId: "11111111-1111-4111-8111-111111111111" },
  ]);
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
  const pricingRow = page
    .locator(".roco-row")
    .filter({ has: page.locator("dt", { hasText: /^Pricing saved$/ }) });
  await pricingRow.getByText("No", { exact: true }).waitFor();
  for (const [label, value] of [
    ["Delivery fee ($)", "5"],
    ["Service fee (%)", "5"],
    ["Configured tax rate (%)", "0"],
    ["Restaurant commission (%)", "10"],
    ["Driver share of delivery fee (%)", "100"],
    ["Delivery ZIP codes, separated by commas", "37763"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("combobox", { name: /^Taxable charges/ })
    .selectOption("food");
  await page
    .getByRole("button", {
      name: "Save pricing policy for provider testing",
      exact: true,
    })
    .click();
  await pricingRow.getByText("Yes", { exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.qaPricingWrites), [
    {
      deliveryFeeCents: 500,
      serviceFeeBps: 500,
      taxBps: 0,
      restaurantCommissionBps: 1000,
      driverShareBps: 10000,
      taxDeliveryAndService: false,
      allowedPostalCodes: ["37763"],
      testMode: true,
    },
  ]);
  await page.evaluate(() => {
    window.qaSignedEventAt = "2026-11-08T12:30:00Z";
  });
  await page
    .getByRole("button", { name: "Refresh setup status", exact: true })
    .click();
  await page
    .getByText(/^Last accepted signed event:/)
    .filter({ hasText: "None yet" })
    .waitFor({ state: "hidden" });
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
  const nextButton = page.getByRole("button", {
    name: "Start fresh guest checkout",
    exact: true,
  });
  assert.equal(await nextButton.isDisabled(), true);
  assert.equal(
    new URL(
      await page
        .getByLabel("Previous order's private tracking link", { exact: true })
        .inputValue(),
    ).origin,
    "https://qa.onrender.com",
  );
  await page
    .getByLabel(
      "I saved the previous order's private tracking link somewhere safe",
      { exact: true },
    )
    .check();
  await page
    .getByLabel("Name for the next order", { exact: true })
    .fill("Returning QA guest");
  await page
    .getByLabel("Email for the next receipt", { exact: true })
    .fill("returning-ui@example.test");
  await page
    .getByLabel("Phone for the next delivery", { exact: true })
    .fill("8655550100");
  await nextButton.click();
  await page.waitForURL("**/cart");
  assert.deepEqual(await page.evaluate(() => window.qaNextGuestWrites), [
    {
      name: "Returning QA guest",
      email: "returning-ui@example.test",
      phone: "8655550100",
      previousLinkSaved: true,
    },
  ]);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("rocoeats-guest-access:v1")),
    "B".repeat(43),
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
