/** Keep diagram structure while adapting unsupported presentation at render time. */
export const MAX_DIAGRAM_SOURCE = 20_000;

export function prepareDiagramSource(source: string): string | null {
  if (!source.trim() || source.length > MAX_DIAGRAM_SOURCE) return null;

  // Imported configuration never controls the library or its security settings.
  let prepared = source.replace(/^\s*---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "")
    .replace(/%%\s*\{[\s\S]*?\}%%/g, "");
  const edgeIds = new Set(Array.from(prepared.matchAll(/\b([\w-]+)@(?=[-=~.<>])/g), match => match[1]));

  // Mermaid image/icon nodes are converted before rendering, so no request for
  // the original resource occurs, even in Mermaid's temporary measuring DOM.
  prepared = prepared.replace(/([\w-]+)\s*@\{((?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^}"'])*)\}/g,
    (_whole, id: string, attributes: string) => {
      // Edge presentation metadata must not become a new node in the graph.
      if (edgeIds.has(id)) return "";
      const label = attributes.match(/(?:^|[,\n])\s*["']?label["']?\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^,\n]+)/);
      let text = label ? label[1].trim().replace(/^(["'])([\s\S]*)\1$/, "$2") : id;
      text = text.replace(/\\(["'\\])/g, "$1")
        .replace(/&/g, "#38;").replace(/"/g, "#34;")
        .replace(/</g, "#60;").replace(/>/g, "#62;")
        .replace(/[\r\n]/g, " ");
      return `${id}["${text}"]`;
    });

  // Fail closed if an extended node could not be converted; do not pass any
  // resource-capable metadata through to Mermaid's temporary DOM.
  if (/@\s*\{/.test(prepared)) return null;

  // Markdown image labels also become text; normal URL labels remain readable.
  prepared = prepared.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  return statements(prepared)
    .filter(statement => !/^\s*(?:style|classDef|class|linkStyle|click)\s/.test(statement))
    .map(statement => withoutClassAnnotations(statement))
    .join("\n");
}

/** Split only actual statement boundaries, not punctuation inside node labels. */
function statements(source: string): string[] {
  const result: string[] = [];
  let start = 0, depth = 0, quote = "";
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = "";
      continue;
    }
    if (depth === 0 && source.startsWith("%%", i)) {
      result.push(source.slice(start, i));
      const end = source.indexOf("\n", i);
      if (end === -1) return result;
      i = end;
      start = end + 1;
      continue;
    }
    if (char === '"' || (char === "'" && depth > 0)) quote = char;
    else if ("[({".includes(char)) depth++;
    else if ("])}".includes(char)) depth = Math.max(0, depth - 1);
    else if ((char === ";" || char === "\n") && depth === 0) {
      result.push(source.slice(start, i));
      start = i + 1;
    }
  }
  result.push(source.slice(start));
  return result;
}

/** Class annotations are presentation; identical text inside labels is content. */
function withoutClassAnnotations(source: string): string {
  let output = "", depth = 0, quote = "";
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      output += char;
      if (char === "\\" && i + 1 < source.length) output += source[++i];
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || (char === "'" && depth > 0)) quote = char;
    else if ("[({".includes(char)) depth++;
    else if ("])}".includes(char)) depth = Math.max(0, depth - 1);
    if (!quote && depth === 0 && source.startsWith(":::", i)) {
      const annotation = source.slice(i).match(/^:::[\w-]+/);
      if (annotation) { i += annotation[0].length - 1; continue; }
    }
    output += char;
  }
  return output;
}
