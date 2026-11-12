// Read-only deployed checks. No credentials, auth bypasses, orders or payments.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export function stagingArguments(args) {
  const originArg = args[0];
  const expectedRevision = args[1];
  const privateTestWindow = args[2] === "--private-test-window";
  let origin;
  try {
    const url = new URL(originArg);
    assert.equal(url.protocol, "https:");
    assert.ok(url.hostname.endsWith(".onrender.com"));
    assert.ok(
      !url.username && !url.password && !url.port && !url.search && !url.hash,
    );
    assert.equal(url.pathname, "/");
    assert.ok(
      args.length <= 2 ||
        (args.length === 3 && privateTestWindow && expectedRevision),
    );
    assert.ok(!expectedRevision || /^[a-f0-9]{40}$/i.test(expectedRevision));
    origin = url.origin;
  } catch {
    throw new Error("Invalid staging verifier arguments");
  }
  return { origin, expectedRevision, privateTestWindow };
}

export async function verifyStaging(
  { origin, expectedRevision, privateTestWindow = false },
  fetcher = fetch,
) {
  const checks = [],
    failures = [];
  let live, readiness, mobile;
  async function check(name, run) {
    try {
      await run();
    } catch {
      failures.push(name);
    }
  }
  async function request(path, expected, headers = {}, method = "GET") {
    const response = await fetcher(origin + path, {
      method,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(45000),
    });
    checks.push({
      path,
      status: response.status,
      ...(headers.origin && { method, origin: headers.origin }),
    });
    assert.ok(expected.includes(response.status));
    return response;
  }
  await check("deployment_revision", async () => {
    live = await (await request("/livez", [200])).json();
    assert.equal(live.alive, true);
    assert.ok(
      typeof live.revision === "string" &&
        /^[a-f0-9]{40}$/i.test(live.revision),
    );
    if (expectedRevision)
      assert.equal(live.revision.toLowerCase(), expectedRevision.toLowerCase());
  });
  await check("dependency_health", async () => {
    readiness = await (await request("/readyz", [200, 503])).json();
    assert.equal(readiness.liveChargesEnabled, false);
    assert.equal(readiness.database, true);
    if (privateTestWindow) assert.equal(readiness.ready, true);
  });
  await check("private_staging_and_ordering_gates", async () => {
    mobile = await (await request("/api/mobile/readiness", [200])).json();
    assert.equal(
      mobile.privateTestStaging,
      true,
      "Staging is not restricted to private testers",
    );
    assert.equal(
      mobile.orderingEnabled,
      privateTestWindow,
      "Effective ordering does not match the requested test-window state",
    );
    assert.equal(
      mobile.liveChargesEnabled,
      false,
      "Live charges must be disabled",
    );
    assert.equal(
      mobile.nativeProtocolVersion,
      1,
      "Unexpected native protocol version",
    );
    assert.equal(
      mobile.publicOrderingEnabled,
      false,
      "Public ordering must be closed",
    );
    assert.equal(
      mobile.privateTestOrderingEnabled,
      privateTestWindow,
      "Private test ordering does not match the requested state",
    );
  });
  const nativeOrigins = ["https://localhost", "capacitor://localhost"];
  for (const nativeOrigin of [...nativeOrigins, "https://untrusted.example"]) {
    const allowed = nativeOrigins.includes(nativeOrigin);
    await check(`cors:${nativeOrigin}`, async () => {
      const preflight = await request(
        "/api/profiles/me",
        allowed ? [204] : [401, 403],
        {
          origin: nativeOrigin,
          "access-control-request-method": "GET",
          "access-control-request-headers":
            "authorization,x-rocoeats-guest-token",
        },
        "OPTIONS",
      );
      assert.equal(
        preflight.headers.get("access-control-allow-origin"),
        allowed ? nativeOrigin : null,
      );
      if (allowed) {
        const allowedHeaders = (
          preflight.headers.get("access-control-allow-headers") || ""
        )
          .toLowerCase()
          .split(",")
          .map((value) => value.trim());
        assert.ok(
          allowedHeaders.includes("authorization") &&
            allowedHeaders.includes("x-rocoeats-guest-token"),
        );
        await request("/api/profiles/me", [401], { origin: nativeOrigin });
      }
    });
  }
  for (const path of [
    "/api/profiles/me",
    "/api/session/access",
    "/api/restaurants",
    "/api/admin/profiles",
  ])
    await check(`unsigned_denied:${path}`, () => request(path, [401]));
  await check("forged_admin_denied", () =>
    request("/api/admin/profiles", [401], {
      "x-test-user": "user_QASpoof",
      "x-role": "admin",
    }),
  );
  for (const path of ["/.env", "/.env.staging"])
    await check(`hidden_file:${path}`, () => request(path, [404]));
  for (const path of [
    "/",
    "/sign-in",
    "/restaurants",
    "/guest/order",
    "/orders",
    "/restaurant",
    "/driver",
    "/operations",
  ]) {
    await check(`website_route:${path}`, async () => {
      const html = await (await request(path, [200])).text();
      assert.match(html, /RoCoEats/);
    });
  }
  const bool = (value) => (typeof value === "boolean" ? value : null);
  const revision =
    typeof live?.revision === "string" && /^[a-f0-9]{40}$/i.test(live.revision)
      ? live.revision.toLowerCase()
      : null;
  const requirements = {
    database: "database_connection",
    authReady: "clerk_configuration",
    pricingReady: "test_pricing_and_service_area",
    providerConfigured: "stripe_test_provider_configuration",
    webhookReady: "stripe_webhook_signing_configuration",
    workerReady: "background_worker_health",
  };
  const missingConfiguration = Object.entries(requirements)
    .filter(([key]) => readiness?.[key] === false)
    .map(([, label]) => label);
  const unverifiedDependencies = Object.entries(requirements)
    .filter(([key]) => typeof readiness?.[key] !== "boolean")
    .map(([, label]) => label);
  return {
    origin,
    observedAt: new Date().toISOString(),
    revision,
    expectedRevision: expectedRevision?.toLowerCase() ?? null,
    revisionMatches: expectedRevision
      ? revision === expectedRevision.toLowerCase()
      : null,
    verificationPassed: failures.length === 0,
    dependenciesReady:
      readiness?.ready === true &&
      missingConfiguration.length === 0 &&
      unverifiedDependencies.length === 0,
    readiness: Object.fromEntries(
      [
        "ready",
        "database",
        "authReady",
        "pricingReady",
        "providerConfigured",
        "webhookReady",
        "workerReady",
        "liveChargesEnabled",
      ].map((key) => [key, bool(readiness?.[key])]),
    ),
    missingConfiguration,
    unverifiedDependencies,
    privateTestStaging: bool(mobile?.privateTestStaging),
    orderingEnabled: bool(mobile?.orderingEnabled),
    publicOrderingEnabled: bool(mobile?.publicOrderingEnabled),
    privateTestOrderingEnabled: bool(mobile?.privateTestOrderingEnabled),
    checks,
    failures,
    authenticatedOwnerTested: false,
    providerTransactionTested: false,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let options;
  try {
    options = stagingArguments(process.argv.slice(2));
  } catch {
    console.error(
      "Usage: node scripts/verify-staging-http.mjs https://<staging>.onrender.com [40-character revision [--private-test-window]]",
    );
    process.exitCode = 1;
  }
  if (options) {
    const report = await verifyStaging(options);
    console.log(JSON.stringify(report, null, 2));
    if (!report.verificationPassed) process.exitCode = 1;
  }
}
