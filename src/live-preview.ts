import { RangeSetBuilder, type Extension } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { findInlineAnnotationLivePreviewRanges } from "./live-preview-ranges";

class InlineAnnotationWidget extends WidgetType {
  constructor(private readonly html: string) {
    super();
  }

  eq(other: InlineAnnotationWidget): boolean {
    return this.html === other.html;
  }

  toDOM(): HTMLElement {
    const element = document.createElement("span");
    element.className = "ia-live-preview-widget";
    element.innerHTML = this.html;
    return element;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function livePreviewEnabled(view: EditorView): boolean {
  return view.state.field(editorLivePreviewField, false) === true;
}

function buildDecorations(view: EditorView): DecorationSet {
  if (!livePreviewEnabled(view)) return Decoration.none;

  const builder = new RangeSetBuilder<Decoration>();
  const selections = view.state.selection.ranges.map((range) => ({ from: range.from, to: range.to }));
  const seen = new Set<number>();

  for (const visibleRange of view.visibleRanges) {
    const from = view.state.doc.lineAt(visibleRange.from).from;
    const to = view.state.doc.lineAt(visibleRange.to).to;
    const text = view.state.doc.sliceString(from, to);
    const ranges = findInlineAnnotationLivePreviewRanges(text, selections, undefined, from);
    for (const range of ranges) {
      if (seen.has(range.from)) continue;
      seen.add(range.from);
      builder.add(
        range.from,
        range.to,
        Decoration.replace({
          widget: new InlineAnnotationWidget(range.html),
          inclusive: false,
        })
      );
    }
  }

  return builder.finish();
}

class InlineAnnotationLivePreviewPlugin {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    const livePreviewChanged = update.startState.field(editorLivePreviewField, false) !== update.state.field(editorLivePreviewField, false);
    if (update.docChanged || update.selectionSet || update.viewportChanged || livePreviewChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

export function inlineAnnotationLivePreviewExtension(): Extension {
  return ViewPlugin.fromClass(InlineAnnotationLivePreviewPlugin, {
    decorations: (plugin) => plugin.decorations,
  });
}
