# Inline Ruby Annotation for Obsidian

Render Inline Annotation syntax as ruby/furigana, over/under glosses, bouten,
overlines, and underlines in Obsidian.

```markdown
[漢字]^^(かんじ)
[base]^^(over)^_(under)
[重要]^^(..)^_(.~)
```

The plugin supports Reading view and an early Live Preview replacement widget.
Both use the model from
[`markdown-it-inline-annotation/core`](https://github.com/BaksiLi/markdown-it-inline-annotation).

## Behavior

| Surface | Support |
| --- | --- |
| Reading view | yes |
| Live Preview | prototype; reveals source while editing the expression |
| Source mode | original Markdown source |
| Commands and settings | not yet |
| Network access or external resources | none |

The adapter uses conservative `spaceAlignment: "auto"`: phonetic readings such
as `[取り返す]^^(と り かえ す)` align per character, while glosses such as
`[真值]^^(Truth Value)` stay grouped.

## Host Boundaries

Obsidian parses Markdown before Reading-view postprocessors run. The adapter:

- renders complete expressions inside a plain or consistently formatted run;
- may join adjacent plain text nodes and attribute-free spans;
- does not join across emphasis, highlight, link, code, or another semantic
  boundary;
- skips existing links, code, preformatted blocks, ruby elements, scripts,
  styles, textareas, and `data-inline-annotation-ignore` elements.

Annotation slots are plain text. Rich Markdown such as
`[term]^^(**bold gloss**)` is intentionally not reconstructed after Obsidian has
split it into semantic DOM nodes. Preserving the source and formatting is safer
than silently flattening them to form an annotation.

Live Preview has a separate CodeMirror integration because it operates on
source ranges rather than rendered DOM. See
[docs/live-preview-notes.md](./docs/live-preview-notes.md) for its current
tradeoffs.

## Styling

The bundled stylesheet exposes a small customization surface:

```css
body {
  --ia-rt-font-size: 0.65em;
  --ia-rt-line-height: 1;
  --ia-underline-offset: 0.15em;
}
```

## Development

```sh
npm install
npm run check
```

`npm version` synchronizes `manifest.json` and `versions.json`.
Push the matching bare version tag, such as `0.4.0`, to test, build, and upload
the three Obsidian release assets with attestations.
The Release workflow can also be dispatched on an existing tag to retry it.

`npm run check` builds the plugin, runs the shared rendering and segment-boundary
fixtures, tests Live Preview source ranges, and verifies package safety rules.
The core package is bundled into `main.js`; Obsidian and its CodeMirror packages
remain external so the editor keeps one CodeMirror runtime.

To test the runtime files in a vault:

```sh
npm run install:vault -- "/path/to/Vault" --clean --enable --examples
```

Then reload Obsidian or disable and re-enable the plugin. The installer copies
only `main.js`, `manifest.json`, `versions.json`, and `styles.css`; `--examples`
also installs the maintained smoke and showcase notes.

- [examples/obsidian-smoke.md](./examples/obsidian-smoke.md): focused smoke test.
- [examples/obsidian-showcase.md](./examples/obsidian-showcase.md): broader visual pass.

To update the published core intentionally:

```sh
npm run update:core
npm run check
```

## Ecosystem

- [Inline Annotation spec and core](https://github.com/BaksiLi/markdown-it-inline-annotation)
- [Inline Annotation for VS Code](https://marketplace.visualstudio.com/items?itemName=baksili.vscode-inline-annotation)
- [Logseq reference plugin](https://github.com/BaksiLi/logseq-furigana-ruby)
- [Original proposal](https://blog.baksili.codes/markdown-ruby)

## Safety

Generated DOM is built with DOM APIs. User-authored text is escaped by the
shared core, and the plugin loads no scripts or remote resources.

## License

MIT
