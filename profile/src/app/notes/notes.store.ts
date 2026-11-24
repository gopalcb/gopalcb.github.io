import buildInfo from '../../../public/build-info.json';
import { NoteAsset } from "./note-assets";
import {
  ReaderLayout,
  HeaderMenu,
  PageComponent,
  SITE_DEFAULTS,
  validSiteConfig,
} from "../site/site-models";
import { MarkdownStyle, stylingError } from "./markdown-styling";
import { Injectable, signal } from "@angular/core";
import { MESH_PATH, MESH_PROJECT_ID, RAG_TOPIC_ID, ragAreaForTopic, ragAreaForUrl } from "../rag/rag-area";
export interface ReadingStyle {
  font: string;
  size: number;
  ink: string;
  background: string;
}
export interface ReaderMetadata {
  showPath: boolean;
  showType: boolean;
  showReadingTime: boolean;
  showUpdated: boolean;
}
export const DEFAULT_READER_METADATA: Readonly<ReaderMetadata> = {
  showPath: true, showType: true, showReadingTime: true, showUpdated: true,
};
export interface Note {
  readerMetadata?: ReaderMetadata;
  routeName?: string;
  routeAliases?: string[];
  project?: string | null;
  contentPath?: string;
  aliases?: string[];
  assets?: NoteAsset[];
  id: string;
  topic: string;
  title: string;
  summary: string;
  content: string;
  format: string;
  published: boolean;
  updated: string;
  style?: ReadingStyle;
}
export const NOTE_ROUTE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function noteRouteTokens(note: Note): string[] {
  return [...new Set([note.routeName || note.id, note.id, ...(note.aliases || []), ...(note.routeAliases || [])])];
}
export function sameNoteRouteScope(a: Pick<Note, "topic" | "project">, b: Pick<Note, "topic" | "project">): boolean {
  return a.topic === b.topic && (!ragAreaForTopic(a.topic) || (a.project || null) === (b.project || null));
}
export interface SiteTheme extends ReadingStyle {
  canvas: string;
  accent: string;
  name: string;
}
export interface Topic {
  id: string;
  title: string;
  short: string;
  glyph: string;
  description: string;
  tags: string;
}
export const FONTS = [
  { value: "roboto", label: "Roboto" },
  { value: "source", label: "Source Sans 3" },
  { value: "system", label: "System sans" },
  { value: "mono", label: "Roboto Mono" },
  { value: "handlee", label: "Handlee · handwritten" },
  { value: "patrick", label: "Patrick Hand · handwritten" },
];
export const FONT_CSS: Record<string, string> = {
  roboto: '"RAG Roboto", Roboto, Arial, sans-serif',
  source: '"Source Sans 3", sans-serif',
  system: "system-ui, sans-serif",
  mono: '"Roboto Mono", monospace',
  handlee: "Handlee, cursive",
  patrick: '"Patrick Hand", cursive',
};
export const DEFAULT_THEME: SiteTheme = {
  font: "roboto",
  size: 15,
  ink: "#e1e5ec",
  background: "#1e2129",
  canvas: "#1e2129",
  accent: "#6ee7d2",
  name: "Gopal",
};
export function topicRouteConflict(id: string, menus: HeaderMenu[]) {
  return ["home", "notes", "admin", "api", "secure", "p", "projects-and-nodex"].includes(id) ||
    (!ragAreaForTopic(id) && menus.some(menu => menu.slug === id));
}
export function validStyle(value: unknown): value is ReadingStyle {
  const v = value as ReadingStyle;
  return (
    !!v &&
    Object.hasOwn(FONT_CSS, v.font) &&
    Number.isInteger(v.size) &&
    v.size >= 12 &&
    v.size <= 24 &&
    /^#[0-9a-f]{6}$/i.test(v.ink) &&
    /^#[0-9a-f]{6}$/i.test(v.background)
  );
}
export interface Project { id: string; topic: string; title: string; }
export interface Workspace {
  projects?: Project[];
  readerLayout?: ReaderLayout;
  headerMenus?: HeaderMenu[];
  pageComponents?: PageComponent[];
  markdownStyles?: MarkdownStyle[];
  activeMarkdownStyle?: string | null;
  topics: Topic[];
  notes: Note[];
  theme: SiteTheme;
}
export function validWorkspace(value: unknown): value is Workspace {
  const data = value as Workspace;
  return (
    !!data &&
    validSiteConfig(data) &&
    (data.projects === undefined || (Array.isArray(data.projects) && data.projects.every(p => typeof p.id === "string" && typeof p.title === "string" && typeof p.topic === "string"))) &&
    (data.markdownStyles === undefined ||
      (Array.isArray(data.markdownStyles) &&
        data.markdownStyles.every(
          (s) =>
            typeof s.id === "string" &&
            typeof s.name === "string" &&
            s.rules &&
            typeof s.rules === "object" &&
            Object.values(s.rules).every((v) => typeof v === "string") &&
            !stylingError(s, false),
        ))) &&
    (data.activeMarkdownStyle == null ||
      !!data.markdownStyles?.some((s) => s.id === data.activeMarkdownStyle)) &&
    Array.isArray(data.topics) &&
    data.topics.every(
      (t) =>
        t &&
        /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(t.id) &&
        [t.title, t.short, t.glyph].every(
          (v) => typeof v === "string" && !!v.trim(),
        ) &&
        typeof t.description === "string" &&
        typeof t.tags === "string",
    ) &&
    new Set(data.topics.map((t) => t.id)).size === data.topics.length &&
    Array.isArray(data.notes) &&
    data.notes.every(
      (n) =>
        n &&
        (n.readerMetadata === undefined || (n.readerMetadata !== null &&
          Object.keys(DEFAULT_READER_METADATA).every(key => typeof n.readerMetadata![key as keyof ReaderMetadata] === "boolean"))) &&
        (n.routeName === undefined || (typeof n.routeName === "string" && n.routeName.length <= 100 && NOTE_ROUTE_PATTERN.test(n.routeName))) &&
        (n.routeAliases === undefined || (Array.isArray(n.routeAliases) && n.routeAliases.every(route => typeof route === "string" && route.length <= 100 && NOTE_ROUTE_PATTERN.test(route)))) &&
        typeof n.id === "string" &&
        data.topics.some((t) => t.id === n.topic) &&
        ["title", "summary", "content", "updated"].every(
          (k) =>
            typeof (n as unknown as Record<string, unknown>)[k] === "string",
        ) &&
        ["html", "markdown"].includes(n.format) &&
        typeof n.published === "boolean" &&
        (!n.style || validStyle(n.style)),
    ) &&
    new Set(data.notes.map((n) => n.id)).size === data.notes.length &&
    validStyle(data.theme) &&
    /^#[0-9a-f]{6}$/i.test(data.theme.canvas) &&
    /^#[0-9a-f]{6}$/i.test(data.theme.accent) &&
    typeof data.theme.name === "string"
  );
}
@Injectable({ providedIn: "root" })
export class NotesStore {
  topicPath(topic: string) {
    return ragAreaForTopic(topic)?.path || "/" + encodeURIComponent(topic);
  }
  notePath(note: Note) {
    const route = encodeURIComponent(note.routeName || note.id);
    const area = ragAreaForTopic(note.topic);
    if (area) {
      const project = this.projects().find(p => p.topic === note.topic && p.title === note.project);
      return project ? `${area.path}/${encodeURIComponent(project.id)}/${route}` : area.path;
    }
    return this.topicPath(note.topic) + "/" + route;
  }
  resolveNoteRoute(topic: string, route: string, project?: string) {
    return this.notes().find(note => note.published && note.topic === topic &&
      (!ragAreaForTopic(topic) || note.project === project) && noteRouteTokens(note).includes(route));
  }
  contentPaths() {
    const paths = [
      ...this.headerMenus().filter(m => m.published).map(m => "/" + m.slug),
      ...this.topics().map(t => this.topicPath(t.id)),
      ...this.projects().filter(p => ragAreaForTopic(p.topic)).map(p => `${this.topicPath(p.topic)}/${encodeURIComponent(p.id)}`),
      ...this.notes().filter(n => n.published).flatMap(note => {
        const canonical = this.notePath(note);
        const prefix = canonical.slice(0, canonical.lastIndexOf("/") + 1);
        return noteRouteTokens(note).map(route => prefix + encodeURIComponent(route));
      }),
    ];
    return paths.flatMap(path => {
      const area = ragAreaForUrl(path);
      return [path, ...(area?.legacyPaths.map(legacy => legacy + path.slice(area.path.length)) || [])];
    });
  }
  readonly projects = signal<Project[]>([]);
  readonly readerLayout = signal<ReaderLayout>({
    ...SITE_DEFAULTS.readerLayout,
  });
  readonly headerMenus = signal<HeaderMenu[]>(
    structuredClone(SITE_DEFAULTS.headerMenus),
  );
  readonly pageComponents = signal<PageComponent[]>(
    structuredClone(SITE_DEFAULTS.pageComponents),
  );
  get notesPath() {
    const menu = this.headerMenus().find(
      (m) => m.published && m.page.kind === "notes",
    );
    return menu ? "/" + menu.slug : "/notes";
  }
  get meshProjectPath() {
    const published = this.headerMenus().some(menu =>
      menu.id === MESH_PROJECT_ID && menu.slug === MESH_PATH.slice(1) && menu.published);
    const project = this.projects().find(item => item.id === MESH_PROJECT_ID && item.topic === MESH_PROJECT_ID);
    return published && project ? `${MESH_PATH}/${project.id}` : undefined;
  }
  get homePath() {
    const meshProject = this.meshProjectPath;
    if (meshProject) return meshProject;
    const menu =
      this.headerMenus().find((m) => m.published && m.id === "home") ||
      this.headerMenus().find((m) => m.published);
    return menu ? "/" + menu.slug : "/home";
  }
  readonly markdownStyles = signal<MarkdownStyle[]>([]);
  readonly activeMarkdownStyle = signal<string | null>(null);
  get markdownRules() {
    return (
      this.markdownStyles().find((s) => s.id === this.activeMarkdownStyle())
        ?.rules || {}
    );
  }
  readonly notes = signal<Note[]>([]);
  readonly topics = signal<Topic[]>([]);
  readonly theme = signal<SiteTheme>({ ...DEFAULT_THEME });
  readonly message = signal("");
  readonly error = signal("");
  readonly busy = signal(false);
  readonly loaded = signal(false);
  readonly requiresRestart = signal(false);
  private revision = 0;

