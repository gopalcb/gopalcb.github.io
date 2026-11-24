import { AsyncPipe } from "@angular/common";
import { MarkdownService } from "ngx-markdown";
import { NoteHtmlPipe } from "./note-html.pipe";
import { MarkdownRulesDirective } from "./markdown-rules.directive";
import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { NotesStore, FONT_CSS } from "./notes.store";
import { noteAssetUrl } from "./note-assets";
import { IconComponent } from "../components/icon/icon.component";
@Component({
  providers: [MarkdownService],
  imports: [
    AsyncPipe,
    NoteHtmlPipe,
    RouterLink,
    IconComponent,
    MarkdownRulesDirective,
  ],
  template: ` <div
    class="reader-layout page-width"
    [style.grid-template-columns]="
      'minmax(0, ' +
      store.readerLayout().leftPercent +
      'fr) minmax(0, ' +
      (100 - store.readerLayout().leftPercent) +
      'fr)'
    "
  >
    <aside class="topic-rail">
      <a class="back-link" [routerLink]="store.notesPath"
        ><wo-icon name="back" /> All topics</a
      >
      @if (selectedTopic(); as topic) {
        <div class="rail-topic">
          <span>{{ topic.glyph }}</span
          >{{ topic.short }}
        </div>
      }
      <nav class="project-explorer" aria-label="Projects for this topic">
        <p class="eyebrow">PROJECTS</p>
        @if (selectedTopic(); as topic) {
            @for (project of projects(topic.id); track project) {
              <section class="project-folder" [class.project-active]="project === note()?.project" [attr.aria-label]="project">
                <h2 class="project-title"><wo-icon name="projects" /> {{ project }}</h2>
                @for (doc of projectDocs(topic.id, project); track doc.id) {
                  @if (pdfAsset(doc); as pdf) {
                    <a class="rail-note" [class.selected]="doc.id === note()?.id"
                      [attr.aria-current]="doc.id === note()?.id ? 'page' : null"
                      [href]="noteAssetUrl(doc.id, pdf.name)" target="_blank" rel="noopener noreferrer">{{ doc.title }}</a>
                  } @else {
                  <a class="rail-note" [class.selected]="doc.id === note()?.id"
                    [attr.aria-current]="doc.id === note()?.id ? 'page' : null"
                    [routerLink]="store.notePath(doc)">{{ doc.title }}</a>
                  }
                } @empty {
                  <p class="project-empty">No published documents yet.</p>
                }
              </section>
            } @empty {
              <p class="project-empty">No project documentation yet.</p>
            }
        }
      </nav>
      <nav class="note-explorer" aria-label="Notes for this topic">
        <p class="eyebrow">NOTES</p>
        @if (selectedTopic(); as topic) {
          @for (item of topicNotes(topic.id); track item.id; let position = $index) {
              <a
                class="rail-note"
                [class.selected]="item.id === note()?.id"
                [attr.aria-current]="item.id === note()?.id ? 'page' : null"
                [routerLink]="store.notePath(item)"
                >{{ position + 1 }}. {{ noteLabel(item.title) }}</a
              >
          }
        }
      </nav>
    </aside>
    @if (note(); as n) {
      <div class="reading-pane">
        @if (n.readerMetadata?.showPath !== false) {
        <div class="breadcrumb">
          notes <span>/</span> {{ topicTitle(n.topic) }}
          @if (n.project) { <span>/</span> {{ n.project }} }
        </div>
        }
        @if (n.readerMetadata?.showType !== false || n.readerMetadata?.showReadingTime !== false || n.readerMetadata?.showUpdated !== false) {
        <div class="reading-meta">
          @if (n.readerMetadata?.showType !== false) {
            <span class="pill">{{ n.project ? "PROJECT DOCUMENT" : "LEARNING NOTE" }}</span>
          }
          @if (n.readerMetadata?.showReadingTime !== false || n.readerMetadata?.showUpdated !== false) {
            <span>
              @if (n.readerMetadata?.showReadingTime !== false) { {{ minutes(n.content) }} min read }
              @if (n.readerMetadata?.showReadingTime !== false && n.readerMetadata?.showUpdated !== false) { · }
              @if (n.readerMetadata?.showUpdated !== false) { Updated <time [attr.datetime]="n.updated">{{ n.updated }}</time> }
            </span>
          }
        </div>
        }
        <article
          class="prose reader-article"
          [style.font-family]="fonts[(n.style || store.theme()).font]"
          [style.font-size.px]="(n.style || store.theme()).size"
          [style.color]="(n.style || store.theme()).ink"
          [markdownRules]="n.format === 'markdown' ? store.markdownRules : {}"
          [markdownSource]="n.content"
          [innerHTML]="n.content | noteHtml: n.format : n : n.assets | async"
        ></article>
      </div>
    } @else {
      <div class="empty">
        <h1>
          {{ selectedTopic() && !params()?.get('id') ? "No published notes yet" : "Note unavailable" }}
        </h1>
        <p>This note is unpublished or could not be found.</p>
        <a [routerLink]="store.notesPath">Explore the notes →</a>
      </div>
    }
  </div>`,
})
export class ReaderComponent {
  readonly store = inject(NotesStore);
  readonly params = toSignal(inject(ActivatedRoute).paramMap);
  fonts = FONT_CSS;
  noteAssetUrl = noteAssetUrl;
  pdfAsset(note: { assets?: { name: string; mediaType: string }[] }) {
    return note.assets?.find((asset) => asset.mediaType === "application/pdf");
  }
  note() {
    const params = this.params();
    const topic = params?.get("topic");
    const id = params?.get("id") || "";
    if (id) {
      return topic ? this.store.resolveNoteRoute(topic, id) : this.store.notes().find(
        n => n.published && (n.id === id || n.aliases?.includes(id)),
      );
    }
    return topic ? this.topicNotes(topic)[0] : undefined;
  }
  selectedTopic() {
    return this.store
      .topics()
      .find(
        (t) => t.id === (this.params()?.get("topic") || this.note()?.topic),
      );
  }
  topicNotes(topic: string) {
    return this.store.notes().filter(n => n.topic === topic && n.published && !n.project);
  }
  noteLabel(title: string) {
    return title.replace(/^\d+[.)]\s+/, "");
  }
  projects(topic: string): string[] {
    return this.store.projects().filter(p => p.topic === topic).map(p => p.title);
  }
  projectDocs(topic: string, project: string) {
    return this.store.notes().filter(n => n.topic === topic && n.project === project && n.published);
  }
  topicTitle(id: string) {
    return this.store.topics().find((t) => t.id === id)?.title;
  }
  minutes(content: string) {
    return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  }
}
