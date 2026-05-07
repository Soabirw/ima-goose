# ima-claude to ima-goose Migration Guide

Transitioning from Claude Code (ima-claude plugin) to Goose (ima-goose recipe repo). This covers what changed, what maps where, and how to do the things you already know how to do.

---

## The Big Picture

| | Claude Code | Goose |
|---|---|---|
| **Unit of work** | Skill (injected into running session) | Recipe (standalone agent config, launched independently) |
| **Config format** | SKILL.md + frontmatter | recipe.yaml (YAML) |
| **Project context** | CLAUDE.md | .goosehints |
| **Guardrails** | Python hook scripts (hooks.json) | Baked into recipe `instructions` + .goosehints |
| **Agent delegation** | `Agent(subagent_type: "ima-claude:implementer")` | Sub-recipes + orchestrator extension |
| **Session memory** | Vestige + Qdrant + Serena MCP | chatrecall extension |
| **Model selection** | Per-agent (haiku/sonnet/opus) | Per-recipe `settings.goose_model` |
| **Installation** | `/plugin install ima-claude` | `GOOSE_RECIPE_GITHUB_REPO` in config.yaml |
| **Invocation** | `/ima-claude:skill-name` or auto-discovery | `goose run --recipe recipe-name` |

**Key paradigm shift:** In Claude Code, you open a session and invoke skills within it — skills layer onto your conversation. In Goose, each recipe launches a fresh, purpose-built agent. You pick the recipe *before* starting, not during.

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

**OpenRouter (interim — until RunPod is ready):**
```bash
goose configure
# → Configure Providers → OpenRouter
# → Enter API key
# → Model: anthropic/claude-sonnet-4-5
```

**RunPod (production):**
Edit `~/.config/goose/config.yaml`:
```yaml
GOOSE_PROVIDER: "openai"
OPENAI_HOST: "https://api.runpod.ai/v2/<endpoint-id>"
OPENAI_API_KEY: "<your-runpod-key>"
GOOSE_MODEL: "your-deployed-model"
```

### 3. Connect Recipe Repo

```bash
goose configure
# → goose settings → goose recipe github repo → Soabirw/ima-goose-recipes
```

Or add to `~/.config/goose/config.yaml`:
```yaml
GOOSE_RECIPE_GITHUB_REPO: "Soabirw/ima-goose-recipes"
```

### 4. Enable Extensions

```bash
goose configure
# Toggle ON: chatrecall, orchestrator, developer
```

These are Goose's built-in platform extensions. `developer` gives file/shell access, `chatrecall` gives session memory, `orchestrator` enables multi-agent delegation.

### 5. Add MCP Extensions (Optional)

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
    args: ["-y", "@anthropic-ai/mcp-proxy", "--endpoint", "https://context7.com/mcp"]
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

Each recipe is a standalone session. Pick the right recipe for the job upfront.

### Previewing Before Running

**Goose:**
```bash
goose run --recipe implement --explain
```

Shows what the recipe will do (instructions, extensions, settings) without executing. Use this when trying a recipe for the first time.

### Interactive Mode

**Goose:**
```bash
goose run --recipe implement --interactive
```

Prompts for parameter values before starting. Useful for recipes with parameters (e.g., wp-developer asks for `environment: ddev | local-wp | other`).

---

## Skill-to-Recipe Map

### What You Used → What You Use Now

| Claude Code Slash Command | Goose Command | Notes |
|---|---|---|
| `/ima-claude:implement` or auto | `goose run --recipe implement` | Same FP rules, security checks |
| `/ima-claude:code-review` or reviewer agent | `goose run --recipe code-review` | Read-only, produces report |
| `/ima-claude:wp-developer` or wp-developer agent | `goose run --recipe wp-developer` | All 5 WP security checks included |
| Explorer agent | `goose run --recipe explore` | Read-only, fast (Light model) |
| `/ima-claude:unit-testing` or tester agent | `goose run --recipe test-writer` | PHPUnit, Jest, Playwright, pytest |

### Skills That Merged Into Recipes

Many Claude Code skills were small, focused instructions. In Goose, related skills are grouped into single recipes:

