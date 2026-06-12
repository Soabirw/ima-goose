---
name: mcp-atlassian
description: "Atlassian specialist for Jira, Confluence, Compass, and the Atlassian Rovo MCP Server in Goose. Use for Rovo MCP setup, Jira issue keys such as FNR-123, issue descriptions and comments, JQL searches, adding comments, transitions/status changes, Confluence lookup, Atlassian Cloud auth setup, ATLASSIAN_BEARER_TOKEN, ATLASSIAN_CLOUD_ID, ATLASSIAN_DOMAIN, ATLASSIAN_EMAIL, and ATLASSIAN_API_TOKEN."
---

# Atlassian - Rovo MCP + REST API

Prefer the Atlassian Rovo MCP Server for interactive Jira, Confluence, Compass,
and Rovo search work in Goose. Use the bundled REST helper when MCP is not
configured, when you need deterministic scripted Jira workflow updates, or when
the user explicitly asks for direct API work. The skill name remains
`mcp-atlassian` for installer and recipe compatibility.

## ima-mcp Gateway Path

When a project has the `ima-mcp` gateway installed and current, use it as a
stable local CLI path for safe Atlassian Rovo diagnostics and read-only Jira or
Confluence lookups.

```bash
ima-mcp atlassian status --json
ima-mcp atlassian doctor --json
ima-mcp atlassian jira get FNR-123 --cloud-id <cloud-id> --json
ima-mcp atlassian jira search "project = FNR ORDER BY updated DESC" --cloud-id <cloud-id> --max-results 25 --json
ima-mcp atlassian confluence get <page-id> --cloud-id <cloud-id> --json
```

The gateway should return stable `auth_required` or `auth_failed` diagnostics
instead of launching browser OAuth or mutating credentials by default. Run live
Jira and Confluence reads only with approved safe targets. Prefer direct
`AtlassianRovo.*` wrappers when they are available and the current harness
exposes the needed operation reliably.

## Rovo MCP Setup in Goose

The old Atlassian SSE endpoint is being retired after June 30, 2026. Do not
configure new clients with:

```text
https://mcp.atlassian.com/v1/sse
```

Use the current Streamable HTTP endpoint:

```text
https://mcp.atlassian.com/v1/mcp/authv2
```

For default Goose setup, use this config block:

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

Or configure it interactively:

```bash
goose configure
```

Choose:

```text
Add Extension
Remote Extension (Streamable HTTP)
```

Use:

```text
Name: atlassian-rovo
Endpoint URI: https://mcp.atlassian.com/v1/mcp/authv2
Timeout: 300
Description: Atlassian Rovo MCP for Jira, Confluence, Compass, and Rovo search
Custom headers: No
```

For a one-off session:

```bash
goose session --with-streamable-http-extension "https://mcp.atlassian.com/v1/mcp/authv2 timeout=300"
```

When first used, Goose should open an Atlassian OAuth browser flow. Sign in with
the Atlassian account that has site access, authorize the client, and enable the
requested Atlassian apps.

If native remote OAuth fails locally, add a Command-line Extension instead:

```text
npx -y mcp-remote@latest https://mcp.atlassian.com/v1/mcp/authv2
```

This fallback requires Node.js 18+.

## Goose TypeScript SDK

Use the `AtlassianRovo` namespace when the Goose typed SDK is available. The Rovo MCP tools return `Promise<any>`. Do not invent `Jira.*` or `Confluence.*` namespaces. Most product-specific calls require `cloudId`; use the site hostname if accepted, or call `AtlassianRovo.getAccessibleAtlassianResources({})` to discover cloud IDs.

### Discovery, Rovo search, and hydration

| Purpose | Goose SDK wrapper | Required input | Optional input |
|---|---|---|---|
| Current user | `AtlassianRovo.atlassianUserInfo` | `{}` | — |
| Accessible sites | `AtlassianRovo.getAccessibleAtlassianResources` | `{}` | — |
| Rovo search | `AtlassianRovo.search` | `query: string` | `cloudId?: string` (not normally needed) |
| Fetch by ARI | `AtlassianRovo.fetch` | `id: string` | `cloudId?: string` (not normally needed) |

