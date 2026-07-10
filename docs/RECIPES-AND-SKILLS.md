# Recipes and Skills Catalog

This catalog explains what ships in `ima-goose` without making the README carry
every detail.

## How to Use This Catalog

Prefer aliases for normal work. Use recipe names directly when developing or
troubleshooting the workflow itself:

```bash
goose run --recipe <recipe-name> --interactive
```

List installed recipes with:

```bash
goose recipe list
```

List available skills inside Goose with:

```text
/skills
```

## Recommended User-Facing Aliases

| Alias | Recipe | Use when |
|---|---|---|
| `goose-brainstorm` | `brainstorm` | Shaping a rough idea, PRD, product direction, or large feature. |
| `goose-plan` | `plan` | Producing a detailed technical plan for one story. |
| `goose-implement` | `implement` | Implementing an approved plan. |
| `goose-test` | `test-writer` | Creating, repairing, or validating tests. |
| `goose-review` | `code-review` | Reviewing a PR, diff, task, or lifecycle thread. |
| `goose-learn` | `document-learn` | Updating docs and memory after completed implementation/test/review artifacts. |
| `goose-cycle` | local helper | Automating the story cycle from Taskwarrior and Vestige. |

## Core Recipes

| Recipe | Purpose |
|---|---|
| `brainstorm` | Product discovery, idea shaping, requirements exploration. |
| `task-planner` | Requirements/story hierarchy planning and optional PM persistence after approval. |
| `plan` | Story-level implementation planning. |
| `implement` | General implementation and review-resolution work. |
| `test-writer` | Test creation, test repair, and focused verification. |
| `code-review` | Read-only implementation, security, workflow, or PR review. |
| `document-learn` | Documentation updates, memory routing, and closeout handoff. |
| `cycle-start` | Normalizes Taskwarrior and Vestige context for `goose-cycle`. |
| `cycle-close` | Final operational closeout for `goose-cycle`. |

## Specialist Recipes

| Recipe | Purpose | Tier |
|---|---|---|
| `avada-generate` | Avada/Fusion generation recipe: selected Claude Design pages -> DOM/screenshots/vision context, catalog section mapping, lean/full A/B validation, and optional lean-only emission | HIGH |

Representative specialist recipes include:

- `explore` for focused read-only repository discovery
- `investigate` for deeper troubleshooting without edits
- `instructor` for mentoring and guidance instead of agentic changes
- WordPress/PHP implementation and review recipes
- JavaScript/FP implementation helpers
- UI/UX, SEO, copywriting, research, and brand-focused recipes
- adversarial review recipes for high-friction second opinions

Check the installed recipe list for the exact local set:

```bash
goose recipe list
```

## Skills

Skills are domain guides installed to `~/.agents/skills/`. They do not run by
themselves; Summon loads them when the task matches their frontmatter or when
you ask for them explicitly.

Important skill groups:

- MCP skills: Serena, Vestige, Qdrant, Taskwarrior, Atlassian, Context7,
  Fetch, Tavily
- IMA Goose support: `ima-goose-guide` for IMA Goose setup, configuration,
  operation, workstation/VM support, MCP gateway troubleshooting, installed
  recipe/skill paths, and related ecosystem repos
- development standards: FP JavaScript, WordPress/PHP, security, testing
- product and communication: IMA brand, copywriting, SEO, UX
- workflow support: architecture, git, release, migration, documentation

Normal users should ask IMA Goose support questions through `goose-instructor`,
using IMA Goose keywords such as setup, recipes, skills, MCP, preflight,
goose-cycle, or workstation. Manual skill loading is mainly for sessions that
already support explicit skill loading.

For installation and MCP details, see [`SKILLS-AND-MCP-SETUP.md`](SKILLS-AND-MCP-SETUP.md).

## Memory Responsibilities

| System | Use it for |
|---|---|
| Serena | Stable project instructions, code navigation, project memory. |
| Vestige | Task lifecycle state, decisions, bugs, preferences, review/closeout thread. |
| Qdrant | Durable reference docs, PRDs, architecture material, long-lived research. |

## Adding or Changing Recipes

- Edit source templates such as `*/recipe.yaml.eta`.
- Keep child-session briefs standalone.
- Validate rendered YAML, not only the template.
- Bump a recipe version only when that recipe's behavior, parameters, or
  workflow changes.

Useful checks:

```bash
node scripts/install.ts --validate
goose recipe validate ~/.config/goose/recipes/<recipe>.yaml
git diff --check
```

### Lifecycle persistence

HITL phase recipes use the stable `ima-mcp vestige save` lifecycle types and a shared handoff contract. `scorecard` remains an explicit scoring/health/trend request, not routine review work.