| Goose Recipe | Claude Code Skills It Replaces |
|---|---|
| `implement` | implementer agent, functional-programmer, js-fp, php-fp, py-fp |
| `code-review` | reviewer agent, functional-programmer, security hooks |
| `wp-developer` | wp-developer agent, php-fp-wordpress, wp-ddev, wp-local, ima-bootstrap, jquery, ima-forms-expert |
| `explore` | explorer agent, rg |
| `test-writer` | tester agent, unit-testing, phpunit-wp, playwright |

### Skills That Became Shared Files

These aren't recipes — they're reference documents that recipes can read:

| Shared File | Claude Code Source | Used By |
|---|---|---|
| `shared/fp-principles.md` | functional-programmer | All coding recipes |
| `shared/security-guardrails.md` | Hook scripts (wp_security_check, sql_injection_check, etc.) | All coding recipes |
| `shared/ima-brand-book.md` | ima-brand | wp-developer, design-to-code |
| `shared/code-standards/js-fp.md` | js-fp, js-fp-api, js-fp-react, js-fp-vue, js-fp-wordpress | implement |
| `shared/code-standards/php-fp.md` | php-fp, php-fp-wordpress | implement, wp-developer |
| `shared/code-standards/py-fp.md` | py-fp | implement |
| `shared/code-standards/jquery.md` | jquery | wp-developer |

### Skills Not Yet Ported (P2/P3)

| Recipe | Status | Claude Code Equivalent |
|---|---|---|
| `architect` | P2 — coming soon | architect skill |
| `project-planner` | P2 | task-planner |
| `task-master` | P2 — being reworked for Goose orchestrator | task-master, task-planner, task-runner |
| `prompt-starter` | P2 — being reworked for Goose templates | prompt-starter |
| `espocrm` | P2 | espocrm, espocrm-api |
| `design-to-code` | P2 | design-to-code |
| `scorecard` | P2 | scorecard |
| `quasar-developer` | P3 | quasar-fp |
| `livecanvas` | P3 | livecanvas |
| `payment-processing` | P3 | php-authnet |
| `jira-workflow` | P3 | jira-checkpoint |

### Skills Dropped (No Goose Equivalent Needed)

| Skill | Why Dropped |
|---|---|
| save-session, resume-session | Goose has `--resume` / `--name` built in |
| skill-creator, skill-analyzer | Claude Code meta-tools |
| compound-bridge | Claude Code-specific |
| mcp-memory | Already deprecated |
| quickstart | Replaced by this guide + README |

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

**Goose (coming P2):**
```bash
goose run --recipe task-master
# → Uses orchestrator extension for multi-agent sessions
# → Delegates via sub_recipes (implement, test-writer, code-review)
# → Each sub-recipe has its own model settings
# → summon extension for knowledge-aware subagents
```

Until task-master is built, manually chain recipes:
```bash
goose run --recipe explore        # Understand codebase
goose run --recipe implement      # Build the feature
goose run --recipe test-writer    # Write tests
goose run --recipe code-review    # Review the result
```

### Code Review

**Claude Code:**
```
# Auto: push PR, reviewer agent runs
# Manual: /ima-claude:code-review or delegate to reviewer agent
```

**Goose:**
```bash
goose run --recipe code-review
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

# chatrecall extension provides automatic session memory
```

### Prompt Building

**Claude Code (prompt-starter):**
```
/ima-claude:prompt-starter
# Template selection → Jira pre-fill → editor spawn
# Returns refined prompt, does NOT execute
```

