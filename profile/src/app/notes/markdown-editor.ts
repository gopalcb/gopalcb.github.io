/** Shared Markdown textarea indentation; Escape then Tab preserves keyboard exit. */
const escapeTab = new WeakSet<HTMLTextAreaElement>();
function clearEscapeTab(event: FocusEvent) {
  if (event.currentTarget instanceof HTMLTextAreaElement) escapeTab.delete(event.currentTarget);
}

export function markdownEditorKeydown(event: KeyboardEvent, enabled = true): void {
  const editor = event.currentTarget;
  if (!(editor instanceof HTMLTextAreaElement)) return;
  if (!enabled || editor.readOnly || editor.matches(":disabled")) {
    escapeTab.delete(editor);
    return;
  }
  if (event.defaultPrevented || event.isComposing) return;
  if (event.key === "Escape") {
    escapeTab.add(editor);
    editor.addEventListener("blur", clearEscapeTab, { once: true });
    return;
  }
  if (["Shift", "Control", "Alt", "Meta", "AltGraph"].includes(event.key)) return;
  if (event.key !== "Tab") {
    escapeTab.delete(editor);
    return;
  }
  if (escapeTab.delete(editor) || event.ctrlKey || event.metaKey || event.altKey) return;
  event.preventDefault();
  const { selectionStart: start, selectionEnd: end, selectionDirection: direction, scrollTop, scrollLeft } = editor;
  if (!event.shiftKey && start === end) {
    editor.setRangeText("\t", start, end, "end");
  } else {
    const value = editor.value;
    const first = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
    // A selection ending at the next line's start does not include that line.
    const lastSelected = end > start && value[end - 1] === "\n" ? end - 1 : end;
    const nextLine = value.indexOf("\n", lastSelected);
    const last = nextLine < 0 ? value.length : nextLine;
    const edits: { at: number; removed: number; added: number }[] = [];
    let offset = first;
    const replacement = value.slice(first, last).split("\n").map(line => {
      const removed = event.shiftKey ? (line.startsWith("\t") ? 1 : Math.min(4, /^ */.exec(line)![0].length)) : 0;
      const added = event.shiftKey ? 0 : 1;
      edits.push({ at: offset, removed, added });
      offset += line.length + 1;
      return event.shiftKey ? line.slice(removed) : "\t" + line;
    }).join("\n");
    if (replacement === value.slice(first, last)) return;
    const adjusted = (position: number) => edits.reduce((result, edit) =>
      position < edit.at ? result : result + edit.added - Math.min(edit.removed, position - edit.at), position);
    editor.setRangeText(replacement, first, last, "preserve");
    editor.setSelectionRange(adjusted(start), adjusted(end), direction);
  }
  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.scrollTop = scrollTop;
  editor.scrollLeft = scrollLeft;
}
