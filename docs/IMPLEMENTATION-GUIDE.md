# Implementation Guide

This guide reflects the current human-in-the-loop Goose workflow. The old
`task-master` and `task-runner` recipes have been deprecated and removed.

## Install

```bash
node scripts/install.ts --validate
```

The default profile is `chatgpt_codex`, which renders recipes through Goose's native ChatGPT Codex provider:

- HIGH: `gpt-5.5` with alias-scoped `GOOSE_THINKING_EFFORT=high`
- MID: `gpt-5.5` with alias-scoped `GOOSE_THINKING_EFFORT=medium`
- LOW: `gpt-5.5` with alias-scoped `GOOSE_THINKING_EFFORT=low`

Use `--profile chatgpt_codex_56` for the opt-in GPT-5.6 mapping: HIGH uses
`gpt-5.6-sol` at high effort, MID uses `gpt-5.6-terra` at high effort, and LOW
uses `gpt-5.6-terra` at medium effort. Use `--profile openai`, `--profile
hybrid`, `--profile anthropic`, `--profile claude-acp`, or `--profile sakana`
only when those providers are configured locally.
For `chatgpt_codex`, `chatgpt_codex_56`, and `sakana`, copy or merge
`.goose-aliases.example`, then switch with `goose-profile <name>` so the
current shell receives the profile's command-scoped `GOOSE_THINKING_EFFORT`
overrides. Direct installer calls print equivalent exports.
Sakana uses `fugu` for all tiers with efforts HIGH→`xhigh`, MID→`high`,
LOW→`high`.

## Primary Workflow

```
brainstorm -> plan -> task-planner -> implement/wp-developer -> test-writer -> code-review -> document-learn
```

The preferred umbrella recipe is:

```bash
goose run --recipe software-development-cycle --interactive
```

It owns the full cycle directly. It does not call `task-master`.

## Manual Sessions

Use separate sessions when you want more control:

```bash
goose run --recipe brainstorm --interactive
goose run --recipe plan --interactive
goose run --recipe task-planner --interactive
goose run --recipe instructor --interactive
goose run --recipe wp-developer --interactive
goose run --recipe test-writer --interactive
goose run --recipe code-review --interactive
goose run --recipe scorecard --interactive
goose run --recipe document-learn --interactive
```

For non-WordPress code, use `implement` or `js-developer` instead of
`wp-developer`.

`task-planner` remains non-implementation. It can optionally persist an approved
Epic -> Story -> Task hierarchy to exactly one PM system after a preview: Jira
or Taskwarrior, never both. It must not make code/content/config/database,
dependency, branch, commit, generated artifact, test/build, migration,
deployment, or implementation changes.

For design handoff, use `design-to-code` as its own HIGH-tier session. It can
produce an implementation prompt, call the implementation pipeline, or run the
full design-to-code path depending on the requested mode.

## Commands Inside Existing Sessions

Some workflows are commands, not dedicated sessions:

- `/architect` applies the architecture/persona lens to the current session.
- `/prompt-starter` builds a prompt for a future dedicated recipe session.
- `/serena-bootstrap` (`/bootstrap-serena` alias) reloads project memories.
- `/vestige-bootstrap` (`/bootstrap-vestige` alias) loads user preferences from Vestige.
- `/serena-memorize <note>` updates standardized Serena project memory.

## Sub-Recipe Delegation

Sub-recipes are declared directly by parent recipes. Each child runs in an
isolated session with a self-contained brief.

Current parents:

| Parent | Children |
|---|---|
| `software-development-cycle` | brainstorm, plan, task-planner, explore, implement, wp-developer, test-writer, code-review, document-learn |
| `implement` | vision-handoff |
| `wp-developer` | vision-handoff |
| `js-developer` | vision-handoff |
| `code-review` | vision-handoff, review-verify, conditional scorecard |
| `instructor` | vision-handoff, explore |
| `design-to-code` | explore, wp-developer, test-writer, code-review |
| `brainstorm` / `plan` | explore |
| `adversarial-review` | adversarial-review-claude, adversarial-review-openai |

`explore` is LOW and is intended as a focused read-only sub-recipe. It should
return compact findings to its parent, not design or implement.

`investigate` is HIGH and owns evidence synthesis, hypothesis testing,
reproduction analysis, and root-cause reporting. It remains non-mutating and is
intended as a one-off tool for hairy troubleshooting, not a routine workflow
phase.

`instructor` is HIGH and owns context-aware mentoring: what the human should do
next, why, what evidence supports it, and what to avoid. It remains
non-mutating, may delegate only to `vision_handoff` and `explore`, and is a
side path rather than a goose-cycle phase.

`review-verify` is HIGH because it verifies critical review findings and should
not be less capable than the original reviewer.

## Recipe Roles

| Recipe | Tier | Role |
|---|---|---|
| `brainstorm` | HIGH | Shape an idea into a feature set |
| `plan` | HIGH | Turn a feature set into an implementation plan |
| `investigate` | HIGH | Read-only Sherlock-style debugging and root-cause analysis |
| `instructor` | HIGH | Read-only context-aware mentor for what the human should do next and why |
| `task-planner` | HIGH | Decompose a plan into Epic -> Story -> Task and optionally persist the approved hierarchy to Jira or Taskwarrior |
| `wp-developer` | MID | Implement approved WordPress plans |
| `implement` | MID | General implementation |
| `js-developer` | MID | JavaScript/TypeScript implementation |
| `test-writer` | MID | Write and repair tests |
| `code-review` | HIGH | Review implementation and tests |
| `scorecard` | HIGH | Score project, PR, or codebase quality |
| `design-to-code` | HIGH | Turn approved designs into implementation prompts or code |
| `document-learn` | MID | Update docs and memory after completion |
| `goose-ship-it` | MID | Prepare release branches/tags directly |

## Release Prep

`goose-ship-it` is called directly, not as a sub-recipe:

```bash
goose run --recipe goose-ship-it \
  --params "target_env=stg" \
  --params "project_path=$(pwd)" \
  --interactive
```

It prepares refs and may run dry-runs when requested. It must not perform an
actual deploy without explicit user approval.

## HITL child matrix

- `implement`, `js-developer`, and `wp-developer`: `vision-handoff` only.
- `code-review`: `vision-handoff`, `review-verify`, plus `scorecard` only on explicit scoring, grading, health, or trend requests.

Formal test and review are separate top-level phases.
