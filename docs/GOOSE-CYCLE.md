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
goose-cycle start --project ima-mcp-gateway
```

Start a specific task:

```bash
goose-cycle start --project ima-mcp-gateway --task S01
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
goose-cycle close --project ima-mcp-gateway --task S01
```

Use `--commit` only when you explicitly want the closeout recipe to include
commit preparation or application:

```bash
goose-cycle close --project ima-mcp-gateway --task S01 --commit
```

## Status And Dry Runs

Inspect the selected task and local pointer state:

```bash
goose-cycle status --project ima-mcp-gateway --task S01
```

Preview the exact Goose commands without running them:

```bash
goose-cycle start --project ima-mcp-gateway --task S01 --dry-run
```

## Manual Phases

You can run a single phase with the same project/task context:

```bash
goose-cycle plan --project ima-mcp-gateway --task S01
goose-cycle implement --project ima-mcp-gateway --task S01
goose-cycle test --project ima-mcp-gateway --task S01
goose-cycle review --project ima-mcp-gateway --task S01
goose-cycle learn --project ima-mcp-gateway --task S01
```

The conductor passes only the lifecycle identifiers. The recipes are
responsible for loading Taskwarrior, searching Vestige, doing phase-specific
work, and updating phase outcomes.

## Local State

`.goose-cycle/active.json` stores only lightweight pointers:

```json
{
  "project": "ima-mcp-gateway",
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
