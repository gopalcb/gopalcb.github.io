import { AfterViewChecked, Directive, ElementRef, Input, inject } from "@angular/core";

const NOTE_ID = "design-decision-and-model-selection-embeddings-and-database";
const TABLE_CLASS = "memory-mesh-design-decisions";
const HEADERS = ["Design Dimension", "General Principle / Trade-Off", "rag-memory-mesh Implementation", "Why It Works Here"];
const COMPACT_TABLE_LAYOUTS = new Map([
  ["embedding-and-agent-design-decision-and-model-selection", "embedding"],
  ["vector-database-selection", "compact"],
  ["deep-agents-harness-and-main-agent-vs-agent-mesh-collaboration", "collaboration"],
  ["deep-agents-sandboxing-and-web-crawling-for-knowledge-mining", "sandboxing"],
]);

/** Apply app-owned layouts by stable note ID, with a separate marker for the reference table. */
@Directive({
  selector: "[noteTableLayout]",
  host: { "[attr.data-table-layout]": "compactTableLayout" },
})
export class NoteTableLayoutDirective implements AfterViewChecked {
  @Input() noteTableLayout = "";
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private rendered: ChildNode | null = null;
  private noteId: string | null = null;

  get compactTableLayout() {
    return COMPACT_TABLE_LAYOUTS.get(this.noteTableLayout) ?? null;
  }

  ngAfterViewChecked() {
    const root = this.host.nativeElement;
    if (this.rendered === root.firstChild && this.noteId === this.noteTableLayout) return;
    this.rendered = root.firstChild;
    this.noteId = this.noteTableLayout;
    for (const table of Array.from(root.querySelectorAll("table." + TABLE_CLASS))) table.classList.remove(TABLE_CLASS);
    if (this.noteId !== NOTE_ID) return;
    for (const table of Array.from(root.querySelectorAll("table"))) {
      const headers = Array.from(table.querySelectorAll(":scope > thead > tr > th"));
      if (headers.length !== HEADERS.length || headers.some((cell, index) => this.text(cell) !== HEADERS[index])) continue;
      let heading = table.previousElementSibling;
      while (heading && !heading.matches("h1,h2,h3,h4,h5,h6")) heading = heading.previousElementSibling;
      if (!heading || this.text(heading) !== "Design decisions for rag-memory-mesh") continue;
      table.classList.add(TABLE_CLASS);
      break;
    }
  }

  private text(element: Element) {
    return (element.textContent || "").replace(/\s+/g, " ").trim();
  }
}
