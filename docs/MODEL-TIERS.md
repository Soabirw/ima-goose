# Model Tiers — Provider-Agnostic Recipe Pinning

**Status:** working hypothesis as of 2026-05-14. Adjust after bake-off and ongoing monitoring.

Recipes pin a **tier** (`opus` / `sonnet` / `haiku`) rather than a concrete model ID. The installer rewrites these to provider-specific IDs at deploy time based on the selected `--profile`. See `profiles/` at the repo root and `scripts/install.ts` for the mechanism.

## Why tier abstraction

A single recipe should run identically against Anthropic, OpenAI via codex-acp, or any future provider. Hard-coding `claude-opus-4-7` or `gpt-5.5` in every recipe means re-editing every recipe file when we change providers. Tier names are stable; provider IDs aren't.

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
| opus | `gpt-5.5` | Flagship general/reasoning (Apr 23, 2026). 1M context. Opus 4.7 equivalent. |
| sonnet | `gpt-5.3-codex` | Agentic coding specialist (Feb 2026). SWE-Bench Pro ~72%. Higher rate-limit ceiling on Pro $200 (600–3,000 msg/5hr) than gpt-5.4. Better fit than gpt-5.4 because our sonnet recipes are all coding workhorses. |
| haiku | `gpt-5.4-mini` | Fast sub-agent tier. 400K context. $0.25/$2.00 per 1M API. Mature function calling. Pro $200 budget: 1,200–7,000 msg/5hr. |

### Hybrid codex-acp + claude-acp

Use this when you want GPT-5.5 only for complex Opus-tier recipes and Claude
subscription models for lower tiers.

| Tier | Provider | Model |
|---|---|---|
| opus | `codex-acp` | `gpt-5.5` |
| sonnet | `claude-acp` | `sonnet` |
| haiku | `claude-acp` | `haiku` |

### claude-acp (current default, identity mapping)

Friendly shortnames (`opus`, `sonnet`, `haiku`) are resolved by the claude-acp provider itself. No rewrite needed.

## Per-recipe overrides

Some recipes fan out heavily and would otherwise burn through the flagship rate-limit budget. The OpenAI profile demotes them from `gpt-5.5` to `gpt-5.4`:

| Recipe | Default tier | OpenAI override | Why |
|---|---|---|---|
| `task-master` | opus | `gpt-5.4` | Orchestrates many sub-recipe calls; protect 5.5 budget. |

Adjust `profiles/openai.yaml` `overrides:` block to tune. The hybrid profile
does not demote `task-master`; Opus-tier recipes intentionally stay on GPT-5.5.

## Models considered but not used

- **`gpt-5.4`** — strong general flagship, but for our sonnet tier `gpt-5.3-codex` outscores it on SWE-Bench Pro and has higher rate-limit ceilings. Used only as an opus override for the heaviest orchestration recipe.
- **`gpt-5.3-codex-spark`** — Cerebras-served, 1,000+ tok/s, but SWE-Bench Pro drops to ~56% and reasoning state collapses after 6–8 steps. Pro $200 exclusive. Skip for recipes that orchestrate 12+ step plans. Revisit if we add a one-shot "quickfix" recipe.
- **`gpt-5.2`** — superseded by 5.3/5.4/5.5. Available in the codex-acp menu but no current use case.

## Recipe-to-model resolution

### Under `--profile openai`

