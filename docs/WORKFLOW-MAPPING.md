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
- `vision_handoff` for cross-cutting image analysis of screenshots, mockups, visual diffs, diagrams, scanned docs, and Jira image attachments
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

Artifacts move forward by memory name, file path, Jira key, Taskwarrior
project/task, PR URL, or pasted summary. Recipes should not assume a prior
session exists unless the user provides a reference.

`task-planner` can optionally persist an approved Epic -> Story -> Task hierarchy
after a preview, but only to one PM source of truth: Jira or Taskwarrior. It does
not implement, edit project files, run tests/builds, branch, commit, or deploy.

## Complex Troubleshooting Side Path

For unusually hairy defects or ambiguous production-like symptoms:

```text
symptom / Jira / logs / URL -> investigate -> choose next workflow
```

`investigate` is not part of the standard per-story cycle. It is a one-off
diagnostic tool for cases where the problem is not understood well enough to
plan or implement safely. The resulting report may feed `plan`, `wp-developer`,
`js-developer`, `implement`, `code-review`, or no code-change workflow at all.

## Mentoring Side Path

For questions where the human needs guidance rather than agent execution:

```text
question / task / memory / Jira / file / screenshot -> instructor -> human next step
```

`instructor` is not part of `goose-cycle` or the routine per-story delivery
loop. It is a HIGH-tier read-only mentor that researches enough evidence to
explain what the human should do next, why, what to avoid, and when to choose a
deeper workflow such as `plan`, `investigate`, `implement`, or `code-review`.
It may call `vision_handoff` for visual evidence and `explore` for bounded
read-only codebase discovery, but it must not edit files, run tests/builds,
migrate data, deploy, commit, or perform operational changes.

## Commands

Use these inside an existing session:

| Command | Purpose |
|---|---|
| `/architect` | Apply architecture judgment/persona to the current topic |
| `/prompt-starter` | Create a prompt for a future dedicated recipe session |
| `/serena-bootstrap` (`/bootstrap-serena` alias) | Reload standard Serena project memories |
| `/vestige-bootstrap` (`/bootstrap-vestige` alias) | Load user preferences from Vestige |
| `/serena-memorize <note>` | Persist stable project context into Serena |

`/prompt-starter` does not execute the generated prompt. It stops after
returning a copy-ready prompt.

## Model Profile Mapping

| Tier | Purpose |
|---|---|
| HIGH | Planning, review, research, orchestration |
| MID | Implementation, tests, release prep, documentation |
| LOW | Focused exploration |

`chatgpt_codex` is the default GPT-5.5 profile for Goose's native ChatGPT Codex provider. Use `chatgpt_codex_56` for the opt-in GPT-5.6 Sol/Terra mapping, `openai` only as the codex-acp fallback, and `sakana` only when a custom Sakana model provider is configured locally. See `docs/MODEL-TIERS.md`.

## Sub-Recipe Rule

Each sub-recipe call must receive a self-contained brief. Child sessions do not
inherit the parent context reliably enough to depend on implied state.

Parents should delegate image interpretation to `vision_handoff` and pass its visual-analysis result forward explicitly when later phases need it. This hand-off is standard even when the parent provider appears vision-capable because it saves context and normalizes evidence.

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

`explore` is read-only and sub-recipe-oriented. `instructor` is read-only and mentoring-oriented, delegating only to `vision_handoff` and `explore`. `goose-ship-it` is direct-only.
