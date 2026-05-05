# Tavily — Web Research

Use for current information and multi-source research (post-January 2025).

## Goose Extension Config

```yaml
# In ~/.config/goose/config.yaml
extensions:
  tavily:
    type: stdio
    cmd: "npx"
    args: ["-y", "tavily-mcp@latest"]
    env_keys: ["TAVILY_API_KEY"]
    timeout: 300
```

## When to Use

| Need | Use |
|------|-----|
| Post-Jan-2025 info | Tavily search |
| Multi-source research | Tavily search (advanced) |
| Single known URL | Built-in fetch |
| Library API docs | Context7 |
| Within training knowledge | Native LLM |

## Query Tips

Include year. Be specific: `"Vite 6 breaking changes 2026"` not `"Vite updates"`.
