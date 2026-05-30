import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const args = process.argv.slice(2);
const clean = args.includes("--clean");
const targetArg = args.find((arg) => arg !== "--clean") ?? process.env.OBSIDIAN_VAULT;

if (!targetArg) {
  console.error("Usage: npm run install:vault -- <vault path | plugins path | plugin path> [--clean]");
  process.exit(1);
}

const sourceRoot = path.resolve(new URL("..", import.meta.url).pathname);
const targetRoot = path.resolve(targetArg);
const pluginDir = resolvePluginDir(targetRoot);
const files = ["main.js", "manifest.json", "versions.json", "styles.css"];

if (clean && existsSync(pluginDir)) {
  rmSync(pluginDir, { recursive: true, force: true });
}

mkdirSync(pluginDir, { recursive: true });

for (const file of files) {
  cpSync(path.join(sourceRoot, file), path.join(pluginDir, file));
}

console.log(`Installed ${manifest.id} to ${pluginDir}`);

function resolvePluginDir(target) {
  if (existsSync(path.join(target, "manifest.json"))) return target;
  if (path.basename(target) === manifest.id) return target;
  if (path.basename(target) === "plugins" && path.basename(path.dirname(target)) === ".obsidian") {
    return path.join(target, manifest.id);
  }
  if (path.basename(target) === ".obsidian") return path.join(target, "plugins", manifest.id);
  return path.join(target, ".obsidian", "plugins", manifest.id);
}
