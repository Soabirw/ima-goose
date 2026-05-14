# ima-goose

IMA's Goose recipe repository — FP-aware coding agents, WordPress development, code review, testing, and architecture guidance.

Current release: **v1.2.0**. See [CHANGELOG.md](CHANGELOG.md) for release notes.

## What's New In v1.2.0

- `software-development-cycle` is now the preferred full-cycle umbrella for
  Brainstorm -> Plan -> Decompose -> Implement -> Test -> Review ->
  Document/Learn.
- `brainstorm`, `plan`, `task-master`, `task-runner`, `architect`,
  `review-verify`, and `document-learn` can start without required parameter
  gates and ask for context in-session.
- `node scripts/install.ts --profile <name>` now rewrites model tiers for
  Claude ACP, Anthropic direct, or OpenAI via Codex ACP.
- Gitea work now has a dedicated `tea-gitea` skill and safer guidance for long
  PR review comments.

---

## Quick Start (Get Fully Goosed)

For a teammate setting this up fresh. All four layers (recipes, skills, MOIM, aliases) need to be in place for the workflow to behave as documented. Setting just the Goose recipe repo is **not** sufficient — that distributes recipes, but skills/MOIM/aliases need files on disk.

### 1. Clone the repo

```bash
git clone git@github.com:Soabirw/ima-goose.git ~/IMA/dev/ima-goose
cd ~/IMA/dev/ima-goose
```

Skills, MOIM, and shell aliases all read from the working tree. If you clone to a different path, you'll update `GOOSE_RECIPE_PATH` in step 4.

### 2. Install the ACP provider binaries

Goose needs the ACP binary on PATH to route through your Claude Code (or Codex) subscription. Install at least the one you'll use as your default — installing both is fine if you want to switch providers later:

```bash
# Claude ACP (team default — routes through your Claude Code subscription)
npm install -g @agentclientprotocol/claude-agent-acp

# Codex ACP (alternative — routes through your Codex subscription)
npm install -g @zed-industries/codex-acp
```

Verify on PATH:

```bash
which claude-agent-acp        # /usr/local/bin/claude-agent-acp (or your npm global prefix)
```

Without these binaries, the next step's provider config silently fails to connect — Goose only knows the provider *name* (`claude-acp`); the binary is what actually proxies requests to your subscription.

### 3. Configure Goose provider (one-time)

Add to `~/.config/goose/config.yaml`:

```yaml
GOOSE_PROVIDER: "claude-acp"
GOOSE_MODEL: "sonnet"
GOOSE_PLANNER_PROVIDER: "claude-acp"
GOOSE_PLANNER_MODEL: "default"           # maps to opus
GOOSE_RECIPE_GITHUB_REPO: "Soabirw/ima-goose"  # enables `goose run --recipe NAME` by short name
```

Use `"codex-acp"` instead of `"claude-acp"` if you'd rather route through Codex. Alternative providers (Anthropic direct, OpenRouter, RunPod) are in the [Setup](#setup) section below.

### 4. Install skills globally — REQUIRED

```bash
node scripts/install.ts
```

Copies all 42 skills from `skills/*/` to `~/.agents/skills/` where Summon auto-discovers them. **Without this step, recipes load but their skill references go nowhere** — Summon has nothing to find and the recipes silently lose their deep domain knowledge. Requires Node 24+.

### 5. Set up shell aliases

```bash
cp .goose-aliases.example ~/.goose-aliases
echo '[ -f "$HOME/.goose-aliases" ] && source "$HOME/.goose-aliases"' >> ~/.bashrc
# (use ~/.zshrc if you're on zsh)
source ~/.bashrc
```

If you cloned to a non-default path, edit `GOOSE_RECIPE_PATH` in `~/.goose-aliases` before sourcing.

### 6. Enable the Practitioner persona via MOIM (optional but recommended)

Open `~/.goose-aliases`, find the commented-out export, and uncomment:

```bash
export GOOSE_MOIM_MESSAGE_FILE="$GOOSE_RECIPE_PATH/moim/ima-practitioner.md"
```

Re-source your shell. Now every Goose session — IMA recipes or not — gets the 6-line Practitioner persona anchor injected every turn. Survives `/compact`.

### Verify

```bash
goose-help                    # prints all the workflow commands
goose-explore                 # launches the explore recipe at Haiku
```

Inside the interactive session, type `/skills` — you should see ~42 skills listed. Ask *"who are you?"* — if MOIM is enabled, the Practitioner persona answers.

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| Goose "provider not found" or hangs on every call | ACP binary not on PATH — rerun step 2's `npm install -g …` |
| `/skills` lists only 9 (just MCP guides) | Skipped step 4 — rerun `node scripts/install.ts` |
| Recipe references a skill that won't load | Skill missing from `~/.agents/skills/<name>/SKILL.md` — re-run installer |
| Sub-recipe tool calls fail with path errors | `GOOSE_RECIPE_PATH` unset or wrong directory — check `~/.goose-aliases` |
| MOIM persona not active | `echo $GOOSE_MOIM_MESSAGE_FILE` empty, or file missing |
| `goose run --recipe task-master` "recipe not found" | `GOOSE_RECIPE_GITHUB_REPO` not set, or you cloned without `gh` CLI available |

