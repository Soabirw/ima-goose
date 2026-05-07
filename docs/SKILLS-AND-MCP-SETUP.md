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

---

## Skill Locations

Skills are discovered from the filesystem at session start. Goose (via Summon) checks:

```
~/.agents/skills/          ← global (available in all sessions)
  mcp-tavily/
    SKILL.md
  mcp-context7/
    SKILL.md
  ...
```

Project-level skills are not yet supported by Summon. All skills install globally.

---

## How Summon Loads Skills

Summon scans `~/.agents/skills/` at session start and makes all SKILL.md files available to the model.

**Auto-discovery**: Goose detects skill-relevant requests from the frontmatter `description` field. When a prompt matches trigger conditions, the skill loads automatically.

**Explicit load**: Tell Goose directly:
```
"Load the mcp-serena skill with summon"
"What skills are available?"
"Use the Atlassian skill to search for FNR-123"
```

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

Requires Node 24+. Copies all `skills/*/` directories to `~/.agents/skills/`.

What it does:
- Checks Goose is installed and prints version
- Creates `~/.agents/skills/` if it doesn't exist
- Copies each skill directory
- Warns about missing env vars
- Prints next steps

### 3. Verify skills installed

```bash
ls ~/.agents/skills/
# mcp-atlassian  mcp-chrome-devtools  mcp-context7  mcp-fetch
# mcp-qdrant  mcp-sequential-thinking  mcp-serena  mcp-tavily  mcp-vestige
```

---

## Step-by-Step: Configure MCP Extensions

### 1. Copy the template

```bash
cp config-template.yaml ~/.config/goose/config.yaml
```

If you already have a config, merge the `extensions:` section manually — don't overwrite your provider settings.

### 2. Set API keys

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Required for Tavily
export TAVILY_API_KEY="tvly-..."

# Required if using Atlassian (Jira/Confluence)
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="..."         # https://id.atlassian.com/manage-profile/security/api-tokens
export ATLASSIAN_SITE_URL="your-org.atlassian.net"
```

Reload: `source ~/.bashrc`

### 3. Configure Serena (if using JetBrains)

Serena requires:
- `uvx` installed: `pip install uv` or `brew install uv`
- A JetBrains IDE (IntelliJ, WebStorm, PHPStorm) running
- The [Serena MCP plugin](https://plugins.jetbrains.com/plugin/27337-serena-mcp) installed in the IDE
- Your project open in the IDE

The `serena` extension in `config-template.yaml` is pre-configured with the correct command. Just ensure `uvx` is on your PATH.

If you're not using JetBrains, set `enabled: false` for the serena extension. The content editing tools (`replace_symbol_body`, etc.) still work with the LSP backend if configured.

---

## API Keys Reference

| Extension | Key(s) Needed | Where to Get |
|-----------|--------------|--------------|
| `tavily` | `TAVILY_API_KEY` | https://tavily.com |
| `context7` | None | Free, no auth |
| `sequential-thinking` | None | Free, no auth |
| `serena` | None | Requires uvx + IDE |
| `fetch` | None | Requires `uvx` |
| `chrome-devtools` | None | Requires `npx`; Chrome/Chromium for browser debugging |
| `qdrant-memory` | None by default | Requires `qdrant-mcp`; Qdrant at `http://localhost:6333` |
| `vestige` | None | Requires `vestige-mcp` |
| `atlassian` | `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_SITE_URL` | https://id.atlassian.com/manage-profile/security/api-tokens |

---

## Verification

Start a Goose session and run these checks:

```bash
goose session
```

**Check skills are loaded:**
```
What skills do you have available?
```

Goose should list the installed skills from `~/.agents/skills/`.

**Test Tavily:**
```
Search the web for "Goose AI agent Block 2026"
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
Get the Jira issue FNR-1
```

---

## Cross-Platform Compatibility

The same SKILL.md files work in:

- **Goose** — loaded by Summon extension from `~/.agents/skills/`
- **Claude Code** — loaded by the Summon extension or invoked directly with `/skill-name`

The YAML frontmatter (`name`, `description`) is the same format in both systems. Write a skill once, use it in both agents.

The tool names (`mcp__tavily__search`, `mcp__context7__resolve-library-id`, etc.) are identical because both systems use the same MCP servers.

---

## Troubleshooting

**Skill not auto-loading:**
- Check the skill is in `~/.agents/skills/<name>/SKILL.md`
- Verify Summon extension is enabled in config
- Load explicitly: `"Load the mcp-tavily skill with summon"`

**MCP tool call fails:**
- Verify the extension is `enabled: true` in config
- Check env vars are set: `echo $TAVILY_API_KEY`
- Restart Goose session after config changes

**Serena jet_brains_* tools unavailable:**
- Ensure JetBrains IDE is running with the project open
- Verify Serena MCP plugin is installed and enabled in the IDE
- Check `uvx` is on PATH: `which uvx`

**Context7 tool not found:**
- The correct tools are `resolve-library-id` and `query-docs` — not `search`
- Verify the `@upstash/context7-mcp@latest` package starts correctly
