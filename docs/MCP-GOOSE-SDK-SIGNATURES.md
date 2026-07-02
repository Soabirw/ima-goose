# MCP Goose TypeScript SDK Signatures

This reference documents MCP-related Goose TypeScript SDK wrappers that are currently exposed in the Goose API harness. Use these signatures as the source of truth for SDK calls; do not invent wrappers for MCP tools that are not listed here.

Use direct/native MCP tools when the harness exposes tools directly. Use these SDK wrappers only inside a Goose TypeScript SDK execution context where the namespace is registered. Tool results are already parsed JavaScript values; do not `JSON.parse` the whole result unless a specific returned string field is known to contain JSON. Serena and Vestige are exceptions: use `ima-mcp serena` for Serena bootstrap/status/memory and `ima-mcp vestige` for all Vestige operations. These tools can make the TypeScript execution path fail before the intended call runs.

## Namespace summary

| Skill | SDK namespace | Return shape |
|---|---|---|
| `mcp-atlassian` | `AtlassianRovo` | `Promise<any>` |
| `mcp-chrome-devtools` | `ChromeDevtools` | `Promise<any>` |
| `mcp-context7` | `Context7` | `Promise<any>` |
| `mcp-fetch` | `Fetch` | `Promise<any>` |
| `mcp-qdrant` | `QdrantMemory` | `{ result: string }` |
| `mcp-sequential-thinking` | `SequentialThinking` | typed thought result |
| `mcp-serena` | `Serena` | Do not use SDK for bootstrap; use `ima-mcp serena` |
| `mcp-tavily` | `Tavily` | `Promise<any>` |
| `mcp-vestige` | `Vestige` | Do not use SDK; use `ima-mcp vestige` |
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

Do **not** use the Goose TypeScript SDK / `execute_typescript` path for Serena
bootstrap in Goose API sessions. The registered SDK generation can fail before
any Serena call executes, including failures caused by unrelated namespaces. Use
`ima-mcp` for project activation, `initial_instructions`, status, and memory
reads:

```bash
ima-mcp serena project activate --json
ima-mcp serena instructions --json
ima-mcp serena memory list --json
ima-mcp serena memory read core --json
```

Native/direct Serena MCP tools may still be used for JetBrains-backed symbol
navigation when the active harness exposes them directly and they have proven
reliable. Avoid using `execute_typescript` as a Serena fallback.

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

Do **not** use the Goose TypeScript SDK / `execute_typescript` path for Vestige.
The Vestige SDK registration can break generated TypeScript before any tool call
runs, which can also block unrelated SDK probes. Use the `ima-mcp` CLI gateway
for Vestige status, search, retrieval, lifecycle saves, preferences, decisions,
patterns, intentions, and closeout memory:

```bash
ima-mcp vestige status --json
ima-mcp vestige doctor --json
ima-mcp vestige search "FNR-123 implementation plan" --json
ima-mcp vestige get <memory-id> --json
ima-mcp vestige save --type closeout --file /tmp/vestige-closeout.md --json
```

`vestige save` is mutating and requires the task to explicitly call for a
memory/lifecycle update. Destructive memory operations should not be attempted
through ad-hoc SDK calls. Use documented `ima-mcp vestige` commands and report a
blocker if the gateway is unavailable.

## Taskwarrior

No Goose TypeScript SDK wrapper is currently exposed for Taskwarrior. Use the CLI:

```bash
task +PENDING export
task <id-or-uuid> info
```

Do not invent `Taskwarrior.*` SDK calls.
