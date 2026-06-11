# Workflow Mapping

This repository supports two workflow styles:

1. A full-cycle umbrella session with `software-development-cycle`.
2. Human-controlled handoff between dedicated recipe sessions.

The old `task-master` / `task-runner` pattern from Claude Code has been removed.
Goose recipes are more precise, so the current workflow keeps humans in the
approval loop between major artifacts.

## Full Cycle

```bash
goose run --recipe software-development-cycle --interactive
```

The umbrella owns:

```
brainstorm -> plan -> task-planner -> story loop -> document-learn
```

For each story it can call:

- `explore` for focused LOW-cost code discovery
- `wp-developer`, `implement`, or `js-developer` for implementation
- `test-writer` for tests
- `code-review` for review
- `scorecard` when the user asks to score project or PR quality
- `document-learn` for story and feature closeout

## Manual Handoff

```bash
goose run --recipe brainstorm --interactive
goose run --recipe plan --interactive
goose run --recipe task-planner --interactive
goose run --recipe wp-developer --interactive
goose run --recipe design-to-code --interactive
goose run --recipe code-review --interactive
goose run --recipe scorecard --interactive
goose run --recipe document-learn --interactive
```

Artifacts move forward by memory name, file path, Jira key, PR URL, or pasted
summary. Recipes should not assume a prior session exists unless the user
provides a reference.

## Commands

Use these inside an existing session:

| Command | Purpose |
|---|---|
| `/architect` | Apply architecture judgment/persona to the current topic |
| `/prompt-starter` | Create a prompt for a future dedicated recipe session |
| `/serena-bootstrap` | Reload standard Serena project memories |
| `/serena-memorize <note>` | Persist stable project context into Serena |

`/prompt-starter` does not execute the generated prompt. It stops after
returning a copy-ready prompt.

## Model Profile Mapping

| Tier | Purpose |
|---|---|
| HIGH | Planning, review, research, orchestration |
| MID | Implementation, tests, release prep, documentation |
| LOW | Focused exploration |

`openai` is the default profile. Use `chatgpt_codex` when Goose is
configured with the native ChatGPT Codex provider. See `docs/MODEL-TIERS.md`.

## Sub-Recipe Rule

Each sub-recipe call must receive a self-contained brief. Child sessions do not
inherit the parent context reliably enough to depend on implied state.

Parents should pass:

- objective
- relevant files/memories/tickets
- acceptance criteria
- constraints
- expected output shape
- whether the child may modify files

`design-to-code` is a dedicated HIGH-tier session for approved design artifacts.
It can stop at a prompt, hand off to implementation, or run the full path when
the user requests that mode.

`scorecard` is available both as a direct session and as a `code-review`
sub-recipe when the user asks to score a project, PR, or codebase.

`explore` is read-only and sub-recipe-oriented. `goose-ship-it` is direct-only.