### Jira

| Purpose | Goose SDK wrapper | Required input | Useful optional input |
|---|---|---|---|
| Get issue | `AtlassianRovo.getJiraIssue` | `cloudId`, `issueIdOrKey` | `fields?: string[]`, `expand?: string`, `responseContentFormat?: "markdown" \| "adf"` |
| Search JQL | `AtlassianRovo.searchJiraIssuesUsingJql` | `cloudId`, `jql` | `maxResults?: number`, `fields?: string[]`, `nextPageToken?: string` |
| Create issue | `AtlassianRovo.createJiraIssue` | `cloudId`, `projectKey`, `issueTypeName`, `summary` | `description?`, `parent?`, `additional_fields?`, `transition?`, content formats |
| Edit issue | `AtlassianRovo.editJiraIssue` | `cloudId`, `issueIdOrKey`, `fields` | content formats |
| Add/update comment | `AtlassianRovo.addCommentToJiraIssue` | `cloudId`, `issueIdOrKey`, `commentBody` | `commentId?`, `commentVisibility?`, content formats |
| Get transitions | `AtlassianRovo.getTransitionsForJiraIssue` | `cloudId`, `issueIdOrKey` | `transitionId?`, `includeUnavailableTransitions?` |
| Transition issue | `AtlassianRovo.transitionJiraIssue` | `cloudId`, `issueIdOrKey`, `transition: { id: string }` | `fields?`, `update?`, `historyMetadata?` |
| Lookup user | `AtlassianRovo.lookupJiraAccountId` | `cloudId`, `searchString` | — |
| Add/update worklog | `AtlassianRovo.addWorklogToJiraIssue` | `cloudId`, `issueIdOrKey`, `timeSpent` | `worklogId?`, `commentBody?`, `started?`, `visibility?` |
| Get link types | `AtlassianRovo.getIssueLinkTypes` | `cloudId` | — |
| Create issue link | `AtlassianRovo.createIssueLink` | `cloudId`, `inwardIssue`, `outwardIssue`, `type` | `comment?`, `contentFormat?` |
| Remote links | `AtlassianRovo.getJiraIssueRemoteIssueLinks` | `cloudId`, `issueIdOrKey` | `globalId?` |
| Projects | `AtlassianRovo.getVisibleJiraProjects` | `cloudId` | `searchString?`, `action?`, pagination |
| Issue types | `AtlassianRovo.getJiraProjectIssueTypesMetadata` | `cloudId`, `projectIdOrKey` | pagination |
| Field metadata | `AtlassianRovo.getJiraIssueTypeMetaWithFields` | `cloudId`, `projectIdOrKey`, `issueTypeId` | pagination |

### Confluence

