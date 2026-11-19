import { HeaderMenu } from "../../site/site-models";
import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterOutlet } from "@angular/router";
import { NotesStore } from "../../notes/notes.store";
@Component({
  selector: "app-root",
  imports: [RouterLink, RouterOutlet],
  template: ` <div
    class="wo-shell wo-telemetry notes-shell"
    [style.--wo-page]="store.theme().canvas"
    [style.--wo-primary]="store.theme().accent"
    [style.--wo-ink]="store.theme().ink"
  >
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="notes-navigation page-width">
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
  menuActive(menu: HeaderMenu) {
    const path = this.router.url.split(/[?#]/)[0];
    return (
      path === "/" + menu.slug ||
      (menu.page.kind === "notes" &&
        "/" + menu.slug === this.store.notesPath &&
        /^\/notes\/(?:topic\/)?[a-zA-Z0-9_-]+$/.test(path))
    );
  }
  reload() { window.location.reload(); }
}
