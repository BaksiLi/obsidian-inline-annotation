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

## Why Replacement Widgets First

Replacement widgets are blunt, but they answer the first product question:
"Can this syntax look right in Live Preview without breaking basic editing?"

They avoid the harder partial-editing problem for now. The source is either
fully rendered or fully visible; we do not yet try to hide only operators,
parentheses, or annotation text while leaving the base editable.

## Known Gaps

- The scanner currently uses the published core HTML/range API. After
  `markdown-it-inline-annotation@0.3.0` is published, Live Preview should switch
  to `findInlineAnnotationModel` so decorations are built from the semantic
  slot model.
- Source-mode/editor syntax awareness is minimal. Reading view skips rendered
  links and code after Obsidian's Markdown parser has handled them; Live Preview
  sees raw text and needs its own syntax-aware skip policy.
- Widgets are not yet tuned for cursor motion, IME composition, or partial
  selection ergonomics.
- No commands or settings are exposed yet.

## Next Shape

The likely next step is a model-backed decoration layer:

```text
visible source range -> InlineAnnotationModel -> DecorationSpec[]
```

That lets us decide per slot whether to render ruby, hide syntax punctuation,
or leave source visible. It also gives lint/fix commands the same source ranges
without reparsing generated HTML.
