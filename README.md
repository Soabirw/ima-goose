# ima-goose

IMA's Goose recipe repository — FP-aware coding agents, WordPress development, code review, testing, and architecture guidance.

Current release: **v2.6.0**. See [CHANGELOG.md](CHANGELOG.md) for release notes.

## What's New In v2.6.0

- Added `instructor`, a HIGH-tier read-only mentoring recipe with the
  `goose-instructor [source]` alias for context-aware guidance on what the
  human should do next and why.
- Updated `task-planner` so approved Epic→Story→Task hierarchies may be
  persisted to exactly one PM system, Jira or Taskwarrior, after explicit
  preview approval, with Stories as lifecycle units and lower-level Tasks as
  embedded Story checklists by default.
- Removed direct Serena, Qdrant, and Vestige extension entries from
  `config-template.yaml`; those integrations now route through
  `ima-mcp-gateway`.

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

Goose needs an ACP binary on `PATH` for ACP-backed providers. Install at least
the provider you plan to use; installing both is fine for local testing.

```bash
# Codex ACP (fallback path and vision handoff support)
npm install -g @zed-industries/codex-acp

# Claude ACP (optional; use only when you intentionally want the Claude ACP path)
npm install -g @agentclientprotocol/claude-agent-acp
```

Verify on PATH:

```bash
which codex-acp        # /usr/local/bin/codex-acp (or your npm global prefix)
which claude-agent-acp # optional, only if installed
```

Provider notes, current as of 2026-06-12:

