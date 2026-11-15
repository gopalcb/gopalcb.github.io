import "./math-markdown";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { highlightCode } from "./code-highlighting";
import { AssetContext, noteAssetUrl } from "./note-assets";
import { staticNoteAssets } from "./static-note-assets";
export function renderNote(
  content: string,
  format: string,
  note?: AssetContext,
): string {
  const html = DOMPurify.sanitize(
    format === "html" ? content : marked.parse(content, { async: false }),
    {
      FORBID_TAGS: [
        "style",
        "iframe",
        "form",
        "input",
        "button",
        "svg",
        "math",
        "video",
        "audio",
        "source",
        "picture",
        "object",
        "embed",
        ...(!note ? ["img"] : []),
      ],
      FORBID_ATTR: ["style", "id", "name", "target", "srcset"],
    },
  );
  const template = document.createElement("template");
  template.innerHTML = html;
  highlightCode(template);
  if (!note) return template.innerHTML;
  for (const image of Array.from(template.content.querySelectorAll("img"))) {
    const asset = resolveAsset(image.getAttribute("src") || "", note);
    if (!asset || !asset.mediaType.startsWith("image/")) {
      image.remove();
      continue;
    }
    image.setAttribute("src", noteAssetUrl(note.id, asset.name));
    image.setAttribute("loading", "lazy");
  }
  for (const link of Array.from(template.content.querySelectorAll("a[href]"))) {
    const asset = resolveAsset(link.getAttribute("href") || "", note);
    if (!asset) continue;
    link.setAttribute("href", noteAssetUrl(note.id, asset.name));
    // Only source-controlled MP4 assets can become players. Imported video,
    // source, iframe and event attributes remain blocked by the sanitizer.
    if (asset.mediaType === "video/mp4" && staticNoteAssets(note.id).includes(asset)) {
      const video = document.createElement("video");
      video.setAttribute("src", noteAssetUrl(note.id, asset.name));
      video.setAttribute("controls", "");
      video.setAttribute("preload", "metadata");
      video.setAttribute("aria-label", link.textContent || "Play note video");
      link.replaceWith(video);
      video.append(link);
    }
  }
  return template.innerHTML;
}

/** Resolve the static allowlist first, then newly uploaded local assets. */
function resolveAsset(source: string, note: AssetContext) {
  let decoded: string;
  try {
    decoded = decodeURIComponent(source).replace(/^\.\//, "");
  } catch {
    return undefined;
  }
  return [...(note.assets || []), ...staticNoteAssets(note.id)]
    .reverse()
    .find((a) =>
      [
        noteAssetUrl(note.id, a.name),
        "/api/notes/" + encodeURIComponent(note.id) + "/assets/" + encodeURIComponent(a.name),
        a.name,
        a.originalName,
        "assets/" + a.name,
        "assets/" + a.originalName,
      ].includes(decoded),
    );
}
