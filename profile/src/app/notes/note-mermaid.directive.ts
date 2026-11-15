import { FLOWCHART_CSS, addDiagramIcons } from './diagram-presentation';
import {
  AfterViewChecked, Directive, ElementRef, InjectionToken, OnDestroy,
  PendingTasks, inject,
} from "@angular/core";
import DOMPurify from "dompurify";
import { MAX_DIAGRAM_SOURCE, prepareDiagramSource } from "./mermaid-source";

let sequence = 0;

/** Library-created SVG is shown as an inert image, never inserted as active markup. */
export function diagramImage(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["foreignObject", "script", "image", "a", "animate", "animateMotion", "animateTransform", "set"],
    FORBID_ATTR: ["href", "xlink:href"],
  });
}

async function renderDiagram(source: string): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  const flowchart = /^\s*(?:flowchart|graph)\s/m.test(source);
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    htmlLabels: false,
    flowchart: { htmlLabels: false, curve: "linear", nodeSpacing: 48, rankSpacing: 64, diagramPadding: 32, padding: 20 },
    maxTextSize: MAX_DIAGRAM_SOURCE,
    maxEdges: 200,
    fontFamily: "Arial, sans-serif",
    theme: flowchart ? "base" : "neutral",
    ...(flowchart ? {
      themeVariables: { primaryColor: "#edf4f2", primaryTextColor: "#202936", primaryBorderColor: "#edf4f2", lineColor: "#6b7d80", secondaryColor: "#f1f4f8", tertiaryColor: "#f7f9f8", edgeLabelBackground: "#ffffff", fontSize: "14px" },
      themeCSS: FLOWCHART_CSS,
    } : {}),
    secure: ["securityLevel", "startOnLoad", "maxTextSize", "maxEdges", "htmlLabels", "flowchart", "fontFamily", "theme", "themeVariables", "themeCSS"],
  });
  const container = document.createElement("div");
  container.style.visibility = "hidden";
  container.style.position = "absolute";
  document.body.append(container);
  try {
    const result = await mermaid.render("note-diagram-" + ++sequence, source, container);
    return flowchart ? addDiagramIcons(result.svg) : result.svg;
  } finally {
    container.remove();
  }
}

export const NOTE_DIAGRAM_RENDERER = new InjectionToken<(source: string) => Promise<string>>(
  "Note diagram renderer", { providedIn: "root", factory: () => renderDiagram },
);

/** Render fenced Mermaid after sanitized article insertion, retaining readable source only on rendering failure. */
@Directive({ selector: "[noteMermaid]" })
export class NoteMermaidDirective implements AfterViewChecked, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly pending = inject(PendingTasks);
  private readonly render = inject(NOTE_DIAGRAM_RENDERER);
  private readonly visited = new WeakSet<HTMLElement>();
  private readonly images = new Map<HTMLElement, string>();
  private destroyed = false;

  ngAfterViewChecked() {
    const host = this.host.nativeElement;
    for (const [figure, url] of this.images) {
      if (!host.contains(figure)) {
        URL.revokeObjectURL(url);
        this.images.delete(figure);
      }
    }
    for (const code of Array.from(host.querySelectorAll<HTMLElement>('pre > code.note-mermaid-source'))) {
      if (this.visited.has(code)) continue;
      this.visited.add(code);
      void this.draw(code);
    }
  }

  private async draw(code: HTMLElement) {
    const source = code.textContent || "";
    const prepared = prepareDiagramSource(source);
    const pre = code.parentElement!;
    if (!prepared) {
      this.fallback(pre);
      return;
    }
    const finish = this.pending.add();
    try {
      const svg = await this.render(prepared);
      if (this.destroyed || !this.host.nativeElement.contains(pre) || code.textContent !== source) return;
      const clean = diagramImage(svg);
      if (!clean.includes("<svg")) throw new Error("Invalid diagram");
      const url = URL.createObjectURL(new Blob([clean], { type: "image/svg+xml" }));
      const figure = document.createElement("figure");
      figure.className = "note-diagram";
      const image = document.createElement("img");
      image.onerror = () => {
        if (this.destroyed || !this.host.nativeElement.contains(figure)) return;
        figure.replaceWith(pre);
        URL.revokeObjectURL(url);
        this.images.delete(figure);
        this.fallback(pre);
      };
      const root = new DOMParser().parseFromString(clean, "image/svg+xml").documentElement;
      const box = root.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
      if (box?.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) {
        image.style.width = `${box[2]}px`;
        image.width = Math.ceil(box[2]);
        image.height = Math.ceil(box[3]);
      }
      image.src = url;
      const description = Array.from(root.querySelectorAll('text')).map(node => node.textContent?.trim()).filter(Boolean).join('; ');
      image.alt = description ? `Architecture diagram: ${description}` : "Architecture diagram";
      pre.replaceWith(figure);
      figure.append(image);
      this.images.set(figure, url);
    } catch {
      if (!this.destroyed && this.host.nativeElement.contains(pre)) this.fallback(pre);
    } finally {
      finish();
    }
  }

  private fallback(pre: HTMLElement) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Diagram could not be rendered. Source is shown below.";
    pre.before(message);
  }

  ngOnDestroy() {
    this.destroyed = true;
    for (const url of this.images.values()) URL.revokeObjectURL(url);
    this.images.clear();
  }
}
