# ima-claude to ima-goose Migration Guide

Transitioning from Claude Code (ima-claude plugin) to Goose (ima-goose recipe repo). This covers what changed, what maps where, and how to do the things you already know how to do.

---

## The Big Picture

| | Claude Code | Goose |
|---|---|---|
| **Unit of work** | Skill (injected into running session) | Recipe (standalone agent config, launched independently) |
| **Config format** | SKILL.md + frontmatter | recipe.yaml (YAML) |
| **Project context** | CLAUDE.md | .goosehints |
| **Guardrails** | Python hook scripts (hooks.json) | Skill files (php-fp-wordpress, etc.) + .goosehints; model-enforced |
| **Agent delegation** | `Agent(subagent_type: "ima-claude:implementer")` | `sub_recipes:` (declarative YAML) + subagents (natural-language) |
| **Session memory** | Vestige + Qdrant + Serena MCP | chatrecall extension; or configure Vestige/Qdrant as MCP extensions |
| **Model selection** | Per-agent (haiku/sonnet/opus) | Per-recipe `settings.goose_model` |
| **Installation** | `/plugin install ima-claude` | `GOOSE_RECIPE_GITHUB_REPO` + `node scripts/install.ts` for skills |
| **Invocation** | `/ima-claude:skill-name` or auto-discovery | `goose run --recipe recipe-name`; `/skills` lists available skills |
| **Persistent instructions** | CLAUDE.md + hooks | MOIM (`GOOSE_MOIM_MESSAGE_FILE`) for every-turn injection; .goosehints at session start |

**The correct framing:** The migration preserved both layers from ima-claude. Skills stay skills — 40 are now installed in `~/.agents/skills/` and auto-discovered by Summon. Recipes are thin workflow bootstrappers that orchestrate via sub-recipes. The old "skills became recipes" framing was wrong; only orchestration skills (task-master, task-planner, task-runner) became recipes. Everything else stayed a skill.

**Key paradigm shift:** In Claude Code, you open a session and invoke skills within it. In Goose, each recipe launches a fresh, purpose-built agent. You pick the recipe before starting, not during. But within a recipe session, Summon auto-loads the relevant skills from `~/.agents/skills/` as the conversation calls for them.

---

## Setup (One-Time)

### 1. Install Goose

```bash
# macOS
brew install block/goose/goose

# Linux
curl -fsSL https://github.com/block/goose/releases/latest/download/download_cli.sh | bash

# Verify
goose --version
```

### 2. Configure Provider

**Direct Anthropic:**
```bash
goose configure
# → Configure Providers → Anthropic
# → Enter API key
```

**OpenRouter (multi-provider routing):**
Edit `~/.config/goose/config.yaml`:
```yaml
GOOSE_PROVIDER: "openrouter"
GOOSE_MODEL: "sonnet"  # claude-acp friendly name; for OpenRouter use "anthropic/claude-sonnet-4-6"
```

**RunPod (self-hosted):**
```yaml
GOOSE_PROVIDER: "openai"
OPENAI_HOST: "https://api.runpod.ai/v2/<endpoint-id>"
OPENAI_API_KEY: "<your-runpod-key>"
GOOSE_MODEL: "your-deployed-model"
```

### 3. Connect Recipe Repo

```bash
goose configure
# → goose settings → goose recipe github repo → Soabirw/ima-goose
```

Or add to `~/.config/goose/config.yaml`:
```yaml
GOOSE_RECIPE_GITHUB_REPO: "Soabirw/ima-goose"
```

### 4. Enable Extensions

```bash
goose configure
# Toggle ON: developer, summon
```

`developer` gives file/shell access. `summon` auto-discovers skills from `~/.agents/skills/`. The `orchestrator` extension is session management (list/interrupt sessions) — not a delegation engine; delegation goes through `sub_recipes:`.

### 5. Install Skills

```bash
node scripts/install.ts
```

Copies all 40 skills from `skills/` to `~/.agents/skills/`. Requires Node 24+.

### 6. Add MCP Extensions (Optional)

