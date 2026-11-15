import { AfterViewChecked, Directive, ElementRef, inject } from "@angular/core";
import renderMathInElement from "katex/contrib/auto-render";
import { MATH_DELIMITERS, matchEquation } from "./math-markdown";

/** Typeset sanitized article text after Angular binding, never imported math HTML. */
@Directive({ selector: "[noteEquations]" })
export class NoteEquationsDirective implements AfterViewChecked {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private rendered: ChildNode | null = null;
  ngAfterViewChecked() {
    const element = this.host.nativeElement;
    if (element.firstChild === this.rendered) return;
    prepareInlineMath(element);
    renderMathInElement(element, {
      // Single dollars are normalized only when they meet math boundaries.
      delimiters: MATH_DELIMITERS.filter((delimiter) => delimiter.left !== "$"),
      ignoredClasses: ["katex"],
      throwOnError: false,
      trust: false,
      strict: "error",
      maxSize: 10,
      maxExpand: 1000,
      output: "htmlAndMathml",
    });
    this.rendered = element.firstChild;
  }
}

/** Keep ordinary prices literal while allowing $a$ and $b$ in sanitized text. */
function prepareInlineMath(element: HTMLElement) {
  const walker = element.ownerDocument.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
  );
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (
      current.parentElement?.closest(
        "pre,code,script,noscript,style,textarea,option,.katex,.katex-error",
      )
    )
      continue;
    const source = current.textContent || "";
    let output = "",
      offset = 0;
    while (offset < source.length) {
      const next = source.slice(offset).search(/\$|\\[\[(]/);
      if (next === -1) {
        output += source.slice(offset);
        break;
      }
      const start = offset + next;
      output += source.slice(offset, start);
      const preceding = source.slice(0, start).match(/\\+$/)?.[0].length || 0;
      const match =
        preceding % 2 === 0 ? matchEquation(source.slice(start)) : undefined;
      if (!match) {
        output += source[start];
        offset = start + 1;
        continue;
      }
      output += match.opening === "$" ? "\\(" + match.body + "\\)" : match.raw;
      offset = start + match.raw.length;
    }
    if (output !== source) current.textContent = output;
  }
}
