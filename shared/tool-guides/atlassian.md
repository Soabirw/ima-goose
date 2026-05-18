# Atlassian — Jira, Confluence & Rovo MCP

Use the Atlassian Rovo MCP remote server for interactive Goose work, and keep
the REST helper available for deterministic scripts, Jira workflow updates, and
fallback auth.

## Rovo MCP Setup for Goose

The old Atlassian SSE endpoint is going away after June 30, 2026. Do not use:

```text
https://mcp.atlassian.com/v1/sse
```

Configure Goose with the current Streamable HTTP endpoint:

```text
https://mcp.atlassian.com/v1/mcp/authv2
```

Recommended config block:

```yaml
atlassian-rovo:
  enabled: true
  type: streamable_http
  name: atlassian-rovo
  description: Atlassian Rovo MCP
  uri: https://mcp.atlassian.com/v1/mcp/authv2
  envs: {}
  env_keys: []
  headers: {}
  timeout: 300
  socket: null
  bundled: null
  available_tools: []
```

Or configure interactively:

```bash
goose configure
```

Then choose:

```text
Add Extension
Remote Extension (Streamable HTTP)
```

Use these values:

```text
Name: atlassian-rovo
Endpoint URI: https://mcp.atlassian.com/v1/mcp/authv2
Timeout: 300
Description: Atlassian Rovo MCP for Jira, Confluence, Compass, and Rovo search
Custom headers: No
```

For a one-off session without changing defaults:

```bash
goose session --with-streamable-http-extension "https://mcp.atlassian.com/v1/mcp/authv2 timeout=300"
```

On first use, Goose should open a browser-based Atlassian OAuth flow. Sign in
with the Atlassian account that has access to the Jira/Confluence site you need,
authorize the client, and enable the Atlassian apps requested by the client.

If native remote OAuth is blocked in a local environment, use the local proxy
fallback as a command-line extension:

```text
Command: npx -y mcp-remote@latest https://mcp.atlassian.com/v1/mcp/authv2
```

This requires Node.js 18+.

## Rovo MCP Verification

Start a new Goose session after adding the extension and ask:

```text
Use Atlassian Rovo MCP to show my Atlassian user info.
```

Then try a read-only query:

```text
Search Jira for issues assigned to me updated in the last 7 days.
```

If OAuth loops or redirects fail, allow `http://localhost:3334` in browser and
firewall settings, restart the Goose session, and re-run the connection flow.
If your organization blocks user-installed apps, an Atlassian site admin may
need to allow or pre-approve the Atlassian MCP app.

## API Auth

Preferred:

```bash
export ATLASSIAN_BEARER_TOKEN="..."
export ATLASSIAN_CLOUD_ID="..."
export ATLASSIAN_DOMAIN="flccc.atlassian.net"
```

Fallback:

```bash
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="..."
export ATLASSIAN_DOMAIN="your-org.atlassian.net"
```

## Common Operations

| Task | Approach |
|------|----------|
| Search issues | JQL: `project = FNR AND status = "In Progress"` |
| Get issue details | Fetch by key: `FNR-123` |
| Add comment | REST API |
| Transition issue | Get available transitions, then apply |
| Search Confluence | CQL: `space = DEV AND type = page AND text ~ "deployment"` |
| Create/update pages | REST API |

## Jira Awareness

When you see a Jira issue key (e.g., FNR-123) in conversation:
1. Fetch the issue context first
2. Read acceptance criteria before implementing
3. Update status when starting/completing work
