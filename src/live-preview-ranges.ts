import {
  findInlineAnnotationModel,
  renderInlineAnnotationModelToHtml,
  type InlineAnnotationModel,
  type InlineAnnotationOptions,
} from "markdown-it-inline-annotation/core";
import { OBSIDIAN_RENDER_OPTIONS } from "./render-options";

export interface TextSelectionRange {
  from: number;
  to: number;
}

export interface InlineAnnotationLivePreviewRange {
  from: number;
  to: number;
  html: string;
  model: InlineAnnotationModel;
  resetMarkdownEmphasisAfter: boolean;
  source: string;
}

function touchesSelection(from: number, to: number, selections: readonly TextSelectionRange[]): boolean {
  for (const selection of selections) {
    const selectionFrom = Math.min(selection.from, selection.to);
    const selectionTo = Math.max(selection.from, selection.to);
    if (selectionFrom === selectionTo) {
      if (selectionFrom >= from && selectionFrom <= to) return true;
    } else if (selectionFrom < to && selectionTo > from) {
      return true;
    }
  }
  return false;
}

function mayLeakMarkdownEmphasis(source: string): boolean {
  return source.includes("^_(") || source.includes("*");
}

export function findInlineAnnotationLivePreviewRanges(
  text: string,
  selections: readonly TextSelectionRange[] = [],
  options: InlineAnnotationOptions = OBSIDIAN_RENDER_OPTIONS,
  baseOffset = 0
): InlineAnnotationLivePreviewRange[] {
  const ranges: InlineAnnotationLivePreviewRange[] = [];
  let pos = 0;

  while (pos < text.length) {
    const model = findInlineAnnotationModel(text, pos, text.length, options);
    if (!model) break;
    if (model.end <= pos) {
      pos++;
      continue;
    }

    const from = baseOffset + model.start;
    const to = baseOffset + model.end;

    if (!touchesSelection(from, to, selections)) {
      ranges.push({
        from,
        to,
        html: renderInlineAnnotationModelToHtml(model, options),
        model,
        resetMarkdownEmphasisAfter: mayLeakMarkdownEmphasis(model.source),
        source: model.source,
      });
    }

    pos = model.end;
  }

  return ranges;
}
