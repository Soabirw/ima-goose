---
name: "mcp-fetch"
description: "Fetch MCP — retrieve URL content and convert it into model-readable text. Use when the user provides a URL to inspect, summarize, quote briefly, or use as source material."
---

# Fetch MCP

Use Fetch when the task needs content from a specific URL and a lightweight page retrieval is enough.

Prefer Tavily for broad web research, current search, or crawling. Prefer Fetch when the user already gave a URL or asks for the contents of one page.

## Common Uses

- Read a specific documentation page, article, raw file, or simple HTML page.
- Summarize provided URL content.
- Extract source text for a small citation or implementation reference.
- Convert HTML into easier-to-read Markdown/text before analysis.

## Goose Extension

```yaml
extensions:
  fetch:
    enabled: true
    name: fetch
    type: stdio
    cmd: uvx
    args: ["mcp-server-fetch"]
    timeout: 60
```

## Usage Pattern

1. Use Fetch for the exact URL.
2. Summarize or extract only what is needed for the user's task.
3. Do not paste long copyrighted source text; summarize and quote sparingly.

## Verification

```text
Fetch https://example.com and summarize it in one paragraph.
```
