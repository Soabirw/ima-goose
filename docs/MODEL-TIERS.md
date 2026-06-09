# Model Tiers — Provider-Agnostic Recipe Pinning

**Status:** working hypothesis as of 2026-05-14. Adjust after bake-off and ongoing monitoring.

Recipes pin a **tier** (`opus` / `sonnet` / `haiku`) rather than a concrete model ID. The installer rewrites these to provider-specific IDs at deploy time based on the selected `--profile`. See `profiles/` at the repo root and `scripts/install.ts` for the mechanism.

## Why tier abstraction

A single recipe should run identically against Anthropic, OpenAI via codex-acp, or any future provider. Hard-coding `claude-opus-4-7` or `gpt-5.5/high` in every recipe means re-editing every recipe file when we change providers. Tier names are stable; provider IDs aren't.

`opus` / `sonnet` / `haiku` are Anthropic-flavored shorthand but serve as our internal tier vocabulary. Revisit naming when a third provider lands.

## Tier definitions

| Tier | Role | Use cases |
|---|---|---|
| `opus` | Flagship reasoning. Burns rationed message budget. | Orchestration, code review, architecture, planning, brainstorming. |
| `sonnet` | Implementation workhorse. Generous budget. | Coding, test writing, sub-recipe execution, verification passes. |
| `haiku` | Fast/cheap. Effectively unlimited. | Exploration, lookups, low-stakes scans. |

## Provider mappings

### Anthropic (direct API)

| Tier | Model |
|---|---|
| opus | `claude-opus-4-7` |
| sonnet | `claude-sonnet-4-6` |
| haiku | `claude-haiku-4-5` |

### OpenAI via codex-acp (ChatGPT Pro/Max subscription auth)

| Tier | Model | Rationale |
|---|---|---|
| opus | `gpt-5.5/high` | GPT-5.5 with high reasoning effort for orchestration, review, and planning. |
| sonnet | `gpt-5.5/medium` | GPT-5.5 with the default everyday reasoning balance for implementation and verification. |
| haiku | `gpt-5.5/low` | GPT-5.5 with lighter reasoning for fast exploration and low-stakes scans. |

### Hybrid codex-acp + claude-acp

Use this when you want GPT-5.5 only for complex Opus-tier recipes and Claude
subscription models for lower tiers.

| Tier | Provider | Model |
|---|---|---|
| opus | `codex-acp` | `gpt-5.5/high` |
| sonnet | `claude-acp` | `sonnet` |
| haiku | `claude-acp` | `haiku` |

### claude-acp (current default, identity mapping)

Friendly shortnames (`opus`, `sonnet`, `haiku`) are resolved by the claude-acp provider itself. No rewrite needed.

## Per-recipe overrides

OpenAI tiering is expressed through `codex-acp` model IDs with reasoning effort
suffixes (`gpt-5.5/low`, `gpt-5.5/medium`, `gpt-5.5/high`). There are no
per-recipe demotions in the OpenAI profile at this point.

Adjust `profiles/openai.yaml` `overrides:` block only if a recipe needs to break
from the tier mapping. The hybrid profile also keeps Opus-tier recipes on
GPT-5.5 high reasoning.

## Models considered but not used

- **`gpt-5.4` / `gpt-5.4-mini`** — strong alternatives, but not used while `codex-acp` can express lower tiers as GPT-5.5 reasoning effort.
- **`gpt-5.3-codex-spark`** — Cerebras-served, 1,000+ tok/s, but SWE-Bench Pro drops to ~56% and reasoning state collapses after 6–8 steps. Pro $200 exclusive. Skip for recipes that orchestrate 12+ step plans. Revisit if we add a one-shot "quickfix" recipe.
- **`gpt-5.2`** — superseded by 5.3/5.4/5.5. Available in the codex-acp menu but no current use case.

## Recipe-to-model resolution

### Under `--profile openai`

