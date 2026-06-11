# MCP Goose TypeScript SDK Signatures

This reference documents MCP-related Goose TypeScript SDK wrappers that are currently exposed in the Goose API harness. Use these signatures as the source of truth for SDK calls; do not invent wrappers for MCP tools that are not listed here.

Use direct/native MCP tools when the harness exposes tools directly. Use these SDK wrappers only inside a Goose TypeScript SDK execution context where the namespace is registered. Tool results are already parsed JavaScript values; do not `JSON.parse` the whole result unless a specific returned string field is known to contain JSON.

## Namespace summary

| Skill | SDK namespace | Return shape |
|---|---|---|
| `mcp-atlassian` | `AtlassianRovo` | `Promise<any>` |
| `mcp-chrome-devtools` | `ChromeDevtools` | `Promise<any>` |
| `mcp-context7` | `Context7` | `Promise<any>` |
| `mcp-fetch` | `Fetch` | `Promise<any>` |
| `mcp-qdrant` | `QdrantMemory` | `{ result: string }` |
| `mcp-sequential-thinking` | `SequentialThinking` | typed thought result |
| `mcp-serena` | `Serena` | `{ result: string }` |
| `mcp-tavily` | `Tavily` | `Promise<any>` |
| `mcp-vestige` | `Vestige` | `Promise<any>` |
| `mcp-taskwarrior` | none | Use `task` CLI through shell |

## Context7

```ts
await Context7.resolveLibraryId({ libraryName: "React", query: "useEffect cleanup" });
await Context7.queryDocs({ libraryId: "/facebook/react", query: "useEffect cleanup" });
```

No `tokens` parameter is exposed by the Goose SDK wrapper.

## Tavily

```ts
await Tavily.tavilySearch({ query: "Vite 6 breaking changes 2026", search_depth: "advanced" });
await Tavily.tavilyExtract({ urls: ["https://example.com"], format: "markdown" });
await Tavily.tavilyCrawl({ url: "https://docs.example.com", max_depth: 2, limit: 20 });
await Tavily.tavilyMap({ url: "https://docs.example.com", max_depth: 2 });
await Tavily.tavilyResearch({ input: "Compare Bun and Node.js in 2026", model: "auto" });
```

Use `time_range`, `start_date`, or `end_date` for recency. Do not use unsupported fields like `days` or `topic: "news"`.

## Fetch

```ts
await Fetch.fetch({ url: "https://example.com", max_length: 4000, start_index: 0, raw: false });
```

## Qdrant

```ts
await QdrantMemory.qdrantStore({ information: "Durable note", collection_name: "ima-knowledge", metadata: { source: "docs" } });
const hits = await QdrantMemory.qdrantFind({ query: "architecture note", limit: 5 });
console.log(hits.result);
```

## Sequential Thinking

```ts
const thought = await SequentialThinking.sequentialthinking({
  thought: "Frame the problem and likely failure points.",
  nextThoughtNeeded: true,
  thoughtNumber: 1,
  totalThoughts: 5,
});
```

Optional inputs: `isRevision`, `revisesThought`, `branchFromThought`, `branchId`, `needsMoreThoughts`.

## Serena

Common bootstrap calls:

```ts
await Serena.activateProject({ project: "." });
await Serena.initialInstructions({});
const memories = await Serena.listMemories({});
const core = await Serena.readMemory({ memory_name: "core" });
```

Common code navigation calls:

```ts
await Serena.jetBrainsGetSymbolsOverview({ relative_path: "src/index.ts", depth: 1 });
await Serena.jetBrainsFindSymbol({ name_path_pattern: "MyClass/myMethod", include_body: false });
await Serena.jetBrainsFindReferencingSymbols({ relative_path: "src/index.ts", name_path: "MyClass/myMethod" });
```

Activate the project before initial instructions or memory calls. Serena wrappers use `memory_name`, not `memory_file_name`, and return `{ result: string }`.

## Chrome DevTools

```ts
await ChromeDevtools.newPage({ url: "http://localhost:3000" });
await ChromeDevtools.takeSnapshot({});
await ChromeDevtools.fillForm({ elements: [{ uid: "1", value: "test@example.com" }] });
await ChromeDevtools.listConsoleMessages({ pageSize: 20 });
await ChromeDevtools.listNetworkRequests({ pageSize: 50 });
```

Most DOM actions require a `uid` from `takeSnapshot`.

## Atlassian Rovo

```ts
await AtlassianRovo.atlassianUserInfo({});
await AtlassianRovo.getAccessibleAtlassianResources({});
await AtlassianRovo.search({ query: "FNR-123 acceptance criteria" });
await AtlassianRovo.getJiraIssue({ cloudId: "example.atlassian.net", issueIdOrKey: "FNR-123" });
await AtlassianRovo.searchJiraIssuesUsingJql({ cloudId: "example.atlassian.net", jql: "project = FNR ORDER BY updated DESC" });
await AtlassianRovo.getConfluencePage({ cloudId: "example.atlassian.net", pageId: "123456", contentFormat: "markdown" });
```

Most Jira, Confluence, Compass, and Teamwork Graph calls require `cloudId`. Use `AtlassianRovo.search` for broad Jira/Confluence discovery unless the task specifically calls for JQL or CQL.

## Vestige

```ts
await Vestige.search({ query: "FNR-123 implementation plan", limit: 5, detail_level: "summary" });
await Vestige.smartIngest({ content: "Decision summary...", node_type: "decision", tags: ["FNR-123"] });
await Vestige.memory({ action: "get", id: "memory-id" });
await Vestige.intention({ action: "check", context: { topics: ["release"] } });
```

Destructive memory actions use `Vestige.memory({ action: "purge" | "delete", confirm: true, ... })` and require explicit user permission.

## Taskwarrior

No Goose TypeScript SDK wrapper is currently exposed for Taskwarrior. Use the CLI:

```bash
task +PENDING export
task <id-or-uuid> info
```

Do not invent `Taskwarrior.*` SDK calls.
