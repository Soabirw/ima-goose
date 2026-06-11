---
name: "mcp-qdrant"
description: "Qdrant MCP — permanent semantic knowledge library. Use for reference material that should not fade: standards, PRDs, architecture docs, code samples, research findings, and durable project knowledge."
---

# Qdrant MCP

Qdrant is the permanent library in the memory stack.

| System | Role | Lifecycle |
|---|---|---|
| Qdrant | Permanent library for reference material | Persistent |
| Vestige | Neural memory for decisions, preferences, patterns, bugs | Fades if unused |
| Serena Memory | Project workbench for session state and task progress | Project-scoped |

## Use Qdrant For

- PRDs, feature specs, architecture notes, and standards.
- Stable domain knowledge and integration guides.
- Research findings and reusable code samples.
- Meeting notes or requirements that should remain durable.

Do not use Qdrant for temporary debugging notes, preferences, or session progress.

## Goose TypeScript SDK

Use the `QdrantMemory` namespace when the Goose typed SDK is available. Both wrappers return `{ result: string }`.

| Direct/native tool | Goose SDK wrapper | Required input | Optional input | Return |
|---|---|---|---|---|
| Qdrant store tool | `QdrantMemory.qdrantStore` | `information: string` | `collection_name?: string \| null`, `metadata?: Record<string, any> \| null` | `{ result: string }` |
| Qdrant find/search tool | `QdrantMemory.qdrantFind` | `query: string` | `collection_name?: string \| null`, `limit?: number` | `{ result: string }` |

```ts
await QdrantMemory.qdrantStore({
  information: "Durable architecture note...",
  collection_name: "ima-knowledge",
  metadata: { source: "architecture", project: "example" },
});

const hits = await QdrantMemory.qdrantFind({
  query: "architecture decision auth tokens",
  limit: 5,
});
console.log(hits.result);
```

Use `.result` as text unless the specific server response is known to contain JSON.

## Per-Project Collection

If a project has a `.qdrant` file, use its collection value for searches and stores. Otherwise, use the server default collection, normally `ima-knowledge`.

```yaml
collection: my-project-knowledge
```

## Goose Extension

```yaml
extensions:
  qdrant-memory:
    enabled: true
    name: qdrant-memory
    type: stdio
    cmd: qdrant-mcp
    args: []
    envs:
      QDRANT_URL: "http://localhost:6333"
      COLLECTION_NAME: "ima-knowledge"
    timeout: 60
```

## Setup

```bash
docker run -d --name qdrant \
  -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant:latest
```

Ensure `qdrant-mcp` is on `PATH`.

## Verification

```bash
curl http://localhost:6333/health
```

Then ask Goose to search Qdrant for known project context.
