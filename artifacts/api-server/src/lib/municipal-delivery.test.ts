import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createMunicipalValidator,
  validateGeocodioResult,
  safelyInsideBoundary,
  municipalConfiguration,
  geographicReadiness,
  requireLaunchServiceArea,
  type Geometry,
} from "./municipal-delivery";
import { boundaryGeometry, boundarySha256 } from "../data/rockwood/boundary";
const square: Geometry = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
    [
      [0.4, 0.4],
      [0.6, 0.4],
      [0.6, 0.6],
      [0.4, 0.6],
      [0.4, 0.4],
    ],
  ],
};
const address = {
  street1: "101 Main Street",
  city: "Rockwood",
  region: "TN",
  postalCode: "37854",
};
// Coordinates are geometry test points, not geocoded customer addresses.
const result = {
  accuracy: 1,
  accuracy_type: "rooftop",
  match_type: "building_centroid",
  address_components: {
    number: "101",
    formatted_street: "Main St",
    city: "Rockwood",
    state: "TN",
    zip: "37854",
    country: "US",
  },
  location: { lng: -84.684, lat: 35.865 },
};
const evidence = () => ({ results: [structuredClone(result)] });
const env = {
  ROCOEATS_DELIVERY_AREA_MODE: "municipal",
  ROCOEATS_APPROVED_BOUNDARY_SHA256: boundarySha256,
  ROCOEATS_GEOCODING_PROVIDER: "geocodio",
  GEOCODIO_API_KEY: "test_key_not_a_real_credential",
};
const response = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
test("polygon holes, exterior, exact edges and uncertain edge buffer fail closed", () => {
  assert.ok(safelyInsideBoundary([0.2, 0.2], square));
  for (const p of [
    [2, 2],
    [0.5, 0.5],
    [0, 0.2],
    [0.0001, 0.2],
    [NaN, 0.2],
    [Infinity, 2],
    [0.2],
  ])
    assert.equal(safelyInsideBoundary(p, square), false);
  assert.equal(safelyInsideBoundary([0.4001, 0.3], square), true);
  assert.equal(safelyInsideBoundary([0.3999, 0.5], square), false);
  const multi: Geometry = {
    type: "MultiPolygon",
    coordinates: [
      square.coordinates,
      [
        [
          [2, 2],
          [3, 2],
          [3, 3],
          [2, 3],
          [2, 2],
        ],
      ],
    ],
  };
  assert.ok(safelyInsideBoundary([2.5, 2.5], multi));
  assert.equal(safelyInsideBoundary([1.5, 1.5], multi), false);
});
test("pinned state geometry hash and actual Rockwood exclusion ring are preserved", () => {
  assert.equal(
    createHash("sha256").update(JSON.stringify(boundaryGeometry)).digest("hex"),
    boundarySha256,
  );
  assert.ok(
    safelyInsideBoundary(
      [result.location.lng, result.location.lat],
      boundaryGeometry,
    ),
  );
  assert.equal(safelyInsideBoundary([-84.56, 35.88], boundaryGeometry), false);
  assert.ok(
    boundaryGeometry.coordinates.length > 1,
    "official geometry contains excluded territory",
  );
  const hole = boundaryGeometry.coordinates[1];
  // Find a point inside the irregular official hole without assuming its centroid lies inside.
  const xs = hole.map((p) => p[0]),
    ys = hole.map((p) => p[1]);
  let exclusion: number[] | undefined;
  const holeGeometry: Geometry = { type: "Polygon", coordinates: [hole] };
  for (let x = 0; x < 20 && !exclusion; x++)
    for (let y = 0; y < 20 && !exclusion; y++) {
      const p = [
        Math.min(...xs) +
          ((Math.max(...xs) - Math.min(...xs)) * (x + 0.5)) / 20,
        Math.min(...ys) +
          ((Math.max(...ys) - Math.min(...ys)) * (y + 0.5)) / 20,
      ];
      if (safelyInsideBoundary(p, holeGeometry, 0)) exclusion = p;
    }
  assert.ok(exclusion);
  assert.equal(safelyInsideBoundary(exclusion, boundaryGeometry), false);
});
test("only approved exact street rooftop evidence inside city and ZIP is accepted", () => {
  assert.ok(validateGeocodioResult(evidence(), address));
  assert.ok(
    validateGeocodioResult(evidence(), { ...address, street1: "101 Main St." }),
  );
  for (const patch of [
    { accuracy: 0.99 },
    { accuracy: NaN },
    { accuracy_type: "range_interpolation" },
    { accuracy_type: "nearest_rooftop_match" },
    { match_type: null },
    { match_type: "parcel_centroid" },
    { location: { lng: -84.56, lat: 35.88 } },
    { location: { lng: "-84.684", lat: 35.865 } },
  ]) {
    const data = evidence();
    Object.assign(data.results[0], patch);
    assert.throws(
      () => validateGeocodioResult(data, address),
      /cannot be verified/,
    );
  }
  for (const patch of [
    { number: "103" },
    { formatted_street: "Other St" },
    { state: "KY" },
    { city: "Kingston" },
    { zip: "37763" },
    { zip: 37854 },
    { zip: "37854junk" },
    { country: "CA" },
  ]) {
    const data = evidence();
    Object.assign(data.results[0].address_components, patch);
    assert.throws(() => validateGeocodioResult(data, address));
  }
  for (const data of [null, {}, { results: [] }, { results: [result, result] }])
    assert.throws(() => validateGeocodioResult(data, address));
  assert.throws(() =>
    validateGeocodioResult(evidence(), {
      ...address,
      street1: "999 False Road",
      longitude: -84.684,
      latitude: 35.865,
    } as typeof address),
  );
  assert.throws(() =>
    validateGeocodioResult(evidence(), { ...address, street2: "Unit 4" }),
  );
});
test("unapproved, unknown, missing provider/key configurations never call a provider", async () => {
  assert.deepEqual(municipalConfiguration({}), {
    mode: "provisional_postal",
    approved: false,
  });
  let calls = 0;
  const validate = createMunicipalValidator(async () => {
    calls++;
    return response(evidence());
  });
  for (const patch of [
    { ROCOEATS_APPROVED_BOUNDARY_SHA256: "unapproved" },
    { ROCOEATS_GEOCODING_PROVIDER: "other" },
    { GEOCODIO_API_KEY: "" },
    { ROCOEATS_DELIVERY_AREA_MODE: "false" },
    { ROCOEATS_DELIVERY_AREA_MODE: "provisional_postal" },
  ])
    await assert.rejects(
      validate(address, { ...env, ...patch }),
      /unavailable/,
    );
  assert.equal(calls, 0);
});
test("provider request uses only saved address, ignores coordinates and binds cache to full address", async () => {
  let calls = 0;
  let now = 1000;
  const validate = createMunicipalValidator(
    async (url, options) => {
      calls++;
      const parsed = new URL(String(url));
      assert.equal(parsed.origin, "https://api.geocod.io");
      assert.equal(parsed.pathname, "/v1.11/geocode");
      assert.equal(options?.redirect, "error");
      assert.ok(options?.signal);
      assert.match(
        parsed.searchParams.get("q")!,
        /^101 Main Street, Rockwood, TN, 37854, US$/,
      );
      assert.equal(parsed.searchParams.has("lat"), false);
      return response(evidence());
    },
    () => now,
  );
  await validate(
    { ...address, latitude: 0, longitude: 0 } as typeof address,
    env,
  );
  await validate(address, env);
  assert.equal(calls, 1);
  now += 300001;
  await validate(address, env);
  assert.equal(calls, 2);
  await assert.rejects(
    validate({ ...address, street1: "https://attacker.invalid" }, env),
  );
  assert.equal(calls, 2);
  await assert.rejects(
    validate({ ...address, street1: "101 Main Street\nOther" }, env),
  );
  assert.equal(calls, 2);
  // Address edits cannot reuse a previous successful verification.
  await assert.rejects(
    validate({ ...address, street1: "999 Other Street" }, env),
  );
  assert.equal(calls, 3);
});
test("network timeout, rate/quota errors, redirects, bad JSON, oversized or ambiguous results fail closed without evidence caching", async () => {
  for (const send of [
    async () => {
      throw new Error("secret provider URL");
    },
    async () => new Response("", { status: 429 }),
    async () => new Response("", { status: 500 }),
    async () =>
      new Response("not json", {
        headers: { "content-type": "application/json" },
      }),
    async () =>
      new Response("x".repeat(262145), {
        headers: { "content-type": "application/json" },
      }),
    async () => response({ results: [result, result] }),
    async () =>
      new Response("html", { headers: { "content-type": "text/html" } }),
  ]) {
    const validate = createMunicipalValidator(send);
    await assert.rejects(validate(address, env));
    await assert.rejects(validate(address, env));
  }
});
test("postal checks run before geocoding and public production cannot use provisional approval", async () => {
  const prior = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    process.env.ROCOEATS_ORDERING_ENABLED = "true";
    delete process.env.ROCOEATS_DELIVERY_AREA_MODE;
    await assert.rejects(
      requireLaunchServiceArea(address, address, ["37854"]),
      /unavailable/,
    );
    await assert.rejects(
      requireLaunchServiceArea(address, { ...address, postalCode: "37763" }, [
        "37854",
      ]),
      /limited to Rockwood/,
    );
  } finally {
    process.env = prior;
  }
});

