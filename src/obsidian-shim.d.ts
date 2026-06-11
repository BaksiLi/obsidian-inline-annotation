declare module "obsidian" {
  import type { Extension, StateField } from "@codemirror/state";

  export const editorLivePreviewField: StateField<boolean>;

  export interface MarkdownPostProcessorContext {
    sourcePath: string;
  }

  export class Plugin {
    registerMarkdownPostProcessor(
      postprocessor: (element: HTMLElement, context: MarkdownPostProcessorContext) => void | Promise<void>
    ): void;
    registerEditorExtension(extension: Extension): void;
  }
}
