import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  ViewChild,
  inject,
} from "@angular/core";
import { Router } from "@angular/router";
import DOMPurify from "dompurify";
import { PageBlock, PageComponent } from "./site-models";
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function fillTemplate(
  html: string,
  props: Record<string, string>,
): string {
  return html.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (_, key) =>
    escapeHtml(Object.hasOwn(props, key) ? props[key] : ""),
  );
}
/** The only authored-code execution boundary: an opaque-origin, script-only iframe. */
export function frameDocument(
  blocks: PageBlock[],
  components: PageComponent[],
  grid: boolean,
  token: string,
): string {
  const data = blocks
    .map((block) => {
      const component = components.find((c) => c.id === block.componentId);
      return component
        ? {
            html: DOMPurify.sanitize(
              fillTemplate(component.html, block.props),
              {
                FORBID_TAGS: [
                  "script",
                  "style",
                  "iframe",
                  "object",
                  "embed",
                  "link",
                  "base",
                  "form",
                ],
                FORBID_ATTR: ["srcdoc"],
              },
            ),
            css: component.css,
            js: component.js,
          }
        : null;
    })
    .filter(Boolean);
  const encoded = JSON.stringify({ data, grid, token })
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${token}' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'"><style>body{margin:0;color:#202936;font:13px/1.6 system-ui}#canvas{display:grid;gap:16px;padding:4px}#canvas.grid{grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr}#canvas.grid>section{min-width:0}@media(max-width:760px){#canvas.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:500px){#canvas.grid{grid-template-columns:minmax(0,1fr)}}.error{color:#932d24;font-size:12px;padding:8px}</style></head><body><div id="canvas"></div><script nonce="${token}" type="application/json" id="page-data">${encoded}</script><script nonce="${token}">
  (()=>{const config=JSON.parse(document.getElementById('page-data').textContent),canvas=document.getElementById('canvas');canvas.className=config.grid?'grid':'';
  const notify=()=>parent.postMessage({channel:'site-page',token:config.token,height:Math.min(8000,Math.max(80,Math.ceil(canvas.getBoundingClientRect().height)+8))},'*');
  for(const item of config.data){const host=document.createElement('section');canvas.append(host);const root=host.attachShadow({mode:'open'}),style=document.createElement('style');style.textContent=item.css+(config.grid?':host{display:flex!important;min-width:0} :host>div{display:flex;flex:1;min-width:0} :host>div>*{flex:1;min-width:0;overflow-wrap:anywhere}':'');root.append(style);const content=document.createElement('div');content.innerHTML=item.html;root.append(content);
  try{if(item.js.trim())new Function('root',item.js)(root);}catch(error){const notice=document.createElement('p');notice.className='error';notice.textContent='Component script error: '+error.message;root.append(notice);}}
  document.addEventListener('click',event=>{const anchor=event.composedPath().find(node=>node.tagName==='A');if(anchor){event.preventDefault();parent.postMessage({channel:'site-page',token:config.token,href:anchor.getAttribute('href')},'*');}});
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(notify).observe(canvas);notify();})();
  </script></body></html>`;
}
@Component({
  selector: "site-frame",
  template: `<iframe
    #frame
    sandbox="allow-scripts"
    referrerpolicy="no-referrer"
    title="{{ title }}"
    class="site-frame"
  ></iframe>`,
})
export class SiteFrameComponent implements OnChanges, AfterViewInit {
  @Input() blocks: PageBlock[] = [];
  @Input() components: PageComponent[] = [];
  @Input() grid = false;
  @Input() title = "Page preview";
  @Input() navigationEnabled = false;
  @Input() allowedPaths: string[] = [];
  @ViewChild("frame") frame?: ElementRef<HTMLIFrameElement>;
  private readonly router = inject(Router);
  private token = crypto.randomUUID();
  private signature = "";
  ngAfterViewInit() {
    this.update();
  }
  ngOnChanges() {
    this.update();
  }
  private update() {
    if (!this.frame) return;
    const signature = JSON.stringify([this.blocks, this.components, this.grid]);
    if (signature === this.signature) return;
    this.signature = signature;
    this.token = crypto.randomUUID();
    this.frame.nativeElement.srcdoc = frameDocument(
      this.blocks,
      this.components,
      this.grid,
      this.token,
    );
  }
  @HostListener("window:message", ["$event"]) message(event: MessageEvent) {
    const frame = this.frame?.nativeElement,
      data = event.data;
    if (
      !frame ||
      event.source !== frame.contentWindow ||
      !data ||
      data.channel !== "site-page" ||
      data.token !== this.token
    )
      return;
    if (Number.isFinite(data.height))
      frame.style.height = Math.max(80, Math.min(8000, data.height)) + "px";
    if (
      this.navigationEnabled &&
      typeof data.href === "string" &&
      data.href.startsWith("/") &&
      !data.href.startsWith("//") &&
      (this.allowedPaths.includes(data.href) ||
        /^\/notes\/(?:topic\/)?[a-zA-Z0-9_-]+$/.test(data.href))
    )
      void this.router.navigateByUrl(data.href);
  }
}
