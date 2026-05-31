import { findInlineAnnotation, type InlineAnnotationOptions } from "markdown-it-inline-annotation/core";
import { OBSIDIAN_RENDER_OPTIONS } from "./render-options";

export interface TextSelectionRange {
  from: number;
  to: number;
}

export interface InlineAnnotationLivePreviewRange {
  from: number;
  to: number;
  html: string;
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

export function findInlineAnnotationLivePreviewRanges(
  text: string,
  selections: readonly TextSelectionRange[] = [],
  options: InlineAnnotationOptions = OBSIDIAN_RENDER_OPTIONS,
  baseOffset = 0
): InlineAnnotationLivePreviewRange[] {
  const ranges: InlineAnnotationLivePreviewRange[] = [];
  let pos = 0;

  while (pos < text.length) {
    const match = findInlineAnnotation(text, pos, text.length, options);
    if (!match) break;
    if (match.end <= pos) {
      pos++;
      continue;
    }

    const from = baseOffset + match.start;
    const to = baseOffset + match.end;

    if (!touchesSelection(from, to, selections)) {
      ranges.push({
        from,
        to,
        html: match.html,
        source: match.source,
      });
    }

    pos = match.end;
  }

  return ranges;
}
