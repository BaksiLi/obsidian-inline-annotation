import type { InlineAnnotationModel } from "markdown-it-inline-annotation/core";
import type { InlineAnnotationLivePreviewRange } from "./live-preview-ranges";

export type InlineAnnotationLivePreviewDecorationPlan =
  | {
      type: "replace";
      from: number;
      to: number;
      model: InlineAnnotationModel;
    }
  | {
      type: "reset-emphasis";
      from: number;
      to: number;
    };

export function planInlineAnnotationLivePreviewDecorations(
  ranges: readonly InlineAnnotationLivePreviewRange[],
  lineEnd: number
): InlineAnnotationLivePreviewDecorationPlan[] {
  const plans: InlineAnnotationLivePreviewDecorationPlan[] = [];

  for (const range of ranges) {
    plans.push({
      type: "replace",
      from: range.from,
      to: range.to,
      model: range.model,
    });
    if (range.resetMarkdownEmphasisAfter && range.to < lineEnd) {
      plans.push({
        type: "reset-emphasis",
        from: range.to,
        to: lineEnd,
      });
    }
  }

  return plans;
}
