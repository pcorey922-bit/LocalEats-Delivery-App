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
leave payment methods/paid credits absent. The owner authorized free account creation and public-address accuracy testing
on November 14, 2026. Account creation/email verification and secure key entry
currently require owner assistance; real-provider acceptance is not yet established.
No customer addresses have been transmitted.

The adapter uses the documented fixed HTTPS `/v1.11/geocode` endpoint. It sends
only address components, including unit, never account names, instructions,
phone numbers, coordinates, card data or order details. API key stays server-side and is sent in the provider-supported Authorization
Bearer header, never the URL query string; redirects are refused. Exceptions never expose request URLs, keys or bodies.
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
cache fail closed without stale fallback. New outbound attempts are limited to
30 per rolling minute and 500 per UTC day per process, counting failed attempts;
cache/in-flight hits consume no extra requests. Invalid/backward clocks fail closed.
These local budgets reset on restart and are not an account-wide spending control.
Use a free-only account with no payment method, paid credits, subscription or
auto-refill; confirm free quota before each real evaluation run. At most eight distinct lookups run
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
approved. Provider/account and public testing are now authorized. Pass real accuracy
evaluation and obtain separate activation authorization before changing hosted
settings or municipal mode. A later, separately approved deployment/configuration can activate
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

Account/public evaluation is authorized. Once the account and secure key are ready,
run each permitted
lookup once, without orders or payments. Record field types, candidate count,
accuracy score/type, match type, matched street/unit/ZIP, public point and
inside/edge result. Compare with independent public map/parcel evidence. Keep keys
out of logs. Missing, coarse, ambiguous, wrong-unit, outside or near-edge evidence
is a rejection/review outcome. A precise known-inside street and unit must also
work before activation; if valid cases fail, investigate and regression-test the
smallest evidence-based correction rather than bypassing geography safeguards.


## Executable public accuracy runner

Default command is offline and needs no credentials:

```sh
node scripts/verify-geocodio-public.mjs
```

After owner account setup and secure development-secret entry, engineering may
run the authorized public suite only when free quota has at least five lookups
remaining and no paid billing/credits/auto-refill are enabled:

```sh
NODE_USE_ENV_PROXY=1 node scripts/verify-geocodio-public.mjs --live --confirm-free-tier
```

`GEOCODIO_API_KEY` must be supplied through development environment Secrets. Never
paste it in chat, put it in command arguments, commit it, or add it to Render for
this evaluation. If this session has no secure secret-entry UI, leave the key in
the owner's Geocodio dashboard and resolve that blocker before direct API testing.
No account creation credential or private session is accessible to engineering.

The executable accepts no custom addresses/files/URLs; it uses six fixed public
cases and makes at most five provider calls, sequentially, with no retries. The
unsupported-ZIP case is rejected without a lookup. Transport/quota failures stop
further calls. Added cases: the published Lone Mountain State Forest office at
4314 Roane State Hwy (boundary-review candidate, not yet proven near an edge) and
Chamberlain Avenue without a house number (public street-only ambiguity/coarse
result probe; production input validation always blocks it). It uses exactly the
same fixed-origin transport and strict evidence validator as production, without
changing any process/Render activation or ordering settings or reading a database.

Reports contain only case IDs, normalized precision enums, scores, result counts,
boundary distances, and accept/reject decisions. They omit API keys, URLs containing
keys, raw responses, matched addresses and provider exception text. Exact provider
points/returned street/unit evidence must be inspected securely by the owner and
compared to independent public building/parcel evidence. A near-edge candidate is
not independent ground truth. Ambiguity and near-edge coverage gaps are reported
honestly if the actual provider does not return those cases.

Exit 0: offline dry-run completed. Exit 1: invocation/configuration failed.
Exit 2: live observations collected with unresolved coverage/review or expectations.
The runner deliberately never marks `accuracyAcceptancePassed` or `activationReady`
true by itself: owner review and remaining real-boundary/precision acceptance
must be completed. No automated report enables enforcement or ordering.


### Owner-assisted path when no secure key field is available

Owner confirmed the free account is ready but this Codex environment exposes no
secure Secrets entry. Keep the API key private in Geocodio. No direct provider API
requests have been made by engineering. Do not place the key in GitHub, Render,
chat, a screenshot, command arguments or an attachment to work around this.

Download [the five-public-address CSV](public-geocodio-cases.csv), upload it to the
Geocodio spreadsheet tool, select US only, leave optional appends/extras off and
confirm five rows/free $0 usage before processing. Download the **geocoding results**
CSV, not a Usage/Billing export (which may contain API-key information). Check it
contains only these public rows and no key column before sharing it for analysis.
No application records/orders are involved. Do not run a second job unnecessarily.

These are owner-assisted real-provider observations, not engineering-authenticated
API execution. Use the actual returned coordinates/precision against the approved
polygon and 30 m margin; mark unmatched or omitted fields unverified. A spreadsheet
may return only the best match: do not infer that the API returned one candidate,
that the JSON field types are proven, or that Bearer authentication was verified.
Independent public building footprints and a real near-edge case still require
review. No CSV result automatically approves accuracy or activates enforcement.


## Actual owner-supplied public results — November 14, 2026

Owner reports Geocodio COMPLETED five rows. The attached results contain all five
allowlisted public inputs and no authentication-key column. `Geocodio Stable
Address Key` is a location identifier, not an API credential; it is omitted from
our committed evidence. Raw original attachment is not committed. Sanitized public
observations and source-content SHA-256 are in
[the observation record](geocodio-public-observations.json).