test("adapter validates locality itself before any provider request or cache use", async () => {
  let calls = 0;
  const validate = createMunicipalValidator(async () => {
    calls++;
    return response(evidence());
  });
  for (const patch of [
    { city: "Kingston" },
    { region: "KY" },
    { postalCode: "37763" },
    { city: null },
    { postalCode: 37854 },
  ]) {
    await assert.rejects(
      validate({ ...address, ...patch }, env),
      /cannot be verified/,
    );
    assert.throws(
      () => validateGeocodioResult(evidence(), { ...address, ...patch }),
      /cannot be verified/,
    );
  }
  assert.equal(calls, 0);
  await validate(address, env);
  await assert.rejects(validate({ ...address, city: "Kingston" }, env));
  assert.equal(calls, 1);
});
test("concurrent identical lookups share immutable evidence and snapshot mutable input", async () => {
  let calls = 0,
    release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const validate = createMunicipalValidator(async () => {
    calls++;
    await wait;
    return response(evidence());
  });
  const mutable = { ...address };
  const first = validate(mutable, env);
  const second = validate(address, env);
  mutable.street1 = "999 Changed Street";
  assert.equal(calls, 1);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.deepEqual(a, b);
  assert.ok(Object.isFrozen(a));
  assert.equal(Reflect.set(a, "latitude", 0), false);
  assert.equal((await validate(address, env)).latitude, result.location.lat);
  assert.equal(calls, 1);
});
test("concurrent provider work is bounded, rejected lookups release slots, and failures are not cached", async () => {
  let calls = 0,
    release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const validate = createMunicipalValidator(async () => {
    calls++;
    await wait;
    throw new Error("provider secret error");
  });
  const jobs = Array.from({ length: 8 }, (_, i) =>
    validate(address, { ...env, GEOCODIO_API_KEY: env.GEOCODIO_API_KEY + i }),
  );
  const settled = Promise.allSettled(jobs);
  await assert.rejects(
    validate(address, {
      ...env,
      GEOCODIO_API_KEY: env.GEOCODIO_API_KEY + "overflow",
    }),
    /unavailable/,
  );
  assert.equal(calls, 8);
  release();
  assert.ok((await settled).every((r) => r.status === "rejected"));
  await assert.rejects(validate(address, env), /unavailable/);
  assert.equal(calls, 9);
});
test("geographic readiness names missing settings without echoing values or implying provider acceptance", () => {
  assert.deepEqual(geographicReadiness({}), {
    mode: "provisional_postal",
    configurationReady: true,
    municipalConfigurationReady: false,
    municipalEnforcementEnabled: false,
    missingConfiguration: [],
  });
  const missing = geographicReadiness({
    ROCOEATS_DELIVERY_AREA_MODE: "municipal",
    GEOCODIO_API_KEY: "sensitive invalid key",
  });
  assert.equal(missing.configurationReady, false);
  assert.equal(missing.municipalConfigurationReady, false);
  assert.deepEqual(missing.missingConfiguration, [
    "ROCOEATS_APPROVED_BOUNDARY_SHA256",
    "ROCOEATS_GEOCODING_PROVIDER",
    "GEOCODIO_API_KEY",
  ]);
  assert.equal(
    JSON.stringify(missing).includes("sensitive invalid key"),
    false,
  );
  assert.equal(
    geographicReadiness({ ...env }).municipalEnforcementEnabled,
    true,
  );
  const invalid = geographicReadiness({
    ROCOEATS_DELIVERY_AREA_MODE: "sensitive misconfigured value",
  });
  assert.equal(invalid.mode, "invalid");
  assert.equal(invalid.configurationReady, false);
  assert.equal(
    JSON.stringify(invalid).includes("sensitive misconfigured value"),
    false,
  );
  const publicLaunch = geographicReadiness({
    NODE_ENV: "production",
    ROCOEATS_ORDERING_ENABLED: "true",
  });
  assert.equal(publicLaunch.configurationReady, false);
  assert.ok(
    publicLaunch.missingConfiguration.includes("ROCOEATS_DELIVERY_AREA_MODE"),
  );
});

