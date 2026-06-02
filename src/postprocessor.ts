import {
  findInlineAnnotation,
  findInlineAnnotationModels,
  renderInlineAnnotationModelToHtml,
  renderInlineAnnotationsToHtml,
  type InlineAnnotationModel,
} from "markdown-it-inline-annotation/core";
import { OBSIDIAN_RENDER_OPTIONS } from "./render-options";

const SKIP_TAGS = new Set(["A", "CODE", "PRE", "RUBY", "SCRIPT", "STYLE", "TEXTAREA"]);

export interface InlineAnnotationRenderStats {
  replacements: number;
}

export function renderInlineAnnotationsInElement(root: HTMLElement): InlineAnnotationRenderStats {
  let replacements = 0;
  const document = root.ownerDocument;
  const nodeFilter = document.defaultView?.NodeFilter ?? NodeFilter;
  const walker = document.createTreeWalker(root, nodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !findInlineAnnotation(node.nodeValue, 0, node.nodeValue.length, OBSIDIAN_RENDER_OPTIONS)) {
        return nodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent || shouldSkipElement(parent, root)) return nodeFilter.FILTER_REJECT;
      return nodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    replaceTextNode(node);
    replacements++;
  }

  replacements += replaceFragmentedAnnotations(root);
  return { replacements };
}

function shouldSkipElement(element: Element, root: Element): boolean {
  for (let current: Element | null = element; current; current = current.parentElement) {
    if (SKIP_TAGS.has(current.tagName)) return true;
    if (current.hasAttribute("data-inline-annotation-ignore")) return true;
    if (current === root) return false;
  }
  return false;
}

function replaceTextNode(node: Text): void {
  const html = renderInlineAnnotationsToHtml(node.nodeValue ?? "", OBSIDIAN_RENDER_OPTIONS);
  const template = node.ownerDocument.createElement("template");
  template.innerHTML = html;
  node.replaceWith(template.content);
}

interface TextRun {
  node: Text;
  start: number;
  end: number;
  eligible: boolean;
}

function replaceFragmentedAnnotations(root: HTMLElement): number {
  let replacements = 0;
  while (replaceOneFragmentedAnnotation(root)) replacements++;
  return replacements;
}

function replaceOneFragmentedAnnotation(root: HTMLElement): boolean {
  const document = root.ownerDocument;
  const nodeFilter = document.defaultView?.NodeFilter ?? NodeFilter;
  const walker = document.createTreeWalker(root, nodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.nodeValue ?? "";
    if (!text.includes("^^(") && !text.includes("^_(")) continue;
    if (!node.parentElement || shouldSkipElement(node.parentElement, root)) continue;

    for (let container: Element | null = node.parentElement; container; container = container.parentElement) {
      if (shouldSkipElement(container, root)) break;
      const match = findFragmentedMatch(container, root);
      if (!match) continue;
      replaceTextRange(container, match);
      return true;
    }
  }

  return false;
}

function findFragmentedMatch(container: Element, root: HTMLElement): { runs: TextRun[]; model: InlineAnnotationModel } | null {
  const runs = collectTextRuns(container, root);
  const text = runs.map((run) => run.node.nodeValue ?? "").join("");
  const models = findInlineAnnotationModels(text, 0, text.length, OBSIDIAN_RENDER_OPTIONS);

  for (const model of models) {
    const touchedRuns = runs.filter((run) => run.end > model.start && run.start < model.end);
    if (touchedRuns.length <= 1) continue;
    if (touchedRuns.some((run) => !run.eligible)) continue;
    return { runs, model };
  }

  return null;
}

function collectTextRuns(container: Element, root: HTMLElement): TextRun[] {
  const document = container.ownerDocument;
  const nodeFilter = document.defaultView?.NodeFilter ?? NodeFilter;
  const walker = document.createTreeWalker(container, nodeFilter.SHOW_TEXT);
  const runs: TextRun[] = [];
  let offset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.nodeValue ?? "";
    const parent = node.parentElement;
    runs.push({
      node,
      start: offset,
      end: offset + text.length,
      eligible: Boolean(parent && !shouldSkipElement(parent, root)),
    });
    offset += text.length;
  }

  return runs;
}

function findRunAt(runs: TextRun[], offset: number, side: "start" | "end"): { run: TextRun; offset: number } | null {
  for (const run of runs) {
    if (offset > run.start && offset < run.end) return { run, offset: offset - run.start };
    if (side === "start" && offset === run.start) return { run, offset: 0 };
    if (side === "end" && offset === run.end) return { run, offset: run.end - run.start };
  }
  return null;
}

function replaceTextRange(container: Element, match: { runs: TextRun[]; model: InlineAnnotationModel }): void {
  const start = findRunAt(match.runs, match.model.start, "start");
  const end = findRunAt(match.runs, match.model.end, "end");
  if (!start || !end) return;

  const html = renderInlineAnnotationModelToHtml(match.model, OBSIDIAN_RENDER_OPTIONS);
  const template = container.ownerDocument.createElement("template");
  template.innerHTML = html;

  const range = container.ownerDocument.createRange();
  range.setStart(start.run.node, start.offset);
  range.setEnd(end.run.node, end.offset);
  range.deleteContents();
  range.insertNode(template.content);
}
