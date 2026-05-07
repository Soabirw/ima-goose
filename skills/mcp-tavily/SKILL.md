---
name: mcp-tavily
description: Use Tavily MCP for web research and current information beyond knowledge cutoff (post-January 2025).
---

# Tavily MCP - Web Research & Current Information

Use Tavily for current information and multi-source research instead of multiple WebFetch calls.

## Tools

| Tool | Purpose |
|------|---------|
| `mcp__tavily__search` | Web search with depth control |
| `mcp__tavily__extract` | Extract content from specific URLs |

## Search

```
mcp__tavily__search
  query: "Vue 4 new features 2026"
  search_depth: "basic"
  max_results: 10
```

| Parameter | Values | Default |
|-----------|--------|---------|
| `query` | string | required |
| `search_depth` | `basic` / `advanced` | `basic` |
| `max_results` | number | 5 |
| `topic` | `general` / `news` | `general` |
| `days` | N (last N days) | — |
| `include_domains` | array | — |
| `exclude_domains` | array | — |

| Depth | Use Case |
|-------|----------|
| `basic` | Factual lookups, quick answers |
| `advanced` | Comparisons, multiple perspectives |

## Query Patterns

| Need | Pattern |
|------|---------|
| Latest features | `"[library] [version] new features [year]"` |
| Breaking changes | `"[library] [version] migration breaking changes"` |
| Comparisons | `"[tool A] vs [tool B] comparison [year]"` |
| Best practices | `"[topic] best practices [year]"` |

Always include year. Be specific: `"Vite 6 breaking changes"` not `"Vite updates"`.

## Extract

```
mcp__tavily__extract
  urls: ["https://example.com/article"]
```

## Decision Logic

```
Post-Jan-2025 info needed → Tavily
Multi-source research needed → Tavily
Single known URL → WebFetch
Library API docs (not "what's new") → Context7
Question within Claude's knowledge → native Claude
```

## Examples

| Request | Action |
|---------|--------|
| "What's new in Vue 4?" | `search(query: "Vue 4 new features 2026", search_depth: "basic")` |
| "Compare Bun vs Node 2026" | `search(query: "Bun vs Node.js comparison 2026", search_depth: "advanced")` |
| "How does useState work?" | Native Claude |
| "Quasar QDialog API" | Context7 |

## Source Attribution

Always include after Tavily results:

```
Sources:
- [Source Name](https://url)
```
