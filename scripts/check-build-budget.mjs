import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const assetsDir = join(distDir, "assets");
const indexHtml = readFileSync(join(distDir, "index.html"), "utf8");
const assetNames = readdirSync(assetsDir);
const jsAssets = assetNames.filter((name) => name.endsWith(".js"));

const findAsset = (prefix) => jsAssets.find((name) => name.startsWith(`${prefix}-`));
const sizeOf = (name) => statSync(join(assetsDir, name)).size;
const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

const failures = [];
const entryAsset = findAsset("index");
const threeAssets = jsAssets.filter((name) => /^three(?:\.core|\.module)?-/.test(name));

if (!entryAsset) failures.push("Missing production entry chunk.");
if (threeAssets.length === 0) failures.push("Missing Three.js chunks.");

const initialAssets = [...indexHtml.matchAll(/(?:src|href)="[^"]*\/assets\/([^"]+\.js)"/g)].map(
  (match) => match[1],
);
const initialBytes = initialAssets.reduce((total, name) => total + sizeOf(name), 0);

const budgets = {
  entry: 1650 * 1024,
  three: 750 * 1024,
  initial: 2400 * 1024,
  sceneEffects: 150 * 1024,
};

if (entryAsset && sizeOf(entryAsset) > budgets.entry) {
  failures.push(`Entry chunk ${entryAsset} is ${kib(sizeOf(entryAsset))}; budget is ${kib(budgets.entry)}.`);
}
const threeBytes = threeAssets.reduce((total, name) => total + sizeOf(name), 0);
if (threeBytes > budgets.three) {
  failures.push(
    `Three.js chunks total ${kib(threeBytes)}; budget is ${kib(budgets.three)}.`,
  );
}
if (initialBytes > budgets.initial) {
  failures.push(`Initial JavaScript is ${kib(initialBytes)}; budget is ${kib(budgets.initial)}.`);
}

const deferredPrefixes = [
  "SceneEffects",
  "spriteStrategy",
  "gifStrategy",
  "videoStrategy",
  "zipStrategy",
  "htmlStrategy",
  "glbStrategy",
];

const initialEffectsChunk = initialAssets.find((name) =>
  ["postprocessing-", "r3f-postprocessing-", "SceneEffects-"].some((prefix) =>
    name.startsWith(prefix),
  ),
);
if (initialEffectsChunk) {
  failures.push(`Scene-effects dependency ${initialEffectsChunk} is preloaded by dist/index.html.`);
}

for (const prefix of deferredPrefixes) {
  const asset = findAsset(prefix);
  if (!asset) failures.push(`Missing expected deferred chunk: ${prefix}.`);
  if (asset && initialAssets.includes(asset)) {
    failures.push(`Deferred chunk ${asset} is preloaded by dist/index.html.`);
  }
}

const sceneEffectsAsset = findAsset("SceneEffects");
if (sceneEffectsAsset && sizeOf(sceneEffectsAsset) > budgets.sceneEffects) {
  failures.push(
    `Scene-effects chunk ${sceneEffectsAsset} is ${kib(sizeOf(sceneEffectsAsset))}; budget is ${kib(
      budgets.sceneEffects,
    )}.`,
  );
}

if (failures.length > 0) {
  console.error("Build budget failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(
  [
    "Build budget passed.",
    `Entry: ${entryAsset ? kib(sizeOf(entryAsset)) : "missing"} / ${kib(budgets.entry)}`,
    `Three.js: ${kib(threeBytes)} / ${kib(budgets.three)}`,
    `Initial JavaScript: ${kib(initialBytes)} / ${kib(budgets.initial)}`,
    `Deferred: ${deferredPrefixes.join(", ")}`,
  ].join("\n"),
);
