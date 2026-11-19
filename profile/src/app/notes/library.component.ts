import { faDiagramProject, faKey, faDharmachakra, faRobot, faListCheck, faServer, faTerminal, faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { SiteFrameComponent } from "../site/site-frame.component";
import { CARD_COMPONENT, PageBlock } from "../site/site-models";
import { Component, inject } from "@angular/core";
import { NotesStore, Topic } from "./notes.store";
@Component({
  selector: "site-library",
  styles: `.homelab-banner { display: block; width: 100%; height: auto; margin: 0 0 24px; }`,
  imports: [SiteFrameComponent],
  template: ` <div class="library page-width">
    <img
      class="homelab-banner"
      src="homelab.png"
      width="1407"
      height="450"
      alt="Home lab architecture with an Acer gateway, Docker services, and local AI machines on a VLAN"
    />
    <div class="library-bar">
      <div>
        <strong>Explore topics</strong
        ><span class="count"
          >{{ store.topics().length }} topics ·
          {{ published().length }} notes</span
        >
      </div>
    </div>
    @if (store.topics().length) {
      <div class="topic-frame">
        <site-frame
          title="Learning topics"
          [blocks]="topicBlocks()"
          [components]="cardComponents()"
          [grid]="true"
          [navigationEnabled]="true"
          [allowedPaths]="allowedPaths()"
        />
      </div>
    } @else {
      <div class="empty">
        <h2>No topics yet</h2>
        <p>Learning topics will appear here as they are added.</p>
      </div>
    }
  </div>`,
})
export class LibraryComponent {
  readonly store = inject(NotesStore);
  published() {
    return this.store.notes().filter((n) => n.published);
  }
  topicBlocks(): PageBlock[] {
    return this.store
      .topics()
      .map((t) => ({
        id: t.id,
        componentId: this.topicStyle(t),
        props: {
          title: t.title,
          description: t.description,
          tags: t.tags,
          symbol: t.glyph,
          meta: this.topicCounts(t.id),
          link: "/notes/topic/" + t.id,
        },
      }));
  }
  topicCounts(id: string): string {
    const notes = this.published().filter(n => n.topic === id && !n.project).length;
    const projects = this.store.projects().filter(p => p.topic === id).length;
    return `${notes} ${notes === 1 ? "note" : "notes"} · ${projects} ${projects === 1 ? "project" : "projects"}`;
  }
  topicStyle(topic: Topic): string {
    if (topic.id === "rest-api") return "card-rest-api";
    if (topic.id === "my-codex-agents-mcp-plugins-workflow-skills") return "card-codex";
    if (topic.id === "aws-production-grade-architecture-on-local") return "card-aws-local";
    const name = `${topic.id} ${topic.title}`.toLowerCase();
    if (/\beval(?:uate|uation)?\b/.test(name)) return "card-eval";
    if (/\breactive[- ]agents\b/.test(name)) return "card-agents";
    if (/\bembeddings?\b/.test(name)) return "card-embedding";
    if (/\biam\b|identity.*access/.test(name)) return "card-iam";
    if (/\bkubernetes\b|\beks\b/.test(name)) return "card-eks";
    return "card";
  }
  cardComponents() {
    const base = this.store.pageComponents().find((c) => c.id === "card") || CARD_COMPONENT;
    return [base, ...[
      { id: "card-embedding", icon: faDiagramProject, surface: "#f3effc", ink: "#64439a", badge: "#e5dbf7", border: "#d7c8ee" },
      { id: "card-iam", icon: faKey, surface: "#fff5e6", ink: "#8b5315", badge: "#fbe4bf", border: "#efd3a6" },
      { id: "card-eks", icon: faDharmachakra, surface: "#edf4ff", ink: "#285bb5", badge: "#dce9ff", border: "#c5d8f6" },
      { id: "card-agents", icon: faRobot, surface: "#eaf7f3", ink: "#176b58", badge: "#d0ece2", border: "#b7ddcf" },
      { id: "card-eval", icon: faListCheck, surface: "#fff0f3", ink: "#a03958", badge: "#f9dce5", border: "#efc5d2" },
      { id: "card-aws-local", icon: faServer, surface: "#fff2e8", ink: "#99480f", badge: "#ffe0c2", border: "#efc6a4" },
      { id: "card-codex", icon: faTerminal, surface: "#f0f3f7", ink: "#34465e", badge: "#dde5ef", border: "#c6d1df" },
      { id: "card-rest-api", icon: faArrowRightArrowLeft, surface: "#eaf7fc", ink: "#176580", badge: "#d1edf7", border: "#b8dce9" },
    ].map(({ id, icon, surface, ink, badge, border }) => ({
      ...base,
      id,
      html: base.html.replace("{{symbol}}", `<svg aria-hidden="true" viewBox="0 0 ${icon.icon[0]} ${icon.icon[1]}" width="20" height="20" fill="currentColor"><path d="${Array.isArray(icon.icon[4]) ? icon.icon[4].join(" ") : icon.icon[4]}"/></svg>`),
      css: base.css + `.card{background:${surface};border-color:${border}}.symbol{background:${badge};color:${ink};border-color:${border}}footer{color:${ink}}.card:hover{border-color:${ink}}`,
    }))];
  }
  allowedPaths() {
    return this.store
      .headerMenus()
      .filter((m) => m.published)
      .map((m) => "/" + m.slug);
  }
}