| Public case | Reported score/type | Independent boundary result | Delivery disposition |
| --- | --- | --- | --- |
| 110 N Chamberlain Ave, City Hall | 1.0, rooftop/building centroid | Inside, ~939 m from closest edge | Selected point passes spatial/precision checks; unique API match still unverified. |
| 1070 N Gateway Ave, Suite 1 | 1.0, rooftop/building centroid | Inside, ~815 m from closest edge | Selected point passes spatial/precision checks; Ste 1 returned. This is a building-centroid point, not independently verified suite coordinates/existence. |
| 258 Rockwood Airport Dr | 1.0, rooftop/building centroid | Outside outer footprint, ~3.83 km from closest edge | Reject despite matching Rockwood/37854 mailing locality. |
| 4314 Roane State Hwy, forestry office | 1.0, rooftop/building centroid | Inside an excluded hole, ~13.5 m from its edge | Reject/review; not in the approved footprint and within the conservative edge-review zone. |
| Chamberlain Avenue, no house number | 1.0, street_center, no precise match type | Point is inside, ~1.08 km from edge; provider selected S Chamberlain Ave | Reject: missing house number and coarse/direction-ambiguous result. A score of 1.0 is not proof of a deliverable address or positional accuracy. |

See [the results map and exclusion detail](geocodio-results-map.svg). These are
owner-assisted real-provider observations, not a new simulated provider response.
No incorrect precise street/house-number match was established in this file;
physical rooftop ground truth is still unverified. Two points are geographically
suitable candidates, not final production ordering approvals. The three other
results must remain rejected. The 30 m margin is additional restriction inside
coverage; it never permits an outside point.

Independent reference: Shapely 2.1.2/GEOS + pyproj 3.7.2, WGS84 to EPSG:32616.
Distances above are approximate projected nearest-edge distances. Production uses
a deliberately conservative local distance approximation (~1% shorter here);
all five point/margin classifications agree. No source boundary vertices moved.
The reference libraries were installed only under /tmp for this analysis; no new
runtime dependency or database migration was introduced.

### Source topology correction without territory change

The approved source has one excluded ring that touches itself at
(-84.610097233458, 35.8760486302104). GEOS reports that serialized ring invalid.
The two touching excluded lobes can be represented as two hole rings instead.
`deliveryBoundaryGeometry` performs only that deterministic repeated-vertex split:
outer ring 5077 coordinates remains unchanged; exclusion 663 coordinates becomes
20 + 644 coordinates (same 662 directed edges).

Verified independently: derived polygon is valid, equals GEOS make_valid(source),
boundary Hausdorff distance is zero, and every original directed boundary edge is
preserved exactly. No area is added, no edge is buffered/moved, no hole filled, and
no city/ZIP territory expands. Approved raw source, map, version and SHA-256 remain
unchanged. The existing even-odd map represents the same footprint. Regression
coverage compares raw/derived behavior over the exclusion, 30 m cases and actual
CSV points. This is a representation correction, not an automatic boundary refresh.
It has not been deployed and does not activate municipal enforcement.

### Remaining acceptance evidence

A best-match spreadsheet row cannot establish that the direct API returned one
candidate or used the tested JSON field types. Diagnostic predicate tests convert
CSV numeric strings and wrap a selected row only to exercise checks; they do NOT
turn the CSV into actual unique API evidence. Duplicated candidates still reject.
No provider key is available to engineering; direct Bearer/API verification has
not been performed. An owner-local masked terminal path is prepared below. Independent rooftop/entrance
checks, the full direct API precision/uniqueness evidence and owner review remain
before accuracy acceptance/activation. `providerAccuracyAcceptancePassed` and
`geographicActivationAuthorized` stay false. No additional lookups, hosted record
changes, payments or financial operations were performed for this evaluation.

### Secure owner-local direct API verification

On November 14, 2026, an unauthenticated OPTIONS request (no key/address/lookup)
to the fixed v1.11 endpoint returned `Access-Control-Allow-Origin: *` but allowed
only `Content-Type, User-Agent` request headers. It did **not** allow Authorization.
A local browser page therefore cannot use our Bearer transport. Do not work around
this by putting a key in a URL or changing deployed CSP.

The owner can instead use a **private local computer terminal**, never this shared
Codex terminal or a cloud IDE. Requires Python 3, supported Node/pnpm and this
repository with dependencies installed. From the repository root:

1. Confirm the free account has no payment method, paid credits, subscription or
   auto-refill, and at least five free lookups remaining. Do not repeat the CSV job.
2. Run `python3 scripts/verify-geocodio-owner.py` with no arguments. Type `YES` to
   confirm those limits. Paste the API key only into its hidden local prompt.
   If entry cannot be masked, it stops. Do not use shell history, command arguments,
   chat, GitHub secrets, Render settings or uploaded files to supply the key.
3. The wrapper starts the existing production-transport verifier, passing the key
   only in the local child process environment. At most five sequential fixed
   public US lookups, no retry; stop on provider failure. No private records, DB,
   payments, hosted settings or activation are involved. Close the terminal after
   use. This assumes a trusted personal machine: local privileged processes can
   read environment/memory; memory zeroization is not guaranteed.
4. Review/share only the sanitized JSON report. It excludes the key, raw provider
   response and requested URL. Exit 2 means acceptance gaps or expectation mismatch,
   **not** permission to repeat the run. Stop and review the evidence first.

Phone-only owners without a trusted local terminal still need a secure developer
secret-entry facility before direct testing; do not paste credentials in chat.
No live API test was run while implementing this runner. Mocked tests do not prove
provider authentication or actual JSON compatibility. Independent building checks,
owner acceptance of direct results and separate activation approval remain required.
Process-local cache/quota controls reset on restart and are not account-wide billing
limits. Before activation, confirm the provider's free-only limit behavior and plan
account-wide usage protection for multiple processes/restarts; do not assume these
in-memory guards alone guarantee no overage.
