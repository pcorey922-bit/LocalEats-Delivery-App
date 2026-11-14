# Rockwood delivery boundary proposal

Status: **boundary map, ZIP restriction and 30 m margin approved by the owner on
November 14, 2026; geographic enforcement not activated**. Public ordering,
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
and does not establish legal municipal lines. The owner approved this pinned
map/version, ZIP 37854 as an additional
restriction and the 30 m edge review margin on November 14, 2026; see
[approval record](owner-approval.json). The archived source provenance and original
review map retain their capture-time candidate labels. They are not runtime
configuration. Real provider accuracy acceptance and separate activation approval
are still required. No boundary refresh or annexation is auto-approved.
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
hash, new review and approval. The owner approval record does not set any runtime
variables or activate the provider.

The proposed 30 m interior margin excludes uncertain boundary streets and hole
edges; it is a conservative review policy, not a claimed provider error radius.
Five-second provider timeout, bounded responses and five-minute/256-entry process
cache fail closed without stale fallback. At most eight distinct lookups run
concurrently; identical in-flight requests share one provider call. Saturation
returns a retryable unavailable response, never a geographic approval. The adapter
validates locality independently and snapshots input so mutation during a lookup
cannot rebind cached evidence. Returned cached evidence is immutable. Cache keys bind the full saved address,
provider key and boundary version; edits/expiry require new evidence. Restart
clears it. No permanent customer geocoding database was introduced.

`/readyz` reports `deliveryAreaReady` and a sanitized `geographicDelivery`
configuration summary. Municipal misconfiguration makes readiness fail; missing
settings are listed by name only. Invalid mode values and provider keys are never
echoed. The read-only staging verifier includes this summary when available and
remains compatible with older deployments. This is configuration evidence only:
readiness never calls the geocoder and cannot establish provider accuracy or
account/quota health. Provisional private staging can remain healthy while
municipal enforcement is explicitly reported inactive. Provider quota
and outage fail closed; free account quota remains the ultimate cost limit.

The map/version, additional ZIP restriction and 30 m review policy are now
approved. Before activation, obtain provider/account authorization, pass real
accuracy evaluation, and obtain separate activation authorization. A later, separately approved deployment/configuration can activate
municipal validation. No authorization to enable ordering or payments is implied.


## Prepared public-address accuracy cases — not executed

These are public institutional addresses, not customer or restaurant records.
No address has been submitted to Geocodio and no account/key or paid resource has
been created. Do not use these addresses to create delivery orders. Expected
positive classifications remain candidates until an exact building/entrance point
has been independently reviewed against the pinned polygon and margin. Published
mailing addresses alone are not coordinate/precision evidence.

| Case | Public address and source | Required evaluation |
| --- | --- | --- |
| City Hall | 110 North Chamberlain Avenue, Rockwood, TN 37854 — [city offices](https://cityofrockwoodtn.gov/administrative-offices/) | Candidate inside-area positive. Verify exact street, precise building point, ZIP and distance from all boundary/hole edges. |
| Public office with unit | 1070 N Gateway Avenue, Suite 1, Rockwood, TN 37854 — [Tennessee Driver Service locations](https://safetysupport.tn.gov/hc/en-us/articles/51013024806291-Driver-Service-Locations) | Candidate unit/alias positive. Verify Suite 1 and precise evidence. Multiple candidates or an absent unit must remain blocked for review; do not weaken the validator to force a pass. |
| Same-ZIP outside municipality | 258 Rockwood Airport Drive, Rockwood, TN 37854 — [city airport page](https://cityofrockwoodtn.gov/rockwood-municipal-airport/) | Must not be accepted merely because city/ZIP match. The city places its airport north of Rockwood; TDOT's published airport reference latitude 35°55.34′ N (~35.922333) is north of the pinned polygon's maximum latitude ~35.896132. That reference point is not a geocoded street entrance or rooftop: independently verify the address point before real-provider acceptance. |
| Unsupported ZIP/locality | 276 Patton Lane, Harriman, TN 37748 — [Roane State](https://www.roanestate.edu/) | Application must reject before a provider call. Public geographic reference only; no need to consume a lookup to establish a disallowed ZIP. |

Airport coordinate reference: [TDOT airport directory](https://www.tn.gov/content/dam/tn/tdot/documents/Aeronautics/Airport-directory.pdf).
The approved polygon's actual hole/30 m edge checks, malformed fields, modified
addresses, outages and rate/quota behavior remain covered by synthetic automated
tests. Do not invent real street addresses for holes or border examples; choose
additional public locations only when their footprint is independently established.

Once account/provider evaluation is separately authorized, run each permitted
lookup once, without orders or payments. Record field types, candidate count,
accuracy score/type, match type, matched street/unit/ZIP, public point and
inside/edge result. Compare with independent public map/parcel evidence. Keep keys
out of logs. Missing, coarse, ambiguous, wrong-unit, outside or near-edge evidence
is a rejection/review outcome. A precise known-inside street and unit must also
work before activation; if valid cases fail, investigate and regression-test the
smallest evidence-based correction rather than bypassing geography safeguards.
