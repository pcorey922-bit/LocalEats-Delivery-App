import test from "node:test";
import assert from "node:assert/strict";
import {
  runPublicAccuracy,
  publicAccuracyCases,
  publicAccuracyRequestLimit,
} from "./geocodio-accuracy";
import { requestGeocodioEvidence } from "./municipal-delivery";
import { strictProviderJson } from "./strict-provider-json";
import { createServer } from "node:http";

test("real fetch aborts a stalled response body within the provider timeout", async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.write('{"results":[');
    // Deliberately never finish: headers alone cannot satisfy the timeout.
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const started = Date.now();
    await assert.rejects(
      requestGeocodioEvidence(
        "Public street, Rockwood, TN",
        secret,
        (_url, options) =>
          fetch(`http://127.0.0.1:${address.port}`, {
            ...options,
            headers: { accept: "application/json" },
          }),
      ),
      /Geographic delivery verification is unavailable/,
    );
    assert.ok(Date.now() - started < 10000);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("provider JSON rejects duplicate and escaped evidence keys without rejecting independent objects", () => {
  const bytes = (s: string) => new TextEncoder().encode(s);
  for (const body of [
    '{"results":[{},{}],"results":[{}]}',
    '{"results":[],"\\u0072esults":[{}]}',
    '{"results":[{"accuracy":0.5,"accuracy":1}]}',
    '{"a":{"x":1,"x":2}}',
  ])
    assert.throws(() => strictProviderJson(bytes(body)));
  const valid = {
    results: [{ accuracy: 1 }, { accuracy: 1 }],
    text: 'escaped " \\ , { }',
    nested: [[], { a: { a: 1 } }],
  };
  assert.deepEqual(strictProviderJson(bytes(JSON.stringify(valid))), valid);
});

test("transport rejects incomplete responses, deceptive media types and malformed UTF-8", async () => {
  for (const response of [
    new Response('{"results":[]}', {
      status: 206,
      headers: { "content-type": "application/json" },
    }),
    new Response('{"results":[]}', {
      status: 202,
      headers: { "content-type": "application/json" },
    }),
    new Response('{"results":[]}', {
      headers: { "content-type": "text/plain; note=application/json" },
    }),
    new Response(new Uint8Array([123, 34, 120, 34, 58, 34, 0xff, 34, 125]), {
      headers: { "content-type": "application/json" },
    }),
    new Response('{"results":[{},{}],"results":[{}]}', {
      headers: { "content-type": "application/json" },
    }),
  ]) {
    await assert.rejects(
      requestGeocodioEvidence(
        "Public street, Rockwood, TN",
        secret,
        async () => response,
      ),
      /Geographic delivery verification is unavailable/,
    );
  }
  assert.deepEqual(
    await requestGeocodioEvidence(
      "Public street, Rockwood, TN",
      secret,
      async () =>
        new Response('{"results":[]}', {
          headers: { "content-type": "Application/JSON; charset=utf-8" },
        }),
    ),
    { results: [] },
  );
});
const secret = "sensitive_test_key_never_echo";
const env = { GEOCODIO_API_KEY: secret };
const payload = (query: string) => {
  const unit = query.includes("Suite 1");
  const airport = query.includes("258 Rockwood");
  const boundary = query.includes("4314");
  const ambiguous = query.startsWith("Chamberlain");
  const number = unit ? "1070" : airport ? "258" : boundary ? "4314" : "110";
  const street = unit
    ? "N Gateway Ave"
    : airport
      ? "Rockwood Airport Dr"
      : boundary
        ? "Roane State Hwy"
        : "N Chamberlain Ave";
  const r = {
    accuracy: 1,
    accuracy_type: ambiguous ? "street_center" : "rooftop",
    match_type: ambiguous ? null : "building_centroid",
    address_components: {
      number,
      formatted_street: street,
      city: "Rockwood",
      state: "TN",
      zip: "37854",
      country: "US",
      ...(unit ? { unit_type: "Suite", unit_number: "1" } : {}),
    },
    location: { lng: -84.684, lat: airport ? 35.922333 : 35.865 },
    untrusted_provider_text: secret,
  };
  return { results: ambiguous ? [r, r] : [r], ignored_key: secret };
};
test("dry-run needs no key and cannot call any provider", async () => {
  const report = await runPublicAccuracy({
    env: {},
    fetcher: async () => {
      throw Error("must not call");
    },
  });
  assert.equal(report.mode, "dry_run");
  assert.equal(report.requestsMade, 0);
  assert.equal(report.cases.length, publicAccuracyCases.length);
  assert.equal(report.activationReady, false);
});
test("live public suite requires free-tier confirmation and a secret key without echoing values", async () => {
  let called = false;
  const fetcher: typeof fetch = async () => {
    called = true;
    throw Error("must not call");
  };
  await assert.rejects(
    runPublicAccuracy({ live: true, env, fetcher }),
    /Confirm free-tier/,
  );
  await assert.rejects(
    runPublicAccuracy({
      live: true,
      freeTierConfirmed: true,
      env: {},
      fetcher,
    }),
    /secret settings/,
  );
  assert.equal(called, false);
});
test("fixed public suite caps lookups, excludes unsupported ZIP and does not activate or expose provider text", async () => {
  const before = { ...process.env };
  let calls = 0;
  const report = await runPublicAccuracy({
    live: true,
    freeTierConfirmed: true,
    env,
    fetcher: async (url, init) => {
      calls++;
      const u = new URL(String(url));
      assert.equal(u.origin, "https://api.geocod.io");
      assert.equal(init?.redirect, "error");
      assert.equal(u.searchParams.has("api_key"), false);
      assert.equal(u.searchParams.get("country"), "US");
      assert.equal(u.searchParams.has("fields"), false);
      assert.equal(String(url).includes(secret), false);
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        `Bearer ${secret}`,
      );
      const q = u.searchParams.get("q")!;
      assert.ok(
        publicAccuracyCases.some((c) => q.startsWith(c.address.street1 + ", ")),
      );
      assert.equal(q.includes("276 Patton"), false);
      return Response.json(payload(q));
    },
  });
  assert.equal(calls, publicAccuracyRequestLimit);
  assert.equal(report.requestsMade, 5);
  assert.equal(
    report.cases.find((c) => c.id === "city-hall")?.status,
    "accepted_by_validator",
  );
  assert.equal(
    report.cases.find((c) => c.id === "public-office-unit")?.status,
    "accepted_by_validator",
  );
  assert.equal(
    report.cases.find((c) => c.id === "same-zip-outside-airport")?.status,
    "rejected_by_validator",
  );
  assert.equal(
    report.cases.find((c) => c.id === "unsupported-zip-college")?.status,
    "rejected_without_provider",
  );
  assert.equal(
    report.cases.find((c) => c.id === "ambiguous-public-street")?.status,
    "rejected_by_validator",
  );
  assert.equal(JSON.stringify(report).includes(secret), false);
  assert.equal(
    JSON.stringify(report).includes("untrusted_provider_text"),
    false,
  );
  assert.equal(report.activationReady, false);
  assert.equal(report.accuracyAcceptancePassed, false);
  assert.ok(
    JSON.stringify({ ...process.env }) === JSON.stringify(before),
    "Public runner must not mutate the process environment",
  );
  assert.equal(report.municipalEnforcementActivated, false);
  assert.ok(
    report.coverageGaps.includes("independent_public_building_ground_truth"),
  );
});
test("provider errors stop further lookups and never expose key, URL or raw error", async () => {
  let calls = 0;
  const report = await runPublicAccuracy({
    live: true,
    freeTierConfirmed: true,
    env,
    fetcher: async () => {
      calls++;
      throw Error("https://api.geocod.io/?api_key=" + secret);
    },
  });
  assert.equal(calls, 1);
  assert.equal(report.requestsMade, 1);
  assert.equal(report.cases[0].status, "provider_unavailable");
  assert.equal(JSON.stringify(report).includes(secret), false);
  assert.equal(report.activationReady, false);
});
test("shared transport rejects redirects, malformed JSON and oversized bodies without leaking evidence", async () => {
  for (const fetcher of [
    async () => new Response("", { status: 302 }),
    async () => new Response("secret error " + secret, { status: 401 }),
    async () =>
      new Response("{bad " + secret, {
        headers: { "content-type": "application/json" },
      }),
    async () =>
      new Response("x".repeat(262145), {
        headers: { "content-type": "application/json" },
      }),
  ]) {
    await assert.rejects(
      requestGeocodioEvidence("Public street, Rockwood, TN", secret, fetcher),
      (error) =>
        error instanceof Error &&
        !error.message.includes(secret) &&
        !error.message.includes("api_key"),
    );
  }
});

test("explicit test environment cannot fall back to another configured API key", async () => {
  const prior = process.env.GEOCODIO_API_KEY;
  process.env.GEOCODIO_API_KEY = secret;
  try {
    await assert.rejects(
      runPublicAccuracy({
        live: true,
        freeTierConfirmed: true,
        env: {},
        fetcher: async () => {
          throw Error("must not call");
        },
      }),
      /secret settings/,
    );
  } finally {
    if (prior === undefined) delete process.env.GEOCODIO_API_KEY;
    else process.env.GEOCODIO_API_KEY = prior;
  }
});
