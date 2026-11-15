export interface MarkdownStyle {
  id: string;
  name: string;
  rules: Record<string, string>;
}
export const MARKDOWN_ELEMENTS = [
  { value: "h1", label: "# · Heading 1", selector: "h1" },
  { value: "h2", label: "## · Heading 2", selector: "h2" },
  { value: "h3", label: "### · Heading 3", selector: "h3" },
  { value: "h4", label: "#### · Heading 4", selector: "h4" },
  { value: "h5", label: "##### · Heading 5", selector: "h5" },
  { value: "h6", label: "###### · Heading 6", selector: "h6" },
  { value: "br", label: "Line break", selector: "br" },
  { value: "p", label: "Paragraph", selector: "p" },
  { value: "ul", label: "- · Unordered list", selector: "ul" },
  { value: "ol", label: "1. · Ordered list", selector: "ol" },
  { value: "li", label: "List item", selector: "li" },
  { value: "hr", label: "--- · Horizontal separator", selector: "hr" },
  { value: "blockquote", label: "> · Blockquote", selector: "blockquote" },
  { value: "pre", label: "``` · Code block", selector: "pre" },
  { value: "code", label: "` · Inline code", selector: ":not(pre) > code" },
  { value: "strong", label: "** · Bold", selector: "strong" },
  { value: "em", label: "* · Italic", selector: "em" },
  { value: "del", label: "~~ · Strikethrough", selector: "del" },
  { value: "a", label: "[text](url) · Link", selector: "a" },
  { value: "table", label: "Table", selector: "table" },
  { value: "thead", label: "Table heading group", selector: "thead" },
  { value: "tbody", label: "Table body group", selector: "tbody" },
  { value: "tr", label: "Table row", selector: "tr" },
  { value: "th", label: "Table heading cell", selector: "th" },
  { value: "td", label: "Table data cell", selector: "td" },
];
export const CSS_PROPERTIES = new Set([
  "color",
  "background",
  "background-color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-align",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-style",
  "text-decoration-thickness",
  "text-underline-offset",
  "text-transform",
  "text-indent",
  "text-shadow",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "margin-block",
  "margin-inline",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "padding-block",
  "padding-inline",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-color",
  "border-width",
  "border-style",
  "border-radius",
  "border-collapse",
  "border-spacing",
  "box-shadow",
  "list-style-type",
  "list-style-position",
  "overflow-wrap",
  "word-break",
  "white-space",
  "tab-size",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "vertical-align",
  "box-sizing",
  "list-style",
]);
const CSS_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix",
  "light-dark",
  "calc",
  "min",
  "max",
  "clamp",
  "linear-gradient",
  "radial-gradient",
  "conic-gradient",
  "repeating-linear-gradient",
  "repeating-radial-gradient",
  "repeating-conic-gradient",
]);
/** Constrain declarations to note presentation; never compile administrator selectors. */
export function parseDeclarations(
  source: string,
  target: string,
  checkBrowserValues = true,
): { declarations: [string, string][]; error: string } {
  const fail = (error: string) => ({
    declarations: [] as [string, string][],
    error,
  });
  if (!MARKDOWN_ELEMENTS.some((e) => e.value === target))
    return fail("Choose a supported Markdown element.");
  if (source.length > 4000)
    return fail("Keep each element’s CSS under 4,000 characters.");
  if (
    /[{}<>@\\]|\/\*|\*\/|url\s*\(|expression\s*\(|var\s*\(|attr\s*\(|!|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/i.test(
      source,
    )
  )
    return fail(
      "Use CSS declarations only, without selectors, imports, URLs, comments or !important.",
    );
  const declarations: [string, string][] = [];
  for (const raw of source.split(";")) {
    if (!raw.trim()) continue;
    const colon = raw.indexOf(":");
    if (colon < 1) return fail("Use property: value; for each declaration.");
    const property = raw.slice(0, colon).trim().toLowerCase(),
      value = raw.slice(colon + 1).trim();
    if (
      !CSS_PROPERTIES.has(property) ||
      !value ||
      !/^[a-zA-Z0-9\s#.,%()'"+\-/*]+$/.test(value)
    )
      return fail(
        "Unsupported declaration: " +
          property +
          ". Use typography, spacing, border, list or color properties.",
      );
    if (
      Array.from(value.matchAll(/([a-z-]+)\s*\(/gi)).some(
        (match) => !CSS_FUNCTIONS.has(match[1].toLowerCase()),
      )
    )
      return fail(
        "Only color, gradient and numeric CSS functions are supported.",
      );
    if ((target === "pre" || target === "code") && property === "font-family")
      return fail(
        "Code fonts stay monospaced. You can change size, color, spacing and borders.",
      );
    if (
      checkBrowserValues &&
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      !CSS.supports(property, value)
    )
      return fail("Invalid CSS value for " + property + ".");
    declarations.push([property, value]);
  }
  return { declarations, error: "" };
}
export function stylingError(
  style: MarkdownStyle,
  checkBrowserValues = true,
): string {
  if (!style.name.trim() || style.name.trim().length > 80)
    return "Give the styling a name between 1 and 80 characters.";
  for (const [target, css] of Object.entries(style.rules)) {
    const error = parseDeclarations(css, target, checkBrowserValues).error;
    if (error) return error;
  }
  return "";
}
export const SAMPLE_MARKDOWN = `# A notebook for building systems

A small paragraph with **bold ideas**, *emphasis*, ~~an old assumption~~, an [example link](https://example.com), and \`inline code\`.

A line can break  
without starting a new paragraph.

## Follow the request

- Browser sends a request
- API validates the payload
  - Check input and permissions

### Make the change durable

1. Begin a transaction
2. Write the record
3. Return the result

---

> Keep the useful details. Let the next question guide you.

#### A small implementation

\`\`\`typescript
const note = { title: "Keep learning", published: true };
\`\`\`

##### A compact comparison

| Layer | Responsibility |
| --- | --- |
| Browser | Interaction |
| API | Business rules |

###### One last thought

Build, observe, and write down what changed.
`;
