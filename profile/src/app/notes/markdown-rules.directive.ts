import {
  AfterViewChecked,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  inject,
} from "@angular/core";
import { NoteEquationsDirective } from "./note-equations.directive";
import { NoteMermaidDirective } from "./note-mermaid.directive";
import { MARKDOWN_ELEMENTS, parseDeclarations } from "./markdown-styling";
/** Apply validated declarations after Angular inserts sanitized article HTML. */
@Directive({
  selector: "[markdownRules]",
  hostDirectives: [NoteEquationsDirective, NoteMermaidDirective],
})
export class MarkdownRulesDirective implements OnChanges, AfterViewChecked {
  @Input() markdownRules: Record<string, string> = {};
  @Input() markdownSource = "";
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private pending = true;
  private rendered: ChildNode | null = null;
  private applied: [HTMLElement, string][] = [];
  ngOnChanges() {
    this.pending = true;
  }
  ngAfterViewChecked() {
    const rendered = this.host.nativeElement.firstChild;
    if (!this.pending && rendered === this.rendered) return;
    this.rendered = rendered;
    this.pending = false;
    for (const [node, property] of this.applied)
      node.style.removeProperty(property);
    this.applied = [];
    for (const target of MARKDOWN_ELEMENTS) {
      const parsed = parseDeclarations(
        this.markdownRules[target.value] || "",
        target.value,
      );
      if (parsed.error) continue;
      for (const node of Array.from(
        this.host.nativeElement.querySelectorAll<HTMLElement>(target.selector),
      )) {
        for (const [property, value] of parsed.declarations) {
          node.style.setProperty(property, value);
          this.applied.push([node, property]);
        }
      }
    }
  }
}
