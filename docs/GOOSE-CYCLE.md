# Goose Cycle Helper

`goose-cycle` is a local HITL conductor for the IMA per-story software cycle.
It uses Taskwarrior for task discovery and queue state, Vestige for detailed
lifecycle handoff, and existing top-level Goose recipes for the phase work.

It is intentionally thin. It does not replace the recipes, Taskwarrior, or
Vestige, and it does not create benchmark-style copied recipe runs.

## Install

Run the normal installer:

```bash
node scripts/install.ts
```

The installer writes a local executable shim:

```text
~/.local/bin/goose-cycle
```

Add `~/.local/bin` to your shell `PATH` if the installer warns that it is not
already present.

## Basic Flow

Start the next ready Taskwarrior task for a project:

```bash
goose-cycle start --task-project ima-mcp-gateway
```

Start a specific task:

```bash
goose-cycle start --task-project ima-mcp-gateway --task S01
```

When both `--task-project` and `--task` are supplied, the selected
Taskwarrior task and its Vestige lifecycle thread are concrete source material;
the planning phase should not fall back to open-ended "what should we plan?"
prompts.

The approved flow is:

```text
cycle-start -> plan -> implement -> test-writer -> code-review -> document-learn -> cycle-close
```

If review requests changes, the fix loop remains:

```text
code-review -> resolve-review -> rereview
```

After an approved review or rereview, `goose-cycle` no longer stops after
`document-learn`; it continues into `cycle-close`. In autonomous mode, automatic
closeout passes `commit=true`. In guided mode, automatic closeout does not pass
commit behavior unless `--commit` was supplied.

Manual close remains available when you want to run it directly:

```bash
goose-cycle close --task-project ima-mcp-gateway --task S01
```

Use `--commit` only when you explicitly want the closeout recipe to include
commit preparation or application:

```bash
goose-cycle close --task-project ima-mcp-gateway --task S01 --commit
```

## Status, Next, And Dry Runs

Inspect the selected task and local pointer state:

```bash
goose-cycle status --task-project ima-mcp-gateway --task S01
```

Resume from `.goose-cycle/active.json`:

```bash
goose-cycle next --task-project ima-mcp-gateway
```

`next` uses the active status as the phase pointer; it does not replay the full
cycle unless no active state exists. `closed` is terminal, so `goose-cycle next`
from a closed state is a no-op and does not try to resolve a now-completed
Taskwarrior task.

Preview the exact Goose commands without running them:

```bash
goose-cycle start --task-project ima-mcp-gateway --task S01 --dry-run
goose-cycle next --task-project ima-mcp-gateway --dry-run
```

## Manual Phases

You can run a single phase with the same project/task context:

```bash
goose-cycle plan --task-project ima-mcp-gateway --task S01
goose-cycle implement --task-project ima-mcp-gateway --task S01
goose-cycle test --task-project ima-mcp-gateway --task S01
goose-cycle review --task-project ima-mcp-gateway --task S01
goose-cycle learn --task-project ima-mcp-gateway --task S01
goose-cycle resolve-review --task-project ima-mcp-gateway --task S01
goose-cycle rereview --task-project ima-mcp-gateway --task S01
```

Manual phase names are operator-facing aliases. The conductor maps each alias to
the concrete Goose recipe and phase-specific handoff parameters:

| Manual phase | Goose recipe | Phase-specific parameters |
|---|---|---|
| `plan` | `plan` | none |
| `implement` | `implement` | `implementation_source=Vestige lifecycle thread for Taskwarrior project <task_project>, task <task>` |
| `test` | `test-writer` | `test_source=Vestige lifecycle thread for Taskwarrior project <task_project>, task <task>` |
| `review` | `code-review` | `target=Vestige lifecycle thread for Taskwarrior project <task_project>, task <task>` |
| `learn` | `document-learn` | `artifact_bundle=Vestige lifecycle thread for Taskwarrior project <task_project>, task <task>` |
| `resolve-review` | `implement` | `cycle_phase=resolve-review`, `implementation_source=Resolve review findings from Vestige lifecycle thread for Taskwarrior project <task_project>, task <task>` |
| `rereview` | `code-review` | `cycle_phase=rereview`, `target=Rereview resolved findings from Vestige lifecycle thread for Taskwarrior project <task_project>, task <task>` |

The conductor passes lifecycle identifiers and the alias-specific handoff. The
recipes are responsible for loading Taskwarrior, searching Vestige, doing
phase-specific work, and updating phase outcomes.

## Local State

`.goose-cycle/active.json` stores only lightweight pointers and the current
resumable phase:

```json
{
  "taskProject": "ima-mcp-gateway",
  "task": "S01",
  "taskwarriorUuid": "...",
  "status": "reviewed",
  "updatedAt": "2026-06-12T00:00:00.000Z"
}
```

The conductor updates the pointer before and after each tracked phase. Completed
manual phases use completed-state names such as `planned`, `implemented`,
`tested`, `reviewed`, `learned`, `review-resolved`, and `rereviewed`; legacy
phase names are normalized only where resume behavior is safe.

Detailed lifecycle state belongs in Vestige. `.goose-cycle/` is git-ignored.

## Review Loop

After `code-review` or `rereview`, the conductor inspects Taskwarrior
annotations and tags for:

- `approved`
- `needs-fix` / `changes requested`
- `blocked`

Latest explicit review annotations win over stale or conflicting lifecycle
tags. Tags are fallback state markers only; if `approved` and `needs-fix` tags
conflict without a resolving annotation, the conductor stops as
unknown/ambiguous rather than entering a loop.

`needs-fix` means an implementation-ready, reviewer-decided remediation exists. Incomplete remediation is `blocked`; blocked review or resolution pauses the conductor instead of consuming another review cycle.

If `needs-fix` is the current state, it runs:

```text
implement --cycle-phase resolve-review
code-review --cycle-phase rereview
```

It stops after the configured maximum review cycles.

## Legacy Umbrella Recipe

The older experimental full-session umbrella remains available as:

```bash
goose-cycle-umbrella
```

The new `goose-cycle` binary is the recommended operational helper for
Taskwarrior/Vestige-backed per-story delivery.

> `--task-project` is the Taskwarrior project used for native `task project:<name>` filtering. It is not a Serena project. Serena bootstrap discovers the current project through the `ima-mcp serena` gateway and Serena's cwd/project configuration behavior.

## Vestige receipt gate

Before recording a completed phase state, `goose-cycle` clears the prior `.goose-cycle/phase-receipt.json`, supplies its absolute path to the phase recipe, and validates a fresh successful `vestige.save` receipt of the expected type. Missing, malformed, failed, stale, or wrong-type receipts leave the active state at the pre-phase status and stop progression.
