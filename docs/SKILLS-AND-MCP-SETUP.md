# Skills and MCP Setup Guide

How to install skills, configure MCP extensions, and verify everything works.

---

## MCPs vs Skills

| | MCP Extension | Skill (SKILL.md) |
|---|---|---|
| **What it is** | A server process that exposes tools | A Markdown guide on how to use those tools |
| **Where it runs** | As a subprocess, started by Goose | Loaded into the model's context |
| **Configured in** | `~/.config/goose/config.yaml` | `~/.agents/skills/<name>/SKILL.md` |
| **Loaded by** | Goose automatically at session start | Summon extension (auto or on request) |
| **Without the other** | Tools available but model may misuse them | Guide exists but no tools to call |

You need both: the MCP extension provides the tools, the skill teaches the model when and how to use them correctly.

Use `/preflight` after installation to run a read-only canary across recipes, skills, MCP endpoints, and supported Goose TypeScript SDK wrappers. See [`PREFLIGHT-CHECK.md`](PREFLIGHT-CHECK.md).

For Goose API/typed-SDK harnesses, supported MCP tools are documented in [`MCP-GOOSE-SDK-SIGNATURES.md`](MCP-GOOSE-SDK-SIGNATURES.md). The SDK wrappers use namespaces such as `Tavily` and `Context7`; use only documented wrappers. Serena, Vestige, and Qdrant are gateway exceptions in the primary IMA workflows: use `ima-mcp serena`, `ima-mcp vestige`, and `ima-mcp qdrant` instead of Goose typed-SDK wrappers.

---

## Skill Locations

Skills are discovered from the filesystem at session start. Goose (via Summon) checks:

```
~/.agents/skills/          ← global (available in all sessions)
  mcp-tavily/
    SKILL.md
  mcp-context7/
    SKILL.md
  php-fp-wordpress/
    SKILL.md
  ima-bootstrap/
    SKILL.md
  ...
```

All skills install globally. Use `~/.agents/skills/` for user-level skills applicable across projects.

---

## How Summon Loads Skills

Summon scans `~/.agents/skills/` at session start and makes all SKILL.md files available to the model. The frontmatter (`name`, `description`) stays in context; the full body loads on-demand when the task matches.

**Auto-discovery**: Goose detects skill-relevant requests from the frontmatter `description` field. When a prompt matches trigger conditions, the skill body loads automatically.

**Explicit load**: Tell Goose directly:
```
"Load the php-fp-wordpress skill with summon"
"What skills are available?"
/skills
```

The `/skills` slash command lists all discovered skills. `/prompts` and `/prompt <n>` exist for prompt templates.

---

## Step-by-Step: Install Skills

### 1. Clone the repo (if not already)

```bash
git clone https://github.com/Soabirw/ima-goose.git
cd ima-goose
```

### 2. Run the install script

```bash
node scripts/install.ts
```

Requires Node 24+. Copies all 50 `skills/*/` directories to `~/.agents/skills/`.

What it does:
- Checks Goose is installed and prints version
- Creates `~/.agents/skills/` if it doesn't exist
- Copies each skill directory
- Renders recipe templates from `recipes/**/*.yaml.eta` to
  `~/.config/goose/recipes/*.yaml`
- Rewrites recipe model tiers based on the selected provider profile
- Warns about missing env vars
- Prints next steps including MOIM setup instructions

### 3. Verify skills installed

```bash
ls ~/.agents/skills/
# expect the repository skills, including espocrm-api, discourse-admin,
# ember-discourse, mcp-taskwarrior, and ima-email-creator

ls ~/.agents/skills/ | wc -l
# 50
```

---

## Step-by-Step: Configure MCP Extensions and API Keys

### 1. Install and verify ima-mcp-gateway

Serena, Vestige, and Qdrant route through `ima-mcp-gateway` in the primary IMA
workflows. Install **ima-mcp-gateway 0.3.0 or newer** and keep `~/.local/bin` on
`PATH`:

