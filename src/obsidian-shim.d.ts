declare module "obsidian" {
  export interface MarkdownPostProcessorContext {
    sourcePath: string;
  }

  export class Plugin {
    registerMarkdownPostProcessor(
      postprocessor: (element: HTMLElement, context: MarkdownPostProcessorContext) => void | Promise<void>
    ): void;
  }
}
