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

## Safety Model

User-authored base and annotation text is escaped by the shared core renderer.
The adapter does not load preview scripts or remote resources.
