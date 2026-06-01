import type { InlineAnnotationOptions } from "markdown-it-inline-annotation/core";
import {
  type InlineAnnotationLivePreviewDecorationPlan,
  planInlineAnnotationLivePreviewDecorations,
} from "./live-preview-decoration-plan";
import { type SourceRange } from "./live-preview-host-syntax";
import { findInlineAnnotationLivePreviewRanges, type TextSelectionRange } from "./live-preview-ranges";
import { OBSIDIAN_RENDER_OPTIONS } from "./render-options";

export interface InlineAnnotationLivePreviewLineInput {
  text: string;
  selections?: readonly TextSelectionRange[];
  options?: InlineAnnotationOptions;
  baseOffset?: number;
  lineEnd?: number;
  hostSkipRanges?: readonly SourceRange[];
}

export function planInlineAnnotationLivePreviewLine(
  input: InlineAnnotationLivePreviewLineInput
): InlineAnnotationLivePreviewDecorationPlan[] {
  const baseOffset = input.baseOffset ?? 0;
  const lineEnd = input.lineEnd ?? baseOffset + input.text.length;
  const ranges = findInlineAnnotationLivePreviewRanges(
    input.text,
    input.selections ?? [],
    input.options ?? OBSIDIAN_RENDER_OPTIONS,
    baseOffset,
    input.hostSkipRanges
  );

  return planInlineAnnotationLivePreviewDecorations(ranges, lineEnd);
}
