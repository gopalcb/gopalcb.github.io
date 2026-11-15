import { AsyncPipe } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { WoButtonComponent } from '../../theme/controls';
import { NotesStore, FONT_CSS } from './notes.store';
import { NoteHtmlPipe } from './note-html.pipe';
import { MarkdownRulesDirective } from './markdown-rules.directive';
import { topNoteReadMinutes, topNoteUpdated } from './top-note-content';

export const COGNITIVE_MEMORY_NOTE_ID = 'building-a-local-first-cognitive-memory-architecture-for-openai-codex-cli';

@Component({
  selector: 'site-recent-notes',
  providers: [MarkdownService],
  imports: [AsyncPipe, WoButtonComponent, NoteHtmlPipe, MarkdownRulesDirective],
  template: `
    <div class="recent-notes-row" role="group" aria-label="Recent notes">
      <span class="home-article-label">Recent notes</span>
      <button woButton type="button" [attr.aria-pressed]="selected() === 'memory'"
        aria-controls="recent-note-article" (click)="selected.set('memory')">Codex cognitive memory</button>
      <button woButton type="button" [attr.aria-pressed]="selected() === 'bff'"
        aria-controls="recent-note-article" (click)="selected.set('bff')">AI BFF</button>
    </div>
    <section id="recent-note-article" aria-labelledby="recent-note-title">
      @if (selected() === 'bff' || memoryNote()) {
        <header class="home-article-header">
          <h1 id="recent-note-title" class="home-article-title">{{ title() }}</h1>
          <p class="home-article-meta"><span>{{ readMinutes(content()) }} minute read</span>
            @if (updated(); as date) { <span>Last updated <time [attr.datetime]="date">{{ date }}</time></span> }
          </p>
        </header>
        <article class="prose reader-article"
          [style.font-family]="fonts[store.theme().font]"
          [style.font-size.px]="store.theme().size"
          [markdownRules]="store.markdownRules" [markdownSource]="content()"
          [innerHTML]="content() | noteHtml: 'markdown' : assetContext() : assetContext()?.assets | async"></article>
      } @else {
        <p class="recent-note-status" role="status">{{ store.error() || (store.loaded() ? 'This note is currently unavailable.' : 'Loading recent notes…') }}</p>
      }
    </section>
  `,
})
export class RecentNotesComponent {
  @Input() bffContent = '';
  readonly store = inject(NotesStore);
  readonly selected = signal<'memory' | 'bff'>('memory');
  readonly fonts = FONT_CSS;
  readonly readMinutes = topNoteReadMinutes;
  memoryNote() { return this.store.notes().find(note => note.id === COGNITIVE_MEMORY_NOTE_ID && note.published); }
  assetContext() { return this.selected() === 'memory' ? this.memoryNote() : undefined; }
  title() { return this.selected() === 'memory' ? this.memoryNote()?.title : 'Using Traditional BFF Becomes a Practical Starting Point for AI Agents'; }
  content() { return this.selected() === 'memory' ? (this.memoryNote()?.content || '').replace(/^# [^\r\n]+\r?\n/, '') : this.bffContent; }
  updated() { return this.selected() === 'memory' ? this.memoryNote()?.updated : topNoteUpdated(this.bffContent); }
}
