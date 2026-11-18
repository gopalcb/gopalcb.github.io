import { inject } from "@angular/core";
import { NotesStore } from "./notes/notes.store";
import { RedirectCommand, Router, Routes } from "@angular/router";
export const routes: Routes = [
  {
    matcher: (segments) =>
      segments[0]?.path === "projects-and-nodex" &&
      (segments.length === 1 ||
        (segments.length === 2 && segments[1].path === ""))
        ? { consumed: segments }
        : null,
    redirectTo: "/projects-and-notes",
  },
  {
    path: "",
    redirectTo: "/projects-and-notes",
    pathMatch: "full",
  },
  {
    path: "home",
    redirectTo: "/projects-and-notes",
    pathMatch: "full",
  },
  {
    path: "notes",
    loadComponent: () =>
      import("./site/managed-page.component").then(
        (m) => m.ManagedPageComponent,
      ),
  },
  {
    // Angular keeps a trailing slash as an empty segment. Match only the index,
    // leaving topic IDs and note readers to their existing routes below.
    matcher: (segments) =>
      segments[0]?.path === "notes" &&
      segments[1]?.path === "topic" &&
      (segments.length === 2 ||
        (segments.length === 3 && segments[2].path === ""))
        ? { consumed: segments }
        : null,
    canMatch: [
      (_route, segments) => {
        const store = inject(NotesStore);
        if (
          segments.length === 2 &&
          store
            .notes()
            .some(
              (note) => note.id === "topic" || note.aliases?.includes("topic"),
            )
        )
          return false;
        return new RedirectCommand(inject(Router).parseUrl(store.notesPath), {
          replaceUrl: true,
        });
      },
    ],
    loadComponent: () =>
      import("./site/managed-page.component").then(
        (m) => m.ManagedPageComponent,
      ),
  },
  {
    path: "notes/topic/:topic",
    loadComponent: () =>
      import("./notes/reader.component").then((m) => m.ReaderComponent),
  },
  {
    path: "notes/:id",
    loadComponent: () =>
      import("./notes/reader.component").then((m) => m.ReaderComponent),
  },
  {
    path: ":slug",
    loadComponent: () =>
      import("./site/managed-page.component").then(
        (m) => m.ManagedPageComponent,
      ),
  },
  {
    path: "**",
    loadComponent: () =>
      import("./site/managed-page.component").then(
        (m) => m.ManagedPageComponent,
      ),
  },
];
