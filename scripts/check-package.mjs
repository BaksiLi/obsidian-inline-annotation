import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const main = readFileSync(new URL("../main.js", import.meta.url), "utf8");
const buildConfig = readFileSync(new URL("../esbuild.config.mjs", import.meta.url), "utf8");

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) return sourceFiles(url);
    return entry.name.endsWith(".ts") ? [url] : [];
  });
}

assert.equal(manifest.id, "inline-annotation");
assert.equal(manifest.version, pkg.version);
assert.equal(pkg.dependencies?.["markdown-it-inline-annotation"], "^0.3.2");
assert.ok(existsSync(new URL("../main.js", import.meta.url)), "main.js must exist");
assert.ok(existsSync(new URL("../styles.css", import.meta.url)), "styles.css must exist");
assert.ok(existsSync(new URL("../versions.json", import.meta.url)), "versions.json must exist");
assert.ok(!main.includes("require(\"markdown-it-inline-annotation"), "core dependency should be bundled");
assert.ok(main.includes("require(\"@codemirror/view\")"), "CodeMirror view should stay external");
assert.ok(buildConfig.includes("\"@codemirror/state\""), "CodeMirror state should stay external if used");
assert.ok(buildConfig.includes("\"@codemirror/view\""), "CodeMirror view should stay external");
assert.ok(buildConfig.includes("\"@codemirror/language\""), "CodeMirror language should stay external");
assert.ok(!main.includes("previewScripts"), "Obsidian adapter must not inject preview scripts");

for (const file of sourceFiles(new URL("../src/", import.meta.url))) {
  const source = readFileSync(file, "utf8");
  assert.ok(!/\b(?:innerHTML|outerHTML|insertAdjacentHTML)\b/.test(source), `${file.pathname} must build DOM safely`);
  assert.ok(!/\brequire\s*\(/.test(source), `${file.pathname} must use ESM imports`);
}

console.log("Obsidian package checks passed");
