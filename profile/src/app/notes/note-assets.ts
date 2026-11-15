import { staticNoteAssets } from "./static-note-assets";

export interface NoteAsset {
  name: string;
  originalName: string;
  path: string;
  mediaType: string;
  size: number;
}
export interface AssetContext {
  id: string;
  assets?: NoteAsset[];
}
export function noteAssetUrl(noteId: string, name: string): string { return new URL('note-assets/' + encodeURIComponent(noteId) + '/assets/' + encodeURIComponent(name), document.baseURI).href; }
