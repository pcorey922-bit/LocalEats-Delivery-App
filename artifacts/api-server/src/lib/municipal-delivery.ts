import { createHash } from "node:crypto";
import { CommerceError } from "./commerce-policy";
import { boundaryGeometry, boundarySha256 } from "../data/rockwood/boundary";
import {
  requireLaunchDeliveryArea,
  rockwoodPostalAddress,
} from "./delivery-area";

export type DeliveryAddress = {
  street1?: unknown;
  street2?: unknown;
  city?: unknown;
  region?: unknown;
  postalCode?: unknown;
};
type Point = readonly number[];
type Polygon = readonly (readonly Point[])[];
export type Geometry =
  | { type: "Polygon"; coordinates: Polygon }
  | { type: "MultiPolygon"; coordinates: readonly Polygon[] };
// The approved source has a pinched exclusion ring: two holes touch at one
// repeated vertex. Split only at existing identical vertices, preserving every
// directed edge and the full footprint. Never move, buffer or union a boundary.
function splitTouchingHole(ring: readonly Point[]): Polygon {
  const active: Point[] = [],
    positions = new Map<string, number>();
  const loops: Point[][] = [];
  for (const point of ring) {
    const key = `${point[0]},${point[1]}`,
      index = positions.get(key);
    if (index === undefined) {
      positions.set(key, active.length);
      active.push(point);
      continue;
    }
    const loop = [...active.slice(index), point];
    if (loop.length < 4)
      throw new Error("Unsupported degenerate boundary exclusion");
    loops.push(loop);
    for (const removed of active.slice(index + 1))
      positions.delete(`${removed[0]},${removed[1]}`);
    active.length = index + 1;
  }
  if (active.length !== 1 || !loops.length)
    throw new Error("Boundary exclusion must be closed");
  return loops;
}
export const deliveryBoundaryGeometry = {
  type: "Polygon",
  coordinates: [
    boundaryGeometry.coordinates[0],
    ...boundaryGeometry.coordinates.slice(1).flatMap(splitTouchingHole),
  ],
} as const;

const unavailable = () =>
  new CommerceError(
    503,
    "Geographic delivery verification is unavailable. Please try later or contact operations.",
  );
const ineligible = () =>
  new CommerceError(
    409,
    "This address cannot be verified inside the approved Rockwood delivery area. Contact operations for review.",
  );

