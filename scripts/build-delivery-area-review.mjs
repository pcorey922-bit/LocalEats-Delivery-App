// Offline, deterministic map: official stored data only; no geocoding or map API.
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const data = path.join(root, "artifacts/api-server/src/data/rockwood");
const municipal = JSON.parse(
  await readFile(path.join(data, "base.geojson"), "utf8"),
).features[0].geometry;
const zcta = JSON.parse(
  await readFile(
    path.join(root, "docs/delivery-area/zcta-37854-reference.geojson"),
    "utf8",
  ),
).features[0].geometry;
const roads = JSON.parse(
  await readFile(
    path.join(root, "docs/delivery-area/roads-reference.geojson"),
    "utf8",
  ),
).features;
const meta = JSON.parse(
  await readFile(path.join(data, "provenance.json"), "utf8"),
);
assert.equal(
  createHash("sha256").update(JSON.stringify(municipal)).digest("hex"),
  meta.geometrySha256,
  "Map geometry must match the reviewed runtime boundary",
);
const points = municipal.coordinates.flat();
const xs = points.map((p) => p[0]),
  ys = points.map((p) => p[1]);
const minX = Math.min(...xs) - 0.012,
  maxX = Math.max(...xs) + 0.012,
  minY = Math.min(...ys) - 0.012,
  maxY = Math.max(...ys) + 0.012;
const scale = Math.min(
  900 / ((maxX - minX) * Math.cos((35.9 * Math.PI) / 180)),
  780 / (maxY - minY),
);
const project = ([x, y]) => [
  50 + (x - minX) * Math.cos((35.9 * Math.PI) / 180) * scale,
  160 + (maxY - y) * scale,
];
const rings = (g) =>
  g.type === "Polygon" ? g.coordinates : g.coordinates.flat();
// Display-only simplification below one pixel; runtime/source geometry is never simplified.
function simplify(points, tolerance = 0.25) {
  if (points.length <= 2) return points;
  const a = points[0],
    b = points.at(-1);
  let max = 0,
    index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      d = dx * dx + dy * dy;
    const t = d
      ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d))
      : 0;
    const distance = Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
    if (distance > max) {
      max = distance;
      index = i;
    }
  }
  return max > tolerance
    ? [
        ...simplify(points.slice(0, index + 1)).slice(0, -1),
        ...simplify(points.slice(index)),
      ]
    : [a, b];
}
const draw = (g) =>
  rings(g)
    .map(
      (r) =>
        simplify(r.map(project))
          .map(
            (p, i) => `${i ? "L" : "M"}${p.map((n) => n.toFixed(2)).join(",")}`,
          )
          .join(" ") + "Z",
    )
    .join(" ");
const city = draw(municipal),
  postal = draw(zcta);
const roadPaths = roads
  .map((f) => {
    const lines =
      f.geometry.type === "LineString"
        ? [f.geometry.coordinates]
        : f.geometry.coordinates;
    return lines
      .map((r) =>
        simplify(r.map(project))
          .map(
            (p, i) => `${i ? "L" : "M"}${p.map((n) => n.toFixed(2)).join(",")}`,
          )
          .join(" "),
      )
      .join(" ");
  })
  .join(" ");
const placed = [];
const labels = [];
for (const name of [
  "Rockwood Airport Rd",
  "I- 40",
  "N Gateway Ave",
  "S Gateway Ave",
  "US Hwy 70",
  "Roane State Hwy",
  "Spring City Hwy",
]) {
  const points = roads
    .filter((f) => f.properties.NAME === name)
    .flatMap((f) =>
      f.geometry.type === "LineString"
        ? f.geometry.coordinates
        : f.geometry.coordinates.flat(),
    )
    .map(project)
    .filter((p) => p[0] > 110 && p[0] < 820 && p[1] > 195 && p[1] < 850);
  points.sort(
    (a, b) =>
      Math.hypot(a[0] - 500, a[1] - 520) - Math.hypot(b[0] - 500, b[1] - 520),
  );
  const p = points.find((p) =>
    placed.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 85),
  );
  if (p) {
    placed.push(p);
    labels.push(
      `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}">${name}</text>`,
    );
  }
}

