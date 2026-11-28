# Live Geocodio owner diagnostic — November 14, 2026

## November 15 offline investigation (does not rewrite the saved report)

The saved office summary proves one candidate, supported 1.0 rooftop/building-centroid
precision and safe interior coordinates. It omits normalized address components and
the exact rejection branch. The missing facts cannot be reconstructed from it.
Regression reconstruction of the earlier CSV Ste 1 passes Suite 1, including
abbreviation/punctuation/case variations. Missing/different unit, malformed number
or unit types, street/house-number mismatch and locality mismatch each reproduce
the same summary while failing distinct policy checks. None is uniquely proven
as the live cause. An exact unit-mismatch claim would fabricate missing evidence.

The CSV put the unit on the street line; the API query joined street and unit with
a comma. That observable formatting difference is only a hypothesis about provider
parsing, not evidence of a defect; query/admission rules were not relaxed.
If existing saved provider request history contains the returned public address
components, review it without a new lookup. Otherwise this historical cause remains
unknown and the office case cannot be marked accepted. Do not repeat the suite.

Code now emits sanitized finite rejection codes in version 2 reports. It preserves
eligibility and public HTTP error text, and cannot backfill the historical report.
The forestry expectation is corrected to reject for its proven excluded-hole point;
this changes diagnostic classification only, not the approved boundary or 30 m rule.
No one-shot allowance key/reset or hosted data changed.

Evidence source: owner-transcribed complete sanitized three-screenshot report; no provider calls repeated. Mode `real_provider`, 5 requests / maximum 5. Boundary SHA-256 `e1ebc348ed9cc92ffe8ba8ba0d00873486c9fec851233d4190daad3538289d1f`. Overall `accuracyAcceptancePassed=false`, `activationReady=false`.

| Case | Actual | Expected | Accuracy / geometry | Expectation |
|---|---|---|---|---|
| city-hall | accepted_by_validator | accept | one result; 1.0 rooftop/building_centroid; inside, safe, 927.1 m | met |
| public-office-unit | rejected_by_validator | accept | one result; 1.0 rooftop/building_centroid; inside, safe, 807.2 m | **not met** |
| same-zip-outside-airport | rejected_by_validator | reject | one result; 1.0 rooftop/building_centroid; outside, 3790 m | met |
| boundary-review-candidate (forestry office, 4314 Roane State Hwy) | rejected_by_validator | review | one result; 1.0 rooftop/building_centroid; outside approved delivery footprint, within excluded hole; 13.4 m from edge | null / unresolved review classification |
| ambiguous-public-street | rejected_by_validator | reject | two street_center results, score 1.0, matchType unknown; both inside/safe, 1072.1/838.3 m | met |
| unsupported-zip-college | rejected_without_provider | reject | no provider request | met |

## Interpretation and investigation needed

The earlier owner-supplied CSV observation record `geocodio-public-observations.json` identifies public-office-unit as 1070 N Gateway Ave Suite 1; its selected CSV row retained house number, street, Suite 1, ZIP and rooftop/building-centroid precision. This makes a suite-level rejection *plausible* only if the live API returned materially different normalized unit/address components or the validator enforces additional address conditions. A building centroid is not independent proof of suite existence. The sanitized report lacks a rejection reason and the complete normalized API address; do not call it a confirmed software defect or a confirmed correct rejection. Inspect offline predicate code, fixtures and recorded reason, and add a regression once the precise mismatch is identified. Never relax unit/house-number, candidate-uniqueness or role/security rules just to pass the suite.

The forestry office is in the approved source polygon's excluded hole, per the independently projected CSV observation; outside coverage must not be accepted even if a mailing address says Rockwood/37854. The 13.4 m distance is within the 30 m review margin. Rejection is safe; the suite's expected `review` may require a distinct manual-review classification rather than generic rejection. Investigate offline before deciding whether that is an expectation/labeling issue. The airport rejection, ambiguous street rejection, unsupported ZIP no-call and City Hall acceptance are consistent with safety requirements. The two street candidates must remain rejected despite interior coordinates.

**Do not rerun Geocodio.** Keep municipal enforcement, public/private ordering and live payments disabled; Stripe TEST only. The diagnostic can be disabled by setting `ROCOEATS_GEOCODIO_PUBLIC_TEST_ENABLED=false` in Render and deploying the environment change, while retaining the saved report. Do not delete/rotate the key as part of disabling unless separately authorized. Verify the panel reports disabled afterward using GET/read-only status. No geographic activation authorization is inferred.