---

## Architecture Layers

The hybrid model uses six distinct layers. Understanding which layer does what prevents confusion and misuse.

| Layer | Mechanism | Lifecycle | Use for |
|---|---|---|---|
| **MOIM** (`GOOSE_MOIM_MESSAGE_FILE`) | Env var → injected every turn | Always-on, all sessions | 5-10 line persona anchor that survives `/compact` |
| **Recipe instructions** | YAML `instructions:` | Loaded once per session | Persona pointer + workflow + sub-recipe orchestration |
| **Skills** (`~/.agents/skills/<name>/SKILL.md`) | Summon extension, auto-discovered | Frontmatter always loaded, body on-demand | Deep domain knowledge — FP patterns, framework rules, brand |
| **Sub-recipes** (`sub_recipes:` YAML) | Tool per child, parent invokes by call | Spawn on tool call; fresh session, own pinned model | Deterministic delegation with parameters |
| **Subagents** (natural-language) | "Use the X recipe to…" in instructions | Spawned ad-hoc, own context | Parallel ad-hoc work without a YAML contract |
| **`settings.goose_model`** | YAML field per recipe | Per-recipe pin | Opus orchestrate, Sonnet implement, Haiku explore |

**Key point:** The orchestrator extension is *session management* (list/view/interrupt sessions) — it is NOT the delegation engine. Delegation is sub-recipes and subagents.

---

## Setup

> If you're a new teammate, the [Quick Start](#quick-start-get-fully-goosed) above is the fast path. The sections below are the configuration reference — provider alternatives, recipe-repo wiring, extensions, skill installation — useful when you need to switch providers, troubleshoot, or customize.

### 1. Configure Goose Provider

The team's current default routes Goose through your Claude Code subscription via the ACP provider — no separate API costs.

**Claude ACP (team default):**
```yaml
# ~/.config/goose/config.yaml
GOOSE_PROVIDER: "claude-acp"
GOOSE_MODEL: "sonnet"
GOOSE_PLANNER_PROVIDER: "claude-acp"
GOOSE_PLANNER_MODEL: "default"   # maps to opus
```

Friendly model names: `sonnet`, `opus`, `haiku`, `default` (= opus). Recipes pin their own model via `settings.goose_model`; the global is the fallback.

