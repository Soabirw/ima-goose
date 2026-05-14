# Changelog

## v1.2.0 - 2026-05-14

This release captures the Goose workflow refactor we have been building through
the May iteration cycle.

### Added

- Added `brainstorm` and `plan` as standalone interactive recipes that can start
  blank, from pasted text, a Serena memory, a local file, or a Jira key.
- Added `software-development-cycle`, a flattened umbrella recipe for
  Brainstorm -> Plan -> Decompose -> Implement -> Test -> Review ->
  Document/Learn.
- Added `document-learn` for terminal docs and memory closeout after story or
  feature work.
- Added provider model profiles in `profiles/` and `node scripts/install.ts
  --profile <name>` so source recipes can keep portable tier names while
  deployed recipes get provider-specific model IDs.
- Added the `tea-gitea` skill and expanded Gitea/`tea` guidance for internal PR
  comments, approvals, rejections, and API fallbacks.
- Added active docs for model tiers and the software development cycle.

### Changed

- Migrated remaining recipe parameter gates away from required inputs.
  `task-master`, `task-runner`, `architect`, `review-verify`, and
  `document-learn` now enter open mode when launched without parameters.
- Updated `task-master` and workflow docs to describe sub-recipes as declarative
  YAML delegation, not orchestrator-extension behavior.
- Updated `implement` and `wp-developer` with parent-owned verification mode so
  the software-development-cycle umbrella can own tests and review explicitly.
- Updated aliases around the new `goose-cycle`, `goose-brainstorm`,
  `goose-plan`, `goose-orchestrate`, and `goose-profile` workflows.
- Updated provider setup docs for Claude ACP, Codex ACP, direct Anthropic, and
  model-profile switching.

### Fixed

- Fixed recipe launch blockers caused by required parameter dialogs when the
  needed context already lived in Serena memory, a file, or the live session.
- Fixed Gitea review-comment guidance to avoid inlining large Markdown through
  `tea comment`.
- Aligned the OpenAI profile with the documented budget guardrail by demoting
  heavy-fan-out `code-review` runs to `gpt-5.4`.

### Validation

- Parsed all recipe YAML files.
- Validated recipe files with `goose recipe validate`.
- Smoke-tested no-parameter recipe loading with `goose run --recipe ... --explain`
  for the former parameter-gated recipes.

