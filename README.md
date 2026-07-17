# ima-goose

IMA's Goose workflow kit: recipes, skills, memory conventions, MCP guidance, and
local helpers for practical human-in-the-loop software delivery.

**Current release: v2.7.3**

The goal is simple: keep the human in charge of product judgment while Goose
handles focused planning, implementation, tests, review, and documentation
closeout.

## What's New in v2.7.0

- Added the opt-in `chatgpt_codex_56` profile with Sol/high for HIGH-tier work,
  Terra/high for MID-tier work, and Terra/medium for LOW-tier exploration.
- Kept the GPT-5.5 `chatgpt_codex` profile as the default for comparison and
  rollback.
- Updated `goose-profile` to apply each native profile's tier effort overrides
  in the current shell after rendering recipes.

Switch after installing or refreshing the aliases:

```bash
goose-profile chatgpt_codex_56
```

See [Model Tiers](docs/MODEL-TIERS.md) for the full mapping.

## Quick Start

For a fresh teammate setup:

```bash
git clone https://github.com/Soabirw/ima-goose.git
cd ima-goose
node scripts/install.ts
goose configure
```

In `goose configure`, set up your model provider first. The installer renders
recipes, installs skills, and prints any missing local prerequisites.

_Note: This configures the global `goose` provider. The rendered recipes specify
their own providers based on `./profiles`. You may need to create a custom
profile for your provider._

Then install the shell aliases:

```bash
cp .goose-aliases.example ~/.goose-aliases
echo '[ -f "$HOME/.goose-aliases" ] && source "$HOME/.goose-aliases"' >> ~/.bashrc
source ~/.bashrc
```

Use `~/.zshrc` instead of `~/.bashrc` if you use zsh.

Verify the basics:

```bash
goose --version
goose recipe list | rg 'brainstorm|plan|implement|test-writer|code-review|document-learn'
goose-help
```

For the full setup, including provider profiles, MCPs, skills, API keys, MOIM,
and local IMA tools, start with the [Install Guide](docs/INSTALL.md), then use
the [IMA Goose Full Setup Guide](docs/IMA-GOOSE-FULL-SETUP.md) for detailed
self-hosted setup.

## Recommended Daily Workflow

Use the aliases for normal work. They hide recipe names, parameters, model tier
selection, and interactive flags.

```bash
goose-brainstorm "rough idea"
goose-plan "approved story or acceptance criteria"
goose-implement "approved implementation plan"
goose-test "implementation artifact or story key"
goose-review "PR URL, task key, or diff target"
goose-learn "completed artifact bundle" story
```

The intended flow is:

```text
brainstorm -> plan -> implement -> test -> review -> learn
```

For Taskwarrior/Vestige-backed story queues, `goose-cycle` automates that same
flow as separate Goose sessions:

```bash
goose-cycle start --task-project <taskwarrior-project> --mode autonomous
goose-cycle plan|implement|test|review|learn --task-project <taskwarrior-project> --task <task-key-or-uuid>
goose-cycle next --task-project <taskwarrior-project>
goose-cycle status --task-project <taskwarrior-project> --task <task-key-or-uuid>
goose-cycle close --task-project <taskwarrior-project> --task <task-key-or-uuid> --commit
```

Learn the operating model in the [IMA Dev Cycle with Goose](docs/IMA-DEV-CYCLE.md).
For command-level cycle details, see [Goose Cycle Helper](docs/GOOSE-CYCLE.md).

## What This Repo Installs

`node scripts/install.ts` installs the local workflow surface:

- rendered Goose recipes into `~/.config/goose/recipes/`
- global skills into `~/.agents/skills/`
- the `goose-cycle` shim into `~/.local/bin/`
- profile-specific recipe model settings from `profiles/*.yaml`
- validation warnings for missing environment variables and local tools

It does **not** configure every model provider or external API for you. Use
`goose configure` for the Goose provider, then follow the [Install Guide](docs/INSTALL.md)
for MCP gateways, Atlassian, Tavily, Taskwarrior, Qdrant, Serena, Vestige, and
other IMA tooling.

