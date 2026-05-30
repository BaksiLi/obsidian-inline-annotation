# Install in a Test Vault

Build and install the runtime files:

```sh
npm install
npm run check
npm run install:vault -- "/path/to/Vault" --clean --enable --examples
```

To update the shared core before installing:

```sh
npm run update:core
npm run check
```

The installer copies only:

- `main.js`
- `manifest.json`
- `versions.json`
- `styles.css`

It installs to:

```text
<vault>/.obsidian/plugins/inline-annotation/
```

Then reload Obsidian, or disable and re-enable **Inline Annotation** in
Community plugins.

## Current Scope

- Reading view: supported
- Live Preview: not supported yet
- Source mode: shows original Markdown source
- Links: skipped for v1 so anchors are not broken
- Space-based per-character alignment: disabled in this adapter to preserve
  multi-word glosses
- Markdown inside annotation text, such as `[term]^^(**bold gloss**)`: not
  supported in v1

Use Reading view for smoke testing.

For a focused test note, copy `examples/obsidian-smoke.md` into the vault and
open it in Reading view. Passing `--examples` to the installer copies it as
`inline-annotation smoke.md`.

If ruby text appears too small for your Obsidian zoom/theme, add a CSS snippet:

```css
body {
  --ia-rt-font-size: 0.65em;
}
```
