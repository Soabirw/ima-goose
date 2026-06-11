---
name: mcp-tavily
description: Use Tavily MCP for web research and current information beyond knowledge cutoff (post-January 2025).
---

# Tavily MCP - Web Research & Current Information

Use Tavily for current information and multi-source research instead of multiple WebFetch calls.

## Tools

| Direct/native tool | Goose SDK wrapper | Purpose |
|------|------|---------|
| `mcp__tavily__search` | `Tavily.tavilySearch` | Web search with depth control |
| `mcp__tavily__extract` | `Tavily.tavilyExtract` | Extract content from specific URLs |
| `mcp__tavily__crawl` | `Tavily.tavilyCrawl` | Crawl a site from a root URL |
| `mcp__tavily__map` | `Tavily.tavilyMap` | Map URLs on a site |
| `mcp__tavily__research` | `Tavily.tavilyResearch` | Run a multi-source research task |

## Goose TypeScript SDK

Use the `Tavily` namespace when the Goose typed SDK is available. Tavily SDK calls return `Promise<any>`.

| Function | Required input | Useful optional input |
|---|---|---|
| `Tavily.tavilySearch` | `query: string` | `search_depth?: "basic" \| "advanced" \| "fast" \| "ultra-fast"`, `time_range?: "day" \| "week" \| "month" \| "year"`, `start_date?: "YYYY-MM-DD"`, `end_date?: "YYYY-MM-DD"`, `max_results?: number`, `include_domains?: string[]`, `exclude_domains?: string[]`, `include_raw_content?: boolean`, `country?: string` |
| `Tavily.tavilyExtract` | `urls: string[]` | `extract_depth?: "basic" \| "advanced"`, `format?: "markdown" \| "text"`, `include_images?: boolean`, `query?: string` |
| `Tavily.tavilyCrawl` | `url: string` | `max_depth?: number`, `max_breadth?: number`, `limit?: number`, `instructions?: string`, `select_paths?: string[]`, `select_domains?: string[]`, `allow_external?: boolean`, `extract_depth?: "basic" \| "advanced"`, `format?: "markdown" \| "text"` |
| `Tavily.tavilyMap` | `url: string` | `max_depth?: number`, `max_breadth?: number`, `limit?: number`, `instructions?: string`, `select_paths?: string[]`, `select_domains?: string[]`, `allow_external?: boolean` |
| `Tavily.tavilyResearch` | `input: string` | `model?: "mini" \| "pro" \| "auto"` |

Do not use unsupported SDK fields such as `days` or `topic: "news"`. For recency, use `time_range`, `start_date`, or `end_date`.

## Search

```ts
await Tavily.tavilySearch({
  query: "Vue 4 new features 2026",
  search_depth: "basic",
  max_results: 10,
});
```

| Parameter | Values | Default |
|-----------|--------|---------|
| `query` | string | required |
| `search_depth` | `basic` / `advanced` / `fast` / `ultra-fast` | server default |
| `max_results` | number | server default |
| `time_range` | `day` / `week` / `month` / `year` | — |
| `start_date`, `end_date` | `YYYY-MM-DD` | — |
| `include_domains` | string array | — |
| `exclude_domains` | string array | — |

| Depth | Use Case |
|-------|----------|
| `basic` | Factual lookups, quick answers |
| `advanced` | Comparisons, multiple perspectives |
| `fast` / `ultra-fast` | Latency-sensitive lookups |

## Query Patterns

| Need | Pattern |
|------|---------|
| Latest features | `"[library] [version] new features [year]"` |
| Breaking changes | `"[library] [version] migration breaking changes"` |
| Comparisons | `"[tool A] vs [tool B] comparison [year]"` |
| Best practices | `"[topic] best practices [year]"` |

Always include year. Be specific: `"Vite 6 breaking changes"` not `"Vite updates"`.

## Extract

```ts
await Tavily.tavilyExtract({
  urls: ["https://example.com/article"],
  format: "markdown",
});
```

## Decision Logic

```
Post-Jan-2025 info needed → Tavily
Multi-source research needed → Tavily
Single known URL → Fetch
Library API docs (not "what's new") → Context7
Question within model knowledge → native answer
```

## Examples

| Request | Action |
|---------|--------|
| "What's new in Vue 4?" | `Tavily.tavilySearch({ query: "Vue 4 new features 2026", search_depth: "basic" })` |
| "Compare Bun vs Node 2026" | `Tavily.tavilySearch({ query: "Bun vs Node.js comparison 2026", search_depth: "advanced" })` |
| "How does useState work?" | Native answer |
| "Quasar QDialog API" | Context7 |

## Source Attribution

Always include after Tavily results:

```
Sources:
- [Source Name](https://url)
```
