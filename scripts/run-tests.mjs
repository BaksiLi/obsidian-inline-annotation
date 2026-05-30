import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import esbuild from "esbuild";

mkdirSync(new URL("../.test-build", import.meta.url), { recursive: true });

await esbuild.build({
  bundle: true,
  entryPoints: ["test/postprocessor.test.ts"],
  format: "cjs",
  logLevel: "silent",
  outfile: ".test-build/postprocessor.test.cjs",
  platform: "node",
  target: "node20",
});

const result = spawnSync(process.execPath, [".test-build/postprocessor.test.cjs"], {
  cwd: new URL("..", import.meta.url),
  stdio: "inherit",
});

process.exit(result.status ?? 1);
