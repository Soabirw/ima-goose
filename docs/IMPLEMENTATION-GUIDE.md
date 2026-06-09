# Implementation Guide

This guide reflects the current human-in-the-loop Goose workflow. The old
`task-master` and `task-runner` recipes have been deprecated and removed.

## Install

```bash
node scripts/install.ts --validate
```

The default profile is `openai`, which renders recipes through `codex-acp`:

- HIGH: `gpt-5.5/high`
- MID: `gpt-5.5/medium`
- LOW: `gpt-5.5/low`

Use `--profile hybrid`, `--profile anthropic`, or `--profile claude-acp` only
when those providers are configured locally.

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
goose run --recipe wp-developer --interactive
goose run --recipe test-writer --interactive
goose run --recipe code-review --interactive
goose run --recipe scorecard --interactive
goose run --recipe document-learn --interactive
```

For non-WordPress code, use `implement` or `js-developer` instead of
`wp-developer`.

For design handoff, use `design-to-code` as its own HIGH-tier session. It can
produce an implementation prompt, call the implementation pipeline, or run the
full design-to-code path depending on the requested mode.

## Commands Inside Existing Sessions

Some workflows are commands, not dedicated sessions:

- `/architect` applies the architecture/persona lens to the current session.
- `/prompt-starter` builds a prompt for a future dedicated recipe session.
- `/serena-bootstrap` reloads project memories.
- `/serena-memorize <note>` updates standardized Serena project memory.

## Sub-Recipe Delegation

Sub-recipes are declared directly by parent recipes. Each child runs in an
isolated session with a self-contained brief.

Current parents:

| Parent | Children |
|---|---|
| `software-development-cycle` | brainstorm, plan, task-planner, explore, implement, wp-developer, test-writer, code-review, document-learn |
| `implement` | test-writer, code-review |
| `wp-developer` | test-writer, code-review |
| `js-developer` | test-writer, code-review |
| `code-review` | review-verify, scorecard |
| `design-to-code` | explore, wp-developer, test-writer, code-review |
| `brainstorm` / `plan` | explore |
| `adversarial-review` | adversarial-review-claude, adversarial-review-openai |

`explore` is LOW and is intended as a focused read-only sub-recipe. It should
return compact findings to its parent, not design or implement.

`review-verify` is HIGH because it verifies critical review findings and should
not be less capable than the original reviewer.

## Recipe Roles

| Recipe | Tier | Role |
|---|---|---|
| `brainstorm` | HIGH | Shape an idea into a feature set |
| `plan` | HIGH | Turn a feature set into an implementation plan |
| `task-planner` | HIGH | Decompose a plan into Epic -> Story -> Task |
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
