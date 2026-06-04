---
name: "mcp-vestige"
description: "Vestige MCP — cognitive memory with semantic search, spaced repetition, codebase awareness, and intentions. Use proactively for preferences, decisions, patterns, bugs, reminders, and prior context."
---

# Vestige MCP

Vestige is the neural memory layer. Use it for knowledge that should strengthen when reused and fade when it stops mattering.

## Session Start Protocol

Before asking avoidable questions:

1. Search for project context.
2. Search for user preferences relevant to the task.
3. Check pending intentions or reminders.

For task-scoped work, also search by the task correlation key before planning,
implementing, reviewing, or closing out. Correlation keys include Taskwarrior
IDs/UUIDs, Jira keys, issue IDs, project task IDs such as `CM-001`, and related
task IDs mentioned by the user.

## Task Lifecycle Protocol

Use Vestige as the living memory thread for task-based project work. A task may
move through multiple recipes and sessions; Vestige carries the plan, findings,
review concerns, resolution, and closeout state across those boundaries.

### Planning

1. Start from the task source, often Taskwarrior, Jira, a local issue file, or a
   user-provided task ID.
2. Search Vestige for the task key and related keys before asking for context.
3. Create a detailed implementation plan.
4. Store the plan in Vestige with the task key, related keys, scope, non-goals,
   expected files/modules, acceptance criteria, and verification steps.

### Implementation

1. Search Vestige for the task key and read the latest plan before editing.
2. Implement against the stored plan unless the user explicitly changes scope.
3. Store an implementation update in Vestige with changed files, decisions,
   verification performed, unresolved questions, and any review handoff notes.

### Review

1. Search Vestige for the task key before reviewing.
2. Use the stored plan and implementation update to judge intent, scope, and
   expected behavior.
3. Store review results in Vestige with findings, severity, evidence, required
   fixes, and accepted residual risk.

### Resolution and Closeout

1. Re-read Vestige review results before resolving concerns.
2. Store the resolution summary in Vestige, including fixes made, verification,
   remaining risk, and final outcome.
3. Before closing the Taskwarrior task or equivalent tracker item, update Vestige
   with the final state so future planning/review sessions can reconstruct the
   task history.

Use one evolving task thread when possible. Add updates that include the task key
and lifecycle stage instead of scattering unrelated memories with no shared
identifier.

## Store Immediately

- User preferences and corrections.
- Architectural decisions and their rationale.
- Bug root causes worth remembering.
- Reusable codebase patterns.
- Future reminders or intentions.
- Task lifecycle artifacts: plans, implementation summaries, review findings,
  fix resolutions, final closeouts.

Do not store credentials, one-off debugging noise, or content that belongs in durable documentation.

## Decision Rule

Use Vestige for fading knowledge: preferences, decisions, patterns, bugs,
intentions, and task lifecycle state.

Use Qdrant for durable reference material: standards, PRDs, architecture docs, research, and reusable examples.

Use Serena for stable project-scoped instructions and standards that recipes
should load at startup. Use Serena to teach agents that Vestige is the living
task memory, then use Vestige to carry the active task through the plan →
implement → review → resolve → closeout cycle.

## Goose Extension

```yaml
extensions:
  vestige:
    enabled: true
    name: vestige
    type: stdio
    cmd: vestige-mcp
    args: []
    timeout: 60
```

## Setup

Ensure `vestige-mcp` is on `PATH`.

Vestige config lives in `~/.config/vestige/` globally or `.vestige/` per project.

## Verification

```text
Search Vestige for preferences related to this project.
Search Vestige for CM-001, CM-010, and CM-011, then summarize the lifecycle thread.
```