- **Recommended path:** use the `chatgpt_codex` profile with ChatGPT/Codex OAuth,
  plus [`ima-mcp-gateway`](https://gitea.theflccc.org/IMA/ima-mcp-gateway)
  for Serena and Vestige access. This is the least fragile setup for the
  current IMA workflow.
- **Claude ACP billing changed:** Claude ACP should be treated as Anthropic
  API/metered usage rather than a Claude subscription proxy. See Anthropic's
  announcement: [What Anthropic's New Claude Billing Means](https://zed.dev/blog/anthropic-subscription-changes).
- **Known ACP limitations:** both Codex ACP and Claude ACP have active rough
  edges with MCP tool handling and are currently unable to trigger Goose
  sub-recipes reliably. The IMA workflows avoid the worst failures by routing
  fragile memory operations through `ima-mcp` CLI gateways instead of the Goose
  typed SDK path.

If you choose ACP as your provider, without the selected ACP binary, the next step's provider config silently fails
to connect — Goose only knows the provider *name*; the binary is what actually
proxies requests.

### 3. Configure Goose provider (one-time)

Recommended `~/.config/goose/config.yaml` provider block:

```yaml
GOOSE_THINKING_EFFORT: high
active_provider: chatgpt_codex
providers:
  chatgpt_codex:
    enabled: true
    model: gpt-5.5
    configured: true
  codex-acp:
    enabled: true
    model: gpt-5.5/high
    configured: true
```

Provider effort handling differs by path:

- `chatgpt_codex` uses the bare model name (`gpt-5.5`) and reads effort from
  `GOOSE_THINKING_EFFORT`. Do **not** configure `gpt-5.5/low`,
  `gpt-5.5/medium`, or `gpt-5.5/high` for `chatgpt_codex`.
- `codex-acp` does **not** read `GOOSE_THINKING_EFFORT`; effort must be part of
  the model name, such as `gpt-5.5/high`.

The profile system handles this split when rendering recipes and aliases. `node scripts/install.ts` defaults to the recommended `chatgpt_codex` OAuth
path. Use another profile only when that provider is configured locally. See
[`docs/MODEL-TIERS.md`](docs/MODEL-TIERS.md) and the [Setup](#setup) section
for profile details.

### 4. Install skills globally — REQUIRED

```bash
node scripts/install.ts
```

Renders recipe templates from `recipes/**/*.yaml.eta` into
`~/.config/goose/recipes/*.yaml`, then copies all skills from `skills/*/` to
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

Re-source your shell. Now every Goose session — IMA recipes or not — gets the Practitioner persona anchor injected every turn. Survives `/compact`.

### Verify

```bash
goose-help                    # prints all the workflow commands
goose-explore                 # launches the LOW-tier explore recipe
goose-brainstorm              # launches the HIGH-tier brainstorming recipe
```

Inside the interactive session, type `/skills` — you should see ~50 skills listed. Ask *"who are you?"* — if MOIM is enabled, the Practitioner persona answers.

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

## Recommended Use

For day-to-day guidance on the recommended human-in-the-loop workflow, the
experimental full-cycle recipe, and direct specialty recipes, see
[`docs/RECOMMENDED-USE.md`](docs/RECOMMENDED-USE.md).

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

The team's current default is Goose's native ChatGPT Codex provider with OAuth.
Now that Serena and Vestige are routed through `ima-mcp-gateway`, this path gives
us the best mix of MCP reliability and working sub-recipes.

**Recommended default — ChatGPT Codex OAuth:**

```yaml
# ~/.config/goose/config.yaml
GOOSE_THINKING_EFFORT: high
active_provider: chatgpt_codex
providers:
  chatgpt_codex:
    enabled: true
    model: gpt-5.5
    configured: true
  codex-acp:
    enabled: true
    model: gpt-5.5/high
    configured: true
```

Use `codex-acp` as the recommended fallback when the native ChatGPT Codex
provider is unavailable. `codex-acp` still has ACP rough edges, but it is a
better team fallback than `claude-acp` because Claude ACP is now metered/API
billing rather than subscription-backed usage.

Provider effort handling differs by path:

- `chatgpt_codex` uses the bare model name (`gpt-5.5`) and reads effort from
  `GOOSE_THINKING_EFFORT`. Do **not** configure `gpt-5.5/low`,
  `gpt-5.5/medium`, or `gpt-5.5/high` for `chatgpt_codex`.
- `codex-acp` does **not** read `GOOSE_THINKING_EFFORT`; effort must be part of
  the model name, such as `gpt-5.5/high`.
- `claude-acp` is no longer recommended for the team default because of metered
  billing. Use it only when you intentionally want that provider and understand
  the cost model.

**Other valid provider examples:**

```yaml
# Codex ACP fallback
GOOSE_PROVIDER: "codex-acp"
GOOSE_MODEL: "gpt-5.5/high"

# Claude ACP, explicit opt-in only
GOOSE_PROVIDER: "claude-acp"
GOOSE_MODEL: "sonnet"

# Direct Anthropic API
GOOSE_PROVIDER: "anthropic"
GOOSE_MODEL: "claude-sonnet-4-6"

# OpenRouter (multi-provider routing)
GOOSE_PROVIDER: "openrouter"
GOOSE_MODEL: "anthropic/claude-sonnet-4-6"

# RunPod or another self-hosted OpenAI-compatible endpoint
GOOSE_PROVIDER: "openai"
OPENAI_HOST: "https://api.runpod.ai/v2/<endpoint-id>"
OPENAI_API_KEY: "<your-runpod-key>"
GOOSE_MODEL: "your-deployed-model"

# Local OpenAI-compatible server, such as Ollama or llama.cpp
GOOSE_PROVIDER: "openai"
OPENAI_HOST: "http://localhost:11434/v1"
OPENAI_API_KEY: "ollama"
GOOSE_MODEL: "qwen3-coder:latest"
```

Recipes declare `HIGH`, `MID`, or `LOW` by rendering the whole per-tier profile
settings block. The installer writes only provider-supported recipe settings at
deploy time, and shell aliases set `GOOSE_THINKING_EFFORT` for `chatgpt_codex`.
Switch profiles any time:

```bash
node scripts/install.ts                       # default chatgpt_codex OAuth path → gpt-5.5 + GOOSE_THINKING_EFFORT
node scripts/install.ts --profile openai        # codex-acp fallback → gpt-5.5/<effort>
node scripts/install.ts --profile hybrid        # HIGH→codex-acp, MID/LOW→claude-acp
node scripts/install.ts --profile anthropic     # direct Anthropic API model IDs
node scripts/install.ts --profile claude-acp    # explicit Claude ACP opt-in
```

See [`docs/MODEL-TIERS.md`](docs/MODEL-TIERS.md) for the per-tier mapping
rationale and per-recipe overrides. After changing profile thinking
effort/runtime env, copy or merge `.goose-aliases.example` to `~/.goose-aliases`
so command wrappers stay in sync.

### 2. Install Rendered Recipes

This repository is the source package. Goose consumes the rendered files written
by the installer, not the `.yaml.eta` source templates directly.

```bash
node scripts/install.ts --validate
```

To validate rendered recipes without changing your installed Goose recipe set,
render to a temporary destination:

```bash
tmpdir=$(mktemp -d)
node scripts/install.ts --dest "$tmpdir" --profile chatgpt_codex --validate
goose recipe validate "$tmpdir/vision-handoff.yaml"
```

### 3. Enable Required Extensions

```bash
goose configure
# Toggle Extensions → enable the extensions from config-template.yaml
```

This repo assumes **ima-mcp-gateway 0.3.0 or newer** is installed for stable CLI
access to MCPs that cannot safely use Goose's typed SDK path. Install it from
[`ima-mcp-gateway`](https://gitea.theflccc.org/IMA/ima-mcp-gateway.git). The
gateway's local installer copies runtime files to
`~/.local/share/ima-mcp-gateway` and writes the stable launcher to
`~/.local/bin/ima-mcp`; prefer this over `npm link` because Goose environments
may not load npm-managed bin paths reliably. For durable Qdrant-backed
knowledge, use IMA's custom RAG/MCP server from
[`ima-rag`](https://gitea.theflccc.org/IMA/ima-rag):

```bash
git clone https://gitea.theflccc.org/IMA/ima-mcp-gateway.git ~/IMA/dev/ima-mcp-gateway
cd ~/IMA/dev/ima-mcp-gateway

# Use sfw when available; otherwise use npm directly.
sfw npm install
sfw npm run build
sfw npm test
sfw npm run install:local

# If sfw is unavailable:
npm install
npm run build
npm test
npm run install:local

# Ensure ~/.local/bin is on PATH, then verify:
command -v ima-mcp
ima-mcp --version    # must be 0.3.0 or newer for expanded Serena commands
ima-mcp --help
ima-mcp doctor --project . --json
ima-mcp mcp check --project . --json
ima-mcp serena project status --project . --json
ima-mcp vestige status --json
ima-mcp qdrant status --json
```

Required MCPs / gateways for the primary IMA workflows:

| Capability | Required tool | Why it is required |
|---|---|---|
| Skill loading | `summon` extension | Loads `skills/*/SKILL.md` on demand; recipes rely on skill bodies for MCP usage and domain rules. |
| Project memory + code navigation | `mcp-serena` skill, Serena MCP, and `ima-mcp serena` | Every primary workflow starts with Serena project-memory bootstrap. Use `ima-mcp serena` for activation, initial instructions, and memories. |
| Working memory + preferences | `mcp-vestige` skill, Vestige MCP, and `ima-mcp vestige` | Primary workflows load user preferences and task lifecycle memory from Vestige. Use `ima-mcp vestige`; never use `execute_typescript` / `Vestige.*`. |
| Queue/status lifecycle | `mcp-taskwarrior` skill and local `task` CLI | `goose-cycle` uses Taskwarrior as the queue/status source for story phases. |

Top recommended MCP-backed services:

- **ima-mcp-gateway** 0.3.0+ provides the supported CLI path for Serena, Vestige,
  and Qdrant operations. Recipes and skills use `ima-mcp serena`,
  `ima-mcp vestige`, and `ima-mcp qdrant`; do not add removed direct
  `serena`, `vestige`, or `qdrant-memory` extension blocks back to
  `config-template.yaml` for the primary workflow.
- **Serena** ([`oraios/serena`](https://github.com/oraios/serena)) provides
  project memory and optional JetBrains-backed code navigation. Install `uvx`;
  for JetBrains navigation, install the Serena MCP JetBrains plugin and keep the
  project open in the IDE. Access Serena through `ima-mcp serena`.
- **Vestige** ([`samvallad33/vestige`](https://github.com/samvallad33/vestige))
  provides working memory, preferences, decisions, and task lifecycle
  continuity. Install its MCP server so `vestige-mcp` is on `PATH`, then access
  it through `ima-mcp vestige`.
- **Qdrant** ([`qdrant/qdrant`](https://github.com/qdrant/qdrant)) provides the
  vector database behind durable semantic knowledge. Run Qdrant locally (default
  `http://localhost:6333`) and install a compatible MCP/RAG command such as
  IMA's [`ima-rag`](https://gitea.theflccc.org/IMA/ima-rag), then access it
  through `ima-mcp qdrant`.

Most other recommended MCPs are installed directly by Goose through `npx`,
`uvx`, or remote endpoints; see [`config-template.yaml`](config-template.yaml)
for copyable examples that remain direct Goose extensions.

For `mcp-atlassian` REST helper scripts and workflow automation to fully work, set these environment variables in your shell or secrets manager before starting Goose:

```bash
export ATLASSIAN_DOMAIN="your-site.atlassian.net"
export ATLASSIAN_CLOUD_ID="your-cloud-id"
export ATLASSIAN_BEARER_TOKEN="your-api-token"
export ATLASSIAN_EMAIL="you@example.com"
export ATLASSIAN_API_TOKEN="$ATLASSIAN_BEARER_TOKEN"
```

`ATLASSIAN_API_TOKEN` and `ATLASSIAN_BEARER_TOKEN` are the same token value. Do not commit real Atlassian values to `config-template.yaml`; keep the template placeholder-only.

Recommended MCPs for a fully capable development session:

| Capability | Recommended MCP / skill | Typical use |
|---|---|---|
| Durable reference library | `mcp-qdrant` skill, Qdrant, `ima-rag`, and `ima-mcp qdrant` | Long-lived architecture docs, standards, PRDs, research, and reusable patterns. |
| Library/API docs | `mcp-context7` | Current package docs before guessing APIs. |
| Web/content fetch | `mcp-fetch` | Fetch specific URLs and source material. |
| Web research | `mcp-tavily` | Current web research, when external sources are part of the task. |
| Browser inspection | `mcp-chrome-devtools` | UI debugging, DOM snapshots, console/network checks, Lighthouse-style audits. |
| Structured reasoning | `mcp-sequential-thinking` | Complex planning/review reasoning when the recipe calls for it. |
| Jira/Confluence | `mcp-atlassian` / `atlassian-rovo` | Jira issue context, Confluence pages, and approved workflow comments. |

Recipes that declare `sub_recipes` need an explicit rendered `extensions:`
block because Goose auto-injects `summon`, and any explicit extension block
limits the session to only listed extensions. The installer reads enabled
extensions from `~/.config/goose/config.yaml` and renders those into the
installed recipe files, so each developer keeps their own machine's extension
set. After changing enabled Goose extensions, rerun `node scripts/install.ts`.
MCP tools can be called directly through Goose's normal tool interface. In
Goose API/typed-SDK harnesses, some supported MCP tools are also available as
TypeScript namespace wrappers documented in
[`docs/MCP-GOOSE-SDK-SIGNATURES.md`](docs/MCP-GOOSE-SDK-SIGNATURES.md) and the
`skills/mcp-*` guides. Serena bootstrap and all Vestige operations are explicit
exceptions: use `ima-mcp serena` and `ima-mcp vestige` instead of the typed SDK.
Do not invent wrappers that are not exposed by the SDK.

### 4. Install Skills

```bash
node scripts/install.ts
```

Renders recipe templates from `recipes/**/*.yaml.eta` into
`~/.config/goose/recipes/*.yaml`, then copies all 50 skills from `skills/` to
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

**Cross-platform:** The same SKILL.md format works in Claude Code (via the Summon extension) and Goose. Write a skill once, use it in both. MCP skills document the reliable interface for each tool, including CLI-gateway exceptions such as Serena bootstrap and Vestige memory; see [`docs/MCP-GOOSE-SDK-SIGNATURES.md`](docs/MCP-GOOSE-SDK-SIGNATURES.md).

**Slash commands:** `/skills` lists available skills. `/prompts` and `/prompt <n>` exist for prompt templates.

### Serena Project Memories

Serena-enabled recipes bootstrap standardized project memories before acting:
`core`, `conventions`, `tech_stack`, `suggested_commands`, and
`task_completion`. Treat `.goosehints`, `CLAUDE.md`, and `AGENTS.md` as source
files for migration, not as guaranteed runtime context. The `mcp-serena` skill
includes a helper script that converts those files into reviewable Serena
memory blocks.

In Serena-enabled recipes, Serena bootstrap is the first workstream at session
start. Always activate the Serena project first with the current project path or
registered project name before calling initial instructions or memory tools;
without activation, memory calls can return `No active project`. Do this before
greeting, Taskwarrior, Jira, Vestige, Qdrant, repository search,
file discovery, browser inspection, or asking for local paths/config. Loading
the `mcp-serena` skill first is allowed only as bootstrap support when an agent
needs Serena tool guidance or Goose SDK signatures; it is not task-specific
research.

Use the `mcp-serena` skill's `ima-mcp serena` gateway for bootstrap. Do **not**
use a built-in Goose extension, native/direct Serena memory wrappers, or the
Goose typed SDK / `execute_typescript` path for activation, initial
instructions, or memory reads; generated SDK definitions can fail before Serena
runs.

```bash
project="${PWD}"
command -v ima-mcp
ima-mcp serena project activate "$project" --json
ima-mcp serena instructions --project "$project" --json
ima-mcp serena memory list --project "$project" --json
ima-mcp serena memory read core --project "$project" --json
```

If `ima-mcp` is missing or Serena reports unavailable, stop and report the
blocker instead of falling back to SDK/native Serena bootstrap calls.

For task-scoped work, seed the org standards so Serena tells recipes how to use
Vestige as the living task memory:

```bash
python3 skills/mcp-serena/scripts/migrate-context-to-serena.py --root . --include-org-standards
```

Serena holds the stable startup instructions; Vestige carries each task's
plan, implementation updates, review findings, resolutions, and final closeout
under the task key.

Inside any interactive Goose session, run `/serena-bootstrap` (or the alias
`/bootstrap-serena`) to reload the standard Serena project memories on demand.
Recipes that run Serena/Vestige bootstrap render enabled extensions so direct
recipe sessions and delegated slash-command sessions keep the developer shell
tool required for `ima-mcp`.
Run `/preflight` to perform a
read-only Goose/MCP configuration canary; see [`docs/PREFLIGHT-CHECK.md`](docs/PREFLIGHT-CHECK.md).

Use `/vestige-bootstrap` (or `/bootstrap-vestige`) to load user preferences from
Vestige on demand. The tested read-only command is:

```bash
ima-mcp vestige search "preferences" --json
```

Use `/serena-memorize <note>` to add stable project context to the appropriate
standard Serena memory:

```text
/serena-memorize Our Claude Code design exists at ./claude-design and should be referenced when implementing app feature tasks.
```

### Installed Skills (50 total)

**FP languages (5):** `functional-programmer`, `js-fp`, `php-fp`, `py-fp`, `ruby-fp`

**FP framework variants (6):** `js-fp-api`, `js-fp-react`, `js-fp-vue`, `js-fp-wordpress`, `php-fp-wordpress`, `rails`

**WordPress / IMA framework (6):** `ima-bootstrap`, `ima-forms-expert`, `jquery`, `livecanvas`, `wp-ddev`, `wp-local`

**Editorial / brand (5):** `ima-brand`, `ima-copywriting`, `ima-editorial-scorecard`, `ima-editorial-workflow`, `ima-email-creator`

**Research (2):** `ima-researcher`, `patristic-researcher`

**Workflow / git / arch (5):** `ima-git`, `architect`, `goose-preflight`, `gh-cli`, `tea-gitea`

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
| `cycle-start` | Normalize Taskwarrior + Vestige lifecycle context before a goose-cycle run | MID |
| `cycle-close` | Final operational goose-cycle closure after human approval | MID |
| `wp-developer` | WordPress with security + Bootstrap + FP | MID |
| `ui-ux-designer` | Browser-based UI/UX review with Chrome DevTools, responsive checks, accessibility basics, and Bootstrap/IMA CSS guidance | HIGH |
| `design-to-code` | Translate approved designs/screenshots into implementation prompts or code pipeline | HIGH |
| `investigate` | Sherlock-style, evidence-led troubleshooting and non-mutating root-cause investigation | HIGH |
| `instructor` | Context-aware read-only mentor that researches enough evidence to explain what the human should do next and why | HIGH |
| `vision-handoff` | Read-only GPT-5.5 image analysis hand-off via `codex-acp` for screenshots, mockups, visual diffs, diagrams, scanned docs, and image attachments | Pinned |
| `explore` | Fast read-only codebase exploration, sub-recipe oriented | LOW |
| `test-writer` | TDD, test creation, debugging failures | MID |
| `/architect` | Current-session architecture lens and technology selection command | Current session |
| `software-development-cycle` | Flattened umbrella for brainstorm, plan, story implementation, tests, review, document/learn | HIGH |
| `document-learn` | Terminal closeout recipe for docs and memory updates from completed artifacts | MID |
| `task-planner` | Decomposition — Epic → Story → Task hierarchy for HITL planning, with optional approved persistence to exactly one PM system | HIGH |
| `/prompt-starter` | Current-session prompt builder for dedicated recipe sessions | Current session |
| `/preflight` | Read-only Goose/MCP configuration canary and readiness report | LOW |
| `patristic-researcher` | Early Church research through Augustine using the Qdrant theology corpus and primary-source verification | HIGH |
| `ima-researcher` | Evidence-driven IMA medical research using the future `ima-research` corpus and current primary-source verification | HIGH |

### Sub-Recipe Wiring

`software-development-cycle` delegates to: `brainstorm`, `plan_feature` (plan), `decompose` (task-planner), `explore`, `vision_handoff`, `implement`, `wp_implement` (wp-developer), `write_tests` (test-writer), `code_review` (code-review), `document_learn` (document-learn). It owns the full phase graph directly and does not call `task-master`.

`implement` and `wp-developer` delegate to: `write_tests`, `code_review`.

`code-review` delegates to: `verify` (review-verify), `scorecard` when the user requests project/PR scoring, and `vision_handoff` when review evidence includes images or visual artifacts.

`instructor` delegates to: `vision_handoff` for screenshots/diagrams/visual sources and `explore` for bounded read-only codebase discovery. It does not delegate to implementation, testing, review, or documentation recipes.

`adversarial-review` delegates to: `claude_opus_adversary` (adversarial-review-claude), `gpt55_adversary` (adversarial-review-openai). These child recipes are pinned directly to `anthropic`/`claude-opus-4-7` and `codex-acp`/`gpt-5.5/high`, independent of installer profile tier rendering.

Non-implementation helper recipes: `task-planner`, `investigate`, `instructor`, `explore`, `ui-ux-designer`, `goose-ship-it`, `scorecard`, `ima-researcher`, `patristic-researcher`, `adversarial-review-claude`, `adversarial-review-openai`. `task-planner` may write only approved hierarchy persistence to exactly one PM system (Jira or Taskwarrior) after preview approval; `instructor` may save teaching notes only after explicit approval; the others remain terminal/read-only unless their recipe says otherwise.

Cycle helper terminals: `cycle-start`, `cycle-close`.

Current-session commands: `/architect`, `/prompt-starter`, `/serena-bootstrap` (`/bootstrap-serena` alias), `/vestige-bootstrap` (`/bootstrap-vestige` alias), `/serena-memorize`.

**Requirements and story delivery chains.** The recommended HITL workflow has two paths. For product requirements, use `brainstorm` → `task-planner` → `document-learn` to turn a concept or PRD draft into epics, stories, and requirements-level tasks. After the hierarchy is reviewed, `task-planner` can optionally persist it to exactly one PM source of truth: Jira or Taskwarrior, never both. Story-level PM items are the default lifecycle units; lower-level tasks are embedded in Story descriptions, checklists, annotations, or acceptance criteria unless explicitly promoted. For each approved story, use `plan` → `implement` → `test-writer` → `code-review` → `document-learn` to move from implementation plan to reviewed closeout. Use localized `task-planner` inside a story only when that story is unusually large.

**Software development cycle.** `goose-cycle` is a local Node 24 helper installed to `~/.local/bin` by `scripts/install.ts`. It discovers Taskwarrior tasks, runs the existing top-level recipes as separate Goose sessions, uses Vestige as the lifecycle thread, and stops after `document-learn` for final human review before `goose-cycle close`. The older `software-development-cycle` umbrella recipe remains available through `goose-cycle-umbrella` for explicit orchestration experiments.

**Mentoring side path.** `goose-instructor [source]` starts the HIGH-tier `instructor` recipe when the human wants guidance instead of an agent doing the work. It researches read-only evidence, explains what to do next and why, labels risks, and offers deeper help. It is not wired into `goose-cycle` and is not a routine per-story phase.

### P3 — Specialized

| Recipe | Description |
|--------|-------------|
| `task-planner` | Epic > Story > Task decomposition with Story-level lifecycle persistence and lower-level checklist tasks by default |
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
`chatgpt_codex` is the default profile for Goose's native ChatGPT Codex provider. Use `openai` only as the codex-acp fallback. For `chatgpt_codex`, aliases scope `GOOSE_THINKING_EFFORT` per command. See [`docs/MODEL-TIERS.md`](docs/MODEL-TIERS.md).

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


## Vision Hand-Off

`chatgpt_codex` currently cannot pass images to GPT-5.5 vision. Parent workflows therefore delegate image interpretation to `vision_handoff`, a read-only recipe pinned to `codex-acp` / `gpt-5.5/medium`. Use it for screenshots, mockups, browser captures, visual diffs, diagrams, scanned forms, Jira image attachments, and image URLs. Parents consume the structured visual evidence instead of interpreting image context directly.
