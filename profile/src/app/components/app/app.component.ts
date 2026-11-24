import { HeaderMenu } from "../../site/site-models";
import { Component, effect, inject } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { NotesStore } from "../../notes/notes.store";
import { IconComponent } from "../icon/icon.component";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd } from "@angular/router";
import { filter, map } from "rxjs";
import { MESH_PROJECT_ID, RAG_AREAS, RAG_PATH, ragAreaForUrl } from "../../rag/rag-area";
@Component({
  selector: "app-root",
  imports: [RouterLink, RouterOutlet, IconComponent],
  template: ` <div
    class="wo-shell wo-telemetry notes-shell monorepo-theme"
    [class.rag-area]="isRagArea()"
    [class.mesh-navigation]="!!store.meshProjectPath"
    [style.--page]="store.theme().canvas"
    [style.--ink]="store.theme().ink"
    [style.--wo-page]="store.theme().canvas"
    [style.--wo-primary]="store.theme().accent"
    [style.--wo-ink]="store.theme().ink"
  >
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="notes-navigation page-width">
      @if (featuredNavigation; as featured) {
        <nav class="wo-header-nav featured-nav" aria-label="Main navigation">
          @for (menu of featured; track menu.id) {
            <a [routerLink]="menu.path" [attr.aria-current]="menu.active ? 'page' : null">
              <wo-icon [name]="menu.icon" /> {{ menu.label }}
            </a>
          }
        </nav>
      } @else {
        <a class="rag-brand" [routerLink]="isRagArea() ? ragPath : store.notesPath">
          @if (isRagArea()) { <wo-icon name="folderTree" /> }
          {{ isRagArea() ? ragDisplayName : 'projects-monorepo' }}
        </a>
        @if (!isRagArea()) {
          <nav class="wo-header-nav" aria-label="Main navigation">
            @for (menu of store.headerMenus(); track menu.id) {
              @if (menu.published) {
                <a
                  [routerLink]="'/' + menu.slug"
                  [class.active]="menuActive(menu)"
                  [attr.aria-current]="menuActive(menu) ? 'page' : null"
                  >{{ menu.label }}</a
                >
              }
            }
          </nav>
        }
      }
      <a class="rag-github" [href]="githubUrl" target="_blank" rel="noopener noreferrer">
        <span class="github-mark" aria-hidden="true"></span>
        {{ isMeshArea() ? ragDisplayName : "GitHub" }}
      </a>

    </div>
    <main id="main" tabindex="-1"><router-outlet /></main>
    <div class="global-feedback" aria-live="polite">
      @if (store.error()) {
        <p class="error">
          {{ store.error() }}
          @if (!store.loaded()) {
            <button (click)="reload()">Reload page</button>
          }
        </p>
      } @else if (store.message()) {
        <p>{{ store.message() }}</p>
      }
    </div>
  </div>`,
})
export class AppComponent {
  readonly store = inject(NotesStore);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  readonly ragAreas = RAG_AREAS;
  readonly currentRagArea = toSignal(this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(event => ragAreaForUrl(event.urlAfterRedirects)),
  ), { initialValue: ragAreaForUrl(this.router.url) });
  readonly isRagArea = () => !!this.currentRagArea();
  readonly isMeshArea = () => this.currentRagArea()?.id === MESH_PROJECT_ID;
  get githubUrl() {
    return this.isMeshArea() ? "https://github.com/gopalcb/rag-memory-mesh-cli" : "https://github.com/gopalcb";
  }
  get featuredNavigation() {
    const path = this.store.meshProjectPath;
    if (!path) return;
    const mesh = { id: MESH_PROJECT_ID, path, label: "rag-memory-mesh-cli", icon: "folderTree", active: this.isMeshArea() } as const;
    const menus = this.store.headerMenus().filter(menu => menu.published);
    const archive = menus.find(menu => menu.page.kind === "notes");
    const haystack = menus.find(menu => menu.id === "haystack-agents");
    const notesLink = archive ? [{ id: archive.id, path: "/" + archive.slug, label: "monorepo-archive",
      icon: "layers", active: !mesh.active && this.menuActive(archive) } as const] : [];
    const agentLink = haystack ? [{ id: haystack.id, path: "/" + haystack.slug, label: haystack.label,
      icon: "agents", active: this.menuActive(haystack) } as const] : [];
    if (mesh.active) return [mesh, ...agentLink, ...notesLink];
    if (agentLink[0]?.active) return [...agentLink, ...notesLink, mesh];
    return [...notesLink, mesh, ...agentLink];
  }
  get ragPath() { return this.currentRagArea()?.path || RAG_PATH; }
  get ragDisplayName() { return this.currentRagArea()?.displayName || ""; }
  constructor() {
    effect(() => this.title.setTitle(this.currentRagArea()?.displayName || "projects-monorepo"));
  }
  menuActive(menu: HeaderMenu) {
    const path = this.router.url.split(/[?#]/)[0];
    return (
      path === "/" + menu.slug ||
      (menu.page.kind === "notes" &&
        "/" + menu.slug === this.store.notesPath &&
        (/^\/notes\/(?:topic\/)?[a-zA-Z0-9_-]+$/.test(path) ||
          this.store.topics().some(t => path === this.store.topicPath(t.id) ||
            path.startsWith(this.store.topicPath(t.id) + "/"))))
    );
  }
  reload() { window.location.reload(); }
}