For Tavily, Context7, Atlassian — add to `~/.config/goose/config.yaml`:
```yaml
extensions:
  tavily:
    type: stdio
    cmd: "npx"
    args: ["-y", "tavily-mcp@latest"]
    env_keys: ["TAVILY_API_KEY"]
    timeout: 300

  context7:
    type: stdio
    cmd: "npx"
    args: ["-y", "@upstash/context7-mcp@latest"]
    timeout: 300

  atlassian:
    type: stdio
    cmd: "npx"
    args: ["-y", "@anthropic-ai/mcp-proxy", "--endpoint", "https://mcp.atlassian.com"]
    env_keys: ["ATLASSIAN_API_TOKEN", "ATLASSIAN_EMAIL", "ATLASSIAN_SITE_URL"]
    timeout: 300
```

---

## Daily Workflow Translation

### Starting Work

**Claude Code:**
```
claude                          # Opens interactive session
# Skills auto-discover from context
# Or invoke: /ima-claude:implement
```

**Goose:**
```bash
goose run --recipe implement    # Launch implement recipe
goose run --recipe wp-developer # Launch WP recipe
goose run --recipe explore      # Quick codebase scan
```

Each recipe is a standalone session. Pick the right recipe for the job upfront. Within the session, Summon loads skills automatically based on the task.

### Listing Available Skills

```
/skills
```

Lists all skills Summon has discovered from `~/.agents/skills/`. Load explicitly: `"Load the php-fp-wordpress skill with summon"`.

### Previewing Before Running

```bash
goose run --recipe implement --explain
```

Shows what the recipe will do (instructions, extensions, settings, sub-recipes) without executing.

### Interactive Mode

```bash
goose run --recipe implement --interactive
```

Prompts for parameter values before starting. Useful for recipes with parameters (e.g., wp-developer asks for `environment: ddev | local-wp | other`).

---

## Layer Map — Where ima-claude Things Live Now

### Orchestration Skills → Recipes

Three ima-claude orchestration skills became recipes because their semantics are workflow orchestration, not domain knowledge:

| ima-claude | Goose Recipe | Notes |
|---|---|---|
| `task-master` | `task-master` recipe | Pins Opus; uses `sub_recipes:` for delegation |
| `task-planner` | `task-planner` recipe | Pins Opus; terminal (no sub-recipes) |
| `task-runner` | `task-runner` recipe | Pins Sonnet; delegates write_tests + code_review |

### Domain Skills → Skills (still skills)

Most ima-claude skills stayed as skills. They're now installed in `~/.agents/skills/` and auto-discovered by Summon:

| Claude Code | Goose | Layer |
|---|---|---|
| `functional-programmer`, `js-fp`, `php-fp`, `py-fp`, `ruby-fp` | Same names in `~/.agents/skills/` | FP knowledge |
| `js-fp-api`, `js-fp-react`, `js-fp-vue`, `js-fp-wordpress`, `php-fp-wordpress`, `rails` | Same names | Framework FP |
| `ima-bootstrap`, `ima-forms-expert`, `jquery`, `livecanvas` | Same names | WP/IMA framework |
| `ima-brand`, `ima-copywriting`, `ima-editorial-scorecard`, `ima-editorial-workflow` | Same names | Editorial / brand |
| `ima-git`, `architect`, `gh-cli` | Same names | Workflow / tooling |
| `unit-testing`, `phpunit-wp`, `playwright` | Same names | Testing |
| `rg`, `wp-ddev`, `wp-local` | Same names | CLI tools |
| `discourse`, `espocrm`, `php-authnet` | Same names | Domain |
| `mcp-tavily`, `mcp-context7`, `mcp-serena`, etc. | Same names (9 MCP guides) | MCP guides |

### Workflow Recipes (matching ima-claude agents)