// Local distance projection is conservative for this small Tennessee service area.
function segmentDistance(point: Point, a: Point, b: Point) {
  const scaleX = 110000 * Math.cos((point[1] * Math.PI) / 180),
    scaleY = 110000;
  const ax = (a[0] - point[0]) * scaleX,
    ay = (a[1] - point[1]) * scaleY;
  const bx = (b[0] - point[0]) * scaleX,
    by = (b[1] - point[1]) * scaleY;
  const dx = bx - ax,
    dy = by - ay,
    length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length))
    : 0;
  return Math.hypot(ax + t * dx, ay + t * dy);
}
export function boundaryDistanceMeters(point: Point, geometry: Geometry) {
  if (
    point.length !== 2 ||
    !point.every(Number.isFinite) ||
    Math.abs(point[0]) > 180 ||
    Math.abs(point[1]) > 90
  )
    return null;
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let distance = Infinity;
  for (const polygon of polygons)
    for (const ring of polygon)
      for (let i = 0; i < ring.length; i++)
        distance = Math.min(
          distance,
          segmentDistance(point, ring[i], ring[(i + 1) % ring.length]),
        );
  return Number.isFinite(distance) ? distance : null;
}
function insideRing(point: Point, ring: readonly Point[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
export function safelyInsideBoundary(
  point: Point,
  geometry: Geometry,
  marginMeters = 30,
) {
  if (
    point.length !== 2 ||
    !point.every(Number.isFinite) ||
    Math.abs(point[0]) > 180 ||
    Math.abs(point[1]) > 90 ||
    marginMeters < 0
  )
    return false;
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(
    (polygon) =>
      polygon.length > 0 &&
      insideRing(point, polygon[0]) &&
      !polygon.slice(1).some((ring) => insideRing(point, ring)) &&
      polygon.every((ring) =>
        ring.every(
          (a, i) =>
            segmentDistance(point, a, ring[(i + 1) % ring.length]) >
            marginMeters,
        ),
      ),
  );
}
const canonical = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ")
    : "";
const street = (value: unknown) =>
  canonical(value).replace(
    /\b(st|rd|ave|blvd|dr|ln|ct|hwy|pkwy|n|s|e|w)\b/g,
    (word) =>
      ({
        st: "street",
        rd: "road",
        ave: "avenue",
        blvd: "boulevard",
        dr: "drive",
        ln: "lane",
        ct: "court",
        hwy: "highway",
        pkwy: "parkway",
        n: "north",
        s: "south",
        e: "east",
        w: "west",
      })[word]!,
  );
function inputAddress(address: DeliveryAddress) {
  if (!rockwoodPostalAddress(address)) throw ineligible();
  if (
    typeof address.street1 !== "string" ||
    !/^\d+[a-z]?\s+[a-z0-9]/i.test(address.street1.trim()) ||
    address.street1.length > 180 ||
    /[\r\n\x00]/.test(address.street1)
  )
    throw ineligible();
  if (
    address.street2 != null &&
    (typeof address.street2 !== "string" ||
      address.street2.length > 180 ||
      /[\r\n\x00]/.test(address.street2))
  )
    throw ineligible();
  return {
    street1: address.street1.trim(),
    street2: typeof address.street2 === "string" ? address.street2.trim() : "",
    city: "Rockwood",
    state: "TN",
    postal_code: String(address.postalCode).trim(),
    country: "US",
  };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function validateGeocodioResult(
  data: unknown,
  address: DeliveryAddress,
  geometry: Geometry = deliveryBoundaryGeometry,
) {
  inputAddress(address);
  const results = isRecord(data) ? data.results : undefined;
  // Do not silently select the first candidate from ambiguous provider results.
  if (!Array.isArray(results) || results.length !== 1) throw ineligible();
  const result: unknown = results[0];
  if (
    !isRecord(result) ||
    !isRecord(result.address_components) ||
    !isRecord(result.location)
  )
    throw ineligible();
  const components = result.address_components;
  if (
    typeof components.number !== "string" ||
    !components.number.trim() ||
    typeof components.formatted_street !== "string" ||
    !components.formatted_street.trim() ||
    (components.unit_type != null &&
      typeof components.unit_type !== "string") ||
    (components.unit_number != null &&
      typeof components.unit_number !== "string") ||
    typeof result.match_type !== "string" ||
    result.accuracy !== 1 ||
    result.accuracy_type !== "rooftop" ||
    !["rooftop", "building_centroid", "unit"].includes(result.match_type) ||
    canonical(components.country) !== "us" ||
    canonical(components.state) !== "tn" ||
    canonical(components.city) !== "rockwood" ||
    typeof components.zip !== "string" ||
    !/^37854(?:-\d{4})?$/.test(components.zip ?? "") ||
    street(
      `${components.number ?? ""} ${components.formatted_street ?? ""}`,
    ) !== street(address.street1)
  )
    throw ineligible();
  const unit = canonical(address.street2);
  if (
    unit &&
    canonical(
      `${components.unit_type ?? ""} ${components.unit_number ?? ""}`,
    ).replace(/^apt |^ste |^suite |^unit |^#\s*/, "") !==
      unit.replace(/^apt |^ste |^suite |^unit |^#\s*/, "")
  )
    throw ineligible();
  const { lng, lat } = result.location;
  if (
    typeof lng !== "number" ||
    typeof lat !== "number" ||
    !safelyInsideBoundary([lng, lat], geometry)
  )
    throw ineligible();
  return { longitude: lng, latitude: lat, boundarySha256 };
}
export function geographicReadiness(env = process.env) {
  const mode = env.ROCOEATS_DELIVERY_AREA_MODE ?? "provisional_postal";
  const missingConfiguration: string[] = [];
  const publicApprovalRequired =
    env.NODE_ENV === "production" && env.ROCOEATS_ORDERING_ENABLED === "true";
  if (mode !== "municipal" && mode !== "provisional_postal")
    missingConfiguration.push("ROCOEATS_DELIVERY_AREA_MODE");
  if (mode === "municipal" || publicApprovalRequired) {
    if (mode !== "municipal" && !missingConfiguration.length)
      missingConfiguration.push("ROCOEATS_DELIVERY_AREA_MODE");
    if (env.ROCOEATS_APPROVED_BOUNDARY_SHA256 !== boundarySha256)
      missingConfiguration.push("ROCOEATS_APPROVED_BOUNDARY_SHA256");
    if (env.ROCOEATS_GEOCODING_PROVIDER !== "geocodio")
      missingConfiguration.push("ROCOEATS_GEOCODING_PROVIDER");
    if (!/^[a-zA-Z0-9_-]{16,200}$/.test(env.GEOCODIO_API_KEY ?? ""))
      missingConfiguration.push("GEOCODIO_API_KEY");
  }
  const municipalConfigurationReady =
    mode === "municipal" && missingConfiguration.length === 0;
  return {
    mode:
      mode === "municipal" || mode === "provisional_postal" ? mode : "invalid",
    configurationReady: missingConfiguration.length === 0,
    municipalConfigurationReady,
    municipalEnforcementEnabled: municipalConfigurationReady,
    missingConfiguration,
  };
}
export function municipalConfiguration(env = process.env) {
  const state = geographicReadiness(env);
  if (!state.configurationReady) throw unavailable();
  return { mode: state.mode, approved: state.municipalConfigurationReady };
}
// Fixed-origin transport shared with the public-only acceptance runner. Never log
// the request URL, API key, response body or provider exception.
export async function requestGeocodioEvidence(
  query: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  if (
    !/^[a-zA-Z0-9_-]{16,200}$/.test(apiKey) ||
    !query.trim() ||
    query.length > 600 ||
    /[\r\n\x00]/.test(query)
  )
    throw unavailable();
  const url = new URL("https://api.geocod.io/v1.11/geocode");
  url.searchParams.set("q", query);
  url.searchParams.set("country", "US"); // Rockwood-only; never request paid/non-US coverage.
  try {
    const response = await fetcher(url, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("application/json")
    ) {
      await response.body?.cancel();
      throw unavailable();
    }
    const reader = response.body?.getReader();
    if (!reader) throw unavailable();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 262144) {
        await reader.cancel();
        throw unavailable();
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw unavailable();
  }
}

export const geocodingRequestBudget = Object.freeze({
  perMinute: 30,
  perUtcDay: 500,
} as const);

export function createMunicipalValidator(
  fetcher: typeof fetch = (...args) => fetch(...args),
  now = () => Date.now(),
  budget: { perMinute: number; perUtcDay: number } = geocodingRequestBudget,
) {
  if (
    !Number.isInteger(budget.perMinute) ||
    budget.perMinute < 1 ||
    budget.perMinute > geocodingRequestBudget.perMinute ||
    !Number.isInteger(budget.perUtcDay) ||
    budget.perUtcDay < 1 ||
    budget.perUtcDay > geocodingRequestBudget.perUtcDay
  )
    throw new Error("Invalid geocoding request budget");
  const { perMinute, perUtcDay } = budget;
  let minuteRequests: number[] = [];
  let day = -1,
    dayRequests = 0,
    lastTime = -Infinity;
  const cache = new Map<
    string,
    { expires: number; value: ReturnType<typeof validateGeocodioResult> }
  >();
  const pending = new Map<
    string,
    Promise<ReturnType<typeof validateGeocodioResult>>
  >();
  return async (address: DeliveryAddress, env = process.env) => {
    const input = inputAddress(address);
    const verifiedAddress: DeliveryAddress = {
      street1: input.street1,
      street2: input.street2,
      city: input.city,
      region: input.state,
      postalCode: input.postal_code,
    };
    const config = municipalConfiguration(env);
    if (!config.approved) throw unavailable();
    const key = createHash("sha256")
      .update(JSON.stringify([input, boundarySha256, env.GEOCODIO_API_KEY]))
      .digest("hex");
    const time = now();
    if (!Number.isSafeInteger(time) || time < 0 || time < lastTime)
      throw unavailable();
    lastTime = time;
    const saved = cache.get(key);
    if (saved && saved.expires > time) return saved.value;
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= 8) throw unavailable();
    const utcDay = Math.floor(time / 86400000);
    if (utcDay !== day) {
      day = utcDay;
      dayRequests = 0;
    }
    minuteRequests = minuteRequests.filter((start) => start > time - 60000);
    if (dayRequests >= perUtcDay || minuteRequests.length >= perMinute)
      throw unavailable();
    minuteRequests.push(time);
    dayRequests++; // Count failed/ambiguous attempts too; retries must not bypass quotas.
    const lookup = async () => {
      try {
        const evidence = await requestGeocodioEvidence(
          [
            input.street1,
            input.street2,
            input.city,
            input.state,
            input.postal_code,
            input.country,
          ]
            .filter(Boolean)
            .join(", "),
          env.GEOCODIO_API_KEY!,
          fetcher,
        );
        const value = Object.freeze(
          validateGeocodioResult(evidence, verifiedAddress),
        );
        if (cache.size >= 256) cache.delete(cache.keys().next().value!);
        cache.set(key, { expires: time + 300000, value });
        return value;
      } catch (error) {
        if (error instanceof CommerceError) throw error;
        throw unavailable();
      }
    };
    const promise = lookup();
    pending.set(key, promise);
    try {
      return await promise;
    } finally {
      pending.delete(key);
    }
  };
}
const validateAddress = createMunicipalValidator();
export async function requireLaunchServiceArea(
  restaurant: DeliveryAddress | null | undefined,
  address: DeliveryAddress | null | undefined,
  configuredPostalCodes: readonly string[],
) {
  requireLaunchDeliveryArea(restaurant, address, configuredPostalCodes);
  const config = municipalConfiguration();
  if (!config.approved) {
    // A provisional test configuration must never become a public-launch bypass.
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ROCOEATS_ORDERING_ENABLED === "true"
    )
      throw unavailable();
    return;
  }
  await validateAddress(restaurant!);
  await validateAddress(address!);
}
