# Changelog

## 0.3.5

- Add a Live Preview host range provider backed by Obsidian's CodeMirror syntax
  tree when `@codemirror/language` is available.
- Filter Live Preview annotations core-first: scan Inline Annotation source
  models first, then use host ranges only to suppress annotations fully
  contained inside host-owned Markdown. Partial host overlap, such as a syntax
  tree seeing `[base]` inside `[base]^^(...)`, no longer suppresses the
  annotation.
- Merge fallback Markdown ranges with syntax-tree ranges as a safety net for
  runtime differences and Obsidian-specific syntax.
- Keep `@codemirror/language` external so the plugin uses Obsidian's editor
  runtime instead of bundling another CodeMirror package.

## 0.3.2

- Track `markdown-it-inline-annotation@0.3.1`.
- Build Live Preview ranges from the shared multi-model scanner instead of a
  local scan loop, keeping Obsidian's source-range behavior aligned with core.
- Keep Live Preview planning line-scoped so Markdown-emphasis reset decorations
  cannot spill across visible-range boundaries.

## 0.3.1

- Prepare the Live Preview scanner for syntax-tree host ranges by separating
  annotation scanning from host-owned Markdown range detection.
- Keep a fallback host syntax scanner for obvious inline code, links, wiki
  links, math, and HTML tags.
- Add and maintain Obsidian-specific smoke/showcase notes copied by the vault
  installer.

## 0.3.0

- Track `markdown-it-inline-annotation@0.3.0`.
- Reset leaked Live Preview Markdown emphasis after hidden source delimiters.
- Add an early Live Preview CodeMirror extension. It renders annotations as
  replacement widgets while the cursor is outside the source span, and reveals
  the original source while editing.
- Build Live Preview ranges from the shared core annotation model, including
  overflow ranges for extra pipe levels.
- Keep `@codemirror/state` and `@codemirror/view` external so the plugin uses
  Obsidian's editor runtime instead of bundling a second CodeMirror instance.
- Add pure Live Preview range tests and complete overline class-mode CSS.

## 0.2.1

- Track `markdown-it-inline-annotation@0.2.1`.
- Use the shared core's conservative `spaceAlignment: "auto"` policy in Reading
  view, keeping plain multi-word glosses grouped while aligning phonetic
  readings such as `[取り返す]^^(と り かえ す)`.

## 0.2.0

- Track Inline Annotation v2 via `markdown-it-inline-annotation@0.2.0`.
- Adds Reading view support for symmetric overline marks and the v2 visible
  pipe-overflow behavior through the shared renderer.

## 0.1.0

- Initial Obsidian Reading view prototype.
- Renders Inline Annotation syntax through an Obsidian Markdown postprocessor.
- Bundles `markdown-it-inline-annotation/core` and keeps `obsidian` external.
- Ships canonical `ia-*` Reading view styles.
- Disables space-based per-character alignment by default for academic notes
  with multi-word glosses.
- Includes a runtime-only vault installer and focused smoke note.
