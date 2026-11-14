import { boundarySha256 } from "../data/rockwood/boundary";
import { rockwoodPostalAddress } from "./delivery-area";
import {
  boundaryDistanceMeters,
  deliveryBoundaryGeometry,
  requestGeocodioEvidence,
  safelyInsideBoundary,
  validateGeocodioResult,
} from "./municipal-delivery";

// No custom address/file/URL input is supported. This suite cannot read customers,
// restaurants, orders or hosted settings and does not import database modules.
export const publicAccuracyCases = [
  {
    id: "city-hall",
    address: {
      street1: "110 North Chamberlain Avenue",
      city: "Rockwood",
      region: "TN",
      postalCode: "37854",
    },
    expected: "accept",
    source: "https://cityofrockwoodtn.gov/administrative-offices/",
  },
  {
    id: "public-office-unit",
    address: {
      street1: "1070 N Gateway Avenue",
      street2: "Suite 1",
      city: "Rockwood",
      region: "TN",
      postalCode: "37854",
    },
    expected: "accept",
    source:
      "https://safetysupport.tn.gov/hc/en-us/articles/51013024806291-Driver-Service-Locations",
  },
  {
    id: "same-zip-outside-airport",
    address: {
      street1: "258 Rockwood Airport Drive",
      city: "Rockwood",
      region: "TN",
      postalCode: "37854",
    },
    expected: "reject",
    source: "https://cityofrockwoodtn.gov/rockwood-municipal-airport/",
  },
  {
    id: "boundary-review-candidate",
    address: {
      street1: "4314 Roane State Hwy",
      city: "Rockwood",
      region: "TN",
      postalCode: "37854",
    },
    expected: "review",
    source:
      "https://www.tn.gov/agriculture/forests/state-forests/lone-mountain.html",
  },
  {
    id: "ambiguous-public-street",
    address: {
      street1: "Chamberlain Avenue",
      city: "Rockwood",
      region: "TN",
      postalCode: "37854",
    },
    expected: "reject",
    source: "https://cityofrockwoodtn.gov/administrative-offices/",
  },
  {
    id: "unsupported-zip-college",
    address: {
      street1: "276 Patton Lane",
      city: "Harriman",
      region: "TN",
      postalCode: "37748",
    },
    expected: "reject_without_provider",
    source: "https://www.roanestate.edu/",
  },
] as const;
export const publicAccuracyRequestLimit = 5;
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
function observations(evidence: unknown) {
  const results =
    object(evidence) && Array.isArray(evidence.results) ? evidence.results : [];
  return {
    resultCount: results.length,
    candidates: results.slice(0, 5).map((r) => {
      const row = object(r) ? r : {};
      const loc = object(row.location) ? row.location : {};
      const point =
        typeof loc.lng === "number" && typeof loc.lat === "number"
          ? [loc.lng, loc.lat]
          : null;
      const distance = point
        ? boundaryDistanceMeters(point, deliveryBoundaryGeometry)
        : null;
      return {
        accuracy:
          typeof row.accuracy === "number" &&
          Number.isFinite(row.accuracy) &&
          row.accuracy >= 0 &&
          row.accuracy <= 1
            ? row.accuracy
            : null,
        accuracyType:
          typeof row.accuracy_type === "string" &&
          [
            "rooftop",
            "point",
            "range_interpolation",
            "nearest_rooftop_match",
            "intersection",
            "street_center",
            "place",
            "county",
            "state",
          ].includes(row.accuracy_type)
            ? row.accuracy_type
            : "unknown",
        matchType:
          typeof row.match_type === "string" &&
          ["rooftop", "building_centroid", "unit", "parcel_centroid"].includes(
            row.match_type,
          )
            ? row.match_type
            : "unknown",
        insideBoundary: point
          ? safelyInsideBoundary(point, deliveryBoundaryGeometry, 0)
          : false,
        safelyInterior: point
          ? safelyInsideBoundary(point, deliveryBoundaryGeometry)
          : false,
        boundaryDistanceMeters:
          distance === null ? null : Math.round(distance * 10) / 10,
      };
    }),
  };
}
export async function runPublicAccuracy(
  options: {
    live?: boolean;
    freeTierConfirmed?: boolean;
    env?: NodeJS.ProcessEnv;
    fetcher?: typeof fetch;
  } = {},
) {
  const report = {
    provider: "geocodio",
    mode: options.live ? "real_provider" : "dry_run",
    boundarySha256,
    requestsMade: 0,
    maximumRequests: publicAccuracyRequestLimit,
    hostedSettingsChanged: false,
    municipalEnforcementActivated: false,
    financialOperationsPerformed: false,
    accuracyAcceptancePassed: false,
    activationReady: false,
    coverageGaps: [
      "independent_public_building_ground_truth",
      "owner_review_of_actual_provider_results",
    ],
    cases: [] as Record<string, unknown>[],
  };
  if (!options.live) {
    for (const c of publicAccuracyCases)
      report.cases.push({
        id: c.id,
        source: c.source,
        expected: c.expected,
        status: "not_run",
      });
    return report;
  }
  if (!options.freeTierConfirmed)
    throw new Error(
      "Confirm free-tier-only setup and at least five remaining free lookups before running.",
    );
  const apiKey = (options.env ?? process.env).GEOCODIO_API_KEY;
  if (!apiKey || !/^[a-zA-Z0-9_-]{16,200}$/.test(apiKey))
    throw new Error(
      "Configure GEOCODIO_API_KEY in the development environment secret settings. Never paste it in chat or pass it as a command argument.",
    );
  let stopped = false,
    realAmbiguity = false,
    nearBoundary = false;
  for (const c of publicAccuracyCases) {
    if (!rockwoodPostalAddress(c.address)) {
      report.cases.push({
        id: c.id,
        status: "rejected_without_provider",
        expectationMet: c.expected === "reject_without_provider",
      });
      continue;
    }
    if (stopped || report.requestsMade >= publicAccuracyRequestLimit) {
      report.cases.push({ id: c.id, status: "not_run_after_provider_failure" });
      continue;
    }
    const address: {
      street1: string;
      street2?: string;
      city: string;
      region: string;
      postalCode: string;
    } = c.address;
    const query = [
      address.street1,
      address.street2,
      address.city,
      address.region,
      address.postalCode,
      "US",
    ]
      .filter(Boolean)
      .join(", ");
    let evidence: unknown;
    try {
      report.requestsMade++;
      evidence = await requestGeocodioEvidence(query, apiKey, options.fetcher);
    } catch {
      report.cases.push({
        id: c.id,
        status: "provider_unavailable",
        expectationMet: false,
      });
      stopped = true;
      continue;
    }
    let accepted = false;
    try {
      validateGeocodioResult(evidence, c.address);
      accepted = true;
    } catch {}
    const details = observations(evidence);
    realAmbiguity ||= details.resultCount > 1;
    nearBoundary ||= details.candidates.some(
      (p) =>
        p.boundaryDistanceMeters !== null && p.boundaryDistanceMeters <= 30,
    );
    report.cases.push({
      id: c.id,
      status: accepted ? "accepted_by_validator" : "rejected_by_validator",
      expected: c.expected,
      expectationMet:
        c.expected === "review"
          ? null
          : c.expected === "accept"
            ? accepted
            : !accepted,
      ...details,
    });
  }
  if (!realAmbiguity)
    report.coverageGaps.push("real_ambiguous_result_not_observed");
  if (!nearBoundary)
    report.coverageGaps.push("real_near_boundary_candidate_not_observed");
  // No provider text, formatted/matched address, raw payload, key or exception may
  // escape. Owner must inspect full results securely in their Geocodio dashboard.
  if (JSON.stringify(report).includes(apiKey))
    throw new Error("Report suppressed by secret-protection check.");
  return report;
}
