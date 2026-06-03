# Changelog

## v1.6.0 - 2026-06-03

### Added

- Added strict saved-plan handoff requirements to the `plan` recipe so memory
  and file saves produce detailed, self-contained implementation briefs for
  lower-capability implementation agents.
- Added `Detailed Code Instructions`, `Acceptance Criteria`, and
  `Verification Commands` sections to the saved plan template.
- Added `Accept-Language: en-US` handling to the Atlassian REST helper, with
  `ATLASSIAN_LOCALE` available for explicit overrides.

### Changed

- Updated OpenAI and hybrid model profiles to express tiers with GPT-5.5
  reasoning effort suffixes: `gpt-5.5/high`, `gpt-5.5/medium`, and
  `gpt-5.5/low`.
- Updated OpenAI profile docs, README setup guidance, migration notes, and the
  adversarial OpenAI child recipe for GPT-5.5 high-reasoning IDs.
- Defaulted the WordPress developer recipe and `goose-wp` alias to
  `environment=ddev`.
- Added DDEV recovery cues to the WordPress developer recipe for WP-CLI,
  Composer dev dependencies, PHPUnit, and `ima-scss`.
- Bumped all active root recipe versions to `1.6.0`.

### Validation

- Parsed recipe YAML files.
- Validated recipe files with `goose recipe validate`.
- Ran `git diff --check`.
- Syntax-checked `scripts/install.ts` and the Atlassian REST helper.

## v1.5.0 - 2026-05-23

### Added

- Added `ui-ux-designer`, a browser-based UI/UX review recipe that uses Chrome
  DevTools for live interface inspection, responsive checks, accessibility
  basics, interaction states, and implementation-ready CSS guidance.
- Added a `goose-ui` shell alias for launching the UI/UX designer recipe.

### Changed

- Updated README recipe, model, and quick-start references for the UI/UX
  designer workflow.
- Bumped all active root recipe versions to `1.5.0`.

### Validation

- Parsed recipe YAML files.
- Validated recipe files with `goose recipe validate`.
- Ran `git diff --check`.

## v1.4.0 - 2026-05-22

### Added

- Added a `hybrid` model profile that routes Opus-tier recipes through
  `codex-acp` / `gpt-5.5` and Sonnet/Haiku-tier recipes through `claude-acp`.
- Added `adversarial-review`, a read-only dual-model review pipeline that runs
  Claude Opus and GPT-5.5 adversaries against the same evidence packet and
  reconciles their findings.
- Added `goose-ship-it`, a release-prep recipe for IMA staging branches and
  production `v*` tag preparation.
- Added `ima-researcher` and `patristic-researcher` recipes plus matching
  skills for evidence-driven medical research and patristic source research.
- Added shell aliases for adversarial review, ship-it release prep, IMA medical
  research, and patristic research.

### Changed

- Extended the recipe installer profile schema with optional per-tier
  `goose_provider` rewrites.
- Updated setup and model-tier docs for the hybrid profile and dual-model
  adversarial review workflow.
- Bumped all recipe versions to `1.4.0`.

## v1.3.1 - 2026-05-18

This patch release adds explicit brand enforcement for the Honest Medicine™
trademark rule across IMA skills and Goose recipes.

### Changed

- Bumped all recipe versions to `1.3.1`.
- Updated README release notes for the Honest Medicine™ brand enforcement patch.
- Added `Honest Medicine™` as required public-facing terminology in
  `ima-brand`, `shared/ima-brand-book.md`, and the brand identity reference.
- Updated `ima-copywriting` examples, newsletter support blocks, transitions,
  and quality checks to use and verify `Honest Medicine™`.
- Added an editorial scorecard trademark check so unmarked public-facing
  `Honest Medicine` usage is deducted from Brand Voice and listed in Priority
  Fixes.
- Updated `ima-editorial-workflow` so drafting and review phases explicitly
  enforce the trademark rule.
- Updated implementation, WordPress, JavaScript, task-runner, code-review, and
  review-verifier recipes to load/apply brand checks when public-facing IMA copy
  or UI text is touched.

### Fixed

- Fixed remaining public-facing editorial examples that used `Honest Medicine`
  without the trademark mark.

### Validation

- Parsed all recipe YAML files.
- Validated all recipe files with `goose recipe validate`.
- Ran `git diff --check`.

## v1.3.0 - 2026-05-18

This release restores the full IMA Goose operating environment inside recipes
and updates Atlassian/Jira access for the current Rovo MCP endpoint plus a
deterministic REST fallback.

### Added

- Added the critical MCP baseline to every recipe: `serena`, `vestige`,
  `qdrant-memory`, `tavily`, `sequential-thinking`, and `context7`.
- Added `tom` to every recipe so MOIM/persistent instructions remain available
  in recipe sessions.
- Added targeted workflow extensions:
  - `atlassian-rovo` for Jira-aware planning, prompt, implementation, review,
    and orchestration recipes.
  - `fetch` for research, planning, review, documentation, and architecture
    recipes.
  - `todo` for implementation, review, task execution, and testing recipes.
  - `chrome-devtools` for implementation, JavaScript, WordPress, testing, and
    review recipes.
  - `code_execution` for implementation, review, task execution, and test
    workflows that benefit from batched tool calls.
- Added a Node-based Atlassian REST helper under
  `skills/mcp-atlassian/scripts/atlassian-api.mjs` for Jira issue reads,
  comments, transitions, JQL search, and Confluence lookup.
- Added a project release checklist to `.goosehints` so future release prep
  consistently covers local diff review, versioning, changelog, docs, recipe
  validation, and git hygiene.

### Changed

- Bumped all recipe versions to `1.3.0`.
- Updated the Atlassian skill and shared tool guide for the Rovo MCP
  Streamable HTTP endpoint at `https://mcp.atlassian.com/v1/mcp/authv2`.
- Updated setup docs and the config template to replace the retired Atlassian
  SSE/proxy guidance with `atlassian-rovo` plus REST-helper environment
  variables.
- Updated installer environment checks for Bearer-token Atlassian auth and the
  Basic-auth fallback.
- Updated README release notes and recipe architecture guidance for the new
  extension baseline and tiered workflow extension model.
- Updated the OpenAI profile so `code-review` resolves to `gpt-5.5` instead of
  the previous `gpt-5.4` override.

### Fixed

- Fixed recipe sessions that previously lacked the memory, code navigation,
  research, documentation, and structured-reasoning tools assumed by their
  instructions.
- Fixed Jira-aware recipes so they have direct access to Atlassian Rovo MCP
  instead of relying on default-session extension state.

### Validation

- Parsed all recipe YAML files.
- Validated all recipe files with `goose recipe validate`.
- Ran `git diff --check`.
- Syntax-checked `scripts/install.ts` and the Atlassian REST helper.

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
