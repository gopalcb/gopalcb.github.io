declare module "katex/contrib/auto-render" {
  import { KatexOptions } from "katex";
  export interface AutoRenderOptions extends KatexOptions {
    delimiters?: { left: string; right: string; display: boolean }[];
    ignoredTags?: string[];
    ignoredClasses?: string[];
  }
  export default function renderMathInElement(
    element: HTMLElement,
    options?: AutoRenderOptions,
  ): void;
}
