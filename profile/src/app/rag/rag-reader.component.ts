import { AsyncPipe } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MarkdownService } from "ngx-markdown";
import { IconComponent } from "../components/icon/icon.component";
import { MarkdownRulesDirective } from "../notes/markdown-rules.directive";
import { NoteHtmlPipe } from "../notes/note-html.pipe";
import { NoteTableLayoutDirective } from "../notes/note-table-layout.directive";
import { NotesStore, Project } from "../notes/notes.store";
import { RAG_AREAS, ragAreaForTopic } from "./rag-area";
import { RagToolOverviewComponent } from "./rag-tool-overview.component";

/** Read the RAG area's published, project-owned documents through the shared renderer. */
@Component({
  imports: [AsyncPipe, RouterLink, IconComponent, NoteHtmlPipe, MarkdownRulesDirective, NoteTableLayoutDirective, RagToolOverviewComponent],
  providers: [MarkdownService],
  template: `
    <div class="rag-layout"
      [style.grid-template-columns]="'minmax(0, ' + store.readerLayout().leftPercent + 'fr) minmax(0, ' + (100 - store.readerLayout().leftPercent) + 'fr)'"
      [attr.aria-busy]="!store.loaded()">
      <aside class="rag-sidebar" aria-label="RAG project navigation">
        <p class="sidebar-label">{{ displayLabel }}</p>
        <nav aria-label="RAG projects">
          @for (project of projects(); track project.id) {
            <section class="rag-project" [class.project-active]="selectedProject()?.id === project.id"
              [attr.aria-label]="project.title">
              <h2>
                <a class="rag-project-link" [routerLink]="[path, project.id]"
                  [attr.aria-current]="selectedProject()?.id === project.id ? 'true' : null">
                  <wo-icon name="projects" /> {{ project.title }}
                </a>
              </h2>
              <div class="rag-project-items">
                @for (document of documents(project); track document.id) {
                  <a class="rag-nav-link" [class.active]="note()?.id === document.id"
                    [attr.aria-current]="note()?.id === document.id ? 'page' : null"
                    [routerLink]="store.notePath(document)">{{ document.title }}</a>
                } @empty {
                  <p class="project-empty">No published documents yet.</p>
                }
              </div>
            </section>
          } @empty {
            <p class="project-empty">{{ store.loaded() ? "No project documentation yet." : "Loading projects…" }}</p>
          }
        </nav>
      </aside>
      <div class="rag-content">
        @if (overview(); as links) {
          <app-rag-tool-overview [guidePath]="links.guide" [sharingPath]="links.sharing" />
        } @else if (note(); as document) {
          @if (document.readerMetadata?.showPath !== false) {
            <div class="breadcrumb">
              <a [routerLink]="path">{{ path.slice(1) }}</a>
              <span>/</span> {{ selectedProject()?.title }}
            </div>
          }
          @if (document.readerMetadata?.showType !== false || document.readerMetadata?.showReadingTime !== false || document.readerMetadata?.showUpdated !== false) {
            <div class="reading-meta">
              @if (document.readerMetadata?.showType !== false) { <span>PROJECT DOCUMENT</span> }
              @if (document.readerMetadata?.showReadingTime !== false || document.readerMetadata?.showUpdated !== false) {
                <span>
                  @if (document.readerMetadata?.showReadingTime !== false) { {{ readingMinutes() }} min read }
                  @if (document.readerMetadata?.showReadingTime !== false && document.readerMetadata?.showUpdated !== false) { {{ " · " }} }
                  @if (document.readerMetadata?.showUpdated !== false) { Updated <time [attr.datetime]="document.updated">{{ document.updated }}</time> }
                </span>
              }
            </div>
          }
          @for (section of displayedDocuments(); track section.id) {
            <article class="prose rag-article"
              [noteTableLayout]="section.id"
              [markdownRules]="{}"
              [markdownSource]="section.content"
              [innerHTML]="section.content | noteHtml: section.format : section : section.assets | async"></article>
          }

        } @else if (!store.loaded()) {
          <div class="rag-intro"><p role="status">Loading documentation…</p></div>
        } @else if (selectedProject() && !params()?.get('id')) {
          <div class="empty rag-intro"><h1>{{ selectedProject()?.title }}</h1><p>No published documents yet.</p></div>
        } @else if (params()?.get('projectId') || params()?.get('id')) {
          <div class="empty rag-intro">
            <h1>Note unavailable</h1>
            <p>This project or document is unpublished or could not be found.</p>
            <a [routerLink]="path">Explore the RAG projects →</a>
          </div>
        } @else {
          <div class="empty rag-intro">
            <h1>{{ path.slice(1) }}</h1>
            <p>No published notes yet. Project documents will appear here when published.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class RagReaderComponent {
  readonly store = inject(NotesStore);
  private readonly route = inject(ActivatedRoute);
  readonly params = toSignal(this.route.paramMap);
  readonly area = ragAreaForTopic(this.route.snapshot.data["ragArea"]) || RAG_AREAS[0];
  readonly path = this.area.path;
  readonly displayLabel = this.area.displayName.toUpperCase();
  readonly year = new Date().getFullYear();

  readonly overview = computed(() => {
    const params = this.params();
    if (this.area.id !== "rag-tool-mcp" || params?.get("projectId") !== "rag-tool-mcp" || params.has("id")) return;

    const project = this.selectedProject();
    if (!project) return;
    const guide = this.store.resolveNoteRoute(this.area.id, "how-it-works", project.title);
    const sharingProject = this.projects().find((item) => item.id === "c6d50d95-189e-4eab-9315-0a85da338e09");
    const sharing = sharingProject && this.store.resolveNoteRoute(this.area.id, "design-decision-overview", sharingProject.title);
    return {
      guide: guide && this.store.notePath(guide),
      sharing: sharing && this.store.notePath(sharing),
    };
  });

  topic() {
    return this.store.topics().find((topic) => topic.id === this.area.id);
  }

  projects() {
    return this.topic()
      ? this.store.projects().filter((project) => project.topic === this.area.id)
      : [];
  }

  documents(project: Project) {
    return project.topic === this.area.id ? this.store.notes().filter((note) =>
      note.published && note.topic === this.area.id && note.project === project.title,
    ) : [];
  }

  note() {
    if (this.overview()) return undefined;
    const projectId = this.params()?.get("projectId");
    const id = this.params()?.get("id");
    if (projectId) {
      const project = this.projects().find((item) => item.id === projectId);
      if (!project) return undefined;
      const documents = this.documents(project);
      return id
        ? this.store.resolveNoteRoute(this.area.id, id, project.title)
        : documents[0];
    }
    if (id) return undefined;
    for (const project of this.projects()) {
      const first = this.documents(project)[0];
      if (first) return first;
    }
    return undefined;
  }

  selectedProject() {
    const projectId = this.params()?.get("projectId");
    return projectId
      ? this.projects().find((project) => project.id === projectId)
      : this.projects().find((project) => project.title === this.note()?.project);
  }

  displayedDocuments() {
    const note = this.note();
    if (!note) return [];
    if (this.params()?.get("id")) return [note];
    const project = this.selectedProject();
    return project ? this.documents(project) : [];
  }

  minutes(content: string) {
    return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  }
  readingMinutes() {
    return this.minutes(this.displayedDocuments().map(note => note.content).join(" "));
  }
}
