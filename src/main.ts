import { Plugin } from "obsidian";
import { renderInlineAnnotationsInElement } from "./postprocessor";

export default class InlineAnnotationPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((element) => {
      renderInlineAnnotationsInElement(element);
    });
  }
}