| Purpose | Goose SDK wrapper | Required input | Useful optional input |
|---|---|---|---|
| Get page/blog | `AtlassianRovo.getConfluencePage` | `cloudId`, `pageId` | `contentType?: "page" \| "blog"`, `contentFormat?: "html" \| "markdown" \| "adf"` |
| Search CQL | `AtlassianRovo.searchConfluenceUsingCql` | `cloudId`, `cql` | `cqlcontext?`, `limit?`, `cursor?`, `expand?` |
| Spaces | `AtlassianRovo.getConfluenceSpaces` | `cloudId` | `ids?`, `keys?`, `type?`, `status?`, `limit?` |
| Pages in space | `AtlassianRovo.getPagesInConfluenceSpace` | `cloudId`, `spaceId` | `contentType?`, `limit?`, `cursor?`, `status?`, `title?`, `sort?` |
| Footer comments | `AtlassianRovo.getConfluencePageFooterComments` | `cloudId`, `pageId` | content type/status/sort/format, `includeReplies?` |
| Inline comments | `AtlassianRovo.getConfluencePageInlineComments` | `cloudId`, `pageId` | status/resolution/sort/format, `includeReplies?` |
| Comment replies | `AtlassianRovo.getConfluenceCommentChildren` | `cloudId`, `commentId`, `commentType` | `limit?`, `cursor?`, `sort?`, `contentFormat?` |
| Descendants | `AtlassianRovo.getConfluencePageDescendants` | `cloudId`, `pageId` | `limit?`, `depth?`, `cursor?` |
| Create page/blog | `AtlassianRovo.createConfluencePage` | `cloudId`, `spaceId`, `body` | `title?`, `parentId?`, `contentFormat?`, `status?`, `isPrivate?` |
| Update page/blog | `AtlassianRovo.updateConfluencePage` | `cloudId`, `pageId`, `body` | `title?`, `spaceId?`, `parentId?`, `versionMessage?`, `includeBody?` |
| Footer comment | `AtlassianRovo.createConfluenceFooterComment` | `cloudId`, `body` | `pageId?`, `parentCommentId?`, `contentFormat?` |
| Inline comment | `AtlassianRovo.createConfluenceInlineComment` | `cloudId`, `body` | `pageId?`, `parentCommentId?`, `inlineCommentProperties?`, `contentFormat?` |

### Compass and Teamwork Graph

| Purpose | Goose SDK wrapper | Required input | Useful optional input |
|---|---|---|---|
| List components | `AtlassianRovo.getCompassComponents` | `cloudId` | `query?`, `filters?`, `after?`, `maxResults?` |
| Get component | `AtlassianRovo.getCompassComponent` | `cloudId`, `componentId` | include custom fields/links/dependencies flags |
| Custom field definitions | `AtlassianRovo.getCompassCustomFieldDefinitions` | `cloudId` | — |
| Create field definition | `AtlassianRovo.createCompassCustomFieldDefinition` | `cloudId`, `input: { name, type }` | `description?`, `isRequired?` |
| Create component | `AtlassianRovo.createCompassComponent` | `cloudId`, `name`, `typeId` | `description?`, `ownerId?`, `labels?` |
| Create component relationship | `AtlassianRovo.createCompassComponentRelationship` | `cloudId`, `fromComponentId`, `toComponentId`, `relationshipType` | — |
| Graph context | `AtlassianRovo.getTeamworkGraphContext` | `cloudId`, `objectType`, `objectIdentifier` | `detailLevel?`, relationship/type/time filters, pagination |
| Hydrate graph objects | `AtlassianRovo.getTeamworkGraphObject` | `cloudId`, `objects: string[]` | — |
| Add graph context | `AtlassianRovo.addTeamworkGraphContext` | `cloudId`, `relationshipType`, `objectIdentifier`, `targetObjectIdentifier` | `title?` |

Examples:

```ts
const me = await AtlassianRovo.atlassianUserInfo({});
const issue = await AtlassianRovo.getJiraIssue({
  cloudId: "flccc.atlassian.net",
  issueIdOrKey: "FNR-123",
  responseContentFormat: "markdown",
});
const search = await AtlassianRovo.search({ query: "FNR-123 acceptance criteria" });
```

## Rovo MCP Verification

After adding the extension, start a fresh Goose session and ask for a read-only
check first:

```text
Use Atlassian Rovo MCP to show my Atlassian user info.
```

Then verify Jira access:

```text
Search Jira for issues assigned to me updated in the last 7 days.
```

If OAuth loops or redirects fail, allow `http://localhost:3334` in browser and
firewall settings, restart Goose, and reconnect. If your organization blocks
user-installed apps, ask an Atlassian admin to allow the Atlassian MCP app.

## First Move

When a Jira key appears and the Rovo MCP is unavailable or not already
authenticated, fetch the issue with the REST helper before planning or
implementing:

```bash
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:get FNR-123
```

If working from the repo source instead of an installed skill:

