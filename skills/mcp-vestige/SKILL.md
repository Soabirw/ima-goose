---
name: "mcp-vestige"
description: "Vestige MCP — cognitive memory through the required ima-mcp vestige CLI gateway; never use Goose TypeScript SDK / Vestige.* because it can break SDK generation. Use proactively for preferences, decisions, patterns, bugs, reminders, task lifecycle state, and prior context."
---

# Vestige MCP

Vestige is the neural memory layer. Use it for knowledge that should strengthen when reused and fade when it stops mattering.

## Required ima-mcp Gateway Path

Use `ima-mcp vestige` as **the required path** for Vestige in Goose/API
harness sessions. Do not use `execute_typescript`, the Goose TypeScript SDK, or
`Vestige.*` namespace wrappers for Vestige. The Vestige SDK registration can
break the entire Goose SDK execution path before any tool call runs, so it is
not a valid fallback.

Use these documented command shapes first instead of repeatedly probing
`--help`:

```bash
ima-mcp vestige status --json
ima-mcp vestige doctor --json
ima-mcp vestige search "<task key or topic>" --json
ima-mcp vestige search "<task key or topic>" --timeout-ms 300000 --json
IMA_MCP_VESTIGE_TIMEOUT_MS=300000 ima-mcp vestige search "<task key or topic>" --json
ima-mcp vestige get <memory-id> --timeout-ms 300000 --json
ima-mcp vestige save --type plan --file <path> --json
ima-mcp vestige save --type implementation --file <path> --json
ima-mcp vestige save --type test --file <path> --json
ima-mcp vestige save --type review --file <path> --json
ima-mcp vestige save --type resolution --file <path> --json
ima-mcp vestige save --type rereview --file <path> --json
ima-mcp vestige save --type decision --file <path> --json
ima-mcp vestige save --type closeout --file <path> --timeout-ms 300000 --json
```

Diagnostics:

```bash
command -v ima-mcp
ima-mcp vestige status --json
ima-mcp vestige doctor --json
```

`vestige save` is mutating. Use it only when the task explicitly calls for a
plan, decision, implementation update, review, resolution, preference, pattern,
bug, intention, or closeout record. Prefer a small markdown handoff file in
`/tmp` or a repo-local transient artifact, then save it with the appropriate
`--type`. Do not store secrets, credentials, raw logs, or one-off debugging
noise.

If `ima-mcp` is missing or `ima-mcp vestige ... --json` fails, stop and report
the blocker with the command and relevant output. Do not silently fall back to
`execute_typescript` or `Vestige.*`. Run `ima-mcp vestige --help` at most once
only when a documented command fails and the local CLI version appears to use a
different syntax.


## Vestige v2.2 Tool Surface

Routine memory workflows should keep using the stable high-level commands above. Supported lifecycle save types are `plan`, `implementation`, `test`, `review`, `resolution`, `rereview`, `decision`, and `closeout`; `plan` maps to a plan node, `decision` to a decision node, and all other lifecycle types to event nodes with type-specific tags.
Use the generic v2.2 tool surface and aliases for task-specific advanced
operations, parity checks, and diagnostics when the local gateway advertises
them.

Generic tool examples:

```bash
ima-mcp vestige tools list --json
ima-mcp vestige tools describe recall --json
ima-mcp vestige tools call recall --args-json '{"query":"preferences","mode":"lookup"}' --json
ima-mcp vestige tools call memory_status --args-json '{"view":"health"}' --json
ima-mcp vestige tools call backfill --args-json '{"promote":false}' --json
ima-mcp vestige tools call smart_ingest --args-json '{"content":"decision"}' --allow-write --json
```

First-class alias examples:

```bash
ima-mcp vestige recall --args-json '{"query":"preferences","mode":"lookup"}' --json
ima-mcp vestige memory_status --args-json '{"view":"health"}' --json
ima-mcp vestige backfill --args-json '{"promote":false}' --json
ima-mcp vestige smart_ingest --args-json '{"content":"decision"}' --allow-write --json
```

