# Atlassian — Jira & Confluence

MCP-first for Jira/Confluence operations. Direct REST API (curl) for gaps.

## Goose Extension Config

```yaml
# In ~/.config/goose/config.yaml
extensions:
  atlassian:
    type: stdio
    cmd: "npx"
    args: ["-y", "@anthropic-ai/mcp-proxy", "--endpoint", "https://mcp.atlassian.com"]
    env_keys: ["ATLASSIAN_API_TOKEN", "ATLASSIAN_EMAIL", "ATLASSIAN_SITE_URL"]
    timeout: 300
```

## Common Operations

| Task | Approach |
|------|----------|
| Search issues | JQL: `project = FNR AND status = "In Progress"` |
| Get issue details | Fetch by key: `FNR-123` |
| Add comment | Via MCP tool or REST API |
| Transition issue | Get available transitions, then apply |
| Search Confluence | CQL: `space = DEV AND type = page AND text ~ "deployment"` |
| Create/update pages | Via MCP tool |

## Jira Awareness

When you see a Jira issue key (e.g., FNR-123) in conversation:
1. Fetch the issue context first
2. Read acceptance criteria before implementing
3. Update status when starting/completing work
