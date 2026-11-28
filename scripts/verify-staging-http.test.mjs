import assert from "node:assert/strict";
import { test } from "node:test";
import { stagingArguments, verifyStaging } from "./verify-staging-http.mjs";

const expected = "a".repeat(40),
  observed = "b".repeat(40);
const origin = "https://qa.onrender.com";
function fixture({
  revision = expected,
  ready = true,
  gate = {},
  config = {},
} = {}) {
  const requests = [];
  return {
    requests,
    fetcher: async (url, options) => {
      requests.push({ url, ...options });
      const path = new URL(url).pathname;
      if (path === "/livez")
        return Response.json({ alive: true, revision, secret: "DO_NOT_ECHO" });
      if (path === "/readyz")
        return Response.json(
          {
            ready,
            database: true,
            authReady: true,
            pricingReady: true,
            providerConfigured: true,
            webhookReady: true,
            workerReady: true,
            liveChargesEnabled: false,
            testPayoutsEnabled: false,
            webhookRetentionEnabled: false,
            clientIpPolicy: "render-cdn-chain-v1",
            clientIpSource: "render_cdn_chain",
            deliveryAreaReady: true,
            geographicDelivery: {
              mode: "provisional_postal",
              configurationReady: true,
              municipalConfigurationReady: false,
              municipalEnforcementEnabled: false,
            },
            ...config,
          },
          { status: ready ? 200 : 503 },
        );
      if (path === "/api/mobile/readiness")
        return Response.json({
          privateTestStaging: true,
          orderingEnabled: false,
          publicOrderingEnabled: false,
          privateTestOrderingEnabled: false,
          nativeProtocolVersion: 1,
          liveChargesEnabled: false,
          ...gate,
        });
      if (options.method === "OPTIONS") {
        const allowed = options.headers.origin !== "https://untrusted.example";
        return new Response(null, {
          status: allowed ? 204 : 401,
          headers: allowed
            ? {
                "access-control-allow-origin": options.headers.origin,
                "access-control-allow-headers":
                  "authorization,x-rocoeats-guest-token",
              }
            : {},
        });
      }
      if (path.startsWith("/api/"))
        return Response.json({ error: "DO_NOT_ECHO" }, { status: 401 });
      if (path.startsWith("/.env")) return new Response(null, { status: 404 });
      return new Response("<html>RoCoEats</html>");
    },
  };
}
test("release verifier reports exact deployment and checks website routes without mutations or response leakage", async () => {
  const f = fixture();
  const report = await verifyStaging(
    { origin, expectedRevision: expected },
    f.fetcher,
  );
  assert.equal(report.verificationPassed, true);
  assert.equal(report.revisionMatches, true);
  assert.equal(report.revision, expected);
  assert.equal(report.dependenciesReady, true);
  assert.deepEqual(report.missingConfiguration, []);
  assert.deepEqual(report.unverifiedSafeguards, []);
  assert.equal(report.readiness.testPayoutsEnabled, false);
  assert.equal(report.readiness.webhookRetentionEnabled, false);
  assert.equal(report.geographicDelivery.municipalEnforcementEnabled, false);
  assert.equal(report.clientIdentity.source, "render_cdn_chain");
  assert.ok(
    f.requests.every(
      (r) =>
        ["GET", "OPTIONS"].includes(r.method) &&
        r.redirect === "manual" &&
        !r.body,
    ),
  );
  for (const path of [
    "/",
    "/restaurants",
    "/guest/order",
    "/orders",
    "/restaurant",
    "/driver",
    "/operations",
  ])
    assert.ok(report.checks.some((c) => c.path === path));
  assert.equal(JSON.stringify(report).includes("DO_NOT_ECHO"), false);
});
test("wrong release still reports observed SHA, missing configuration and independent safety results", async () => {
  const f = fixture({
    revision: observed,
    ready: false,
    config: { pricingReady: false, webhookReady: false },
  });
  const report = await verifyStaging(
    { origin, expectedRevision: expected },
    f.fetcher,
  );
  assert.equal(report.verificationPassed, false);
  assert.equal(report.revisionMatches, false);
  assert.equal(report.revision, observed);
  assert.equal(report.dependenciesReady, false);
  assert.deepEqual(report.missingConfiguration, [
    "test_pricing_and_service_area",
    "stripe_webhook_signing_configuration",
  ]);
  assert.deepEqual(report.failures, ["deployment_revision"]);
  assert.ok(report.checks.some((c) => c.path === "/operations"));
  assert.equal(report.authenticatedOwnerTested, false);
  assert.equal(report.providerTransactionTested, false);
});
test("unknown revisions, absent or unsafe gates and failed dependencies never pass verification", async () => {
  for (const change of [
    { revision: null },
    { gate: { publicOrderingEnabled: undefined } },
    { gate: { privateTestOrderingEnabled: undefined } },
    { gate: { publicOrderingEnabled: true } },
    { config: { database: false } },
    { config: { deliveryAreaReady: undefined } },
  ]) {
    const f = fixture(change);
    const report = await verifyStaging(
      { origin, expectedRevision: expected },
      f.fetcher,
    );
    assert.equal(report.verificationPassed, false);
    assert.ok(report.failures.length);
  }
  const broken = await verifyStaging(
    { origin, expectedRevision: expected },
    async () => {
      throw new Error("DO_NOT_ECHO sk_test_sensitive");
    },
  );
  assert.equal(broken.verificationPassed, false);
  assert.equal(broken.dependenciesReady, false);
  assert.equal(broken.revision, null);
  assert.deepEqual(broken.missingConfiguration, []);
  assert.equal(broken.unverifiedDependencies.length, 7);
  assert.equal(JSON.stringify(broken).includes("DO_NOT_ECHO"), false);
});
test("private test-window verification requires a closed public gate and ready dependencies", async () => {
  const gate = { orderingEnabled: true, privateTestOrderingEnabled: true };
  assert.equal(
    (
      await verifyStaging(
        { origin, expectedRevision: expected, privateTestWindow: true },
        fixture({ gate }).fetcher,
      )
    ).verificationPassed,
    true,
  );
  assert.equal(
    (
      await verifyStaging(
        { origin, expectedRevision: expected, privateTestWindow: true },
        fixture({ gate, ready: false, config: { webhookReady: false } })
          .fetcher,
      )
    ).verificationPassed,
    false,
  );
});
test("CLI rejects unsafe hosts, credential-bearing URLs, short revisions and unknown options", () => {
  assert.deepEqual(stagingArguments([origin, expected]), {
    origin,
    expectedRevision: expected,
    privateTestWindow: false,
  });
  for (const args of [
    ["http://qa.onrender.com", expected],
    ["https://qa.onrender.com.attacker.test", expected],
    ["https://user:password@qa.onrender.com", expected],
    [origin + "?secret=do-not-echo", expected],
    [origin, "ecce823"],
    [origin, expected, "--unknown"],
  ])
    assert.throws(() => stagingArguments(args));
});

