import esbuild from "esbuild";

const prod = process.argv.includes("--prod");

await esbuild.build({
  banner: {
    js: "/* Inline Annotation for Obsidian */",
  },
  bundle: true,
  entryPoints: ["src/main.ts"],
  external: ["obsidian", "@codemirror/state", "@codemirror/view"],
  format: "cjs",
  logLevel: "info",
  minify: prod,
  outfile: "main.js",
  sourcemap: prod ? false : "inline",
  target: "es2018",
  treeShaking: true,
});