| Claude Code Agent / Skill | Goose Recipe | Notes |
|---|---|---|
| implementer agent | `implement` | Pins Sonnet; sub_recipes: write_tests, code_review |
| reviewer agent | `code-review` | Pins Opus; read-only enforced in instructions |
| wp-developer agent | `wp-developer` | Pins Sonnet; loads WP skills via Summon |
| explorer agent | `explore` | Pins Haiku; read-only fast exploration |
| tester agent | `test-writer` | Pins Sonnet; loads testing skills via Summon |
| `prompt-starter` skill | `prompt-starter` recipe | Pins Opus; Jira fetch via mcp-atlassian |
| `architect` skill | Now also a skill in `~/.agents/skills/architect/` | Domain knowledge AND available as recipe |

### What Changed in `shared/`

The `shared/` directory is now intentionally slim. Domain knowledge (FP patterns, brand, framework rules) moved to skills. `shared/` now holds only recipe-internal references the `developer` extension reads at runtime:
- `shared/security-guardrails.md` — consolidated security checks (referenced by coding recipes)
- `shared/persona.md` — Practitioner persona (also in `moim/ima-practitioner.md`)
- `shared/tool-guides/tea.md` — Gitea CLI reference
- `shared/tool-guides/atlassian.md` — Jira/Confluence patterns

The old `shared/fp-principles.md`, `shared/ima-brand-book.md`, `shared/code-standards/*.md` content now lives in the corresponding skills (`functional-programmer`, `ima-brand`, `js-fp`, `php-fp`, etc.) and is loaded on-demand by Summon instead of pre-loaded in every session.

### Skills Not Yet Ported (Genuinely Not Portable)

| Skill | Why Not Ported |
|---|---|
| `save-session`, `resume-session` | Goose has `--resume` / `--name` built in |
| `skill-creator`, `skill-analyzer` | Claude Code meta-tools with no Goose equivalent |
| `compound-bridge` | Claude Code-specific orchestration pattern |
| `mcp-memory` | Already deprecated in ima-claude |
| `quickstart` | Claude Code-specific cheatsheet; replaced by this guide + README |

---

## Workflow Translations

### Task Orchestration

**Claude Code (task-master):**
```
/ima-claude:task-master
# → Decomposes into Epic > Story > Task
# → Selects model per task (haiku/sonnet/opus)
# → Delegates to named agents (implementer, tester, reviewer)
# → Agents return ESCALATION: for out-of-scope forks
# → Opus orchestrator arbitrates
```

**Goose:**
```bash
goose run --recipe task-master
# → Pins Opus 4.7 for orchestration decisions
# → Decomposes into 5-15 atomic tasks
# → Invokes sub-recipes via tool calls (declarative sub_recipes: YAML)
# → Each sub-recipe runs in its own context with its own pinned model
# → Independent tasks: parallel tool calls; dependent tasks: serial
# → Failure: retry once with adjusted brief, then surface to user
```

Sub-recipes declared in `task-master/recipe.yaml`: `implement`, `wp_implement`, `write_tests`, `code_review`, `explore`, `plan_task`. Goose auto-generates one tool per sub-recipe; task-master invokes by tool call with a self-contained brief.

### Code Review

**Claude Code:**
```
# Auto: push PR, reviewer agent runs
# Manual: /ima-claude:code-review or delegate to reviewer agent
```

**Goose:**
```bash
goose run --recipe code-review
# Pins Opus 4.7 — security + logic flaws need the top model
# Read-only — produces a report, never modifies files
# Checks: FP compliance, security, style, complexity
```

### Session Management

**Claude Code:**
```
/ima-claude:save-session     # → Serena MCP memory
/ima-claude:resume-session   # → Reload from Serena
```

**Goose:**
```bash
# Name a session
goose run --recipe implement --name "fnr-456-auth-refactor"

# Resume later
goose run --resume --name "fnr-456-auth-refactor"

# List sessions
goose session list
```

### Prompt Building

**Claude Code (prompt-starter):**
```
/ima-claude:prompt-starter
# Template selection → Jira pre-fill → editor spawn
# Returns refined prompt, does NOT execute
```

**Goose:**
```bash
goose run --recipe prompt-starter
# Pins Opus 4.7 for research and template fill
# Fetches Jira story if key provided (mcp-atlassian skill)
# Same concept: rough idea → structured prompt → refined output
```

