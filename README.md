# Inline Annotation for Obsidian

Reading-view Obsidian adapter for Inline Annotation.

The current adapter is intentionally narrow. It registers a Markdown
postprocessor, scans text nodes in reading view, and renders Inline Annotation
v2 syntax with `markdown-it-inline-annotation/core`.

## Scope

- Reading view: yes
- Live Preview editing: no
- editor commands: no
- external resources: no
- custom network access: no

The adapter skips existing links, code, preformatted blocks, ruby elements,
scripts, styles, and elements marked with `data-inline-annotation-ignore`.

Space-based per-character alignment uses the shared core's conservative `auto`
policy: phonetic readings such as `[取り返す]^^(と り かえ す)` align per
character, while plain multi-word glosses such as `[真值]^^(Truth Value)` stay
grouped.

## Development

```sh
npm install
npm run check
```

To intentionally pick up the latest published core renderer:

```sh
npm run update:core
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
npm run install:vault -- "/path/to/Vault" --clean --enable --examples
```

This copies only `main.js`, `manifest.json`, `versions.json`, and `styles.css`.
With `--enable`, it also adds `inline-annotation` to the vault's
`.obsidian/community-plugins.json`.
With `--examples`, it copies `examples/obsidian-smoke.md` into the vault as
`inline-annotation smoke.md`.

After installing, reload Obsidian or disable and re-enable the plugin so Obsidian
loads the latest `main.js` and `styles.css`.

Use [examples/obsidian-smoke.md](./examples/obsidian-smoke.md) for a focused
Reading view smoke test. Avoid using the Logseq showcase as the primary Obsidian
test file; it includes source/output pairs and Logseq-oriented edge cases that
make Obsidian's reading view look noisier than real notes.

The bundled stylesheet exposes a small customization surface for vault snippets:

```css
body {
  --ia-rt-font-size: 0.65em;
  --ia-rt-line-height: 1;
  --ia-underline-offset: 0.15em;
}
```

## Obsidian Notes

Only Reading view is supported. Live Preview and Source mode may still show the
original source syntax.

Obsidian parses Markdown before this plugin runs. That means normal Markdown and
Obsidian link syntax may already have become `<a>` elements by the time the
postprocessor sees the document. The adapter currently skips links to avoid
breaking anchors; link annotation support should be designed separately.

Annotation text should be plain text. Markdown inside an annotation, such
as `[term]^^(**bold gloss**)`, may be split into multiple rendered DOM nodes by
Obsidian before this plugin runs, so it is not supported by the reading-view
postprocessor.

Space-based per-character alignment is intentionally conservative in this
Obsidian adapter. The shared core still supports always-on alignment for
markdown-it and other adapters, but Obsidian reading view prioritizes
multi-word glosses such as `[真值]^^(Truth Value)` while keeping phonetic readings
such as `[取り返す]^^(と り かえ す)` comfortable to read.

## Safety Model

User-authored base and annotation text is escaped by the shared core renderer.
The adapter does not load preview scripts or remote resources.
