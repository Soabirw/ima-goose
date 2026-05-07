# ima-goose

IMA's Goose recipe repository — FP-aware coding agents, WordPress development, code review, testing, and architecture guidance.

## Setup

### 1. Configure Goose Provider

**OpenRouter (interim):**
```bash
goose configure
# Select: Configure Providers → OpenRouter
# Enter your API key
# Model: anthropic/claude-sonnet-4-5
```

Or edit `~/.config/goose/config.yaml`:
```yaml
GOOSE_PROVIDER: "openrouter"
GOOSE_MODEL: "anthropic/claude-sonnet-4-5"
```

**RunPod (production — OpenAI-compatible):**
```yaml
GOOSE_PROVIDER: "openai"
OPENAI_HOST: "https://api.runpod.ai/v2/<endpoint-id>"
OPENAI_API_KEY: "<your-runpod-key>"
GOOSE_MODEL: "your-deployed-model"
```

### 2. Connect Recipe Repository

```bash
goose configure
# goose settings → goose recipe github repo → owner/repo
```

Or add to config.yaml:
```yaml
GOOSE_RECIPE_GITHUB_REPO: "Soabirw/ima-goose"
```

### 3. Enable Recommended Extensions

```bash
goose configure
# Toggle Extensions → enable: chatrecall, orchestrator
```

### 4. Run a Recipe

```bash
# By name (from configured repo)
goose run --recipe implement

# By local path
goose run --recipe ./implement/recipe.yaml

# Preview without executing
goose run --recipe implement --explain

# Interactive mode
goose run --recipe implement --interactive
```

## Skills

Skills are MCP usage guides loaded by Goose's Summon extension from `~/.agents/skills/`. They teach Goose how to use specific MCP tools — when to reach for them, how to call them correctly, and how to chain operations.

**Skills vs Recipes:** Recipes launch standalone agents. Skills are knowledge guides loaded into running sessions. Same SKILL.md format works in Claude Code too (via the Summon extension).

Summon auto-discovers skills at session start. To load explicitly: `"Load the mcp-tavily skill with summon"`.

| Skill | Guides |
|-------|--------|
| `mcp-tavily` | Web search and research (post-cutoff info, multi-source) |
| `mcp-context7` | Official library docs — two-step resolve + query |
| `mcp-sequential-thinking` | Structured reasoning for debugging and architecture |
| `mcp-atlassian` | Jira/Confluence — issue management, JQL, CQL |
| `mcp-serena` | Code navigation — find symbols, callers, refactor (40-70% token savings) |
| `mcp-fetch` | Fetch and summarize content from specific URLs |
| `mcp-chrome-devtools` | Browser inspection, console/network debugging, and DOM checks |
| `mcp-qdrant` | Permanent semantic knowledge library |
| `mcp-vestige` | Cognitive memory for preferences, decisions, patterns, bugs, and reminders |

### Install Skills

```bash
node scripts/install.ts
```

Copies all skills from `skills/` to `~/.agents/skills/`. Requires Node 24+.

Cross-platform: the same SKILL.md files work in both Goose (via Summon) and Claude Code (via the Summon extension or direct skill invocation).

## Available Recipes

### P1 — Core (Available Now)

| Recipe | Description | Model Tier |
|--------|-------------|-----------|
| `implement` | General-purpose FP-aware coding | Standard |
| `code-review` | Read-only FP + security review | Standard |
| `wp-developer` | WordPress with security + Bootstrap + FP | Standard |
| `explore` | Fast read-only codebase exploration | Light |
| `test-writer` | TDD, test creation, debugging failures | Standard |

### P2 — Extended (Available Now)

| Recipe | Description |
|--------|-------------|
| `architect` | Architecture guidance and technology selection |
| `task-master` | Orchestration via sub-recipes + summon |
| `task-planner` | Detailed implementation planning |
| `task-runner` | Execute detailed task plans |
| `prompt-starter` | Rough idea to structured prompt |
| `mcp-migration` | Compare Claude MCP servers and migrate missing Goose extensions |

### P3 — Specialized (Planned)

| Recipe | Description |
|--------|-------------|
| `project-planner` | Epic > Story > Task decomposition |
| `espocrm` | EspoCRM API integration |
| `design-to-code` | Screenshot to WordPress code |
| `scorecard` | Project quality scorecard |

### P4 — Domain-Specific (Planned)

| Recipe | Description |
|--------|-------------|
| `quasar-developer` | Quasar Framework + Vue FP |
| `livecanvas` | LiveCanvas + Bootstrap + Tangible |
| `payment-processing` | Authorize.Net PHP SDK |
| `jira-workflow` | Jira awareness checkpoints |
| `email-creator` | Branded email HTML |

## Model Tiers

Recipes set their own model via `settings`. Override globally or per-recipe:

| Tier | Use Case | OpenRouter | RunPod |
|------|----------|-----------|--------|
| Heavy | architect, project-planner | `anthropic/claude-sonnet-4-5` | TBD (32B+) |
| Standard | implement, wp-developer, code-review | `anthropic/claude-sonnet-4-5` | TBD (14-32B) |
| Light | explore, scorecard | `google/gemini-2.0-flash` | TBD (8B) |

## Shared Reference Files

Recipes reference these for domain knowledge. Goose's `developer` extension reads them at runtime.

```
shared/
├── persona.md                # The Practitioner persona
├── fp-principles.md          # Core FP philosophy
├── security-guardrails.md    # Consolidated security checks
├── ima-brand-book.md         # IMA brand colors, typography, voice
├── code-standards/
│   ├── js-fp.md              # JavaScript FP patterns
│   ├── php-fp.md             # PHP FP + WordPress patterns
│   ├── py-fp.md              # Python FP patterns
│   └── jquery.md             # jQuery FP-aligned patterns
└── tool-guides/
    ├── tavily.md             # Web research
    ├── context7.md           # Library documentation
    └── atlassian.md          # Jira/Confluence
```

## Per-Project Hints

Copy `.goosehints` to your project repos for persistent context. Goose reads it automatically.

## Origin

Adapted from [ima-claude](https://github.com/Soabirw/ima-claude) (Claude Code plugin, 63 skills). This repo packages the same team standards and FP patterns for Goose's recipe format.