**Alternatives** (if you're not on Claude Code subscription):

```yaml
# Codex ACP (OpenAI via ChatGPT Pro/Max subscription)
GOOSE_PROVIDER: "codex-acp"
GOOSE_MODEL: "gpt-5.5"

# Direct Anthropic
GOOSE_PROVIDER: "anthropic"
GOOSE_MODEL: "claude-sonnet-4-6"

# OpenRouter (multi-provider routing)
GOOSE_PROVIDER: "openrouter"
GOOSE_MODEL: "anthropic/claude-sonnet-4-6"

# RunPod (self-hosted, OpenAI-compatible)
GOOSE_PROVIDER: "openai"
OPENAI_HOST: "https://api.runpod.ai/v2/<endpoint-id>"
OPENAI_API_KEY: "<your-runpod-key>"
GOOSE_MODEL: "your-deployed-model"
```

Recipes pin a tier (`opus` / `sonnet` / `haiku`) and the installer rewrites those to provider-specific model IDs at deploy time. Switch profiles any time:

```bash
node scripts/install.ts --profile openai      # opus→gpt-5.5, sonnet→gpt-5.3-codex, haiku→gpt-5.4-mini
node scripts/install.ts --profile anthropic   # full claude-* model IDs
node scripts/install.ts --profile claude-acp  # default — friendly shortnames
```

See [`docs/MODEL-TIERS.md`](docs/MODEL-TIERS.md) for the per-tier mapping rationale and per-recipe overrides.

### 2. Connect Recipe Repository

```bash
goose configure
# goose settings → goose recipe github repo → Soabirw/ima-goose
```

Or add to config.yaml:
```yaml
GOOSE_RECIPE_GITHUB_REPO: "Soabirw/ima-goose"
```

### 3. Enable Required Extensions

```bash
goose configure
# Toggle Extensions → enable: developer, summon
```

`developer` provides file/shell access. `summon` auto-discovers skills from `~/.agents/skills/`.

### 4. Install Skills

```bash
node scripts/install.ts
```

Copies all 42 skills from `skills/` to `~/.agents/skills/`. Requires Node 24+.

### 5. (Optional) Enable MOIM Persona Anchor

Source `.goose-aliases.example` and uncomment the `GOOSE_MOIM_MESSAGE_FILE` export to inject the Practitioner persona into every Goose turn. This survives context compaction.

### 6. Run a Recipe

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

---

## Skills

Skills live in `~/.agents/skills/<name>/SKILL.md` and are auto-discovered by the **Summon** extension at session start. Summon keeps only the frontmatter in initial context and loads the body on-demand when the task matches — keeping context lean.

**Skills vs Recipes:** Recipes launch standalone sessions with a pinned model and workflow. Skills are deep domain knowledge — FP patterns, framework rules, brand guidelines — loaded into running sessions on demand.

**Cross-platform:** The same SKILL.md format works in Claude Code (via the Summon extension) and Goose. Write a skill once, use it in both.

**Slash commands:** `/skills` lists available skills. `/prompts` and `/prompt <n>` exist for prompt templates.

### Installed Skills (42 total)

**FP languages (5):** `functional-programmer`, `js-fp`, `php-fp`, `py-fp`, `ruby-fp`

**FP framework variants (6):** `js-fp-api`, `js-fp-react`, `js-fp-vue`, `js-fp-wordpress`, `php-fp-wordpress`, `rails`

**WordPress / IMA framework (6):** `ima-bootstrap`, `ima-forms-expert`, `jquery`, `livecanvas`, `wp-ddev`, `wp-local`

**Editorial / brand (4):** `ima-brand`, `ima-copywriting`, `ima-editorial-scorecard`, `ima-editorial-workflow`

**Workflow / git / arch (4):** `ima-git`, `architect`, `gh-cli`, `tea-gitea`

**Testing (3):** `unit-testing`, `phpunit-wp`, `playwright`

**MCP guides (9):** `mcp-tavily`, `mcp-context7`, `mcp-sequential-thinking`, `mcp-atlassian`, `mcp-serena`, `mcp-fetch`, `mcp-chrome-devtools`, `mcp-qdrant`, `mcp-vestige`

**Goose docs (1):** `goose-doc-guide`

**Other domain (4):** `discourse`, `espocrm`, `php-authnet`, `rg`

Load a skill explicitly: `"Load the php-fp-wordpress skill with summon"`. Or just work naturally — Summon matches by description.

---

## Available Recipes

### P1/P2 — Core Recipes

All core recipes follow the hybrid pattern: each pins `settings.goose_model`, declares `extensions: [developer, summon]`, references skills by name in instructions, and uses `sub_recipes:` for declarative delegation where natural.

| Recipe | Description | Model |
|--------|-------------|-------|
| `brainstorm` | Interactive ideation session — research memories/code/web, iterate Q&A, save to Serena/file | Opus 4.7 |
| `plan` | Interactive technical planning session — research codebase + docs, iterate Q&A on implementation, save to Serena/file | Opus 4.7 |
| `implement` | General-purpose FP-aware coding | Sonnet 4.6 |
| `code-review` | Read-only FP + security review | Opus 4.7 |
| `wp-developer` | WordPress with security + Bootstrap + FP | Sonnet 4.6 |
| `explore` | Fast read-only codebase exploration | Haiku 4.5 |
| `test-writer` | TDD, test creation, debugging failures | Sonnet 4.6 |
| `architect` | Architecture guidance and technology selection | Opus 4.7 |
| `software-development-cycle` | Flattened umbrella for brainstorm, plan, story implementation, tests, review, document/learn | Opus 4.7 |
| `document-learn` | Terminal closeout recipe for docs and memory updates from completed artifacts | Sonnet 4.6 |
| `task-master` | Orchestration via sub-recipe delegation | Opus 4.7 |
| `task-planner` | Decomposition — Epic → Story → Task hierarchy for `task-master` consumption | Opus 4.7 |
| `task-runner` | Execute detailed task plans | Sonnet 4.6 |
| `prompt-starter` | Prompt-builder — turn raw ideas or Jira issues into structured implementation prompts (legacy; prefer `brainstorm` for new work) | Opus 4.7 |

### Sub-Recipe Wiring

`software-development-cycle` delegates to: `brainstorm`, `plan_feature` (plan), `decompose` (task-planner), `explore`, `implement`, `wp_implement` (wp-developer), `write_tests` (test-writer), `code_review` (code-review), `document_learn` (document-learn). It owns the full phase graph directly and does not call `task-master`.

`task-master` delegates to: `implement`, `wp_implement` (wp-developer), `write_tests` (test-writer), `code_review` (code-review), `explore`, `plan_task` (task-planner).

`implement` and `wp-developer` delegate to: `write_tests`, `code_review`.

`task-runner` delegates to: `write_tests`, `code_review`.

Terminal (no sub-recipes): `brainstorm`, `plan`, `document-learn`, `architect`, `task-planner`, `prompt-starter`, `test-writer`, `explore`.

**Brainstorm → Plan → Orchestrate chain.** `brainstorm` and `plan` are stand-alone interactive sessions that save their output to Serena memory (or a file). The user passes those saved artifacts forward — `goose-plan <brainstorm-memory-name>` to enter the plan session pre-loaded with the brainstorm, then optionally hand the plan to `task-planner`/`task-master` for Epic→Story→Task decomposition and execution. Each link is terminal; nothing auto-spawns the next session.

**Software development cycle.** `software-development-cycle` is the top-level recipe for the full IMA cycle. It flattens every phase as a direct sub-recipe because Goose child sessions are isolated and should not rely on nested subrecipe calls. It passes explicit artifacts between phases and calls `document-learn` after each story and again at feature closeout.

### P3 — Specialized (Stubs — Planned)

| Recipe | Description |
|--------|-------------|
| `project-planner` | Epic > Story > Task decomposition |
| `espocrm` | EspoCRM API integration |
| `design-to-code` | Screenshot to WordPress code |
| `scorecard` | Project quality scorecard |

### P4 — Domain-Specific (Stubs — Planned)

| Recipe | Description |
|--------|-------------|
| `quasar-developer` | Quasar Framework + Vue FP |
| `livecanvas` | LiveCanvas + Bootstrap + Tangible |
| `payment-processing` | Authorize.Net PHP SDK |
| `jira-workflow` | Jira awareness checkpoints |
| `email-creator` | Branded email HTML |

P3/P4 stubs are harmless empty dirs signaling future scope. Convert when the workflow surfaces.

---

## Model Pinning

Each recipe pins its own model via `settings.goose_model`. No global tier table needed — the recipe carries the right model for the job.

| Recipe | Model | Rationale |
|--------|-------|-----------|
| `brainstorm` | `opus` | Research + clarifying-question quality |
| `plan` | `opus` | Trade-off reasoning + technical synthesis |
| `task-master` | `opus` | Orchestration / decisions |
| `software-development-cycle` | `opus` | Full-cycle orchestration / phase gates |
| `architect` | `opus` | Trade-off reasoning |
| `prompt-starter` | `opus` | Research + template fill |
| `task-planner` | `opus` | Decomposition |
| `code-review` | `opus` | Security + logic flaws |
| `implement` | `sonnet` | Coding |
| `wp-developer` | `sonnet` | Coding |
| `test-writer` | `sonnet` | Test coding |
| `task-runner` | `sonnet` | Execution |
| `document-learn` | `sonnet` | Documentation and memory closeout |
| `explore` | `haiku` | Cheap read-only |

The `settings.goose_model` field in source recipes uses tier shortnames (`opus` / `sonnet` / `haiku`). The installer rewrites these to provider-specific model IDs at deploy time based on `--profile` — see [`docs/MODEL-TIERS.md`](docs/MODEL-TIERS.md) for the full mapping including per-recipe overrides (e.g., `task-master` demoted to `gpt-5.4` under the OpenAI profile to protect the GPT-5.5 rate-limit budget).

---

## MOIM — Persistent Persona Anchor

`moim/ima-practitioner.md` is a ≤10-line persona anchor injected into every Goose turn via `GOOSE_MOIM_MESSAGE_FILE`. Unlike recipe instructions (loaded once at session start), MOIM re-injects every turn and survives `/compact`.

Opt-in by sourcing `.goose-aliases.example` and uncommenting the export. Off by default — non-IMA Goose sessions are unaffected.

---

## Shared Reference Files

`shared/` contains recipe-internal references used by the developer extension at runtime. Domain knowledge (FP patterns, brand, framework rules) now lives in skills — shared/ is intentionally slim.

Gitea operations are handled by the `tea-gitea` skill, which teaches agents the
`tea` CLI workflow for PRs, comments, approvals, and API fallbacks. The shared
`tea.md` file remains available to recipes as a compact runtime reference.

```
shared/
├── persona.md              # Practitioner persona (also in moim/)
├── security-guardrails.md  # Consolidated security checks
└── tool-guides/
    ├── tea.md              # Gitea CLI reference
    └── atlassian.md        # Jira/Confluence patterns
```

---

## Per-Project Hints

Copy `.goosehints` to your project repos for persistent project context. Goose reads it at session start — same role as CLAUDE.md in Claude Code. It covers tool preferences, architecture notes, security requirements, and framework constraints.

---

## Origin

Adapted from [ima-claude](https://github.com/Soabirw/ima-claude) (Claude Code plugin, 63 skills). This repo packages the same team standards and FP patterns in Goose's recipe + skills hybrid format. Skills are cross-installed: the same SKILL.md files serve both Claude Code (via Summon extension) and Goose (via Summon built-in).
