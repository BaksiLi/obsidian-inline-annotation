# Live Preview Notes

Live Preview is intentionally separate from the Reading view postprocessor.
Reading view mutates rendered DOM; Live Preview must cooperate with CodeMirror's
source document, selection, and incremental viewport rendering.

## Current Prototype

- Registers a CodeMirror `ViewPlugin` through `registerEditorExtension`.
- Scans only `view.visibleRanges`, not the full note.
- Replaces each annotation source span with a widget while Live Preview is
  active.
- Reveals the original source whenever the cursor or selection touches the
  annotation range.
- Keeps `@codemirror/state` and `@codemirror/view` external so the extension
  uses Obsidian's editor runtime.
- Resets leaked Markdown emphasis after hidden source spans that may expose
  delimiters such as `^_(...)` or `*` on the same visual line.
- Separates annotation scanning from host-owned source ranges. The current host
  range provider is a fallback Markdown scanner; it is intentionally shaped so a
  CodeMirror syntax-tree provider can replace it.
- The ViewPlugin now asks for host syntax ranges before invoking the annotation
  scanner. The planned syntax-tree integration should replace
  `collectHostSyntaxRangesForLine`, not the model scanner.
- Replacement/reset decisions are planned as pure data before they become
  CodeMirror `Decoration` objects, so editor behavior can gain tests without
  depending on Obsidian UI automation.

## Why Replacement Widgets First

Replacement widgets are blunt, but they answer the first product question:
"Can this syntax look right in Live Preview without breaking basic editing?"

They avoid the harder partial-editing problem for now. The source is either
fully rendered or fully visible; we do not yet try to hide only operators,
parentheses, or annotation text while leaving the base editable.

## Known Gaps

- The scanner uses the core annotation model. The first widget renderer still
  renders that model back to HTML, but the range data now comes from semantic
  slots rather than reparsing generated markup.
- Source-mode/editor syntax awareness is still shallow. Live Preview accepts
  host skip ranges and currently fills them with a line-level fallback scanner
  for obvious host syntax. Reliable handling of inline code, Markdown links,
  wiki links, math, HTML, and fenced code should come from CodeMirror
  syntax-tree data rather than more hand-written Markdown scanning.
- The emphasis reset is a targeted prototype shield. It can also suppress
  intentional Markdown emphasis later on the same line; a syntax tree-aware
  implementation should replace it.
- Reading view and Live Preview do not yet support complex Markdown inside the
  annotated base or annotation text. Some host-rendered DOM shapes can split the
  source before the adapter sees it.
- Widgets are not yet tuned for cursor motion, IME composition, or partial
  selection ergonomics.
- No commands or settings are exposed yet.

## Next Shape

The likely next step is a model-backed decoration layer:

```text
visible source range
  -> host syntax ranges
  -> InlineAnnotationModel
  -> DecorationSpec[]
```

That lets us decide per slot whether to render ruby, hide syntax punctuation,
or leave source visible. It also gives lint/fix commands the same source ranges
without reparsing generated HTML.
