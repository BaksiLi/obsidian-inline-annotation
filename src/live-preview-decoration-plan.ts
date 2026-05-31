import type { InlineAnnotationLivePreviewRange } from "./live-preview-ranges";

export type InlineAnnotationLivePreviewDecorationPlan =
  | {
      type: "replace";
      from: number;
      to: number;
      html: string;
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
      html: range.html,
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
