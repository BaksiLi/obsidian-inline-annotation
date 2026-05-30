# Install in a Test Vault

Build and install the runtime files:

```sh
npm install
npm run check
npm run install:vault -- "/path/to/Vault" --clean --enable
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
- Markdown inside annotation text, such as `[term]^^(**bold gloss**)`: not
  supported in v1

Use Reading view for smoke testing.