### Memory

**Claude Code:**
| Store | Tool | Retention |
|---|---|---|
| Decisions, preferences | Vestige smart_ingest | Fades if unused (FSRS) |
| Docs, standards | Qdrant qdrant-store | Permanent |
| Session state | Serena write_memory | Project-scoped |
| Reminders | Vestige intention | Surfaces next session |

**Goose:**
| Store | How | Notes |
|---|---|---|
| Session history | chatrecall extension | Automatic, per-session |
| Cross-session memory | Configure Vestige/Qdrant as MCP extensions | Same servers, Goose config format |
| Per-turn persona | MOIM (`GOOSE_MOIM_MESSAGE_FILE`) | Re-injected every turn, survives /compact |

For most workflows, session naming + resume covers what you need. If you want Vestige/Qdrant persistence, add them as MCP extensions in `~/.config/goose/config.yaml`.

### Personality Modes

**Claude Code:**
```
"Enable efficient mode"   # Precise, ~30-40% token savings
"Enable terse mode"       # Blunt fragments, ~50-65% savings
```

**Goose:**
Personality is in recipe `instructions` and the MOIM anchor. The Practitioner persona (25-year veteran, FP-first, "we" not "I") is in every recipe. Enable MOIM for the anchor to survive long sessions and `/compact`. For alternate personalities, create recipe variants or use `--system` to override.

---

## Guardrails: Where Did the Hooks Go?

Claude Code used Python hook scripts that ran automatically before/after tool calls. Goose has no hook system. Rules are now model-enforced — they live in skill files and recipe instructions.

### Now in Skill Files (loaded on-demand by Summon)

Domain-specific guardrails moved to the skill where they belong:

| Former Hook | Now In | What It Does |
|---|---|---|
| `wp_security_check.py` | `php-fp-wordpress` skill | 5 PHP security checks (nonces, $wpdb->prepare, sanitize, escape, strict_types) |
| `sql_injection_check.py` | `php-fp` skill | "SQL: parameterized queries only" rule |
| `fp_utility_check.py` | `functional-programmer` skill | "NEVER create custom pipe/compose/curry" rule |
| `bootstrap_utility_check.py` | `ima-bootstrap` skill | "Use Bootstrap utilities, not custom CSS" rule |
| `jquery_in_wordpress.py` | `jquery` skill | jQuery IIFE wrapper pattern |

When Summon loads `php-fp-wordpress` for a WordPress task, all the WP security rules come with it. The skill is the single source of truth for that domain's standards.

### Baked Into Recipe Instructions

Cross-cutting rules that apply to every task stay in recipe instructions:

| Rule | Where |
|---|---|
| No custom pipe/compose/curry | All coding recipe instructions + functional-programmer skill |
| Parameterized SQL only | All coding recipe instructions |

### Baked Into .goosehints

Per-project rules that apply to any Goose session in the repo:

| Former Hook | .goosehints Rule |
|---|---|
| `enforce_rg_over_grep.py` | "Prefer rg over grep" |
| `docs_organization.py` | Three-tier docs structure |

### Dropped (Claude Code-Specific)

`memory_bootstrap.py`, `memory_store_reminder.py`, `vestige_before_external.py`, `block_sed_edits.py`, `prompt_coach.py`, `task_master_*.py`, `sequential_thinking_check.py`, `bootstrap.sh`, `atlassian_prereqs.py`, `serena_project_check.py`

**What this means for you:** The security and FP guardrails are just as strict — they're in the skill files and recipe instructions the model reads. But there is no automated pre-commit gate. If the model ignores an instruction, there's no hook to catch it. Review outputs carefully, especially for security-sensitive changes.

---

## .goosehints = Your New CLAUDE.md

Every project can have a `.goosehints` file at the root. Goose reads it automatically at session start — same role as CLAUDE.md in Claude Code.

**What goes in .goosehints:**
- Project-specific dev standards
- Tool preferences (rg over grep, DDEV vs Local WP)
- Architecture notes
- Security requirements
- Framework constraints

