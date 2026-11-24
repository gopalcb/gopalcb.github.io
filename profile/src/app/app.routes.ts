import { inject } from "@angular/core";
import { NotesStore } from "./notes/notes.store";
import { CanActivateFn, RedirectCommand, Route, Router, Routes } from "@angular/router";
import { RAG_AREAS, RagArea, RAG_TOPIC_ID, ragAreaForTopic } from "./rag/rag-area";
const canonicalNoteRoute: CanActivateFn = route => {
  const segment = route.params["id"];
  if (!segment) return true;
  const store = inject(NotesStore);
  const topic = route.params["topic"] || route.data["ragArea"] || RAG_TOPIC_ID;
  const project = ragAreaForTopic(topic)
    ? store.projects().find(p => p.topic === topic && p.id === route.params["projectId"])
    : undefined;
  const note = store.resolveNoteRoute(topic, segment, project?.title);
  if (!note || segment === (note.routeName || note.id)) return true;
  return new RedirectCommand(inject(Router).createUrlTree([store.notePath(note)], {
    queryParams: route.queryParams, fragment: route.fragment ?? undefined,
  }), { replaceUrl: true });
};
function collectionRoutes(area: RagArea): Routes {
  return [
    ...area.legacyPaths.map((legacyPath): Route => ({
      matcher: segments =>
        segments[0]?.path === legacyPath.slice(1) ? { consumed: segments } : null,
      redirectTo: ({ url, queryParams, fragment }) =>
        inject(Router).createUrlTree([area.path, ...url.slice(1).map(segment => segment.path)], {
          queryParams, fragment: fragment ?? undefined,
        }),
    })),
    {
      path: area.path.slice(1),
      canMatch: [() => inject(NotesStore).headerMenus().some(
        m => m.id === area.id && m.slug === area.path.slice(1) && m.published,
      )],
      children: [
        ...(area.id === RAG_TOPIC_ID ? ["doc-ingestion", "efficient-chunking-and-embeddings"] : []).map(project => ({
          path: project + ".html",
          redirectTo: "rag-" + project,
          pathMatch: "full" as const,
        })),
        {
          path: "projects/:projectId/notes/:id",
          pathMatch: "full",
          redirectTo: ({ params, queryParams, fragment }) => inject(Router).createUrlTree(
            [area.path, params["projectId"], params["id"]], { queryParams, fragment: fragment ?? undefined },
          ),
        },
        {
          path: "projects/:projectId",
          pathMatch: "full",
          redirectTo: ({ params, queryParams, fragment }) => inject(Router).createUrlTree(
            [area.path, params["projectId"]], { queryParams, fragment: fragment ?? undefined },
          ),
        },
        ...["", ":projectId", ":projectId/:id"].map(path => ({
          path,
          pathMatch: "full" as const,
          data: { ragArea: area.id },
          canActivate: [canonicalNoteRoute],
          loadComponent: () => import("./rag/rag-reader.component").then(m => m.RagReaderComponent),
        })),
      ],
    },
  ];
}
export const routes: Routes = [
  ...RAG_AREAS.flatMap(collectionRoutes),
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
    redirectTo: () => inject(NotesStore).homePath,
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
    canActivate: [(route) => {
      const store = inject(NotesStore);
      return store.topics().some(t => t.id === route.params["topic"])
        ? new RedirectCommand(inject(Router).parseUrl(store.topicPath(route.params["topic"])), { replaceUrl: true })
        : true;
    }],
    loadComponent: () =>
      import("./notes/reader.component").then((m) => m.ReaderComponent),
  },
  {
    path: "notes/:id",
    canActivate: [(route) => {
      const store = inject(NotesStore);
      const note = store.notes().find(n =>
        (n.id === route.params["id"] || n.aliases?.includes(route.params["id"])));
      return note ? new RedirectCommand(inject(Router).createUrlTree([store.notePath(note)], {
        queryParams: route.queryParams, fragment: route.fragment ?? undefined,
      }), { replaceUrl: true }) : true;
    }],
    loadComponent: () =>
      import("./notes/reader.component").then((m) => m.ReaderComponent),
  },
  {
    path: ":topic/:id",
    pathMatch: "full",
    canActivate: [canonicalNoteRoute],
    canMatch: [(_route, segments) => inject(NotesStore).topics().some(t =>
      t.id === segments[0]?.path && !ragAreaForTopic(t.id))],
    loadComponent: () => import("./notes/reader.component").then(m => m.ReaderComponent),
  },
  {
    path: ":topic",
    pathMatch: "full",
    canMatch: [(_route, segments) => inject(NotesStore).topics().some(t =>
      t.id === segments[0]?.path && !ragAreaForTopic(t.id))],
    loadComponent: () => import("./notes/reader.component").then(m => m.ReaderComponent),
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
