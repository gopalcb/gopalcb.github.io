/** Only these source-controlled diagrams may be placed in the Home article. */
const diagramIds = new Set(['composition', 'session', 'architecture', 'execution', 'approval']);
export interface TopNotePart { content: string; diagramId?: string; }
export function topNoteParts(source: string): TopNotePart[] {
  const parts: TopNotePart[] = [];
  const marker = /<!-- bff-diagram:([a-z]+) -->/g;
  let start = 0;
  for (const match of source.matchAll(marker)) {
    if (!diagramIds.has(match[1])) continue;
    parts.push({ content: source.slice(start, match.index) });
    parts.push({ content: '', diagramId: match[1] });
    start = match.index! + match[0].length;
  }
  parts.push({ content: source.slice(start) });
  return parts;
}
export function topNoteUpdated(source: string): string | undefined {
  const value = source.match(/<!-- top-note-updated:(\d{4}-\d{2}-\d{2}) -->/)?.[1];
  if (!value) return undefined;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}
export function topNoteReadMinutes(source: string): number {
  const words = source.replace(/```mermaid[\s\S]*?```/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
