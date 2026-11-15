import { PendingTasks, Pipe, PipeTransform, inject } from "@angular/core";
import { MarkdownService } from "ngx-markdown";
import { AssetContext, NoteAsset } from "./note-assets";
import { renderNote } from "./render";

/** Use the Angular Markdown library, then the shared strict rendering boundary. */
@Pipe({ name: "noteHtml" })
export class NoteHtmlPipe implements PipeTransform {
  private readonly markdown = inject(MarkdownService);
  private readonly pending = inject(PendingTasks);
  async transform(
    content: string,
    format: string,
    note?: AssetContext,
    _assets?: NoteAsset[],
  ): Promise<string> {
    const finish = this.pending.add();
    try {
      if (format === "html") return renderNote(content, "html", note);
      // ngx-markdown dedents template literals. A zero-indent comment protects
      // file-authored indentation; the strict sanitizer removes this marker.
      const html = await this.markdown.parse(
        "<!-- note-source -->\n\n" + content,
        {
          markedOptions: { async: false },
        },
      );
      return renderNote(html, "html", note);
    } finally {
      finish();
    }
  }
}