  async load(): Promise<void> {
    this.busy.set(true);
    try {
      const snapshot = new URL('content/workspace.json', document.baseURI);
      snapshot.searchParams.set('v', buildInfo.contentSha256);
      const response = await fetch(snapshot, { cache: 'no-cache', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Content unavailable');
      const data = await response.json();
      if (!validWorkspace(data)) throw new Error('Invalid content');
      this.apply(data, 0);
    } catch { this.error.set('Could not load the published notes. Reload this page to try again.'); }
    finally { this.busy.set(false); }
  }
  private apply(data: Workspace, revision: number) {
    this.projects.set(data.projects || []);
    this.readerLayout.set(
      data.readerLayout || { ...SITE_DEFAULTS.readerLayout },
    );
    this.headerMenus.set(
      data.headerMenus || structuredClone(SITE_DEFAULTS.headerMenus),
    );
    this.pageComponents.set(
      data.pageComponents || structuredClone(SITE_DEFAULTS.pageComponents),
    );
    this.markdownStyles.set(data.markdownStyles || []);
    this.activeMarkdownStyle.set(data.activeMarkdownStyle || null);
    this.notes.set(data.notes.map(note => ({
      ...note, readerMetadata: { ...DEFAULT_READER_METADATA, ...note.readerMetadata },
    })));
    this.topics.set(data.topics);
    this.theme.set(data.theme);
    this.revision = revision;
    this.loaded.set(true);
    this.error.set("");
  }
}
