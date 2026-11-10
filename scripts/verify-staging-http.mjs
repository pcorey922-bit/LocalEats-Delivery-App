// Read-only deployed checks. No credentials, auth bypasses, orders or payments.
import assert from "node:assert/strict";
const args = process.argv.slice(2);
const originArg = args[0];
const expectedRevision = args[1];
const privateTestWindow = args[2] === "--private-test-window";
let origin;
try {
  const url = new URL(originArg);
  assert.equal(url.protocol, "https:");
  assert.ok(url.hostname.endsWith(".onrender.com"));
  assert.ok(!url.username && !url.password && !url.port && !url.search && !url.hash);
  assert.equal(url.pathname, "/");
  assert.ok(args.length <= 2 || (args.length === 3 && privateTestWindow && expectedRevision));
  assert.ok(!expectedRevision || /^[a-f0-9]{40}$/i.test(expectedRevision));
  origin = url.origin;
} catch {
  console.error("Usage: node scripts/verify-staging-http.mjs https://<staging>.onrender.com [40-character revision [--private-test-window]]");
  process.exit(1);
}
const checks = [];
async function request(path, expected, headers = {}, method = "GET") {
  const response = await fetch(origin + path, { method, headers, redirect: "manual", signal: AbortSignal.timeout(45000) });
  assert.ok(expected.includes(response.status), `${path}: unexpected HTTP ${response.status}`);
  checks.push({ path, status: response.status, ...(headers.origin && { method, origin: headers.origin }) });
  return response;
}
try {
  const live = await (await request("/livez", [200])).json();
  assert.equal(live.alive, true);
  if (expectedRevision) assert.equal(live.revision, expectedRevision, "Staging is not running the expected revision");
  const readiness = await (await request("/readyz", privateTestWindow ? [200] : [200, 503])).json();
  assert.equal(readiness.liveChargesEnabled, false);
  assert.equal(readiness.database, true);
  if (privateTestWindow) assert.equal(readiness.ready, true);
  const mobile = await (await request("/api/mobile/readiness", [200])).json();
  assert.equal(mobile.privateTestStaging, true, "Staging is not restricted to private testers");
  assert.equal(mobile.orderingEnabled, privateTestWindow, "Effective ordering does not match the requested test-window state");
  assert.equal(mobile.liveChargesEnabled, false, "Live charges must be disabled");
  assert.equal(mobile.nativeProtocolVersion, 1, "Unexpected native protocol version");
  if (privateTestWindow || "publicOrderingEnabled" in mobile)
    assert.equal(mobile.publicOrderingEnabled, false, "Public ordering must be closed");
  if (privateTestWindow || "privateTestOrderingEnabled" in mobile)
    assert.equal(mobile.privateTestOrderingEnabled, privateTestWindow, "Private test ordering does not match the requested state");
  const nativeOrigins = ["https://localhost", "capacitor://localhost"];
  for (const nativeOrigin of [...nativeOrigins, "https://untrusted.example"]) {
    const allowed = nativeOrigins.includes(nativeOrigin);
    const preflight = await request("/api/profiles/me", allowed ? [204] : [401, 403], {
      origin: nativeOrigin,
      "access-control-request-method": "GET",
      "access-control-request-headers": "authorization,x-rocoeats-guest-token",
    }, "OPTIONS");
    assert.equal(preflight.headers.get("access-control-allow-origin"), allowed ? nativeOrigin : null);
    if (allowed) {
      const allowedHeaders = (preflight.headers.get("access-control-allow-headers") || "")
        .toLowerCase().split(",").map(value => value.trim());
      assert.ok(allowedHeaders.includes("authorization") && allowedHeaders.includes("x-rocoeats-guest-token"));
      await request("/api/profiles/me", [401], { origin: nativeOrigin });
    }
  }
  for (const path of ["/api/profiles/me", "/api/session/access", "/api/restaurants", "/api/admin/profiles"])
    await request(path, [401]);
  await request("/api/admin/profiles", [401], { "x-test-user": "user_QASpoof", "x-role": "admin" });
  for (const path of ["/.env", "/.env.staging"]) await request(path, [404]);
  const html = await (await request("/sign-in", [200])).text();
  assert.match(html, /RoCoEats/);
  console.log(JSON.stringify({
    origin, observedAt: new Date().toISOString(), revision: live.revision ?? null,
    readiness: Object.fromEntries(["ready", "database", "authReady", "pricingReady", "providerConfigured", "webhookReady", "workerReady", "liveChargesEnabled"].map(key => [key,readiness[key]])),
    privateTestStaging: true, orderingEnabled: mobile.orderingEnabled,
    publicOrderingEnabled: mobile.publicOrderingEnabled ?? null,
    privateTestOrderingEnabled: mobile.privateTestOrderingEnabled ?? null,
    checks, authenticatedOwnerTested: false,
  }, null, 2));
} catch (error) {
  console.error("Staging verification failed:", error instanceof assert.AssertionError ? error.message.split("\n")[0] : "HTTP/dependency check failed; inspect staging health without sharing secrets");
  process.exitCode = 1;
}
