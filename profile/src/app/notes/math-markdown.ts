import { marked } from "marked";

export const MATH_DELIMITERS = [
  { left: "$$", right: "$$", display: true },
  { left: "\\[", right: "\\]", display: true },
  { left: "\\(", right: "\\)", display: false },
  { left: "$", right: "$", display: false },
];

/** Recognize balanced TeX with whitespace/digit boundaries for single-dollar math. */
export function matchEquation(text: string, displayOnly = false) {
  for (const delimiter of MATH_DELIMITERS) {
    if ((displayOnly && !delimiter.display) || !text.startsWith(delimiter.left))
      continue;
    const inlineDollar = delimiter.left === "$";
    if (inlineDollar && (text[1] === "$" || !text[1] || /\s/.test(text[1])))
      continue;
    let braces = 0;
    for (let end = delimiter.left.length; end < text.length; end++) {
      if (braces <= 0 && text.startsWith(delimiter.right, end)) {
        if (
          inlineDollar &&
          (/\s/.test(text[end - 1]) || /[0-9$]/.test(text[end + 1] || ""))
        )
          return undefined;
        return {
          raw: text.slice(0, end + delimiter.right.length),
          body: text.slice(delimiter.left.length, end),
          opening: delimiter.left,
        };
      }
      if (text[end] === "\\") end++;
      else if (text[end] === "{") braces++;
      else if (text[end] === "}") braces--;
    }
  }
  return undefined;
}

/** Keep TeX intact instead of interpreting its underscores/backslashes as Markdown. */
function equationToken(source: string, block: boolean) {
  const indentation = block ? source.match(/^ {0,3}/)![0] : "";
  const match = matchEquation(source.slice(indentation.length), block);
  return match
    ? {
        type: block ? "noteEquationBlock" : "noteEquationInline",
        raw: indentation + match.raw,
        text: match.raw,
      }
    : undefined;
}

function escapedMath(source: string): string {
  return source
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ngx-markdown and direct note rendering share this Marked instance. Register once.
marked.use({
  extensions: [
    {
      name: "noteMathEscape",
      level: "inline",
      tokenizer: (source) =>
        source.startsWith("\\$")
          ? { type: "noteMathEscape", raw: "\\$", text: "$" }
          : undefined,
      // Keep an escaped dollar in its own text boundary after Marked removes its slash.
      renderer: () => "<span>$</span>",
    },
    {
      name: "noteEquationBlock",
      level: "block",
      tokenizer: (source) => equationToken(source, true),
      renderer: (token) => "<div>" + escapedMath(token.text) + "</div>\n",
    },
    {
      name: "noteEquationInline",
      level: "inline",
      start: (source) => source.search(/\$|\\[\[(]/),
      tokenizer: (source) => equationToken(source, false),
      renderer: (token) => "<span>" + escapedMath(token.text) + "</span>",
    },
  ],
});
