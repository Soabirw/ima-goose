# ima-goose

IMA's Goose recipe repository — FP-aware coding agents, WordPress development, code review, testing, and architecture guidance.

Current release: **v2.0.2**. See [CHANGELOG.md](CHANGELOG.md) for release notes.

## What's New In v2.0.2

- Made `scripts/install.ts` read-only for `~/.config/goose/config.yaml` by
  default; it now prints slash-command config for manual merge.
- Added `--register-slash-commands` as an explicit opt-in write path with a
  timestamped `config.yaml` backup before changes.
- Updated setup docs so `config-template.yaml` is treated as a reference, not a
  file to copy over an existing Goose config.

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
# Codex ACP (team default — routes through your Codex subscription)
npm install -g @zed-industries/codex-acp

# Claude ACP (optional, only for hybrid/claude-acp profiles)
npm install -g @agentclientprotocol/claude-agent-acp
```

Verify on PATH:

```bash
which codex-acp        # /usr/local/bin/codex-acp (or your npm global prefix)
```

Without these binaries, the next step's provider config silently fails to connect — Goose only knows the provider *name* (`claude-acp`); the binary is what actually proxies requests to your subscription.

### 3. Configure Goose provider (one-time)

Add to `~/.config/goose/config.yaml`:

```yaml
GOOSE_PROVIDER: "codex-acp"
GOOSE_MODEL: "gpt-5.5/medium"
GOOSE_PLANNER_PROVIDER: "codex-acp"
GOOSE_PLANNER_MODEL: "gpt-5.5/high"
```

Use the `hybrid`, `anthropic`, or `claude-acp` installer profiles only when those providers are configured locally. Alternative providers are in the [Setup](#setup) section below.

### 4. Install skills globally — REQUIRED

```bash
node scripts/install.ts
```

Renders recipe templates from `recipes/**/*.yaml.eta` into
`~/.config/goose/recipes/*.yaml`, then copies all 49 skills from `skills/*/` to
`~/.agents/skills/` where Summon auto-discovers them. **Without this step,
recipes load but their skill references go nowhere** — Summon has nothing to
find and the recipes silently lose their deep domain knowledge. Requires
Node 24+. The installer does not modify `~/.config/goose/config.yaml` unless
you explicitly pass `--register-slash-commands`; that opt-in path creates a
timestamped backup first.

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
goose-explore                 # launches the LOW-tier explore recipe
goose-ui                      # launches the HIGH-tier UI/UX designer recipe
```

Inside the interactive session, type `/skills` — you should see ~49 skills listed. Ask *"who are you?"* — if MOIM is enabled, the Practitioner persona answers.

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| Goose "provider not found" or hangs on every call | ACP binary not on PATH — rerun step 2's `npm install -g …` |
| `/skills` lists only 9 (just MCP guides) | Skipped step 4 — rerun `node scripts/install.ts` |
| Recipe references a skill that won't load | Skill missing from `~/.agents/skills/<name>/SKILL.md` — re-run installer |
| Sub-recipe tool calls fail with path errors | Installed recipes are stale — rerun `node scripts/install.ts --validate` |
| MOIM persona not active | `echo $GOOSE_MOIM_MESSAGE_FILE` empty, or file missing |
| `goose run --recipe <name>` "recipe not found" | Recipes have not been rendered into `~/.config/goose/recipes/` — rerun `node scripts/install.ts --validate` |

---

## Architecture Layers

The hybrid model uses six distinct layers. Understanding which layer does what prevents confusion and misuse.

| Layer | Mechanism | Lifecycle | Use for |
|---|---|---|---|
| **MOIM** (`GOOSE_MOIM_MESSAGE_FILE`) | Env var → injected every turn | Always-on, all sessions | 5-10 line persona anchor that survives `/compact` |
| **Recipe instructions** | YAML `instructions:` | Loaded once per session | Persona pointer + workflow + sub-recipe orchestration |
| **Skills** (`~/.agents/skills/<name>/SKILL.md`) | Summon extension, auto-discovered | Frontmatter always loaded, body on-demand | Deep domain knowledge — FP patterns, framework rules, brand |
| **Sub-recipes** (`sub_recipes:` YAML) | Tool per child, parent invokes by call | Spawn on tool call; fresh session, own rendered provider/model | Deterministic delegation with parameters |
| **Subagents** (natural-language) | "Use the X recipe to…" in instructions | Spawned ad-hoc, own context | Parallel ad-hoc work without a YAML contract |
| **Serena project memories** (`core`, `conventions`, etc.) | Serena MCP memory | Loaded by Serena-enabled recipes | Cross-harness project context migrated from `.goosehints`, `CLAUDE.md`, or `AGENTS.md` |
| **Profile-rendered models** | `PROFILE_MODEL_HIGH/MID/LOW` in recipe templates | Per-recipe tier rendered by installer | HIGH plan/review, MID implement, LOW explore |

