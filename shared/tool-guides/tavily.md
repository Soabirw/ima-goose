# Tavily — Web Research

Use for current information and multi-source research (post-January 2025).

## Goose Extension Config

```yaml
# In config.yaml (already configured)
extensions:
  tavily:
    type: stdio
    cmd: "npx"
    args: ["-y", "tavily-mcp@latest"]
    env_keys: ["TAVILY_API_KEY"]
    timeout: 300
```

## Goose TypeScript SDK

When the typed SDK is available, use the `Tavily` namespace:

```ts
await Tavily.tavilySearch({
  query: "Vue 4 new features 2026",
  search_depth: "basic",
  max_results: 10,
});

await Tavily.tavilyExtract({
  urls: ["https://example.com/article"],
  format: "markdown",
});
```

Available wrappers: `tavilySearch`, `tavilyExtract`, `tavilyCrawl`, `tavilyMap`, and `tavilyResearch`. They return `Promise<any>`. Use `time_range`, `start_date`, or `end_date` for recency; do not use unsupported fields such as `days` or `topic: "news"`.

## When to Use

| Need | Use |
|------|-----|
| Post-Jan-2025 info | Tavily search |
| Multi-source research | Tavily search/research |
| Single known URL | Fetch |
| Library API docs | Context7 |
| Within training knowledge | Native LLM |

## Search Parameters

| Parameter | Values | Default |
|-----------|--------|---------|
| `query` | string | required |
| `search_depth` | `basic` / `advanced` / `fast` / `ultra-fast` | server default |
| `max_results` | number | server default |
| `time_range` | `day` / `week` / `month` / `year` | — |
| `start_date`, `end_date` | `YYYY-MM-DD` | — |
| `include_domains` | string array | — |
| `exclude_domains` | string array | — |

## Query Tips

Include year. Be specific: `"Vite 6 breaking changes 2026"` not `"Vite updates"`.

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
