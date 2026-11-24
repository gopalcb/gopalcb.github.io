/** One stable identity for the dedicated RAG project collection and route tree. */
export const RAG_TOPIC_ID = "rag-practical-monorepo";
export const RAG_PATH = "/rag-practical-monorepo";
/** Display text can change without renaming persisted topics or reader routes. */
export const RAG_DISPLAY_NAME = "practical-rag-monorepo";
export const MESH_PROJECT_ID = "rag-tool-mcp";
export const MESH_PATH = "/rag-memory-mesh-cli";

/** Route/presentation configuration only; saved topics remain owned by NotesStore. */
export const RAG_AREAS = [
  {
    id: RAG_TOPIC_ID, path: RAG_PATH, displayName: RAG_DISPLAY_NAME,
    title: "RAG practical monorepo", short: "RAG projects",
    description: "Practical document ingestion, chunking and retrieval projects.",
    tags: "RAG · Ingestion · Embeddings", adminLabel: "RAG Admin", legacyPaths: [],
  },
  {
    id: MESH_PROJECT_ID, path: MESH_PATH, displayName: "rag-memory-mesh-cli",
    title: "rag-memory-mesh-cli", short: "rag-memory-mesh-cli",
    description: "RAG tools and Model Context Protocol projects.",
    tags: "RAG · Tools · MCP", adminLabel: "rag-memory-mesh-cli Admin", legacyPaths: ["/rag-tool-mcp"],
  },
] as const;
export type RagArea = (typeof RAG_AREAS)[number];
export function ragAreaForTopic(topic: string): RagArea | undefined {
  return RAG_AREAS.find(area => area.id === topic);
}
export function ragAreaForUrl(url: string): RagArea | undefined {
  const path = url.split(/[?#]/)[0];
  return RAG_AREAS.find(area => path === area.path || path.startsWith(area.path + "/"));
}
