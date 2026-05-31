import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const args = process.argv.slice(2);
const clean = args.includes("--clean");
const enable = args.includes("--enable");
const examples = args.includes("--examples");
const targetArg =
  args.find((arg) => arg !== "--clean" && arg !== "--enable" && arg !== "--examples") ?? process.env.OBSIDIAN_VAULT;

if (!targetArg) {
  console.error(
    "Usage: npm run install:vault -- <vault path | plugins path | plugin path> [--clean] [--enable] [--examples]"
  );
  process.exit(1);
}

const sourceRoot = path.resolve(new URL("..", import.meta.url).pathname);
const targetRoot = path.resolve(targetArg);
const pluginDir = resolvePluginDir(targetRoot);
const vaultDir = resolveVaultDir(pluginDir);
const files = ["main.js", "manifest.json", "versions.json", "styles.css"];

if (clean && existsSync(pluginDir)) {
  rmSync(pluginDir, { recursive: true, force: true });
}

mkdirSync(pluginDir, { recursive: true });

for (const file of files) {
  cpSync(path.join(sourceRoot, file), path.join(pluginDir, file));
}

if (enable) enablePlugin(vaultDir);
if (examples) installExamples(vaultDir);

console.log(`Installed ${manifest.id} to ${pluginDir}`);
if (enable) console.log(`Enabled ${manifest.id} in ${path.join(vaultDir, ".obsidian", "community-plugins.json")}`);
if (examples) console.log(`Installed examples to ${vaultDir}`);

function resolvePluginDir(target) {
  if (existsSync(path.join(target, "manifest.json"))) return target;
  if (path.basename(target) === manifest.id) return target;
  if (path.basename(target) === "plugins" && path.basename(path.dirname(target)) === ".obsidian") {
    return path.join(target, manifest.id);
  }
  if (path.basename(target) === ".obsidian") return path.join(target, "plugins", manifest.id);
  return path.join(target, ".obsidian", "plugins", manifest.id);
}

function resolveVaultDir(pluginDir) {
  const pluginsDir = path.dirname(pluginDir);
  const obsidianDir = path.dirname(pluginsDir);
  if (path.basename(pluginsDir) !== "plugins" || path.basename(obsidianDir) !== ".obsidian") {
    throw new Error(`Cannot resolve Obsidian vault from plugin directory: ${pluginDir}`);
  }
  return path.dirname(obsidianDir);
}

function enablePlugin(vaultDir) {
  const configPath = path.join(vaultDir, ".obsidian", "community-plugins.json");
  let plugins = [];
  if (existsSync(configPath)) {
    plugins = JSON.parse(readFileSync(configPath, "utf8"));
    if (!Array.isArray(plugins)) throw new Error(`${configPath} must contain a JSON array`);
  }
  if (!plugins.includes(manifest.id)) {
    plugins.push(manifest.id);
    writeFileSync(configPath, `${JSON.stringify(plugins, null, 2)}\n`);
  }
}

function installExamples(vaultDir) {
  cpSync(path.join(sourceRoot, "examples", "obsidian-smoke.md"), path.join(vaultDir, "inline-annotation smoke.md"));
  cpSync(
    path.join(sourceRoot, "examples", "obsidian-showcase.md"),
    path.join(vaultDir, "inline-annotation showcase.md")
  );
}