**Key point:** The orchestrator extension is *session management* (list/view/interrupt sessions) — it is NOT the delegation engine. Delegation is sub-recipes and subagents.

---

## Setup

> If you're a new teammate, the [Quick Start](#quick-start-get-fully-goosed) above is the fast path. The sections below are the configuration reference — provider alternatives, recipe-repo wiring, extensions, skill installation — useful when you need to switch providers, troubleshoot, or customize.

### 1. Configure Goose Provider

The team's current default routes Goose through Codex ACP.

**Codex ACP / OpenAI profile (default):**
```yaml
# ~/.config/goose/config.yaml
GOOSE_PROVIDER: "codex-acp"
GOOSE_MODEL: "gpt-5.5/medium"
GOOSE_PLANNER_PROVIDER: "codex-acp"
GOOSE_PLANNER_MODEL: "gpt-5.5/high"
```

**Alternatives** (if you're not on Claude Code subscription):

```yaml
# Claude ACP, if working locally
GOOSE_PROVIDER: "claude-acp"
GOOSE_MODEL: "sonnet"

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

Recipes declare `HIGH`, `MID`, or `LOW` by using profile variables in source templates. The installer renders concrete provider/model values at deploy time. Switch profiles any time:

```bash
node scripts/install.ts --profile openai      # default: HIGH/MID/LOW → GPT-5.5 efforts
node scripts/install.ts --profile hybrid      # HIGH→codex-acp, MID/LOW→claude-acp
node scripts/install.ts --profile anthropic   # full claude-* model IDs
node scripts/install.ts --profile claude-acp  # Claude friendly shortnames
```

See [`docs/MODEL-TIERS.md`](docs/MODEL-TIERS.md) for the per-tier mapping rationale and per-recipe overrides.

### 2. Install Rendered Recipes

This repository is the source package. Goose consumes the rendered files written
by the installer, not the `.yaml.eta` source templates directly.

```bash
node scripts/install.ts --validate
```

### 3. Enable Required Extensions

```bash
goose configure
# Toggle Extensions → enable the extensions from config-template.yaml
```

Recipes that declare `sub_recipes` need an explicit rendered `extensions:`
block because Goose auto-injects `summon`, and any explicit extension block
limits the session to only listed extensions. The installer reads enabled
extensions from `~/.config/goose/config.yaml` and renders those into the
installed recipe files, so each developer keeps their own machine's extension
set. After changing enabled Goose extensions, rerun `node scripts/install.ts`.
MCP tools are called directly through Goose; do not route normal MCP usage
through a TypeScript execution wrapper.

### 4. Install Skills

```bash
node scripts/install.ts
```

Renders recipe templates from `recipes/**/*.yaml.eta` into
`~/.config/goose/recipes/*.yaml`, then copies all 49 skills from `skills/` to
`~/.agents/skills/`. Requires Node 24+. By default this does not write
`~/.config/goose/config.yaml`; it prints slash-command blocks to merge manually.

### 5. (Optional) Enable MOIM Persona Anchor

Source `.goose-aliases.example` and uncomment the `GOOSE_MOIM_MESSAGE_FILE` export to inject the Practitioner persona into every Goose turn. This survives context compaction.

### 6. Run a Recipe

```bash
# By name after install
goose run --recipe implement

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

### Serena Project Memories

Serena-enabled recipes bootstrap standardized project memories before acting:
`core`, `conventions`, `tech_stack`, `suggested_commands`, and
`task_completion`. Treat `.goosehints`, `CLAUDE.md`, and `AGENTS.md` as source
files for migration, not as guaranteed runtime context. The `mcp-serena` skill
includes a helper script that converts those files into reviewable Serena
memory blocks. In Serena-enabled recipes, Serena bootstrap is the first tool
action at session start before greeting, Taskwarrior, Jira, Vestige, repository
search, or asking for local paths/config.

For task-scoped work, seed the org standards so Serena tells recipes how to use
Vestige as the living task memory:

```bash
python3 skills/mcp-serena/scripts/migrate-context-to-serena.py --root . --include-org-standards
```

Serena holds the stable startup instructions; Vestige carries each task's
plan, implementation updates, review findings, resolutions, and final closeout
under the task key.

Inside any interactive Goose session, run `/serena-bootstrap` to reload the
standard Serena project memories on demand.

Use `/serena-memorize <note>` to add stable project context to the appropriate
standard Serena memory:

```text
/serena-memorize Our Claude Code design exists at ./claude-design and should be referenced when implementing app feature tasks.
```

### Installed Skills (49 total)

**FP languages (5):** `functional-programmer`, `js-fp`, `php-fp`, `py-fp`, `ruby-fp`

**FP framework variants (6):** `js-fp-api`, `js-fp-react`, `js-fp-vue`, `js-fp-wordpress`, `php-fp-wordpress`, `rails`

**WordPress / IMA framework (6):** `ima-bootstrap`, `ima-forms-expert`, `jquery`, `livecanvas`, `wp-ddev`, `wp-local`

**Editorial / brand (5):** `ima-brand`, `ima-copywriting`, `ima-editorial-scorecard`, `ima-editorial-workflow`, `ima-email-creator`

**Research (2):** `ima-researcher`, `patristic-researcher`

**Workflow / git / arch (4):** `ima-git`, `architect`, `gh-cli`, `tea-gitea`

**Testing (3):** `unit-testing`, `phpunit-wp`, `playwright`

**MCP/API guides (10):** `mcp-tavily`, `mcp-context7`, `mcp-sequential-thinking`, `mcp-atlassian` (Atlassian REST API), `mcp-serena`, `mcp-fetch`, `mcp-chrome-devtools`, `mcp-qdrant`, `mcp-vestige`, `mcp-taskwarrior`

**Goose docs (1):** `goose-doc-guide`

**Other domain (7):** `discourse`, `discourse-admin`, `ember-discourse`, `espocrm`, `espocrm-api`, `php-authnet`, `rg`

Load a skill explicitly: `"Load the php-fp-wordpress skill with summon"`. Or just work naturally — Summon matches by description.

---

## Available Recipes

### P1/P2 — Core Recipes

All core recipe templates use profile-rendered `HIGH`, `MID`, or `LOW`
provider/model variables. Recipes with `sub_recipes` render enabled extensions
from the local Goose config at install time so Goose does not render them with
only the auto-injected `summon` extension.

| Recipe | Description | Tier |
|--------|-------------|-------|
| `brainstorm` | Interactive ideation session — research memories/code/web, iterate Q&A, save to Serena/file | HIGH |
| `plan` | Interactive technical planning session — research codebase + docs, iterate Q&A on implementation, save to Serena/file | HIGH |
| `implement` | General-purpose FP-aware coding | MID |
| `code-review` | Read-only FP + security review | HIGH |
| `scorecard` | Project, PR, or codebase quality scorecard | HIGH |
| `review-verify` | High-capability verification of critical review findings | HIGH |
| `adversarial-review` | Experimental dual-model adversarial review with Anthropic + GPT-5.5 children | HIGH coordinator |
| `goose-ship-it` | IMA release-prep workflow for staging branches and production tags | MID |
| `wp-developer` | WordPress with security + Bootstrap + FP | MID |
| `ui-ux-designer` | Browser-based UI/UX review with Chrome DevTools, responsive checks, accessibility basics, and Bootstrap/IMA CSS guidance | HIGH |
| `design-to-code` | Translate approved designs/screenshots into implementation prompts or code pipeline | HIGH |
| `explore` | Fast read-only codebase exploration, sub-recipe oriented | LOW |
| `test-writer` | TDD, test creation, debugging failures | MID |
| `/architect` | Current-session architecture lens and technology selection command | Current session |
| `software-development-cycle` | Flattened umbrella for brainstorm, plan, story implementation, tests, review, document/learn | HIGH |
| `document-learn` | Terminal closeout recipe for docs and memory updates from completed artifacts | MID |
| `task-planner` | Decomposition — Epic → Story → Task hierarchy for human-in-the-loop planning | HIGH |
| `/prompt-starter` | Current-session prompt builder for dedicated recipe sessions | Current session |
| `patristic-researcher` | Early Church research through Augustine using the Qdrant theology corpus and primary-source verification | HIGH |
| `ima-researcher` | Evidence-driven IMA medical research using the future `ima-research` corpus and current primary-source verification | HIGH |

### Sub-Recipe Wiring

`software-development-cycle` delegates to: `brainstorm`, `plan_feature` (plan), `decompose` (task-planner), `explore`, `implement`, `wp_implement` (wp-developer), `write_tests` (test-writer), `code_review` (code-review), `document_learn` (document-learn). It owns the full phase graph directly and does not call `task-master`.

`implement` and `wp-developer` delegate to: `write_tests`, `code_review`.

`code-review` delegates to: `verify` (review-verify) and `scorecard` when the user requests project/PR scoring.

`adversarial-review` delegates to: `claude_opus_adversary` (adversarial-review-claude), `gpt55_adversary` (adversarial-review-openai). These child recipes are pinned directly to `anthropic`/`claude-opus-4-7` and `codex-acp`/`gpt-5.5/high`, independent of installer profile tier rendering.

Terminal (no sub-recipes): `brainstorm`, `plan`, `document-learn`, `task-planner`, `test-writer`, `explore`, `ui-ux-designer`, `goose-ship-it`, `scorecard`, `ima-researcher`, `patristic-researcher`, `adversarial-review-claude`, `adversarial-review-openai`.

Current-session commands: `/architect`, `/prompt-starter`, `/serena-bootstrap`, `/serena-memorize`.

**Brainstorm → Plan → Task Planner chain.** `brainstorm` and `plan` are stand-alone interactive sessions that save their output to Serena memory (or a file). The user passes those saved artifacts forward — `goose-plan <brainstorm-memory-name>` to enter the plan session pre-loaded with the brainstorm, then optionally hand the plan to `task-planner` for Epic→Story→Task decomposition. Each link is terminal; nothing auto-spawns the next session.

**Software development cycle.** `software-development-cycle` is the top-level recipe for the full IMA cycle. It flattens every phase as a direct sub-recipe because Goose child sessions are isolated and should not rely on nested subrecipe calls. It passes explicit artifacts between phases and calls `document-learn` after each story and again at feature closeout.

### P3 — Specialized

| Recipe | Description |
|--------|-------------|
| `task-planner` | Epic > Story > Task decomposition |
| `design-to-code` | Screenshot/design artifact to implementation prompt or code pipeline |
| `scorecard` | Project, PR, or codebase quality scoring |

### P3/P4 — Planned

| Recipe | Description |
|--------|-------------|
| `espocrm` | EspoCRM API integration |
| `quasar-developer` | Quasar Framework + Vue FP |
| `livecanvas` | LiveCanvas + Bootstrap + Tangible |
| `payment-processing` | Authorize.Net PHP SDK |
| `jira-workflow` | Jira awareness checkpoints |
| `email-creator` | Branded email HTML |

Planned recipe dirs are harmless empty dirs signaling future scope. Convert when the workflow surfaces.

---

## Model Profiles

Recipes use `HIGH`, `MID`, and `LOW` tiers rendered from `profiles/*.yaml`.
`openai` is the default profile. See [`docs/MODEL-TIERS.md`](docs/MODEL-TIERS.md).

---

## MOIM — Persistent Persona Anchor

`moim/ima-practitioner.md` is a ≤10-line persona anchor injected into every Goose turn via `GOOSE_MOIM_MESSAGE_FILE`. Unlike recipe instructions (loaded once at session start), MOIM re-injects every turn and survives `/compact`.

Opt-in by sourcing `.goose-aliases.example` and uncommenting the export. Off by default — non-IMA Goose sessions are unaffected.

---

## Shared Reference Files

`shared/` contains build-time snippets injected into rendered recipes and a few
recipe-internal runtime references. Domain knowledge (FP patterns, brand,
framework rules) now lives in skills — shared/ is intentionally slim.

Gitea operations are handled by the `tea-gitea` skill, which teaches agents the
`tea` CLI workflow for PRs, comments, approvals, and API fallbacks. The shared
`tea.md` file remains available to recipes as a compact runtime reference.

```
shared/
├── instructions/
│   └── serena-bootstrap.md # Build-time include for recipe templates
├── persona.md              # Practitioner persona (also in moim/)
├── security-guardrails.md  # Consolidated security checks
└── tool-guides/
    ├── tea.md              # Gitea CLI reference
    └── atlassian.md        # Jira/Confluence patterns
```

---

## Per-Project Context

Use Serena project memories as the reliable runtime source for project context.
You can still keep `.goosehints`, `CLAUDE.md`, or `AGENTS.md` in project repos,
but treat them as migration sources. Use the `mcp-serena` skill to convert them
into standard Serena memories so Goose, Claude Code, Codex, and other harnesses
can load the same project rules consistently.

---

## Origin

Adapted from [ima-claude](https://github.com/Soabirw/ima-claude) (Claude Code plugin, 63 skills). This repo packages the same team standards and FP patterns in Goose's recipe + skills hybrid format. Skills are cross-installed: the same SKILL.md files serve both Claude Code (via Summon extension) and Goose (via Summon built-in).
