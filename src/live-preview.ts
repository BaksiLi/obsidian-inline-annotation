import type { Extension, Range } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import {
  collectFallbackHostMarkdownRanges,
  type SourceRange,
} from "./live-preview-host-syntax";
import { planInlineAnnotationLivePreviewLine } from "./live-preview-line";

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

function collectHostSyntaxRangesForLine(_view: EditorView, text: string, _lineFrom: number, _lineTo: number): SourceRange[] {
  return collectFallbackHostMarkdownRanges(text);
}

function buildDecorations(view: EditorView): DecorationSet {
  if (!livePreviewEnabled(view)) return Decoration.none;

  const decorations: Range<Decoration>[] = [];
  const selections = view.state.selection.ranges.map((range) => ({ from: range.from, to: range.to }));
  const seenLines = new Set<number>();

  for (const visibleRange of view.visibleRanges) {
    const firstLine = view.state.doc.lineAt(visibleRange.from);
    const lastLine = view.state.doc.lineAt(visibleRange.to);

    for (let lineNumber = firstLine.number; lineNumber <= lastLine.number; lineNumber++) {
      const line = view.state.doc.line(lineNumber);
      if (seenLines.has(line.from)) continue;
      seenLines.add(line.from);

      const text = view.state.doc.sliceString(line.from, line.to);
      const hostSkipRanges = collectHostSyntaxRangesForLine(view, text, line.from, line.to);
      for (const plan of planInlineAnnotationLivePreviewLine({
        text,
        selections,
        baseOffset: line.from,
        lineEnd: line.to,
        hostSkipRanges,
      })) {
        if (plan.type === "replace") {
          decorations.push(
            Decoration.replace({
              widget: new InlineAnnotationWidget(plan.html),
              inclusive: false,
            }).range(plan.from, plan.to)
          );
          continue;
        }
        decorations.push(
          Decoration.mark({
            class: "ia-live-preview-markdown-reset",
          }).range(plan.from, plan.to)
        );
      }
    }
  }

  return Decoration.set(decorations, true);
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
