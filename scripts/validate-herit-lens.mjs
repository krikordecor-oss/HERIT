import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const html = readFileSync("docs/index.html", "utf8");
const app = readFileSync("docs/app.js", "utf8");
const sw = readFileSync("docs/sw.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
assert(duplicates.length === 0, `Duplicate DOM ids: ${duplicates.join(", ")}`);

const referencedIds = [...app.matchAll(/\$\('([^']+)'\)/g)].map((match) => match[1]);
const missingReferences = [...new Set(referencedIds.filter((id) => !ids.includes(id)))];
assert(
  missingReferences.length === 0,
  `JavaScript references missing DOM ids: ${missingReferences.join(", ")}`,
);

const requiredIds = [
  "buildingSheet",
  "sheetAddress",
  "sheetLocality",
  "sheetTitle",
  "sheetRnb",
  "buildingFactsCard",
  "buildingFactsText",
  "buildingFactsBadge",
  "constructionHistoryCard",
  "futureContextCard",
  "buildingBriefCard",
  "opportunityCard",
];
for (const id of requiredIds) {
  assert(ids.includes(id), `Missing required DOM id: ${id}`);
}

const orderedMarkers = [
  'id="sheetAddress"',
  'id="buildingFactsCard"',
  'class="sheetSource sheetSourcePriority"',
  'class="identityDetails"',
  'id="constructionHistoryCard"',
  'id="futureContextCard"',
  'id="buildingBriefCard"',
  'id="opportunityCard"',
];
let previous = -1;
for (const marker of orderedMarkers) {
  const position = html.indexOf(marker);
  assert(position > previous, `Building-sheet order regression near ${marker}`);
  previous = position;
}

assert(
  app.includes("addEventListener('click',()=>openSheet())"),
  "openSheet listener must resolve the final wrapped function at click time",
);
assert(
  /await Promise\.all\(\[\s*refreshBuildingFacts\(\),\s*refreshConstructionHistory\(\),\s*refreshFutureContext\(\),\s*refreshOpportunityScore\(\),\s*refreshBuildingBrief\(\)\s*\]\);/m.test(app),
  "Independent building-sheet reads must remain parallel after scan sync",
);
assert(
  app.includes("HERIT n’invente pas de note"),
  "Opportunity must retain its honest insufficient-data state",
);

const styleVersion = html.match(/styles\.css\?v=([\w.-]+)/)?.[1];
const appVersion = html.match(/app\.js\?v=([\w.-]+)/)?.[1];
assert(styleVersion && appVersion, "Versioned Lens assets are required");
assert(sw.includes(`styles.css?v=${styleVersion}`), "Service worker CSS version is stale");
assert(sw.includes(`app.js?v=${appVersion}`), "Service worker app version is stale");
const serviceWorkerVersion = app.match(/register\('\.\/sw\.js\?v=([\w.-]+)'/)?.[1];
assert(serviceWorkerVersion === appVersion, "Registered service-worker version is stale");
for (const dependency of ["cloud.js", "i18n.js"]) {
  const version = app.match(new RegExp(`\\./${dependency.replace(".", "\\.")}\\?v=([\\w.-]+)`))?.[1];
  assert(version, `Missing versioned ${dependency} import`);
  assert(sw.includes(`${dependency}?v=${version}`), `Service worker ${dependency} version is stale`);
}

for (const path of [
  "docs/app.js",
  "docs/sw.js",
  "docs/cloud.js",
  "docs/i18n.js",
  "docs/targeting.js",
  "docs/buildings.js",
]) {
  const syntax = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
  assert(syntax.status === 0, syntax.stderr || `${path} syntax check failed`);
}

console.log(`HERIT Lens validation passed (${ids.length} unique DOM ids).`);
