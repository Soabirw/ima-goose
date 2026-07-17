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

## Artifact vs. Prompt

The persisted phase artifact is the detailed source of truth. It remains complete and self-contained, including its lifecycle metadata, source and approved outcome, scope/non-goals, phase result, changed/reviewed/tested files, decisions, verification commands/results, blockers, residual risk, prior artifact IDs, and recommended next phase.

A manual handoff prompt is a compact pointer to that artifact, not a substitute for it. When a completed phase recommends a concrete next phase, automatically emit one ready-to-paste prompt containing only:

1. next recipe alias;
2. one-line task title or outcome;
3. lifecycle key;
4. latest relevant artifact reference or references; and
5. retained `REVIEW-NNN` IDs only for review-resolution work.

Do not restate acceptance criteria, detailed scope/non-goals, changed or expected files, implementation strategy, testing or review methodology, proposed technical execution, verification instructions already recorded in the artifact, or the complete artifact. Do not give procedural instructions that tell the destination recipe how to plan, implement, test, review, resolve, or document. The destination recipe owns its phase and loads the referenced source through its bootstrap and lifecycle lookup.

Normal example:

```text
Next: goose-test

Continue “Concise lifecycle handoff prompts.”
Lifecycle: ima-goose:manual:concise-lifecycle-handoff-prompts:20260715
Source: Vestige implementation <memory-id>
```

Review-resolution example:

```text
Next: goose-implement

Resolve REVIEW-001 and REVIEW-003 for “Concise lifecycle handoff prompts.”
Lifecycle: ima-goose:manual:concise-lifecycle-handoff-prompts:20260715
Source: Vestige review <memory-id>
```

## Cycle mode and receipts

Cycle mode exists exactly when `task_project && task`. In cycle mode `cycle_receipt_path` is required and is the conductor-provided absolute `.goose-cycle/phase-receipt.json` path. After saving the prepared artifact, redirect only the high-level gateway JSON stdout to it. A valid receipt is fresh JSON with `ok: true`, `command: "vestige.save"`, `data.stored: true`, and the expected `data.type`.

Save before status: prepare artifact, save it and produce the receipt, then—and only then—write a narrow successful Taskwarrior annotation/tag. On save failure never add success state or claim advancement.

On a cycle save failure, preserve the complete artifact using the fallback order below when possible, print the completed result and exact failed command/error, and label advancement blocked. The fallback does not produce a valid Vestige receipt, authorize Taskwarrior success annotations or lifecycle tags, advance conductor state, or authorize skipping manually to the next phase. Provide exact Vestige save retry and same-phase rerun/resume commands. The conductor remains at the pre-phase state. Never embed the complete artifact in a handoff prompt.

Manual mode is every other case. When the phase has a concrete next phase, name its alias and give the pointer-only prompt described above. Never mention `goose-cycle` in the manual handoff. In cycle mode report phase, saved artifact ID, expected next phase, and that the conductor owns normal progression; show `goose-cycle next --task-project <project>` only as interrupted-cycle recovery guidance.

## Manual persistence fallback

Vestige is the primary lifecycle store. If a manual Vestige save fails after the complete artifact is prepared, preserve that artifact automatically in this order, but only where the current phase's own write boundary permits each destination:

1. task-scoped Serena memory;
2. Markdown under `docs/` if Serena also fails or is unavailable.

A phase may narrow or forbid either fallback destination. When no permitted persistence destination succeeds, report the failed Vestige save and block the handoff; do not emit a next-phase prompt. Phase-local safety boundaries take precedence over this fallback order.

For permitted fallbacks, use deterministic filesystem-safe names derived from lifecycle key and phase: `<safe-lifecycle-key>-<phase>-handoff` for Serena memory and `docs/<safe-lifecycle-key>-<phase>-handoff.md` for Markdown. Replace unsafe separators and whitespace with hyphens, while preserving the original lifecycle key in the artifact metadata. Do not ask the user to choose a fallback after the complete artifact exists.

After a successful manual fallback, state the Vestige failure, give the successful fallback reference, and emit the normal pointer-only prompt. The failure notice communicates state only; it must not become procedural coaching or embed the complete artifact. An approved plan or other completed manual phase must be persisted somewhere before its handoff is presented.

Do not save noise: no concrete task, bootstrap failure before work, preliminary conversation only, or cancellation before a meaningful result.

## Review identity

Every actionable `REVIEW-NNN` sent to resolution contains an implementation-grade,
reviewer-decided remediation in the persisted artifact. Detailed solution content
belongs there, never in the pointer-only prompt. No resolution handoff is
permitted while product, architecture, security, API, data-flow, error-handling,
or test decisions remain unresolved. `REQUEST CHANGES` means remediation is ready
to execute, not merely that a defect exists. Resolution agents reject incomplete
remediation rather than infer missing decisions.


After independent verification fan-out, assign `REVIEW-001`, `REVIEW-002`, and so on to every retained Critical/Warning finding. Withdrawn candidates are not actionable. Resolution and rereview preserve original IDs; a new rereview regression gets the next unused ID.
