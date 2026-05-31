import { Plugin } from "obsidian";
import { inlineAnnotationLivePreviewExtension } from "./live-preview";
import { renderInlineAnnotationsInElement } from "./postprocessor";

export default class InlineAnnotationPlugin extends Plugin {
  onload() {
    this.registerMarkdownPostProcessor((element) => {
      renderInlineAnnotationsInElement(element);
    });
    this.registerEditorExtension(inlineAnnotationLivePreviewExtension());
  }
}
