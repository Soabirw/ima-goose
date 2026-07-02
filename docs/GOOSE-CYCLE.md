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

The conductor runs:

```text
cycle-start -> plan -> implement -> test-writer -> code-review
```

If Taskwarrior/Vestige marks the review approved, it continues to:

```text
document-learn
```

Then it stops for final human review. It does not mark the Taskwarrior task
done during normal start/next.

After final human approval:

```bash
goose-cycle close --task-project ima-mcp-gateway --task S01
```

Use `--commit` only when you explicitly want the closeout recipe to include
commit preparation or application:

```bash
goose-cycle close --task-project ima-mcp-gateway --task S01 --commit
```

## Status And Dry Runs

Inspect the selected task and local pointer state:

```bash
goose-cycle status --task-project ima-mcp-gateway --task S01
```

Preview the exact Goose commands without running them:

```bash
goose-cycle start --task-project ima-mcp-gateway --task S01 --dry-run
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

`.goose-cycle/active.json` stores only lightweight pointers:

```json
{
  "taskProject": "ima-mcp-gateway",
  "task": "S01",
  "taskwarriorUuid": "...",
  "status": "learned",
  "updatedAt": "2026-06-12T00:00:00.000Z"
}
```

Detailed lifecycle state belongs in Vestige. `.goose-cycle/` is git-ignored.

## Review Loop

The first implementation keeps review-loop decisions conservative. After
`code-review`, the conductor inspects Taskwarrior tags/annotations for:

- `approved`
- `needs-fix`
- `blocked`

If the state is unknown, the conductor stops for human inspection rather than
guessing. If `needs-fix` is present, it runs:

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
