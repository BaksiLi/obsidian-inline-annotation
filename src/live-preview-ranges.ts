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

interface SourceRange {
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

function mergeRanges(ranges: SourceRange[]): SourceRange[] {
  const sorted = ranges
    .filter((range) => range.to > range.from)
    .sort((left, right) => left.from - right.from || left.to - right.to);
  const merged: SourceRange[] = [];

  for (const range of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && range.from <= previous.to) {
      previous.to = Math.max(previous.to, range.to);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

function countRun(text: string, index: number, char: string): number {
  let count = 0;
  while (text[index + count] === char) count++;
  return count;
}

function isEscaped(text: string, index: number): boolean {
  let backslashes = 0;
  for (let pos = index - 1; pos >= 0 && text[pos] === "\\"; pos--) backslashes++;
  return backslashes % 2 === 1;
}

function findClosingBracket(text: string, open: number): number {
  let depth = 0;
  for (let pos = open + 1; pos < text.length; pos++) {
    if (isEscaped(text, pos)) continue;
    if (text[pos] === "[") depth++;
    if (text[pos] === "]") {
      if (depth === 0) return pos;
      depth--;
    }
  }
  return -1;
}

function findClosingParen(text: string, open: number): number {
  let depth = 0;
  for (let pos = open + 1; pos < text.length; pos++) {
    if (isEscaped(text, pos)) continue;
    if (text[pos] === "(") depth++;
    if (text[pos] === ")") {
      if (depth === 0) return pos;
      depth--;
    }
  }
  return -1;
}

function findClosingDelimiter(text: string, open: number, delimiter: string): number {
  for (let pos = open + delimiter.length; pos < text.length; pos++) {
    if (isEscaped(text, pos)) continue;
    if (text.startsWith(delimiter, pos)) return pos + delimiter.length;
  }
  return -1;
}

function collectHostMarkdownSkipRanges(text: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  let pos = 0;

  while (pos < text.length) {
    if (text[pos] === "`") {
      const tickCount = countRun(text, pos, "`");
      const delimiter = "`".repeat(tickCount);
      const end = findClosingDelimiter(text, pos, delimiter);
      if (end > pos) {
        ranges.push({ from: pos, to: end });
        pos = end;
        continue;
      }
    }

    if (text[pos] === "$" && !isEscaped(text, pos)) {
      const delimiter = text[pos + 1] === "$" ? "$$" : "$";
      const end = findClosingDelimiter(text, pos, delimiter);
      if (end > pos) {
        ranges.push({ from: pos, to: end });
        pos = end;
        continue;
      }
    }

    if (text.startsWith("[[", pos) && !isEscaped(text, pos)) {
      const end = text.indexOf("]]", pos + 2);
      if (end !== -1) {
        ranges.push({ from: pos, to: end + 2 });
        pos = end + 2;
        continue;
      }
    }

    if (text[pos] === "<" && !isEscaped(text, pos)) {
      const end = text.indexOf(">", pos + 1);
      if (end !== -1) {
        const tag = text.slice(pos, end + 1);
        if (/^<\/?[A-Za-z][^>]*>$/.test(tag)) {
          ranges.push({ from: pos, to: end + 1 });
          pos = end + 1;
          continue;
        }
      }
    }

    const linkStart = text[pos] === "!" && text[pos + 1] === "[" ? pos + 1 : text[pos] === "[" ? pos : -1;
    if (linkStart !== -1 && !isEscaped(text, linkStart)) {
      const labelEnd = findClosingBracket(text, linkStart);
      if (labelEnd !== -1) {
        if (text[labelEnd + 1] === "(") {
          const linkEnd = findClosingParen(text, labelEnd + 1);
          if (linkEnd !== -1) {
            ranges.push({ from: pos, to: linkEnd + 1 });
            pos = linkEnd + 1;
            continue;
          }
        } else if (text[labelEnd + 1] === "[") {
          const referenceEnd = findClosingBracket(text, labelEnd + 1);
          if (referenceEnd !== -1) {
            ranges.push({ from: pos, to: referenceEnd + 1 });
            pos = referenceEnd + 1;
            continue;
          }
        }
      }
    }

    pos++;
  }

  return mergeRanges(ranges);
}

export function findInlineAnnotationLivePreviewRanges(
  text: string,
  selections: readonly TextSelectionRange[] = [],
  options: InlineAnnotationOptions = OBSIDIAN_RENDER_OPTIONS,
  baseOffset = 0
): InlineAnnotationLivePreviewRange[] {
  const ranges: InlineAnnotationLivePreviewRange[] = [];
  const skipRanges = collectHostMarkdownSkipRanges(text);
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
