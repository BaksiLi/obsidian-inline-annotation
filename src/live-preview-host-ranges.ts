import type { EditorView } from "@codemirror/view";
import {
  collectFallbackHostMarkdownRanges,
  mergeSourceRanges,
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

interface SyntaxTreeModule {
  syntaxTree(state: unknown): SyntaxTreeLike;
}

interface SyntaxTreeLike {
  cursor?: () => SyntaxTreeCursorLike;
  iterate?: (spec: {
    from?: number;
    to?: number;
    enter: (...args: unknown[]) => void | false;
  }) => void;
}

interface SyntaxTreeCursorLike extends SyntaxTreeNodeLike {
  firstChild(): boolean;
  nextSibling(): boolean;
  parent(): boolean;
}

interface SyntaxTreeNodeLike {
  name: string;
  from: number;
  to: number;
}

function loadSyntaxTreeModule(): SyntaxTreeModule | null {
  try {
    return require("@codemirror/language") as SyntaxTreeModule;
  } catch {
    return null;
  }
}

function isHostOwnedMarkdownNode(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return false;
  if (normalized.includes("inlinecode") || normalized.includes("codespan")) return true;
  if (normalized.includes("codeblock") || normalized.includes("fencedcode")) return true;
  if (normalized.includes("html") || normalized.includes("tag")) return true;
  if (normalized.includes("wikilink") || normalized.includes("internallink")) return true;
  if (normalized.includes("link") || normalized.includes("url") || normalized.includes("image") || normalized.includes("embed")) return true;
  if (normalized.includes("math") || normalized.includes("latex")) return true;
  return false;
}

function addClippedRange(ranges: SourceRange[], node: SyntaxTreeNodeLike, lineFrom: number, lineTo: number): void {
  if (!isHostOwnedMarkdownNode(node.name)) return;
  const from = Math.max(node.from, lineFrom) - lineFrom;
  const to = Math.min(node.to, lineTo) - lineFrom;
  if (to > from) ranges.push({ from, to });
}

function normalizeSyntaxNode(args: unknown[]): SyntaxTreeNodeLike | null {
  const first = args[0] as { name?: unknown; type?: { name?: unknown }; from?: unknown; to?: unknown } | undefined;
  if (!first) return null;

  const name = typeof first.name === "string" ? first.name : typeof first.type?.name === "string" ? first.type.name : "";
  const from = typeof first.from === "number" ? first.from : typeof args[1] === "number" ? args[1] : NaN;
  const to = typeof first.to === "number" ? first.to : typeof args[2] === "number" ? args[2] : NaN;

  return name && Number.isFinite(from) && Number.isFinite(to) ? { name, from, to } : null;
}

export function collectSyntaxTreeHostMarkdownRanges(tree: SyntaxTreeLike, lineFrom: number, lineTo: number): SourceRange[] {
  const ranges: SourceRange[] = [];

  if (typeof tree.iterate === "function") {
    tree.iterate({
      from: lineFrom,
      to: lineTo,
      enter(...args) {
        const node = normalizeSyntaxNode(args);
        if (!node) return;
        addClippedRange(ranges, node, lineFrom, lineTo);
      },
    });
    return mergeSourceRanges(ranges);
  }

  const cursor = tree.cursor?.();
  if (!cursor) return ranges;

  function visit(): void {
    addClippedRange(ranges, cursor!, lineFrom, lineTo);
    if (!cursor!.firstChild()) return;
    do {
      visit();
    } while (cursor!.nextSibling());
    cursor!.parent();
  }

  visit();
  return mergeSourceRanges(ranges);
}

export const syntaxTreeLivePreviewHostRangeProvider: LivePreviewHostRangeProvider = (context) => {
  const fallbackRanges = fallbackLivePreviewHostRangeProvider(context);
  const syntaxTreeModule = loadSyntaxTreeModule();
  if (!syntaxTreeModule) return fallbackRanges;

  const tree = syntaxTreeModule.syntaxTree(context.view.state);
  const syntaxTreeRanges = collectSyntaxTreeHostMarkdownRanges(tree, context.lineFrom, context.lineTo);
  return mergeSourceRanges([...fallbackRanges, ...syntaxTreeRanges]);
};

export function collectLivePreviewHostRanges(
  context: LivePreviewHostRangeContext,
  provider: LivePreviewHostRangeProvider = syntaxTreeLivePreviewHostRangeProvider
): SourceRange[] {
  return provider(context);
}