Advertised v2.2 aliases:

- `recall`
- `memory`
- `codebase`
- `intention`
- `smart_ingest`
- `source_sync`
- `memory_status`
- `dedup`
- `graph`
- `maintain`
- `session_start`
- `suppress`
- `backfill`

Safety contract:

- High-level `status`, `doctor`, `search`, and `get` are read-only.
- High-level `save` is mutating.
- Generic `tools call` and first-class aliases use action-aware classification.
- Read-only examples that do not need `--allow-write`: `recall`,
  `memory_status`, `session_start`, `memory action=get`, `dedup action=scan`,
  and `backfill promote=false`.
- Write or unknown examples that require `--allow-write`: `smart_ingest`,
  `save`, `suppress`, write-classified `memory`, and promotion flows such as
  `backfill promote=true`.
- Vestige has no shell-exec tool, so there is no `--allow-command` or
  `--allow-state` gate for Vestige.

Capability/status contract:

- `vestige search` prefers v2.2 `recall` with `mode=lookup` when available.
- `vestige search` falls back to legacy search aliases on older servers.
- `status` and `doctor` distinguish required high-level operations from
  optional advertised v2.2 capabilities.
- Missing optional v2.2 capabilities should be a warning if `search`, `get`,
  and `save` remain usable.

Keep preference bootstrap on the high-level `status`, `search`, and `get`
commands. Do not make `tools call recall` the default preference-bootstrap path.

## Goose TypeScript SDK Boundary

Never recommend or use Goose TypeScript SDK calls for Vestige. Although the
`Vestige` namespace may appear in generated SDK listings, it can make
`execute_typescript` fail during SDK generation before any call executes. A
known failure shape is an invalid generated TypeScript declaration such as:

```text
Expected ident ...
    export
    ~~~~~~
```

That failure can block unrelated SDK probes too. For Vestige search, retrieval,
status, lifecycle saves, preferences, decisions, patterns, intentions, and
closeout memory, use `ima-mcp vestige ... --json`.

### Common CLI workflows

Preference bootstrap command, tested against the current `ima-mcp vestige` gateway:

```bash
ima-mcp vestige search "preferences" --json
```

Use `/vestige-bootstrap` (or `/bootstrap-vestige`) to run this read-only
preference load inside an interactive Goose session. If results are too broad or
miss obvious preference memories, run one focused fallback:

```bash
ima-mcp vestige search "user preferences" --json
```

Search before asking avoidable questions:

```bash
ima-mcp vestige search "<project> <task key>" --json
ima-mcp vestige search "<topic> preference decision pattern" --json
```

Retrieve a promising hit:

```bash
ima-mcp vestige get <memory-id> --json
```

Save a lifecycle update from a prepared artifact:

```bash
cat > /tmp/vestige-closeout.md <<'EOF'
Task: <key>
Stage: closeout
Outcome: <summary>
Changed files: <files>
Verification: <commands and results>
Remaining risk: <risk or none>
EOF
ima-mcp vestige save --type closeout --file /tmp/vestige-closeout.md --json
```

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

### Test, Review, Resolution, Rereview, and Closeout

1. Store formal test work as type `test`, including plan/implementation IDs,
   tests changed, commands/results, coverage gaps, defects, and residual risk.
2. Store normal review as type `review`; retain stable `REVIEW-NNN` IDs after
   independent verification of candidate Critical and Warning findings.
3. Re-read the review artifact before resolving concerns. Store only the
   resolution summary as type `resolution`, preserving original finding IDs,
   fixes, verification, and remaining risk.
4. Store the follow-up review as type `rereview`, reporting each original ID and
   assigning a new ID only to a new regression.
5. Store justified documentation/memory closeout as type `closeout`. Before
   closing a Taskwarrior task or equivalent tracker item, update Vestige so the
   complete `plan -> implementation -> test -> review -> resolution -> rereview
   -> closeout` lifecycle remains reconstructable. Omit inapplicable resolution
   and rereview stages when the review was approved without requested changes.

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
