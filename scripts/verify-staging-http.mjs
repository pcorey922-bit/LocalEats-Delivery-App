// Read-only deployed checks. No credentials, auth bypasses, orders or payments.
import assert from "node:assert/strict";
const args = process.argv.slice(2);
const originArg = args[0];
const expectedRevision = args[1];
let origin;
try {
  const url = new URL(originArg);
  assert.equal(url.protocol, "https:");
  assert.ok(url.hostname.endsWith(".onrender.com"));
  assert.ok(!url.username && !url.password && !url.port && !url.search && !url.hash);
  assert.equal(url.pathname, "/");
  assert.ok(args.length <= 2);
  assert.ok(!expectedRevision || /^[a-f0-9]{40}$/i.test(expectedRevision));
  origin = url.origin;
} catch {
  console.error("Usage: node scripts/verify-staging-http.mjs https://<staging>.onrender.com [40-character revision]");
  process.exit(1);
}
const checks = [];
async function request(path, expected, headers = {}) {
  const response = await fetch(origin + path, { headers, redirect: "manual", signal: AbortSignal.timeout(45000) });
  assert.ok(expected.includes(response.status), `${path}: unexpected HTTP ${response.status}`);
  checks.push({ path, status: response.status });
  return response;
}
try {
  const live = await (await request("/livez", [200])).json();
  assert.equal(live.alive, true);
  if (expectedRevision) assert.equal(live.revision, expectedRevision, "Staging is not running the expected revision");
  const readiness = await (await request("/readyz", [200, 503])).json();
  assert.equal(readiness.liveChargesEnabled, false);
  assert.equal(readiness.database, true);
  const mobile = await (await request("/api/mobile/readiness", [200])).json();
  assert.equal(mobile.privateTestStaging, true, "Staging is not restricted to private testers");
  assert.equal(mobile.orderingEnabled, false, "Ordering must be closed for deployment verification");
  assert.equal(mobile.liveChargesEnabled, false, "Live charges must be disabled");
  for (const path of ["/api/profiles/me", "/api/session/access", "/api/restaurants", "/api/admin/profiles"])
    await request(path, [401]);
  await request("/api/admin/profiles", [401], { "x-test-user": "user_QASpoof", "x-role": "admin" });
  for (const path of ["/.env", "/.env.staging"]) await request(path, [404]);
  const html = await (await request("/sign-in", [200])).text();
  assert.match(html, /RoCoEats/);
  console.log(JSON.stringify({
    origin, observedAt: new Date().toISOString(), revision: live.revision ?? null,
    readiness: Object.fromEntries(["ready", "database", "authReady", "pricingReady", "providerConfigured", "webhookReady", "workerReady", "liveChargesEnabled"].map(key => [key,readiness[key]])),
    privateTestStaging: true, orderingEnabled: false,
    checks, authenticatedOwnerTested: false,
  }, null, 2));
} catch (error) {
  console.error("Staging verification failed:", error instanceof assert.AssertionError ? error.message.split("\n")[0] : "HTTP/dependency check failed; inspect staging health without sharing secrets");
  process.exitCode = 1;
}
