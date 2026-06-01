import type { EditorView } from "@codemirror/view";
import {
  collectFallbackHostMarkdownRanges,
  type SourceRange,
} from "./live-preview-host-syntax";

export interface LivePreviewHostRangeContext {
  view: EditorView;
  text: string;
  lineFrom: number;
  lineTo: number;
}

export type LivePreviewHostRangeProvider = (context: LivePreviewHostRangeContext) => SourceRange[];

export const fallbackLivePreviewHostRangeProvider: LivePreviewHostRangeProvider = (context) => {
  return collectFallbackHostMarkdownRanges(context.text);
};

export function collectLivePreviewHostRanges(
  context: LivePreviewHostRangeContext,
  provider: LivePreviewHostRangeProvider = fallbackLivePreviewHostRangeProvider
): SourceRange[] {
  return provider(context);
}
