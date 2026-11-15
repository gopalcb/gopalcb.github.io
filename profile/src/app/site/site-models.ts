import defaults from "./site-defaults.json";
export interface ReaderLayout {
  leftPercent: number;
}
export interface PageComponent {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
}
export interface PageBlock {
  id: string;
  componentId: string;
  props: Record<string, string>;
}
export interface MenuPage {
  kind: "home" | "notes" | "markdown" | "html";
  content: string;
  blocks: PageBlock[];
}
export interface HeaderMenu {
  id: string;
  label: string;
  slug: string;
  published: boolean;
  page: MenuPage;
}
export const SITE_DEFAULTS = defaults as {
  readerLayout: ReaderLayout;
  headerMenus: HeaderMenu[];
  pageComponents: PageComponent[];
};
export const CARD_COMPONENT = SITE_DEFAULTS.pageComponents[0];
export const CARD_FIELDS = [
  "symbol",
  "meta",
  "title",
  "description",
  "tags",
  "link",
];
export function validSlug(slug: string): boolean {
  return (
    /^[a-z][a-z0-9-]{0,59}$/.test(slug) &&
    !["admin", "api", "secure", "p"].includes(slug)
  );
}
export function componentFields(component: PageComponent): string[] {
  return [
    ...new Set(
      [
        ...component.html.matchAll(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g),
      ].map((m) => m[1]),
    ),
  ];
}
export function validSiteConfig(value: {
  readerLayout?: ReaderLayout;
  headerMenus?: HeaderMenu[];
  pageComponents?: PageComponent[];
}): boolean {
  const layout = value.readerLayout || SITE_DEFAULTS.readerLayout,
    menus = value.headerMenus || SITE_DEFAULTS.headerMenus,
    components = value.pageComponents || SITE_DEFAULTS.pageComponents;
  if (
    !Number.isInteger(layout.leftPercent) ||
    layout.leftPercent < 15 ||
    layout.leftPercent > 45 ||
    !Array.isArray(menus) ||
    !Array.isArray(components)
  )
    return false;
  if (
    !components.every(
      (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        !!c.name.trim() &&
        [c.html, c.css, c.js].every((v) => typeof v === "string"),
    ) ||
    new Set(components.map((c) => c.id)).size !== components.length
  )
    return false;
  return (
    menus.every(
      (m) =>
        m &&
        typeof m.id === "string" &&
        typeof m.label === "string" &&
        !!m.label.trim() &&
        typeof m.slug === "string" &&
        validSlug(m.slug) &&
        typeof m.published === "boolean" &&
        m.page &&
        ["home", "notes", "markdown", "html"].includes(m.page.kind) &&
        typeof m.page.content === "string" &&
        Array.isArray(m.page.blocks) &&
        m.page.blocks.every(
          (b) =>
            b &&
            typeof b.id === "string" &&
            components.some((c) => c.id === b.componentId) &&
            b.props &&
            typeof b.props === "object" &&
            Object.values(b.props).every((v) => typeof v === "string"),
        ),
    ) &&
    new Set(menus.map((m) => m.id)).size === menus.length &&
    new Set(menus.map((m) => m.slug)).size === menus.length
  );
}
