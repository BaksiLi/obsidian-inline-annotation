# Inline Annotation for Obsidian

Reading-view Obsidian adapter for Inline Annotation.

This first version is intentionally narrow. It registers a Markdown
postprocessor, scans text nodes in reading view, and renders Inline Annotation
syntax with `markdown-it-inline-annotation/core`.

## Scope

- Reading view: yes
- Live Preview editing: no
- editor commands: no
- external resources: no
- custom network access: no

The adapter skips existing links, code, preformatted blocks, ruby elements,
scripts, styles, and elements marked with `data-inline-annotation-ignore`.

## Development

```sh
npm install
npm run check
```

The package bundles `markdown-it-inline-annotation` into `main.js` and keeps
`obsidian` external, matching normal Obsidian plugin packaging.

`npm run check` builds the plugin, runs DOM postprocessor fixtures with
`happy-dom`, and verifies package boundaries. The DOM fixtures include the shared
Inline Annotation HTML corpus plus Obsidian-specific skip behavior for links,
code, preformatted blocks, existing ruby, scripts, styles, textareas, and
`data-inline-annotation-ignore`.

To install only the runtime files into a local test vault:

```sh
npm run install:vault -- "/path/to/Vault" --clean
```

This copies only `main.js`, `manifest.json`, `versions.json`, and `styles.css`.

## Safety Model

User-authored base and annotation text is escaped by the shared core renderer.
The adapter does not load preview scripts or remote resources.
