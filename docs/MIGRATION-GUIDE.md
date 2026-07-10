# ima-claude to ima-goose Migration Guide

This guide reflects the current Goose workflow after deprecating the old
`task-master` / `task-runner` pattern and moving to provider-neutral
`HIGH` / `MID` / `LOW` recipe profiles.

## Big Picture

| Concern | Claude Code / ima-claude | Goose / ima-goose |
|---|---|---|
| Domain knowledge | Skills | Skills installed to `~/.agents/skills/` and loaded by Summon |
| Dedicated workflows | Skills plus agent spawning | Recipes |
| In-session helpers | Skills | Slash-command recipes such as `/architect` and `/prompt-starter` |
| Project context | `CLAUDE.md`, `.goosehints`, memories | Serena standard memories plus optional Vestige/Qdrant |
| Model selection | Agent model names | Recipe tiers rendered from `profiles/*.yaml` |
| Delegation | Claude agent spawning | Goose `sub_recipes:` with self-contained briefs |

The current framing is:

- Skills stay skills.
- Full workflows are recipes.
- Lightweight in-session helpers are slash commands.
- Sub-recipes are explicit child sessions, not inherited context.

## Setup

Install the default provider path:

```bash
npm install -g @zed-industries/codex-acp
```

Configure Goose:

```yaml
GOOSE_PROVIDER: "codex-acp"
GOOSE_MODEL: "gpt-5.5/medium"
GOOSE_PLANNER_PROVIDER: "codex-acp"
GOOSE_PLANNER_MODEL: "gpt-5.5/high"
```

Render recipes and install skills:

```bash
node scripts/install.ts --validate
```

`chatgpt_codex` is the default installer profile. It renders:

- HIGH -> `chatgpt_codex` / `gpt-5.5` with `GOOSE_THINKING_EFFORT=high` in aliases
- MID -> `chatgpt_codex` / `gpt-5.5` with `GOOSE_THINKING_EFFORT=medium` in aliases
- LOW -> `chatgpt_codex` / `gpt-5.5` with `GOOSE_THINKING_EFFORT=low` in aliases

The opt-in GPT-5.6 profile maps HIGH to Sol/high, MID to Terra/high, and
LOW to Terra/medium:

```bash
node scripts/install.ts --profile chatgpt_codex_56
```

Other profiles are available:

```bash
node scripts/install.ts --profile openai
node scripts/install.ts --profile hybrid
node scripts/install.ts --profile anthropic
node scripts/install.ts --profile claude-acp
node scripts/install.ts --profile sakana
```

See `docs/MODEL-TIERS.md`. Because the native `chatgpt_codex` and
`chatgpt_codex_56` profiles use alias-scoped effort, copy or merge
`.goose-aliases.example` to `~/.goose-aliases`, then switch with
`goose-profile <name>` so alias-scoped `GOOSE_THINKING_EFFORT` stays current.
Direct installer calls print the equivalent exports.

## Workflow Translation

| Old ima-claude pattern | Current ima-goose pattern |
|---|---|
| `/ima-claude:prompt-starter` | `/prompt-starter` inside the current session |
| `/ima-claude:architect` | `/architect` inside the current session |
| `task-master` auto-breaks and executes | `brainstorm` -> `plan` -> `task-planner`, then explicit implementation session |
| `task-runner` executes tasks | `implement`, `wp-developer`, or `js-developer` |
| Explorer agent on cheap model | `explore` sub-recipe on LOW |
| Reviewer plus critical re-checks | `code-review` plus `review-verify` on HIGH |
| Codebase/PR scorecard skill | `scorecard` recipe, or `code-review` scorecard mode |
| Screenshot/design implementation skill | `design-to-code` dedicated HIGH-tier recipe |

## Current Primary Flow

```bash
goose run --recipe brainstorm --interactive
goose run --recipe plan --interactive
goose run --recipe task-planner --interactive
goose run --recipe wp-developer --interactive
goose run --recipe test-writer --interactive
goose run --recipe code-review --interactive
goose run --recipe scorecard --interactive
goose run --recipe document-learn --interactive
```

Or use the umbrella:

```bash
goose run --recipe software-development-cycle --interactive
```

## Slash Commands

The following recipes are intended as commands inside an existing session:

- `/architect` loads the architecture/persona lens.
- `/prompt-starter` creates a prompt for a dedicated recipe session.
- `/serena-bootstrap` (`/bootstrap-serena` alias) reloads standard Serena project memories.
- `/vestige-bootstrap` (`/bootstrap-vestige` alias) loads user preferences from Vestige using `ima-mcp vestige search "preferences" --json`.
- `/serena-memorize <note>` updates standardized Serena project memory.

They do not pin provider/model. Recipes that declare `sub_recipes` render
enabled extensions from the local Goose config at install time because Goose
auto-injects `summon`, and an explicit `extensions:` block limits the session
to the listed extensions.

## Sub-Recipes

Active sub-recipe parents:

| Parent | Children |
|---|---|
| `software-development-cycle` | brainstorm, plan, task-planner, explore, implement, wp-developer, test-writer, code-review, document-learn |
| `brainstorm` / `plan` | explore |
| `implement` / `wp-developer` / `js-developer` | test-writer, code-review |
| `code-review` | review-verify, scorecard |
| `design-to-code` | explore, wp-developer, test-writer, code-review |
| `adversarial-review` | adversarial-review-claude, adversarial-review-openai |

Every child brief must be self-contained. Do not depend on hidden parent
conversation state.

## Memory Migration

Use Serena standard memories for stable project context:

- `core`
- `conventions`
- `tech_stack`
- `suggested_commands`
- `task_completion`
- `memory_maintenance`

Use `/serena-bootstrap` (or `/bootstrap-serena`) to reload them in a current session. Serena bootstrap
always activates the current project first, before initial instructions or
memory calls. Use `/serena-memorize <note>` for stable project context updates.

Vestige remains the living task/decision memory. Qdrant remains the durable
reference corpus for standards, PRDs, research, and architecture material.

## Ported Skills

The Goose skill bundle includes the selected late migration skills from
`ima-claude`: `espocrm-api`, `discourse-admin`, and `ember-discourse`.
`quasar-fp`, `docs-organize`, and `jira-checkpoint` remain intentionally
unmigrated for now.