```bash
git clone https://gitea.theflccc.org/IMA/ima-mcp-gateway.git ~/IMA/dev/ima-mcp-gateway
cd ~/IMA/dev/ima-mcp-gateway
sfw npm install || npm install
sfw npm run build || npm run build
sfw npm test || npm test
sfw npm run install:local || npm run install:local

command -v ima-mcp
ima-mcp --version    # must be 0.3.0 or newer for expanded Serena commands
ima-mcp doctor --project . --json
ima-mcp serena project status --project . --json
ima-mcp vestige status --json
ima-mcp qdrant status --json
```

If `ima-mcp --version` is older than 0.3.0 and a Serena command fails with
`unknown command`, upgrade the gateway before relying on expanded Serena
navigation or generic `tools` commands.

### 2. Merge remaining direct Goose extensions from the template

```bash
less config-template.yaml
```

Use `config-template.yaml` as a reference and merge only the direct Goose
extensions you need into `~/.config/goose/config.yaml`. Do not copy it over an
existing config. The removed direct `serena`, `vestige`, and `qdrant-memory`
blocks should not be re-added for the primary workflow; use the `ima-mcp`
gateway commands instead.

### 3. Set API keys

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Required for Tavily
export TAVILY_API_KEY="tvly-..."

# Required if using Atlassian (Jira/Confluence) with Bearer auth
export ATLASSIAN_DOMAIN="your-org.atlassian.net"
export ATLASSIAN_CLOUD_ID="..."
export ATLASSIAN_BEARER_TOKEN="..."

# Optional Basic auth fallback
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="..."         # https://id.atlassian.com/manage-profile/security/api-tokens
```

Reload: `source ~/.bashrc`

### 4. Configure Atlassian Rovo MCP

The old Atlassian MCP/SSE setup should be replaced. Atlassian says
`https://mcp.atlassian.com/v1/sse` will no longer be supported after
June 30, 2026. Use the Rovo MCP Streamable HTTP endpoint instead:

```text
https://mcp.atlassian.com/v1/mcp/authv2
```

The template already includes the verified Goose config block:

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

If configuring interactively instead, run:

```bash
goose configure
```

Choose:

```text
Add Extension
Remote Extension (Streamable HTTP)
```

Enter:

```text
Name: atlassian-rovo
Endpoint URI: https://mcp.atlassian.com/v1/mcp/authv2
Timeout: 300
Description: Atlassian Rovo MCP for Jira, Confluence, Compass, and Rovo search
Custom headers: No
```

Start a new Goose session. The first Atlassian tool use should launch a browser
OAuth flow. Complete the Atlassian login, authorize the client, and enable the
Atlassian apps the client requests.

One-off session, useful for testing without editing defaults:

```bash
goose session --with-streamable-http-extension "https://mcp.atlassian.com/v1/mcp/authv2 timeout=300"
```

Fallback if native remote OAuth fails locally:

```text
Add Extension
Command-line Extension
Command: npx -y mcp-remote@latest https://mcp.atlassian.com/v1/mcp/authv2
Timeout: 300
Environment variables: No
```

The fallback requires Node.js 18+.

### 5. Configure Serena, Vestige, and Qdrant gateway services