| Recipe | Tier (source) | Resolves to |
|---|---|---|
| `architect` | opus | `gpt-5.5` |
| `brainstorm` | opus | `gpt-5.5` |
| `code-review` | opus | `gpt-5.5` |
| `document-learn` | sonnet | `gpt-5.3-codex` |
| `plan` | opus | `gpt-5.5` |
| `prompt-starter` | opus | `gpt-5.5` |
| `software-development-cycle` | opus | `gpt-5.5` |
| `task-master` | opus | `gpt-5.4` (override) |
| `task-planner` | opus | `gpt-5.5` |
| `adversarial-review` | opus | `gpt-5.5` |
| `adversarial-review-claude` | explicit | `claude-acp` / `opus` |
| `adversarial-review-openai` | explicit | `codex-acp` / `gpt-5.5` |
| `implement` | sonnet | `gpt-5.3-codex` |
| `js-developer` | sonnet | `gpt-5.3-codex` |
| `review-verify` | sonnet | `gpt-5.3-codex` |
| `task-runner` | sonnet | `gpt-5.3-codex` |
| `test-writer` | sonnet | `gpt-5.3-codex` |
| `wp-developer` | sonnet | `gpt-5.3-codex` |
| `explore` | haiku | `gpt-5.4-mini` |

### Under `--profile hybrid`

| Recipe | Tier (source) | Resolves to |
|---|---|---|
| `architect` | opus | `codex-acp` / `gpt-5.5` |
| `brainstorm` | opus | `codex-acp` / `gpt-5.5` |
| `code-review` | opus | `codex-acp` / `gpt-5.5` |
| `ima-researcher` | opus | `codex-acp` / `gpt-5.5` |
| `patristic-researcher` | opus | `codex-acp` / `gpt-5.5` |
| `plan` | opus | `codex-acp` / `gpt-5.5` |
| `prompt-starter` | opus | `codex-acp` / `gpt-5.5` |
| `software-development-cycle` | opus | `codex-acp` / `gpt-5.5` |
| `task-master` | opus | `codex-acp` / `gpt-5.5` |
| `task-planner` | opus | `codex-acp` / `gpt-5.5` |
| `adversarial-review` | opus | `codex-acp` / `gpt-5.5` |
| `adversarial-review-claude` | explicit | `claude-acp` / `opus` |
| `adversarial-review-openai` | explicit | `codex-acp` / `gpt-5.5` |
| `document-learn` | sonnet | `claude-acp` / `sonnet` |
| `implement` | sonnet | `claude-acp` / `sonnet` |
| `js-developer` | sonnet | `claude-acp` / `sonnet` |
| `review-verify` | sonnet | `claude-acp` / `sonnet` |
| `task-runner` | sonnet | `claude-acp` / `sonnet` |
| `test-writer` | sonnet | `claude-acp` / `sonnet` |
| `wp-developer` | sonnet | `claude-acp` / `sonnet` |
| `explore` | haiku | `claude-acp` / `haiku` |

## How to switch profiles

```bash
node ~/IMA/dev/ima-goose/scripts/install.ts --profile openai
node ~/IMA/dev/ima-goose/scripts/install.ts --profile hybrid
# or
goose-profile openai     # shell helper from .goose-aliases.example
```

The installer rewrites `settings.goose_model` in each recipe as it copies to `~/.config/goose/recipes/`. Deployed recipes carry concrete model IDs; the source recipes stay portable.

Profiles can also set per-tier `settings.goose_provider` values. The hybrid
profile uses that to deploy Opus recipes with `codex-acp` and lower-tier recipes
with `claude-acp`.

The adversarial child recipes intentionally bypass tier rewriting by pinning
concrete providers and models in source: Claude Opus uses `claude-acp` / `opus`,
and GPT-5.5 uses `codex-acp` / `gpt-5.5`. This keeps dual-model review intact
under every installer profile.

Switching providers also requires updating `~/.config/goose/config.yaml` `GOOSE_PROVIDER` and auth env vars. See `config-template.yaml`.

## Open questions to revisit

1. **GPT-5.5 budget under orchestration load.** Bake-off will show whether the per-recipe overrides are sufficient or whether more recipes need demotion.
2. **Tier renaming.** If a third provider lands, consider renaming `opus/sonnet/haiku` to provider-neutral `flagship/standard/fast`. Cost: 16 recipe files + docs.
3. **Express tier.** Whether to add a fourth tier for `gpt-5.3-codex-spark` / a hypothetical Anthropic ultra-fast model. Defer until a recipe genuinely needs it.