```bash
node skills/mcp-atlassian/scripts/atlassian-api.mjs jira:get FNR-123
```

Read Summary, Description, Acceptance Criteria, Comments, and Status. If requirements conflict, the newest Jira comment normally wins.

## Auth Model

Preferred OAuth/Bearer setup:

```bash
export ATLASSIAN_BEARER_TOKEN="..."
export ATLASSIAN_CLOUD_ID="..."
export ATLASSIAN_DOMAIN="flccc.atlassian.net"
```

This uses:

```text
https://api.atlassian.com/ex/jira/$ATLASSIAN_CLOUD_ID/rest/api/3
https://api.atlassian.com/ex/confluence/$ATLASSIAN_CLOUD_ID/wiki/rest/api
```

Basic/API-token fallback:

```bash
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="..."
export ATLASSIAN_DOMAIN="your-org.atlassian.net"
```

This uses:

```text
https://$ATLASSIAN_DOMAIN/rest/api/3
https://$ATLASSIAN_DOMAIN/wiki/rest/api
```

Do not print tokens. When debugging auth, call `jira:myself` and report only status, account display name, and whether auth succeeded.

## Locale

Always send `Accept-Language: en-US` with Atlassian REST API requests. Jira
Cloud localizes issue type names, status names, and field names in API
responses, and some app accounts can otherwise receive non-English labels even
when the Jira site is intended to be English. The bundled helper defaults to
`en-US`; override only when a user explicitly asks for another locale:

```bash
ATLASSIAN_LOCALE=en-US node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:get FNR-2549
```

## Helper Commands

Use the bundled script for routine Jira work:

```bash
# Verify auth
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:myself

# Get issue description and all comments as readable text
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:get FNR-2549

# JQL search
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:search 'project = FNR ORDER BY updated DESC'

# Add a comment
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:comment FNR-2549 'Comment body'

# List valid transitions before changing status
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:transitions FNR-2549

# Apply a transition by ID
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:transition FNR-2549 31

# Search Confluence with CQL
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs confluence:search 'space = DEV AND text ~ "deployment"'

# Get a Confluence page by ID
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs confluence:get 123456789
```

For unsupported operations, use `curl` or a short Node script with the same auth/base-url rules. Prefer structured JSON APIs and `jq`/Node parsing over ad hoc text scraping.

## Jira Workflow

1. Fetch issue context immediately when a key is provided.
2. Read the current comments as well as the description.
3. Before changing status, fetch transitions for that issue; transition IDs are workflow-specific.
4. If adding implementation notes, post a concise Jira comment with files changed, tests run, and any unresolved risk.
5. If Jira returns `401`, auth is invalid or expired. If it returns `404`, verify auth first with `jira:myself`; Jira uses 404 for missing permission.

Common JQL:

```sql
project = FNR AND status != Done ORDER BY created DESC
assignee = currentUser() AND status != Done
project = FNR AND labels = "backend" AND status != Done
project = FNR AND updated >= -7d ORDER BY updated DESC
key = FNR-2549
```

## Setup Guidance

For Bearer auth, agents need both `ATLASSIAN_BEARER_TOKEN` and `ATLASSIAN_CLOUD_ID`. If only the domain is known, ask the user for the cloud ID or for a token/source that can call Atlassian accessible resources. Some app tokens cannot call `oauth/token/accessible-resources`, so a preconfigured `ATLASSIAN_CLOUD_ID` is the reliable path.

For Basic auth, create an Atlassian API token at `https://id.atlassian.com/manage-profile/security/api-tokens` and pair it with the Atlassian account email. Basic auth often works for human accounts but may fail for app/service accounts; use Bearer auth for app accounts when available.

Suggested shell profile:

```bash
# Atlassian Cloud REST API
export ATLASSIAN_DOMAIN="flccc.atlassian.net"
export ATLASSIAN_CLOUD_ID="..."
export ATLASSIAN_BEARER_TOKEN="..."

# Optional Basic fallback
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="..."
```
