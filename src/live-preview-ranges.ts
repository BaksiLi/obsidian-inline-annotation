import {
  findInlineAnnotationModel,
  renderInlineAnnotationModelToHtml,
  type InlineAnnotationModel,
  type InlineAnnotationOptions,
} from "markdown-it-inline-annotation/core";
import {
  collectFallbackHostMarkdownRanges,
  mergeSourceRanges,
  type SourceRange,
} from "./live-preview-host-syntax";
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
  baseOffset = 0,
  hostSkipRanges: readonly SourceRange[] = collectFallbackHostMarkdownRanges(text)
): InlineAnnotationLivePreviewRange[] {
  const ranges: InlineAnnotationLivePreviewRange[] = [];
  const skipRanges = mergeSourceRanges(hostSkipRanges);
  let segmentStart = 0;

  for (const skipRange of skipRanges) {
    collectAnnotationRanges(text, segmentStart, skipRange.from, selections, options, baseOffset, ranges);
    segmentStart = skipRange.to;
  }

  collectAnnotationRanges(text, segmentStart, text.length, selections, options, baseOffset, ranges);

  return ranges;
}

function collectAnnotationRanges(
  text: string,
  segmentStart: number,
  segmentEnd: number,
  selections: readonly TextSelectionRange[],
  options: InlineAnnotationOptions,
  baseOffset: number,
  ranges: InlineAnnotationLivePreviewRange[]
): void {
  let pos = segmentStart;

  while (pos < segmentEnd) {
    const model = findInlineAnnotationModel(text, pos, segmentEnd, options);
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
}