| Recipe | Tier (source) | Resolves to |
|---|---|---|
| `architect` | opus | `gpt-5.5/high` |
| `brainstorm` | opus | `gpt-5.5/high` |
| `code-review` | opus | `gpt-5.5/high` |
| `ima-researcher` | opus | `gpt-5.5/high` |
| `patristic-researcher` | opus | `gpt-5.5/high` |
| `plan` | opus | `gpt-5.5/high` |
| `prompt-starter` | opus | `gpt-5.5/high` |
| `software-development-cycle` | opus | `gpt-5.5/high` |
| `task-master` | opus | `gpt-5.5/high` |
| `task-planner` | opus | `gpt-5.5/high` |
| `ui-ux-designer` | opus | `gpt-5.5/high` |
| `adversarial-review` | opus | `gpt-5.5/high` |
| `adversarial-review-claude` | explicit | `claude-acp` / `opus` |
| `adversarial-review-openai` | explicit | `codex-acp` / `gpt-5.5/high` |
| `document-learn` | sonnet | `gpt-5.5/medium` |
| `goose-ship-it` | sonnet | `gpt-5.5/medium` |
| `implement` | sonnet | `gpt-5.5/medium` |
| `js-developer` | sonnet | `gpt-5.5/medium` |
| `review-verify` | sonnet | `gpt-5.5/medium` |
| `task-runner` | sonnet | `gpt-5.5/medium` |
| `test-writer` | sonnet | `gpt-5.5/medium` |
| `wp-developer` | sonnet | `gpt-5.5/medium` |
| `explore` | haiku | `gpt-5.5/low` |

### Under `--profile hybrid`

| Recipe | Tier (source) | Resolves to |
|---|---|---|
| `architect` | opus | `codex-acp` / `gpt-5.5/high` |
| `brainstorm` | opus | `codex-acp` / `gpt-5.5/high` |
| `code-review` | opus | `codex-acp` / `gpt-5.5/high` |
| `ima-researcher` | opus | `codex-acp` / `gpt-5.5/high` |
| `patristic-researcher` | opus | `codex-acp` / `gpt-5.5/high` |
| `plan` | opus | `codex-acp` / `gpt-5.5/high` |
| `prompt-starter` | opus | `codex-acp` / `gpt-5.5/high` |
| `software-development-cycle` | opus | `codex-acp` / `gpt-5.5/high` |
| `task-master` | opus | `codex-acp` / `gpt-5.5/high` |
| `task-planner` | opus | `codex-acp` / `gpt-5.5/high` |
| `adversarial-review` | opus | `codex-acp` / `gpt-5.5/high` |
| `adversarial-review-claude` | explicit | `claude-acp` / `opus` |
| `adversarial-review-openai` | explicit | `codex-acp` / `gpt-5.5/high` |
| `document-learn` | sonnet | `claude-acp` / `sonnet` |
| `implement` | sonnet | `claude-acp` / `sonnet` |
| `js-developer` | sonnet | `claude-acp` / `sonnet` |
| `review-verify` | sonnet | `claude-acp` / `sonnet` |
| `task-runner` | sonnet | `claude-acp` / `sonnet` |
| `test-writer` | sonnet | `claude-acp` / `sonnet` |
| `ui-ux-designer` | sonnet | `claude-acp` / `sonnet` |
| `wp-developer` | sonnet | `claude-acp` / `sonnet` |
| `explore` | haiku | `claude-acp` / `haiku` |

## How to switch profiles

```bash
node ~/IMA/dev/ima-goose/scripts/install.ts --profile openai
node ~/IMA/dev/ima-goose/scripts/install.ts --profile hybrid
# or
goose-profile openai     # shell helper from .goose-aliases.example
```

The installer renders each `recipes/**/*.yaml.eta` source template to
`~/.config/goose/recipes/*.yaml` and rewrites `settings.goose_model` during that
render/install step. Deployed recipes carry concrete model IDs; source templates
stay portable.

Profiles can also set per-tier `settings.goose_provider` values. The hybrid
profile uses that to deploy Opus recipes with `codex-acp` and lower-tier recipes
with `claude-acp`.

The adversarial child recipes intentionally bypass tier rewriting by pinning
concrete providers and models in source: Claude Opus uses `claude-acp` / `opus`,
and GPT-5.5 uses `codex-acp` / `gpt-5.5/high`. This keeps dual-model review intact
under every installer profile.

Switching providers also requires updating `~/.config/goose/config.yaml` `GOOSE_PROVIDER` and auth env vars. See `config-template.yaml`.

## Open questions to revisit

1. **GPT-5.5 effort budget under orchestration load.** Bake-off will show whether Opus-tier `high` is appropriate for every orchestration recipe.
2. **Tier renaming.** If a third provider lands, consider renaming `opus/sonnet/haiku` to provider-neutral `flagship/standard/fast`. Cost: 16 recipe files + docs.
3. **Express tier.** Whether to add a fourth tier for `gpt-5.3-codex-spark` / a hypothetical Anthropic ultra-fast model. Defer until a recipe genuinely needs it.
