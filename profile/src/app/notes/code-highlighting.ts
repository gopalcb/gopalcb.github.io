import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import sql from "highlight.js/lib/languages/sql";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import ini from "highlight.js/lib/languages/ini";
import markdown from "highlight.js/lib/languages/markdown";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import rust from "highlight.js/lib/languages/rust";

for (const [name, grammar] of Object.entries({
  python,
  javascript,
  typescript,
  bash,
  json,
  yaml,
  sql,
  xml,
  css,
  dockerfile,
  ini,
  markdown,
  go,
  java,
  rust,
})) {
  hljs.registerLanguage(name, grammar);
}

/** Color escaped code text only; authored classes never survive sanitization. */
export function highlightCode(template: HTMLTemplateElement) {
  const languages = new Map<HTMLElement, string>();
  for (const node of Array.from(template.content.querySelectorAll("[data-language]")))
    node.removeAttribute("data-language");
  for (const node of Array.from(
    template.content.querySelectorAll<HTMLElement>("[class]"),
  )) {
    if (node.matches("pre > code")) {
      const match = node.className.match(
        /(?:^|\s)language-([\w+-]{1,32})(?:\s|$)/i,
      );
      if (match) languages.set(node, match[1].toLowerCase());
    }
    node.removeAttribute("class");
  }
  for (const code of Array.from(
    template.content.querySelectorAll<HTMLElement>("pre > code"),
  )) {
    const source = code.textContent || "",
      language = languages.get(code);
    code.className = "hljs";
    if (language === "mermaid") {
      code.classList.add("note-mermaid-source");
      code.textContent = source;
      continue;
    }
    if (!language || !hljs.getLanguage(language) || source.length > 100_000)
      continue;
    const highlighted = hljs.highlight(source, {
      language,
      ignoreIllegals: true,
    }).value;
    code.innerHTML = DOMPurify.sanitize(highlighted, {
      ALLOWED_TAGS: ["span"],
      ALLOWED_ATTR: ["class"],
    });
    code.dataset["language"] = language;
  }
}
