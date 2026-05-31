# Install in a Test Vault

Build and install the runtime files:

```sh
npm install
npm run check
npm run install:vault -- "/path/to/Vault" --clean --enable --examples
```

For repeat installs into the same vault, you can also set the vault path once
per shell:

```sh
export OBSIDIAN_VAULT="/path/to/Vault"
npm run check
npm run install:vault -- --clean --enable --examples
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

If the plugin appears unchanged after reinstalling, verify that Obsidian is
opening the same vault path and that the installed directory is:

```text
<vault>/.obsidian/plugins/inline-annotation/
```

## Current Scope

- Reading view: supported
- Live Preview: early prototype
- Source mode: shows original Markdown source
- Links: skipped so anchors are not broken
- Space-based per-character alignment: conservative auto mode preserves
  multi-word glosses while aligning phonetic readings
- Markdown inside annotation text, such as `[term]^^(**bold gloss**)`: not
  supported

Use Reading view for smoke testing.

For focused test notes, pass `--examples` to copy:

- `inline-annotation smoke.md`
- `inline-annotation showcase.md`

Open them in Reading view and Live Preview after reloading the plugin.

If ruby text appears too small for your Obsidian zoom/theme, add a CSS snippet:

```css
body {
  --ia-rt-font-size: 0.65em;
}
```