test("malformed provider address fields cannot gain approval through string coercion", () => {
  const check = (patch: Record<string, unknown>) => {
    const data = evidence();
    Object.assign(data.results[0].address_components, patch);
    assert.throws(
      () => validateGeocodioResult(data, address),
      /cannot be verified/,
    );
  };
  for (const patch of [
    { number: ["101"] },
    { number: 101 },
    { formatted_street: ["Main St"] },
    { unit_type: 0 },
    { unit_number: ["4"] },
  ])
    check(patch);
  const validUnit = evidence();
  Object.assign(validUnit.results[0].address_components, {
    unit_type: "Unit",
    unit_number: "4",
  });
  assert.ok(
    validateGeocodioResult(validUnit, { ...address, street2: "Unit 4" }),
  );
  const malformedUnit = structuredClone(validUnit);
  Object.assign(malformedUnit.results[0].address_components, {
    unit_type: ["Unit"],
    unit_number: ["4"],
  });
  assert.throws(
    () =>
      validateGeocodioResult(malformedUnit, { ...address, street2: "Unit 4" }),
    /cannot be verified/,
  );
});

test("rolling minute and UTC daily budgets count failed calls and fail closed without provider I/O", async () => {
  let calls = 0,
    time = 0;
  const settings = { perMinute: 2, perUtcDay: 3 };
  const validate = createMunicipalValidator(
    async () => {
      calls++;
      return new Response("", { status: 429 });
    },
    () => time,
    settings,
  );
  settings.perMinute = 30;
  settings.perUtcDay = 500; // Caller mutation cannot lift limits.
  await assert.rejects(validate(address, env));
  await assert.rejects(validate(address, env));
  await assert.rejects(validate(address, env));
  assert.equal(calls, 2);
  time = 60000;
  await assert.rejects(validate(address, env));
  assert.equal(calls, 3);
  time = 120000;
  await assert.rejects(validate(address, env));
  assert.equal(calls, 3);
  time = 86400000;
  await assert.rejects(validate(address, env));
  assert.equal(calls, 4);
  time = 86399999;
  await assert.rejects(validate(address, env));
  assert.equal(calls, 4);
});
test("cache and shared in-flight evidence remain usable when provider budget is exhausted", async () => {
  let calls = 0,
    release!: () => void;
  const wait = new Promise<void>((r) => {
    release = r;
  });
  const validate = createMunicipalValidator(
    async () => {
      calls++;
      await wait;
      return response(evidence());
    },
    () => 1000,
    { perMinute: 1, perUtcDay: 1 },
  );
  const first = validate(address, env),
    second = validate(address, env);
  assert.equal(calls, 1);
  release();
  await Promise.all([first, second]);
  await validate(address, env);
  assert.equal(calls, 1);
  await assert.rejects(
    validate({ ...address, street1: "999 Other Street" }, env),
  );
  assert.equal(calls, 1);
  for (const budget of [
    { perMinute: 0, perUtcDay: 1 },
    { perMinute: 31, perUtcDay: 1 },
    { perMinute: 1, perUtcDay: 501 },
    { perMinute: NaN, perUtcDay: 1 },
  ])
    assert.throws(
      () => createMunicipalValidator(fetch, Date.now, budget),
      /Invalid geocoding request budget/,
    );
});

test("invalid provider budget clocks never perform network requests", async () => {
  let calls = 0;
  for (const time of [NaN, Infinity, -1, 0.5]) {
    const validate = createMunicipalValidator(
      async () => {
        calls++;
        return response(evidence());
      },
      () => time,
    );
    await assert.rejects(validate(address, env), /unavailable/);
  }
  assert.equal(calls, 0);
});
