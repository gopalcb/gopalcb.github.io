import { AsyncPipe } from "@angular/common";
import { MarkdownService } from "ngx-markdown";
import { NoteHtmlPipe } from "../notes/note-html.pipe";
import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { NotesStore, FONT_CSS } from "../notes/notes.store";
import { LibraryComponent } from "../notes/library.component";
import { MarkdownRulesDirective } from "../notes/markdown-rules.directive";
import { SiteFrameComponent } from "./site-frame.component";
@Component({
  providers: [MarkdownService],
  imports: [
    AsyncPipe,
    NoteHtmlPipe,
    LibraryComponent,
    MarkdownRulesDirective,
    SiteFrameComponent,
  ],
  template: ` @if (menu(); as menu) {
      @switch (menu.page.kind) {
        @case ("home") {}
        @case ("notes") {
          <ng-container><site-library /></ng-container>
        }
        @case ("markdown") {
          <div
            class="page-width managed-markdown"
            [class.home-article-page]="menu.id === 'home'"
            [class.about-me-page]="menu.id === 'about-me'"
          >
            @if (menu.id === 'about-me') {
              <header
                class="about-me-profile"
                [style.font-family]="fonts[store.theme().font]"
                [style.font-size.px]="store.theme().size"
                [markdownRules]="{ h1: store.markdownRules['h2'] || '' }"
              >
                <h1>Gopal Chandra Bala</h1>
                <nav aria-label="Profile links">
                  <a href="https://github.com/gopalcb">GitHub</a>
                  <a href="https://www.linkedin.com/in/gopal-c-bala/">LinkedIn</a>
                  <a href="mailto:gopalcbala@gmail.com">Email</a>
                </nav>
              </header>
              <hr class="about-me-separator" />
            }
            @if (menu.id !== 'home') {
            <article
              class="prose reader-article"
              [style.font-family]="fonts[store.theme().font]"
              [style.font-size.px]="store.theme().size"
              [markdownRules]="store.markdownRules"
              [markdownSource]="menu.page.content"
              [innerHTML]="menu.page.content | noteHtml: 'markdown' | async"
            ></article>
            }
          </div>
        }
        @case ("html") {
          <div class="page-width">
            <site-frame
              [title]="menu.label"
              [blocks]="menu.page.blocks"
              [components]="store.pageComponents()"
              [navigationEnabled]="true"
              [allowedPaths]="paths()"
            />
          </div>
        }
      }
    } @else {
      <div class="page-width empty">
        <h1>Page unavailable</h1>
        <p>This page is unpublished or has been removed.</p>
      </div>
    }`,
})
export class ManagedPageComponent {
  readonly store = inject(NotesStore);
  private readonly route = inject(ActivatedRoute);
  readonly params = toSignal(this.route.paramMap);
  fonts = FONT_CSS;
  menu() {
    const slug =
      this.params()?.get("slug") ||
      this.route.snapshot.routeConfig?.path ||
      "home";
    return this.store.headerMenus().find((m) => m.published && m.slug === slug);
  }
  paths() {
    return this.store.contentPaths();
  }
}
