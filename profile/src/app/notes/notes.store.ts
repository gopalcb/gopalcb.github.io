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
export interface ReadingStyle {
  font: string;
  size: number;
  ink: string;
  background: string;
}
export interface Note {
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
  { value: "source", label: "Source Sans 3" },
  { value: "system", label: "System sans" },
  { value: "mono", label: "Roboto Mono" },
  { value: "handlee", label: "Handlee · handwritten" },
  { value: "patrick", label: "Patrick Hand · handwritten" },
];
export const FONT_CSS: Record<string, string> = {
  source: '"Source Sans 3", sans-serif',
  system: "system-ui, sans-serif",
  mono: '"Roboto Mono", monospace',
  handlee: "Handlee, cursive",
  patrick: '"Patrick Hand", cursive',
};
export const DEFAULT_THEME: SiteTheme = {
  font: "source",
  size: 16,
  ink: "#202936",
  background: "#ffffff",
  canvas: "#f5f7f6",
  accent: "#167b70",
  name: "Gopal",
};
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
  get homePath() {
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
      const response = await fetch(new URL('content/workspace.json', document.baseURI), { signal: AbortSignal.timeout(15000) });
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
    this.notes.set(data.notes);
    this.topics.set(data.topics);
    this.theme.set(data.theme);
    this.revision = revision;
    this.loaded.set(true);
    this.error.set("");
  }
}
