# Rockwood delivery boundary proposal

Status: **candidate only, not approved, deployed or activated**. Public ordering,
private ordering and live charges remain closed. No hosted settings or records
have changed. The completed $19.19 test order and reconciliation safeguards are
outside this change.

Open [phone-friendly review](index.html) or [full-size map](rockwood-proposal.svg).
The map is offline and makes no geocoding, tile, analytics or account requests.
Named road context comes from public Census TIGERweb transportation layers
(January 1, 2026); those roads are not delivery or navigation evidence.
Gold is the intersection of the municipal polygon and a Census ZCTA *reference*,
not an authoritative USPS ZIP delivery polygon. Actual eligibility requires both
the approved municipality and a provider-verified ZIP of 37854. ZIP alone never
establishes city membership. Geographic data does not prove a customer's right to
receive delivery at an address; existing account/ownership authorization remains.

## Official source and version

- Tennessee Comptroller [municipal boundaries](https://comptroller.tn.gov/office-functions/pa/gisredistricting/municipal-boundaries.html)
  links the [maintained dashboard](https://tn-cot.maps.arcgis.com/apps/dashboards/cc2701dd6ef2463ab7944e62120d9b9e).
- Dashboard map item `f155e093a5ec4d1db1d157e653d5bd91` references service item
  `432a7396947245d8acb98d9d2cba292b`, owner `Ned.Phillips_TN_COT`.
- [Service](https://services2.arcgis.com/63Ka7QbNqm4NLbeo/arcgis/rest/services/Comptroller_Cities/FeatureServer):
  layer 2 `City Limits Base`, Rockwood object 269, WGS84 export, no simplification.
  Layer 1 Rockwood records 180, 740 and 741 are archived as change references;
  they are not blindly added again to the current base polygon. The base's stored
  area equals the three inclusion records' combined stored area within rounding.
- Item first published **2025-05-06 17:09:59 UTC**; item last modified
  **2026-11-03 12:48:53 UTC**. Base data edit **2026-11-03 12:48:43.314 UTC**.
  These are statewide item/layer dates, not proof of a Rockwood-specific legal
  effective date. The source does not publish a separate semantic release number.
- Pinned local version `TN-COT-432a7396947245d8acb98d9d2cba292b-layer2-269-20261103`.
- Geometry SHA-256 `e1ebc348ed9cc92ffe8ba8ba0d00873486c9fec851233d4190daad3538289d1f`.
- Raw base/change exports and timestamps, hashes and original state disclaimer:
  [provenance](../../artifacts/api-server/src/data/rockwood/provenance.json).
  This is the latest accessible state dashboard snapshot retrieved during this
  review; it is not a legal survey or certification of unreported annexations.
- ZCTA: [Census reference layer](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1),
  2020 Census ZIP Code Tabulation Area 37854, shown only for context. It is not
  automatically enforced as a USPS ZIP polygon or used to broaden the municipality.

The state says the data is municipality-reported, informational, can have errors,
and does not establish legal municipal lines. Owner review against known streets
and city records is required. No boundary refresh or annexation is auto-approved.
Rebuild the map from pinned files with `node scripts/build-delivery-area-review.mjs`.

## Provider recommendation — evaluation still required

Recommend evaluating **Geocodio** with public or separately authorized test
addresses. [Free tier](https://www.geocod.io/free-geocoding): 2,500 daily lookups,
no credit card. [Terms](https://www.geocod.io/terms-of-use) permit point-in-polygon
use and storage for US results. Verify the current terms at account creation;
leave payment methods/paid credits absent. No account or provider calls have been
made by this change. No customer addresses have been transmitted.

The adapter uses the documented fixed HTTPS `/v1.11/geocode` endpoint. It sends
only address components, including unit, never account names, instructions,
phone numbers, coordinates, card data or order details. API key stays server-side;
redirects are refused. Exceptions never expose request URLs, keys or bodies.
Results are checked against saved street, city, state, country and ZIP. Only one
accuracy-1 rooftop result with a known building/rooftop/unit match is accepted.
Parcel centroids, neighboring rooftops, interpolations, city/ZIP centroids,
multiple candidates and unknown precision fail closed. Unit mismatch also blocks.
See provider [accuracy documentation](https://www.geocod.io/guides/accuracy-types-scores)
and [API reference](https://www.geocod.io/docs/).

These conservative rules can reject valid addresses. No claim of real-provider
acceptance is made from synthetic fixtures. Before activation, evaluate permitted
known inside/outside, excluded-hole, boundary-street and apartment addresses, plus
street aliases. An owner-authorized correction must not merely relabel an outside
address. Review ambiguous results instead of overriding geographic controls.
Census's free geocoder is a possible research reference, but its interpolated
coordinates are insufficient as the sole acceptance evidence near city limits.

## Implementation and approval gates

All new quotes, transactional order creation, checkout preparation and queued
Stripe checkout operations use the server validator. Client coordinates and
approval flags do not enter the geocoding decision. Existing account/address
ownership checks still run. Historic paid orders, signed webhooks, delivery and
financial reconciliation do not acquire a geocoding prerequisite.

New settings are **supported in code only; do not add them to Render yet**:

- `ROCOEATS_DELIVERY_AREA_MODE`: absent means existing `provisional_postal` testing;
  future approved setting `municipal` requires all following configuration.
  Unknown values fail closed. Production public checkout cannot use provisional mode.
- `ROCOEATS_APPROVED_BOUNDARY_SHA256`: exact owner-approved geometry hash above.
- `ROCOEATS_GEOCODING_PROVIDER=geocodio`: future approved provider choice.
- `GEOCODIO_API_KEY`: future owner-created free account key, entered only in hosted
  secret settings after separate approval. Never share it in chat or commit it.

Setting a mode or hash never enables ordering. Existing ordering/Stripe gates
remain independent. Missing/incorrect approval or provider configuration blocks
municipal checkout before transmitting addresses. Data updates require a new
hash, new review and approval. This code does not assert the current candidate
has been approved.

The proposed 30 m interior margin excludes uncertain boundary streets and hole
edges; it is a conservative review policy, not a claimed provider error radius.
Five-second provider timeout, bounded responses and five-minute/256-entry process
cache fail closed without stale fallback. Cache keys bind the full saved address,
provider key and boundary version; edits/expiry require new evidence. Restart
clears it. No permanent customer geocoding database was introduced. Provider quota
and outage fail closed; free account quota remains the ultimate cost limit.

Before launch: owner approves the exact map/version, 30 m review policy, and
provider/address sharing; then authorizes free account setup and permitted accuracy
evaluation. A later, separately approved deployment/configuration can activate
municipal validation. No authorization to enable ordering or payments is implied.
