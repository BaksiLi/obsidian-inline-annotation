import {
  findInlineAnnotation,
  renderInlineAnnotationsToHtml,
  type InlineAnnotationOptions,
} from "markdown-it-inline-annotation/core";

const SKIP_TAGS = new Set(["A", "CODE", "PRE", "RUBY", "SCRIPT", "STYLE", "TEXTAREA"]);
const OBSIDIAN_RENDER_OPTIONS: InlineAnnotationOptions = {
  spaceAlignment: "auto",
};

export interface InlineAnnotationRenderStats {
  replacements: number;
}

export function renderInlineAnnotationsInElement(root: HTMLElement): InlineAnnotationRenderStats {
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

  for (const node of textNodes) replaceTextNode(node);
  return { replacements: textNodes.length };
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