Serena requires `uvx` installed (`pip install uv` or `brew install uv`).
JetBrains-backed navigation additionally requires a running JetBrains IDE
(IntelliJ, WebStorm, PHPStorm), the
[Serena MCP plugin](https://plugins.jetbrains.com/plugin/27337-serena-mcp), and
the project open in the IDE.

Vestige requires `vestige-mcp` on `PATH`. Qdrant requires a running Qdrant
service and a compatible MCP/RAG command such as IMA's `ima-rag`.

Do not enable removed direct `serena`, `vestige`, or `qdrant-memory` extension
blocks from `config-template.yaml`; they are no longer the source of truth for
primary workflows. Use `ima-mcp serena`, `ima-mcp vestige`, and
`ima-mcp qdrant`.

Serena memory tools work without JetBrains. Keep the gateway available when you
want standard project memories, even if `jet_brains_*` code-navigation tools are
not available. If Serena is unavailable, recipes lose the cross-harness project
memory bootstrap. Serena-enabled recipes should activate the Serena project first
with the current project path or registered project name, then load standard
memories as the first workstream at session start before greeting, Taskwarrior,
Jira, Vestige, Qdrant, file discovery, browser inspection, or asking for local
paths/config. Loading
the `mcp-serena` skill first is allowed only as bootstrap support when an agent
needs Serena gateway guidance or native/direct tool names; it is not
task-specific research.

For Serena bootstrap, use the `ima-mcp` CLI gateway. Do not use Goose typed
SDK / `execute_typescript` for Serena activation, `initial_instructions`, or
memory reads; that path can fail before Serena runs when generated SDK type
output from another registered tool is invalid TypeScript.

```bash
project="${PWD}"
ima-mcp serena project activate "$project" --json
ima-mcp serena instructions --project "$project" --json
ima-mcp serena memory list --project "$project" --json
ima-mcp serena memory read core --project "$project" --json
```

If `ima-mcp` is missing or Serena reports unavailable, capture the command
output and fix that gateway path first.

To migrate existing project context files into Serena memories, load the
`mcp-serena` skill and run:

```bash
python3 skills/mcp-serena/scripts/migrate-context-to-serena.py --root .
python3 skills/mcp-serena/scripts/migrate-context-to-serena.py --root . --include-org-standards
```

Review the generated blocks, then write them to Serena memories named `core`,
`conventions`, `tech_stack`, `suggested_commands`, `task_completion`, and
`memory_maintenance`. Use `--include-org-standards` for IMA-style projects so
the generated memories include the Vestige task lifecycle protocol.

Inside an interactive Goose session, use `/serena-bootstrap` (or `/bootstrap-serena`) to reload standard
Serena project memories on demand. The installer prints slash-command config to
merge manually. To let the installer write slash commands, pass
`--register-slash-commands`; it creates a timestamped `config.yaml` backup
before writing.

Use `/serena-memorize <note>` to add stable project context to the appropriate
standard Serena memory:

```text
/serena-memorize Our Claude Code design exists at ./claude-design and should be referenced when implementing app feature tasks.
```

---

## API Keys Reference

| Extension | Key(s) Needed | Where to Get |
|-----------|--------------|--------------|
| `tavily` | `TAVILY_API_KEY` | https://tavily.com |
| `context7` | None | Free, no auth |
| `sequential-thinking` | None | Free, no auth |
| Serena via `ima-mcp serena` | None | Requires `ima-mcp-gateway >= 0.3.0` and `uvx`; JetBrains navigation additionally requires IDE + plugin |
| Vestige via `ima-mcp vestige` | None | Requires `ima-mcp-gateway >= 0.3.0` and `vestige-mcp` on `PATH` |
| Qdrant via `ima-mcp qdrant` | None by default | Requires `ima-mcp-gateway >= 0.3.0`, Qdrant at `http://localhost:6333`, and compatible MCP/RAG command such as `ima-rag` |
| `fetch` | None | Requires `uvx` |
| `chrome-devtools` | None | Requires `npx`; Chrome/Chromium for browser debugging |
| `atlassian-rovo` | Browser OAuth | Remote MCP via `https://mcp.atlassian.com/v1/mcp/authv2`; no static token needed for interactive use |
| `mcp-atlassian` skill REST helper | `ATLASSIAN_BEARER_TOKEN`, `ATLASSIAN_CLOUD_ID`, `ATLASSIAN_DOMAIN`; fallback: `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL` | Direct REST fallback for Jira/Confluence scripts and workflow updates |
| `tom` | `GOOSE_MOIM_MESSAGE_TEXT` or `GOOSE_MOIM_MESSAGE_FILE` | Optional persistent instructions injected every turn |
| `todo` | None | Built-in task checklist extension for complex workflows |

MCP extensions expose tools directly to Goose. In API/typed-SDK harnesses,
some supported MCP tools are also available through TypeScript namespace
wrappers. Use the signatures in [`MCP-GOOSE-SDK-SIGNATURES.md`](MCP-GOOSE-SDK-SIGNATURES.md)
and the `skills/mcp-*` guides; do not invent wrappers that are not exposed by
the SDK. Serena, Vestige, and Qdrant are explicit gateway exceptions in primary
workflows: use `ima-mcp serena`, `ima-mcp vestige`, and `ima-mcp qdrant`, not
`execute_typescript` or direct typed wrappers, because SDK generation can fail
before any tool call runs.


Use `/vestige-bootstrap` (or `/bootstrap-vestige`) inside an interactive Goose
session to load user preferences from Vestige. The tested read-only gateway
command is:

```bash
ima-mcp vestige search "preferences" --json
```

---

## Cross-Platform Compatibility

The same SKILL.md files work in:

- **Goose** — loaded by Summon extension from `~/.agents/skills/`
- **Claude Code** — loaded by the Summon extension or invoked directly with `/skill-name`

The YAML frontmatter (`name`, `description`) is the same format in both systems. Direct MCP tool names such as `mcp__tavily__search` and `mcp__context7__resolve-library-id` may be shared across MCP clients, while Goose API/typed-SDK harnesses expose supported tools as namespace wrappers such as `Tavily.tavilySearch` and `Context7.resolveLibraryId`. The MCP skills document both forms so agents can use the interface available in the current harness.

---

## Verification

Start a Goose session and run these checks:

```bash
goose session
```

**List available skills:**
```
/skills
```

Goose should list all 50 installed skills from `~/.agents/skills/`.

**Run preflight:**
```
/preflight
```

Use `/preflight full` when you want external/auth/browser probes as well.

**Test Tavily:**
```
Search the web for "Goose AI agent Block 2025"
```

**Test Context7:**
```
Look up the Context7 docs for Zod schema validation
```

**Test Sequential Thinking:**
```
Use sequential thinking to analyze why a database query might be slow
```

**Test Serena (requires IDE):**
```
Use Serena to get an overview of the skills directory structure
```

**Test Fetch:**
```
Fetch https://example.com and summarize the page content
```

**Test Chrome DevTools:**
```
Open a Chrome DevTools page for http://localhost:3000 and inspect console errors
```

**Test Qdrant Memory:**
```
Search Qdrant for ima-goose MCP migration notes
```

**Test Vestige:**
```
Search Vestige for ima-goose project preferences
```

**Test Atlassian (if configured):**
```
Use Atlassian Rovo MCP to show my Atlassian user info.
Search Jira for issues assigned to me updated in the last 7 days.
```

**Test Atlassian REST fallback (if configured):**
```bash
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:myself
node ~/.agents/skills/mcp-atlassian/scripts/atlassian-api.mjs jira:get FNR-1
```

---

## Troubleshooting

**Skill not auto-loading:**
- Check the skill is in `~/.agents/skills/<name>/SKILL.md`
- Verify Summon extension is enabled in config
- Load explicitly: `"Load the mcp-tavily skill with summon"` or `/skills` to list

**MCP tool call fails:**
- Verify the extension is `enabled: true` in config
- Check env vars are set: `echo $TAVILY_API_KEY`
- Restart Goose session after config changes

**Serena jet_brains_* tools unavailable:**
- Ensure JetBrains IDE is running with the project open
- Verify Serena MCP plugin is installed and enabled in the IDE
- Check `uvx` is on PATH: `which uvx`
- Memory tools can still work without JetBrains; only symbol-aware IDE tools are
  affected.

**Context7 tool not found:**
- The correct tools are `resolve-library-id` and `query-docs` — not `search`
- Verify the `@upstash/context7-mcp@latest` package starts correctly

**Atlassian OAuth loops or redirect fails:**
- Confirm the extension URL is `https://mcp.atlassian.com/v1/mcp/authv2`, not the old `/v1/sse` URL
- Allow `http://localhost:3334` in browser and firewall settings
- Restart Goose and re-run the connection flow
- If user-installed apps are blocked, ask an Atlassian site admin to allow the Atlassian MCP app

**Only 9 skills showing (not 50):**
- Run `node scripts/install.ts` from the ima-goose repo root — it renders recipes
  and copies the full `skills/` directory
- Verify the script completed without errors
- Check `ls ~/.agents/skills/ | wc -l` — expect 50
