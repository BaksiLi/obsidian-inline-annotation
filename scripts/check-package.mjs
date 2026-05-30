import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const main = readFileSync(new URL("../main.js", import.meta.url), "utf8");

assert.equal(manifest.id, "inline-annotation");
assert.equal(manifest.version, pkg.version);
assert.equal(pkg.dependencies?.["markdown-it-inline-annotation"], "^0.2.0");
assert.ok(existsSync(new URL("../main.js", import.meta.url)), "main.js must exist");
assert.ok(existsSync(new URL("../styles.css", import.meta.url)), "styles.css must exist");
assert.ok(existsSync(new URL("../versions.json", import.meta.url)), "versions.json must exist");
assert.ok(!main.includes("require(\"markdown-it-inline-annotation"), "core dependency should be bundled");
assert.ok(!main.includes("previewScripts"), "Obsidian adapter must not inject preview scripts");

console.log("Obsidian package checks passed");