**Goose (coming P2):**
```bash
goose run --recipe prompt-starter
# Same concept: rough idea → structured prompt → refined output
# Templates reworked for Goose-native parameters and activities
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
| Cross-session memory | chatrecall or MCP extensions | Configure Vestige/Qdrant as MCP extensions if needed |

chatrecall is lighter than the Vestige/Qdrant/Serena tri-store. For most workflows, session naming + resume covers what you need.

### Personality Modes

**Claude Code:**
```
"Enable efficient mode"   # Precise, ~30-40% token savings
"Enable terse mode"       # Blunt fragments, ~50-65% savings
"Enable 40k mode"         # Warhammer themed
```

**Goose:**
Personality is baked into recipe `instructions`. The Practitioner persona (25-year veteran, FP-first) is built into every recipe. For alternate personalities, create recipe variants or use `--system` to override.

---

## Guardrails: Where Did the Hooks Go?

Claude Code used Python hook scripts that ran automatically before/after tool calls. Goose has no hook system. Here's where each guardrail landed:

### Baked Into Recipe Instructions

These run because they're part of the recipe's `instructions` field — the model reads and follows them:

| Former Hook | Now In | What It Does |
|---|---|---|
| wp_security_check.py | wp-developer recipe | 5 PHP security checks (nonces, $wpdb->prepare, sanitize, escape, strict_types) |
| sql_injection_check.py | All coding recipes | "SQL: parameterized queries only" rule |
| fp_utility_check.py | All coding recipes | "NEVER create custom pipe/compose/curry" rule |
| bootstrap_utility_check.py | wp-developer recipe | "Use Bootstrap utilities, not custom CSS" rule |
| jquery_in_wordpress.py | wp-developer recipe | jQuery IIFE wrapper pattern |

### Baked Into .goosehints

These apply to any Goose session in a repo that has the `.goosehints` file:

| Former Hook | .goosehints Rule |
|---|---|
| enforce_rg_over_grep.py | "Prefer rg over grep" |
| docs_organization.py | Three-tier docs structure |

### Dropped (Claude Code-Specific)

memory_bootstrap.py, memory_store_reminder.py, vestige_before_external.py, block_sed_edits.py, prompt_coach.py, task_master_*.py, sequential_thinking_check.py, bootstrap.sh, atlassian_prereqs.py, serena_project_check.py

**What this means for you:** The model-enforced guardrails (security checks, FP rules) are just as strict — they're in the recipe instructions. But there's no automated pre-commit gate. If the model ignores an instruction, there's no hook to catch it. Review outputs carefully.

---

## .goosehints = Your New CLAUDE.md

Every project can have a `.goosehints` file at the root. Goose reads it automatically at session start — same role as CLAUDE.md in Claude Code.

**What goes in .goosehints:**
- Project-specific dev standards
- Tool preferences (rg over grep, DDEV vs Local WP)
- Architecture notes
- Security requirements
- Framework constraints

The repo includes a starter `.goosehints` you can copy to your project repos. It covers FP philosophy, tool preferences, security rules, and git workflow.

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

Claude Code used Anthropic models exclusively. Goose is model-agnostic.

| Claude Code | Goose (OpenRouter interim) | Goose (RunPod production) |
|---|---|---|
| haiku (fast, cheap) | google/gemini-2.0-flash | TBD (8B model) |
| sonnet (balanced) | anthropic/claude-sonnet-4-5 | TBD (14-32B model) |
| opus (complex reasoning) | anthropic/claude-sonnet-4-5 or deepseek/deepseek-r1 | TBD (32B+ model) |

Each recipe declares its own model tier. The explore recipe uses Light (fast/cheap), most recipes use Standard, architect/project-planner use Heavy.

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

# Configure Goose
goose configure

# List available recipes
goose recipe list
```

### Choosing a Recipe

| I want to... | Recipe |
|---|---|
| Build a feature or fix a bug | `implement` |
| Review code for quality and security | `code-review` |
| Build/modify a WordPress plugin or theme | `wp-developer` |
| Quickly understand a codebase | `explore` |
| Write or fix tests | `test-writer` |

---

## FAQ

**Q: Can I still use Claude Code?**
Yes. ima-claude and ima-goose are independent. Use whichever fits — Claude Code for interactive work with the full plugin ecosystem, Goose for recipe-driven workflows with self-hosted models.

**Q: Do I need to learn YAML to use recipes?**
No. Recipes are pre-built — just `goose run --recipe <name>`. YAML matters only if you want to create or modify recipes.

**Q: Where did all 63 skills go?**
Grouped into ~15 recipes. Most Claude Code skills were small instruction sets that naturally merge by workflow. Reference material moved to `shared/` files. See the Skill-to-Recipe Map section above.

**Q: What about the advisor pattern (ESCALATION)?**
Being reworked for Goose. The concept survives — sub-recipes can surface problems to the orchestrator — but the exact protocol changes because Goose handles multi-agent differently than Claude Code's Agent tool.

**Q: Can I use multiple recipes in one session?**
Not directly. Each `goose run --recipe` is a standalone session. Chain them manually, or wait for the task-master recipe (P2), which orchestrates across sub-recipes.

**Q: What replaces Vestige/Qdrant/Serena?**
chatrecall extension covers session memory. For persistent semantic memory, you can configure Vestige and Qdrant as MCP extensions in Goose — same servers, different config format.