The repo includes a starter `.goosehints` you can copy to project repos.

---

## Extension = MCP Server

Goose "extensions" are MCP servers. Same concept as Claude Code's MCP tools, different config format.

| Claude Code | Goose |
|---|---|
| `claude mcp add tavily npx tavily-mcp@latest` | Add `tavily` extension to config.yaml |
| `/ima-claude:mcp-tavily` to invoke | Extension tools available automatically |
| Scoped per-skill via `skills` frontmatter | Scoped per-recipe via `extensions` field |

Extensions are configured globally in `~/.config/goose/config.yaml` or per-recipe in recipe.yaml.

---

## Model Differences

Each recipe pins its own model. The global config is the fallback for unspecified sessions.

| Role | Recipe | Pinned Model |
|---|---|---|
| Orchestration / decisions | task-master, architect, prompt-starter, task-planner, code-review | claude-opus-4-7 |
| Implementation / coding | implement, wp-developer, test-writer, task-runner | claude-sonnet-4-6 |
| Read-only exploration | explore | claude-haiku-4-5-20251001 |

Recipes pin claude-acp friendly names (`sonnet` / `opus` / `haiku` / `default`). For OpenRouter swap to `anthropic/claude-sonnet-4-6` etc.; for direct Anthropic use `claude-sonnet-4-6`. Override at run time with `--model`.

---

## Quick Reference Card

```
# Run a recipe
goose run --recipe implement

# Preview what a recipe does
goose run --recipe implement --explain

# Interactive mode (prompts for parameters)
goose run --recipe implement --interactive

# Name a session for later
goose run --recipe implement --name "my-feature"

# Resume a named session
goose run --resume --name "my-feature"

# Run local recipe file
goose run --recipe ./implement/recipe.yaml

# List available skills (within a session)
/skills

# Configure Goose
goose configure

# List sessions
goose session list
```

### Choosing a Recipe

| I want to… | Recipe |
|---|---|
| Build a feature or fix a bug | `implement` |
| Build/modify WordPress plugin or theme | `wp-developer` |
| Orchestrate a full feature across tasks | `task-master` |
| Review code for quality and security | `code-review` |
| Quickly understand a codebase | `explore` |
| Write or fix tests | `test-writer` |
| Plan a complex feature | `task-planner` |
| Turn rough idea into structured prompt | `prompt-starter` |

---

## FAQ

**Q: Can I still use Claude Code?**
Yes. ima-claude and ima-goose are independent. The skill files are cross-compatible — the same SKILL.md format works in both. Use whichever fits — Claude Code for interactive work with the full plugin ecosystem, Goose for recipe-driven workflows with pinned models per task.

**Q: Do I need to learn YAML to use recipes?**
No. Recipes are pre-built — just `goose run --recipe <name>`. YAML matters only if you want to create or modify recipes.

**Q: Where did all 63 ima-claude skills go?**
40 are now skills in `~/.agents/skills/`, auto-discovered by Summon. The 3 orchestration skills (task-master, task-planner, task-runner) became recipes. ~20 were Claude Code meta-tools, deprecated skills, or already-redundant with Goose built-ins — see "Skills Not Yet Ported" above.

**Q: What about the advisor pattern (ESCALATION)?**
The concept survives. Sub-recipes surface failures to task-master; task-master retries once with adjusted brief, then escalates to the user. The exact ESCALATION: text protocol from ima-claude is not required — the sub-recipe summary carries the failure reason.

**Q: Can I use multiple recipes in one session?**
Not directly. Each `goose run --recipe` is a standalone session. Use `task-master` to orchestrate multiple recipes automatically, or chain them manually.

**Q: What replaces Vestige/Qdrant/Serena?**
You can configure them as MCP extensions in Goose — same servers, Goose config format. chatrecall covers session history. MOIM covers the persistent persona anchor.

**Q: What is the orchestrator extension for?**
Session management — listing, viewing, and interrupting sessions. It is NOT the delegation engine. Delegation is `sub_recipes:` (declarative YAML) and natural-language subagents.