const km = scale / 111.32;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1190" viewBox="0 0 1000 1190" role="img" aria-labelledby="title desc">
<title id="title">Proposed Rockwood delivery boundary — owner approval required</title><desc id="desc">Gold shows the intersection of Tennessee's Rockwood municipal polygon and Census 37854 ZCTA reference. ZCTA is not a USPS ZIP boundary. Actual eligibility additionally requires a verified address in ZIP 37854. Excluded holes and nearby boundary addresses are not eligible automatically. No boundary is approved or active.</desc>
<rect width="1000" height="1190" fill="#081b33"/><g font-family="Arial,sans-serif" fill="#fff"><text x="40" y="45" font-size="29">RoCoEats · Proposed Rockwood delivery area</text><text x="40" y="82" fill="#f4ca64" font-size="23">REVIEW ONLY — NOT APPROVED OR ACTIVE</text><text x="40" y="115" font-size="18">City limits AND verified ZIP 37854; never all addresses in the ZIP</text></g>
<defs><clipPath id="frame"><rect x="35" y="145" width="930" height="800"/></clipPath><clipPath id="city"><path d="${city}" clip-rule="evenodd"/></clipPath></defs>
<rect x="35" y="145" width="930" height="800" fill="#eef2f5"/>
<g clip-path="url(#frame)"><path d="${city}" fill="#ccd4df" fill-rule="evenodd"/><g clip-path="url(#city)"><path d="${postal}" fill="#e3b84f" fill-rule="evenodd"/></g><path d="${postal}" fill="none" stroke="#067a86" stroke-width="2.5" stroke-dasharray="9 6"/><path d="${roadPaths}" fill="none" stroke="#5c6471" stroke-width="1.2" opacity="0.65"/><g font-family="Arial,sans-serif" font-size="15" fill="#132f4f" stroke="#fff" stroke-width="3" paint-order="stroke">${labels.join("")}</g><path d="${city}" fill="none" stroke="#163a64" stroke-width="2.5"/>
<g font-family="Arial,sans-serif" font-size="16" fill="#163a64"><text x="64" y="181">N ↑</text><path d="M65,900 h${km.toFixed(1)}" stroke="#163a64" stroke-width="4"/><text x="65" y="927">1 km · north up · roads: Census 2026 reference</text></g></g>
<g font-family="Arial,sans-serif" font-size="18" fill="#fff"><rect x="42" y="970" width="22" height="16" fill="#e3b84f"/><text x="76" y="985">City ∩ Census postal reference (candidate envelope)</text><path d="M42,1010 h24" stroke="#40c6ca" stroke-width="3" stroke-dasharray="7 4"/><text x="76" y="1016">37854 ZCTA reference; not exact USPS delivery ZIP limits</text><text x="42" y="1050">Source: Tennessee Comptroller · layer 2 · Rockwood object 269</text><text x="42" y="1078">Dataset updated Nov 3, 2026 · retrieved ${meta.retrievedAt.slice(0, 10)}</text><text x="42" y="1106">State data is informational, not a legal survey. Preserve excluded holes.</text><text x="42" y="1134">Display simplified &lt;1 pixel; full geometry used by server. 30 m review margin.</text><text x="42" y="1162">Boundary fingerprint: ${meta.geometrySha256.slice(0, 24)}…</text></g></svg>`;
await writeFile(
  path.join(root, "docs/delivery-area/rockwood-proposal.svg"),
  svg,
);
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RoCoEats boundary review</title><style>body{margin:0;background:#081b33;color:white;font:18px/1.5 system-ui}main{max-width:1000px;margin:auto;padding:16px}a{color:#f4ca64}img{width:100%;height:auto}li{margin-bottom:12px}code{overflow-wrap:anywhere}</style><main><h1>Rockwood boundary proposal</h1><p>Not approved or active. Pinch to zoom the map, or open the original state dashboard to compare streets and landmarks.</p><p><a href="${meta.dashboard}">Open official Tennessee municipal dashboard</a> · <a href="rockwood-proposal.svg">Open full-size map</a></p><img src="rockwood-proposal.svg" alt="Rockwood city limits intersected with Census 37854 postal reference"><ol><li>Approve the blue municipal outline, including excluded holes, as our service boundary only after reviewing it.</li><li>Gold is a reference intersection with the 2020 Census ZCTA, not a guarantee that any address has ZIP 37854. The server must verify the exact street address and returned postal code.</li><li>Approve Geocodio evaluation using public or expressly authorized addresses. No account, API call, customer address sharing or expense has been authorized.</li><li>Proposed conservative rule: exact street/building evidence inside the boundary, verified ZIP 37854, at least 30 m from any boundary edge. Ambiguous or missing evidence blocks checkout for review.</li></ol><p>State item publication: ${meta.publishedAt}. Latest item update: ${meta.itemModifiedAt}. Version: ${meta.version}.</p><p>Geometry SHA-256: <code>${meta.geometrySha256}</code></p><p>Tennessee describes these municipality-reported boundaries as informational, not legal descriptions. Census ZCTA outlines approximate postal areas. This proposal never authorizes service throughout ZIP 37854.</p></main></html>`;
await writeFile(path.join(root, "docs/delivery-area/index.html"), html);
console.log(
  "Built offline owner-review map from pinned official geometry and Census reference.",
);
