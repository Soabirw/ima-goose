---
name: mcp-atlassian
description: "Atlassian MCP — use for all Jira and Confluence operations. Triggers on: Jira issue keys (FNR-123, IMA-456), 'create ticket', 'create issue', 'update Jira', 'add comment', 'transition issue', 'search Confluence', 'create Confluence page', 'update page', 'acceptance criteria', sprint planning, workflow transitions, JQL queries, CQL queries, issue links, worklogs, get issue details, list issues in project."
---

# Atlassian MCP - Jira & Confluence

Use the Atlassian MCP for all Jira and Confluence operations. When you see a Jira issue key in conversation, fetch context first before acting.

## Tools

### Jira Operations

| Tool | Purpose |
|------|---------|
| `mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql` | Search issues with JQL |
| `mcp__claude_ai_Atlassian__getJiraIssue` | Get issue by key (FNR-123) |
| `mcp__claude_ai_Atlassian__createJiraIssue` | Create a new issue |
| `mcp__claude_ai_Atlassian__editJiraIssue` | Edit issue fields |
| `mcp__claude_ai_Atlassian__addCommentToJiraIssue` | Add a comment |
| `mcp__claude_ai_Atlassian__addWorklogToJiraIssue` | Log time against an issue |
| `mcp__claude_ai_Atlassian__getTransitionsForJiraIssue` | List available transitions |
| `mcp__claude_ai_Atlassian__transitionJiraIssue` | Change issue status |
| `mcp__claude_ai_Atlassian__createIssueLink` | Link two issues |
| `mcp__claude_ai_Atlassian__getJiraProjectIssueTypesMetadata` | Get issue types for project |
| `mcp__claude_ai_Atlassian__getJiraIssueTypeMetaWithFields` | Get fields for an issue type |
| `mcp__claude_ai_Atlassian__lookupJiraAccountId` | Find a user's account ID |

### Confluence Operations

| Tool | Purpose |
|------|---------|
| `mcp__claude_ai_Atlassian__getConfluencePage` | Get page by ID |
| `mcp__claude_ai_Atlassian__getConfluenceSpaces` | List spaces |
| `mcp__claude_ai_Atlassian__getConfluencePageDescendants` | Get child pages |
| `mcp__claude_ai_Atlassian__getConfluencePageFooterComments` | Get footer comments |
| `mcp__claude_ai_Atlassian__getConfluencePageInlineComments` | Get inline comments |
| `mcp__claude_ai_Atlassian__createConfluencePage` | Create a new page |
| `mcp__claude_ai_Atlassian__updateConfluencePage` | Update existing page |
| `mcp__claude_ai_Atlassian__createConfluenceFooterComment` | Add footer comment |
| `mcp__claude_ai_Atlassian__createConfluenceInlineComment` | Add inline comment |

### General

| Tool | Purpose |
|------|---------|
| `mcp__claude_ai_Atlassian__search` | Unified Jira + Confluence search |
| `mcp__claude_ai_Atlassian__atlassianUserInfo` | Get current user info |
| `mcp__claude_ai_Atlassian__getAccessibleAtlassianResources` | List accessible sites |
| `mcp__claude_ai_Atlassian__searchConfluenceUsingCql` | Search Confluence with CQL |

## Common JQL Patterns

```
# Open issues in a project
project = FNR AND status != Done ORDER BY created DESC

# In Progress this sprint
project = FNR AND status = "In Progress" AND sprint in openSprints()

# Assigned to me
assignee = currentUser() AND status != Done

# Issues with label
project = FNR AND labels = "backend" AND status != Done

# Recently updated
project = FNR AND updated >= -7d ORDER BY updated DESC

# Blocking issues
issueFunction in subtasksOf("FNR-123")
```

## Common CQL Patterns (Confluence)

```
# Pages in a space
space = DEV AND type = page AND text ~ "deployment"

# Recently modified
space = DEV AND type = page AND lastModified >= "2026-01-01"

# By title
space = DEV AND title = "Architecture Overview"

# By label
space = DEV AND type = page AND label = "runbook"
```

## Jira Awareness Pattern

When you see an issue key (e.g., FNR-123) in conversation:

1. Fetch issue context first: `getJiraIssue(issueKey: "FNR-123")`
2. Read acceptance criteria before implementing
3. Fetch transitions before status change: `getTransitionsForJiraIssue(issueKey: "FNR-123")`
4. Update status on start/complete work: `transitionJiraIssue`

```
IF issue key seen in prompt → getJiraIssue first
IF starting work on a story → transition to "In Progress"
IF work completed → transition to "In Review" or "Done"
IF unclear requirements → check issue description + comments
```

## Decision Logic

```
IF Jira/Confluence operation → MCP tools (preferred)
IF bulk operation > 50 items → REST API fallback (curl)
IF attachment upload/download → REST API (MCP gap)
IF sprint/board management → REST API (MCP gap)
IF operation fails → check error, fallback to REST
```

### REST API Fallback

```bash
# Base URL pattern
curl -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" \
  -H "Accept: application/json" \
  "https://$ATLASSIAN_SITE_URL/rest/api/3/issue/FNR-123"
```

## Setup

Atlassian MCP requires env vars — direct config edit is the easiest path:

Add to `~/.config/goose/config.yaml`:

```yaml
extensions:
  atlassian:
    enabled: false   # set true when using Jira/Confluence
    name: atlassian
    type: stdio
    cmd: npx
    args: ["-y", "@anthropic-ai/mcp-proxy", "--endpoint", "https://mcp.atlassian.com"]
    env_keys: ["ATLASSIAN_API_TOKEN", "ATLASSIAN_EMAIL", "ATLASSIAN_SITE_URL"]
    timeout: 300
```

Add to your shell profile (`~/.bashrc` or `~/.zshrc`):

```bash
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="your-api-token"     # https://id.atlassian.com/manage-profile/security/api-tokens
export ATLASSIAN_SITE_URL="your-org.atlassian.net"
```

Note: Set `enabled: true` only when actively using Jira/Confluence. The extension adds startup time when enabled.
