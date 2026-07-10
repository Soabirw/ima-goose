# HITL Phase Handoff Contract

Formal planning, implementation, testing, review, resolution, rereview, and closeout are separate top-level lifecycle phases. Parent subrecipes may perform only bounded work owned by the current phase; they MUST NOT silently cross a lifecycle boundary. `subrecipe-delegation.md` governs within-phase children; this contract governs top-level handoffs.

## Persist the phase artifact

For every meaningful completed or blocked phase, prepare a complete Markdown artifact and save it through the stable high-level gateway only:

```bash
ima-mcp vestige save --type <plan|implementation|test|review|resolution|rereview|decision|closeout> --file <artifact-file> --timeout-ms 300000 --json
```

Never replace that command with Goose SDK, `execute_typescript`, direct `smart_ingest`, or an undocumented fallback. Do not save secrets, credentials, raw logs, or sensitive payloads.

Every artifact MUST include this labeled metadata block. Use empty strings/arrays rather than invented values:

```yaml
lifecycle:
  project: ""
  lifecycle_key: ""
  lifecycle_root_memory_id: ""
  taskwarrior_project: ""
  taskwarrior_task: ""
  taskwarrior_uuid: ""
  jira_key: ""
  source_refs: []
  phase: "plan|implementation|test|review|resolution|rereview|closeout"
  prior_artifact_ids: []
```

Search Vestige before work and reuse correlation metadata in this order: existing `lifecycle_key`; Taskwarrior project + UUID; Jira key; existing Vestige plan/root ID; source issue/task ID; then manual project + Story slug + stable date suffix. Do not create disconnected artifacts.

Minimum artifact content: source and approved outcome; scope/non-goals; phase result; changed/reviewed/tested files; decisions; verification commands/results; blockers; residual risk; prior artifact IDs; and recommended next phase.

Mapping: cycle-start uses `decision`; plan uses `plan`; normal implementation uses `implementation`; test uses `test`; normal review uses `review`; resolve-review uses `resolution`; rereview uses `rereview`; document/learn uses `closeout`.

## Cycle mode and receipts

Cycle mode exists exactly when `task_project && task`. In cycle mode `cycle_receipt_path` is required and is the conductor-provided absolute `.goose-cycle/phase-receipt.json` path. After saving the prepared artifact, redirect only the high-level gateway JSON stdout to it. A valid receipt is fresh JSON with `ok: true`, `command: "vestige.save"`, `data.stored: true`, and the expected `data.type`.

Save before status: prepare artifact, save it and produce the receipt, then—and only then—write a narrow successful Taskwarrior annotation/tag. On save failure never add success state or claim advancement.

On a cycle save failure, print the completed result, exact failed command/error, and the complete unsaved Markdown artifact; label advancement blocked; provide exact save retry and same-phase rerun/resume commands. The conductor remains at the pre-phase state. On a manual save failure print `NOT SAVED TO VESTIGE`, the complete artifact, exact error, exact retry, and a complete next-phase prompt which embeds/references that artifact; never claim the thread updated.

Manual mode is every other case. Name the next alias and give a ready-to-paste prompt containing lifecycle key, saved IDs, source refs, acceptance criteria context, and exact responsibility. Never mention `goose-cycle` in the manual handoff. In cycle mode report phase, saved artifact ID, expected next phase, and that the conductor owns normal progression; show `goose-cycle next --task-project <project>` only as interrupted-cycle recovery guidance.

Do not save noise: no concrete task, bootstrap failure before work, preliminary conversation only, or cancellation before a meaningful result.

## Review identity

After independent verification fan-out, assign `REVIEW-001`, `REVIEW-002`, and so on to every retained Critical/Warning finding. Withdrawn candidates are not actionable. Resolution and rereview preserve original IDs; a new rereview regression gets the next unused ID.