test("geographic misconfiguration fails readiness and reports only known setting names", async () => {
  const f = fixture({
    ready: false,
    config: {
      deliveryAreaReady: false,
      geographicDelivery: {
        mode: "municipal",
        configurationReady: false,
        municipalConfigurationReady: false,
        municipalEnforcementEnabled: false,
        missingConfiguration: ["GEOCODIO_API_KEY", "DO_NOT_ECHO_SECRET"],
        apiKey: "DO_NOT_ECHO_SECRET",
        address: "DO_NOT_ECHO_SECRET",
      },
    },
  });
  const report = await verifyStaging(
    { origin, expectedRevision: expected },
    f.fetcher,
  );
  assert.equal(report.verificationPassed, false);
  assert.equal(report.dependenciesReady, false);
  assert.ok(report.failures.includes("dependency_health"));
  assert.ok(
    report.missingConfiguration.includes("geographic_delivery_configuration"),
  );
  assert.deepEqual(report.geographicDelivery.missingConfiguration, [
    "GEOCODIO_API_KEY",
  ]);
  assert.equal(JSON.stringify(report).includes("DO_NOT_ECHO"), false);
});

test("read-only verifier rejects open or malformed TEST payout gates", async () => {
  for (const testPayoutsEnabled of [true, "false"]) {
    const report = await verifyStaging(
      { origin, expectedRevision: expected },
      fixture({ config: { testPayoutsEnabled } }).fetcher,
    );
    assert.equal(report.verificationPassed, false);
    assert.ok(report.failures.includes("dependency_health"));
  }
});

test("proxy policy requires actual CDN identity evidence", async () => {
  for (const clientIpSource of ["socket", "unknown"]) {
    const report = await verifyStaging(
      { origin, expectedRevision: expected },
      fixture({ config: { clientIpSource } }).fetcher,
    );
    assert.equal(report.verificationPassed, false);
    assert.ok(report.failures.includes("dependency_health"));
  }
});

test("retention gate is explicit, strict and sanitized", async () => {
  for (const webhookRetentionEnabled of [true, "false", "DO_NOT_ECHO"]) {
    const report = await verifyStaging(
      { origin, expectedRevision: expected },
      fixture({ config: { webhookRetentionEnabled } }).fetcher,
    );
    assert.equal(report.verificationPassed, false);
    assert.ok(report.failures.includes("dependency_health"));
    assert.equal(JSON.stringify(report).includes("DO_NOT_ECHO"), false);
  }
});

test("missing safeguards fail verification and remain explicitly unverified", async () => {
  for (const [config, unverified] of [
    [{ testPayoutsEnabled: undefined }, "test_payout_gate"],
    [{ webhookRetentionEnabled: undefined }, "webhook_retention_gate"],
    [{ geographicDelivery: undefined }, "municipal_enforcement_gate"],
    [{ clientIpPolicy: undefined }, "client_ip_policy"],
    [{ clientIpSource: undefined }, "client_ip_policy"],
  ]) {
    const report = await verifyStaging(
      { origin, expectedRevision: expected },
      fixture({ config }).fetcher,
    );
    assert.equal(report.verificationPassed, false, unverified);
    assert.ok(report.failures.includes("dependency_health"));
    assert.deepEqual(report.unverifiedSafeguards, [unverified]);
    assert.ok(report.checks.some(({ path }) => path === "/operations"));
  }
});

test("municipal enforcement must explicitly be off in both staging modes", async () => {
  for (const privateTestWindow of [false, true]) {
    for (const municipalEnforcementEnabled of [true, "false", undefined]) {
      const report = await verifyStaging(
        { origin, expectedRevision: expected, privateTestWindow },
        fixture({
          config: { geographicDelivery: { municipalEnforcementEnabled } },
          gate: {
            orderingEnabled: privateTestWindow,
            privateTestOrderingEnabled: privateTestWindow,
          },
        }).fetcher,
      );
      assert.equal(report.verificationPassed, false);
      assert.ok(report.failures.includes("dependency_health"));
      assert.equal(
        report.geographicDelivery.municipalEnforcementEnabled,
        municipalEnforcementEnabled === true ? true : null,
      );
    }
  }
});
