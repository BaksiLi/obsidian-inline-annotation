import {
  findInlineAnnotationModels,
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

function isContainedByHostRange(model: InlineAnnotationModel, hostSkipRanges: readonly SourceRange[]): boolean {
  return hostSkipRanges.some((range) => range.from <= model.start && range.to >= model.end);
}

function collectAnnotationRanges(
  text: string,
  segmentStart: number,
  segmentEnd: number,
  selections: readonly TextSelectionRange[],
  options: InlineAnnotationOptions,
  baseOffset: number,
  hostSkipRanges: readonly SourceRange[]
): InlineAnnotationLivePreviewRange[] {
  const ranges: InlineAnnotationLivePreviewRange[] = [];
  const models = findInlineAnnotationModels(text, segmentStart, segmentEnd, options);

  for (const model of models) {
    if (isContainedByHostRange(model, hostSkipRanges)) continue;

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
  }

  return ranges;
}

export function findInlineAnnotationLivePreviewRanges(
  text: string,
  selections: readonly TextSelectionRange[] = [],
  options: InlineAnnotationOptions = OBSIDIAN_RENDER_OPTIONS,
  baseOffset = 0,
  hostSkipRanges: readonly SourceRange[] = collectFallbackHostMarkdownRanges(text)
): InlineAnnotationLivePreviewRange[] {
  const skipRanges = mergeSourceRanges(hostSkipRanges);
  return collectAnnotationRanges(text, 0, text.length, selections, options, baseOffset, skipRanges);
}