## Documentation Map

Start here, then go deeper only where needed:

| Need | Read |
|---|---|
| Full installation and local tool setup | [Install Guide](docs/INSTALL.md) |
| Detailed self-hosted setup | [IMA Goose Full Setup Guide](docs/IMA-GOOSE-FULL-SETUP.md) |
| VM/workstation user setup | [IMA Goose Workstation Setup Guide](docs/IMA-GOOSE-WORKSTATION-SETUP.md) |
| Verification checklist | [IMA Goose Verification Checklist](docs/IMA-GOOSE-VERIFICATION.md) |
| Guided IMA Goose help | Use `goose-instructor` with an IMA Goose question; it loads the `ima-goose-guide` skill |
| Recommended workflow and handoff rules | [IMA Dev Cycle with Goose](docs/IMA-DEV-CYCLE.md) |
| Automated Taskwarrior/Vestige story conductor | [Goose Cycle Helper](docs/GOOSE-CYCLE.md) |
| Recipe and skill catalog | [Recipes and Skills Catalog](docs/RECIPES-AND-SKILLS.md) |
| Model/profile tier behavior | [Model Tiers](docs/MODEL-TIERS.md) |
| MCP and skill setup details | [Skills and MCP Setup](docs/SKILLS-AND-MCP-SETUP.md) |
| Subrecipe delegation rules | [Sub-Recipe Delegation](docs/SUB-RECIPE-DELEGATION.md) |
| Preflight checks | [Preflight Check](docs/PREFLIGHT-CHECK.md) |
| Migration notes | [Migration Guide](docs/MIGRATION-GUIDE.md) |

## Core Concepts

### Recipes

Recipes are reusable Goose sessions for a specific phase or specialty:
brainstorming, planning, implementation, test writing, review, document/learn,
research, WordPress work, and more.

Run most recipes through aliases. Use direct recipe execution only when you are
working on the recipe system itself:

```bash
goose run --recipe plan --interactive --params spec="story key or source"
```

### Skills

Skills are Markdown instruction packs loaded by Summon when a task needs domain
knowledge. They teach Goose how to use tools and follow project conventions.
Examples include Serena, Vestige, Qdrant, WordPress, FP JavaScript, branding,
and copywriting skills.

### MCPs and IMA tools

MCP extensions provide tools. Skills teach Goose how to use those tools safely.
For IMA workflows, Serena, Vestige, and Qdrant are accessed through the
`ima-mcp` gateway commands rather than Goose's typed SDK.

### Memory layers

- **Serena**: stable project instructions and code-navigation memory.
- **Vestige**: task lifecycle memory, decisions, preferences, and closeout state.
- **Qdrant**: durable reference material, architecture docs, PRDs, and research.

## Common Commands

```bash
# Install or refresh local recipes/skills/helper scripts
node scripts/install.ts

# Validate rendered recipes without changing the normal install target
node scripts/install.ts --validate

# See available workflow aliases
goose-help

# Start the recommended story workflow manually
goose-plan "story key or acceptance criteria"

# Start the automated story conductor
goose-cycle start --task-project <taskwarrior-project>

# Check changed files before handoff
git status --short
git diff --check
```

## Development Notes

- Recipe sources are Eta templates, usually `*/recipe.yaml.eta`.
- Rendered recipes install as flat files in `~/.config/goose/recipes/`.
- Profile files in `profiles/*.yaml` control provider/model tier rendering.
- Shell aliases may set command-scoped provider environment such as thinking effort.
- Use `rg` for repository search and keep docs brief; link to deeper guides.

## Origin

Created for IMA's FP-first WordPress and product-development workflows. The
practitioner anchor is MOIM: simple over complex, evidence over assumptions,
and slow is smooth, smooth is fast.

## Vision Hand-Off

Any recipe that needs image interpretation should delegate visual evidence to
`vision_handoff` instead of branching by provider vision support.
