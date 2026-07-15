# Changelog

## v2.7.2 - 2026-07-15

### Added

- Added one authoritative pointer-only lifecycle handoff contract for all formal
  lifecycle recipes, including concise normal and review-resolution examples.

### Changed

- Kept full lifecycle detail in persisted artifacts while manual next-phase
  prompts now carry only the next alias, one-line outcome, lifecycle key,
  relevant artifact reference, and retained review IDs when applicable.
- Added manual persistence fallback from Vestige to task-scoped Serena memory
  and then deterministic Markdown under `docs/`; cycle advancement still
  requires a valid Vestige receipt.
- Aligned planning instructions and active lifecycle workflow documentation with
  the shared contract, and bumped every affected lifecycle recipe template.
- Updated `document-learn` to default to a flexible human-readable closeout;
  strict YAML or JSON output is now used only when explicitly requested or
  supplied by invoking automation.
- Bumped package, lockfile, and README release metadata to v2.7.2.

### Fixed

- Removed recipe-local handoff coaching that duplicated artifacts or instructed
  destination recipes how to execute their own phase.

### Validation

- Ran focused lifecycle and plan contract tests; 12 tests passed.
- Ran `node --test tests/cycle.test.js`; 30 tests passed.
- Ran `node scripts/install.ts --validate --dest "$(mktemp -d)"`; all recipes rendered and validated.
- Ran `npm test`; 52 tests passed.
- Ran `git diff --check`.

## v2.7.1 - 2026-07-10

### Added

- Added a shared HITL phase-handoff contract with correlated Vestige lifecycle
  artifacts, common metadata, manual handoff prompts, and stable review IDs.

### Changed

- Made `implement`, `js-developer`, and `wp-developer` terminal implementation
  phases: they perform immediate verification and diff inspection but leave
  formal testing and review to separate top-level phases.
- Added validated Vestige save-receipt gating to `goose-cycle` before completed
  phase state can advance.
- Aligned recipes, the Vestige skill, and workflow docs with the expanded
  lifecycle save types and preserved review verify fan-out; scorecards remain
  explicit-request-only.
- Bumped package, lockfile, and README release metadata to v2.7.1.

### Fixed

- Made successful manual `resolve-review` completion advance to
  `review-resolved`, so the next lifecycle invocation runs rereview instead of
  repeating resolution.
- Made approved-plan Vestige persistence mandatory; optional Serena and file
  copies are offered only after a successful lifecycle save.

### Validation

- Ran focused lifecycle-contract and conductor coverage; all 37 tests passed.
- Ran `node scripts/install.ts --validate --dest "$(mktemp -d)"`; all recipes
  rendered and validated.
- Ran `npm test`; all 50 tests passed.
- Ran `git diff --check`.

## v2.7.0 - 2026-07-10

### Added

- Added the opt-in `chatgpt_codex_56` profile: HIGH uses GPT-5.6 Sol at high effort, MID uses GPT-5.6 Terra at high effort, and LOW uses GPT-5.6 Terra at medium effort.
- Added profile-switcher support for applying GPT-5.5, GPT-5.6, and Sakana tier effort overrides in the current shell.

### Changed

- Documented GPT-5.6 profile selection across README, the installer, aliases, configuration template, model-tier guide, setup guide, implementation guide, migration guide, and workflow mapping.
- Started tracking stable Serena project configuration and standard onboarding memories while keeping local Serena runtime state and task-local memories ignored.
- Bumped package and lockfile release metadata to v2.7.0.

### Fixed

- Prevented `goose-profile` from applying effort overrides when recipe installation fails.

### Validation

- Ran `npm test`; all 36 tests passed.
- Rendered and validated all recipes for every supported profile: `chatgpt_codex`, `chatgpt_codex_56`, `openai`, `hybrid`, `anthropic`, `claude-acp`, and `sakana`.
- Ran `node --check scripts/install.ts` and `bash -n .goose-aliases.example`.
- Ran `git diff --check`.

## v2.6.8 - 2026-07-09

### Added

- Added the `ima-goose-guide` skill for IMA Goose setup, configuration, operation, workstation/VM support, MCP gateway troubleshooting, installed recipe/skill paths, and related ecosystem repositories.
- Added canonical setup and support docs: `docs/IMA-GOOSE-FULL-SETUP.md`, `docs/IMA-GOOSE-WORKSTATION-SETUP.md`, and `docs/IMA-GOOSE-VERIFICATION.md`.

### Changed

- Updated `instructor` to load `ima-goose-guide` for IMA Goose ecosystem questions while reserving `goose-doc-guide` for upstream Goose-specific semantics.
- Updated README, install docs, recipes/skills catalog, and MCP/skills setup docs to point users to `goose-instructor` and the new canonical guides.
- Bumped the package and lockfile release metadata to v2.6.8.
- Bumped the changed `instructor` recipe template version to `1.0.1`.

### Validation

- Ran `node scripts/install.ts --validate`; all rendered recipes validated and the new skill installed.
- Ran `git diff --check`.
- Ran targeted `rg` checks for new guide/doc references and stale new-user Conda guidance.
- Verified the repository skill count is 52 and updated exact-count docs.

## v2.6.7 - 2026-07-09

### Fixed

- Removed trailing whitespace from `docs/IMA-DEV-CYCLE.md` and cleaned up typos in the example workflow text.
- Bumped the package and lockfile release metadata to v2.6.7.

### Validation

- Ran `git diff --check`.
- Ran `git show --check --stat --oneline HEAD`.

## v2.6.6 - 2026-07-09

### Changed

- Reworked `README.md` into a shorter first-pass guide focused on quick start, aliases, `goose-cycle`, and links to deeper documentation.
- Added `docs/INSTALL.md`, `docs/IMA-DEV-CYCLE.md`, and `docs/RECIPES-AND-SKILLS.md` for fuller setup, workflow, and catalog details.
- Made `goose-test` the primary test alias for grammar consistency while keeping `goose-tests` as a legacy fallback.
- Bumped the package and lockfile release metadata to v2.6.6.
- Updated `goose-cycle` so `.goose-cycle/active.json` is a resumable phase pointer and `next` resumes from the recorded state instead of restarting the cycle.
- Clarified review lifecycle annotations/tags as current-state markers, with latest explicit annotations winning over stale tags.

### Fixed

- Prevented goose-cycle task planning from falling through to open-planning prompts when `task_project` and `task` are supplied.
- Continued approved review/rereview flows through `document-learn` and `cycle-close`, with autonomous closeout requesting `commit=true` and guided closeout committing only when requested.

### Validation

- Ran `npm test` (36 tests passed).
- Ran `npm run install:recipes:validate`; all rendered recipes validated successfully.
- Ran `bash -n .goose-aliases.example`.
- Ran `git diff --check`.

## v2.6.5 - 2026-07-07

### Changed

- Clarified the preflight child recipe naming contract: `preflight-probe` is the source/rendered recipe slug and filename, while `preflight_probe` is only the parent subrecipe tool name.
- Bumped the package, lockfile, and README release metadata to v2.6.5.

### Validation

- Ran `node --check scripts/install.ts`.
- Ran `npm test`.
- Ran `node scripts/install.ts --validate --dest "$tmpdir" --profile openai`; all rendered recipes validated successfully in the temporary destination.
- Ran `goose recipe validate` on rendered `preflight-check.yaml` and `preflight-probe.yaml`.
- Ran `git diff --check`.

## v2.6.4 - 2026-07-02

### Added

- Added Vestige v2.2 gateway parity documentation in the `mcp-vestige` skill, including generic `tools list|describe|call`, first-class aliases, timeout options, and action-aware safety gates.
- Expanded `/preflight` and the `goose-preflight` skill with read-only Vestige v2.2 probes for `tools list`, `tools describe recall`, `tools call recall`, `tools call memory_status`, and the `memory_status` alias.
- Added Avada deconstruction visual handoff manifest guidance so parent workflows can pass complex screenshot/section briefs through `.tmp/<slug>/vision-handoff-manifest.json` instead of long multiline recipe parameters.
- Added `manifest_path` support to `vision-handoff` and regression coverage for the Avada deconstruction manifest handoff path.

### Changed

- Renamed goose-cycle Taskwarrior scoping from generic `--project` / `project` to `--task-project` / `task_project`, and updated aliases, cycle docs, recipe parameters, lifecycle prompts, and regression tests to use the explicit Taskwarrior scope.
- Updated `goose-cycle` manual phase handoffs to describe Vestige lifecycle threads as belonging to a Taskwarrior project/task, not a Serena project.
- Updated canonical Serena bootstrap guidance across shared instructions, bootstrap recipes, skills, README, and MCP setup docs to use current-project `ima-mcp serena` commands without passing recipe parameters as Serena project names.
- Clarified that Vestige preference bootstrap remains on stable high-level `status`/`search`/`get` commands while advanced v2.2 operations live in the `mcp-vestige` skill and preflight parity checks.
- Updated preflight classification so high-level Vestige failures are material and optional v2.2 parity failures warn unless full parity validation is explicitly requested.
- Documented `/preflight` as a current-session command and refreshed setup/recommended-use docs for the new Taskwarrior scoping and gateway behavior.
- Bumped the package, lockfile, and README release metadata to v2.6.4.

### Fixed

- Blocked legacy goose-cycle `--project` usage with an explicit migration error so Taskwarrior project scope cannot be mistaken for Serena project selection.
- Restored the preflight `$project` variable for gateway checks that still use explicit `--project "$project"` while preserving cwd-default Serena bootstrap probes.
- Prevented Avada deconstruction vision handoffs from depending on fragile multiline recipe parameter rendering for large visual briefs.

### Validation

- Ran `node --check scripts/install.ts` and `node --check scripts/cycle.ts`.
- Ran `npm test` (26 tests passed).
- Ran `node scripts/install.ts --dest "$tmpdir" --profile openai --validate`; all rendered recipes validated successfully in the temporary destination.
- Ran `goose recipe validate` on rendered `preflight-check.yaml`, `vestige-bootstrap.yaml`, `avada-deconstruct.yaml`, and `vision-handoff.yaml`.
- Ran read-only Vestige v2.2 gateway probes for `status`, `doctor`, `search`, `tools list`, `tools describe recall`, `tools call recall`, `tools call memory_status`, and the `memory_status` alias.
- Ran `git diff --check`.

## v2.6.3 - 2026-06-26

### Added

- Added the Avada deconstruction recipe for guided Avada Builder page analysis.
- Added `goose-cycle resolve-review` and `goose-cycle rereview` as first-class
  manual phase commands.

### Changed

- Documented `goose-cycle` manual phase aliases and their concrete recipe
  mappings in the README and cycle guide.
- Bumped the package, lockfile, and README release metadata to v2.6.3.

### Fixed

- Fixed manual `goose-cycle review` dispatch to run the existing `code-review`
  recipe instead of the non-existent raw `review` recipe.
- Protected manual phase mappings for `test`, `learn`, `resolve-review`, and
  `rereview` with regression coverage.

### Validation

- Ran `node --test tests/cycle.test.js`.
- Ran `npm test`.
- Ran `node scripts/install.ts --validate`.
- Ran `git diff --check`.

## v2.6.2 - 2026-06-25

### Changed

- Updated `preflight-check` to use `ima-mcp` gateway diagnostics as the source of
  truth for Serena, Vestige, and Qdrant health checks.
- Refreshed `goose-preflight` guidance and preflight docs for current Context7,
  Tavily, Atlassian Rovo, Sequential Thinking, and Chrome DevTools probe signatures.

### Fixed

- Removed outdated Serena, Vestige, Qdrant, and Fetch SDK preflight probing to
  avoid false-positive failures after the `ima-mcp` gateway migration.
- Clarified that the `preflight_probe` subrecipe is the delegation canary and
  requires the `IMA_GOOSE_PREFLIGHT_SUBRECIPE_OK` marker.

### Validation

- Rendered and validated all recipe templates with
  `node scripts/install.ts --validate --dest <tmp> --profile openai`, including
  the rendered `preflight-check.yaml` and `preflight-probe.yaml`.
- Ran `npm test`.
- Ran `git diff --check`.

## v2.6.1 - 2026-06-23

### Added

- Added `sakana` provider profile for Sakana API's OpenAI-compatible Responses
  endpoint, using `fugu` for all tiers with reasoning efforts HIGH→`xhigh`,
  MID→`high`, and LOW→`high`.

### Changed

- Updated `task-planner` persistence guidance so Stories are the default Jira and
  Taskwarrior lifecycle units, while lower-level Tasks are embedded Story
  checklists/annotations/acceptance criteria unless explicitly promoted.
- Clarified Taskwarrior/goose-cycle lifecycle granularity in docs and the
  Taskwarrior skill.
- Fixed v2.6.0 setup docs to use `ima-mcp-gateway >= 0.3.0` as the
  source of truth for Serena, Vestige, and Qdrant instead of removed direct
  extension blocks.
- Added missing `instructor` model-tier and sub-recipe delegation documentation.

### Validation

- Ran targeted stale wording scans for old task-planner granularity language.
- Rendered and validated recipes with `node scripts/install.ts --validate --dest <tmp> --profile chatgpt_codex` and `--profile sakana`.
- Ran `npm test`.
- Ran `git diff --check`.

## v2.6.0 - 2026-06-18

### Added

- Added `instructor`, a HIGH-tier context-aware read-only mentoring recipe that
  researches enough evidence to explain what the human should do next and why,
  with `vision_handoff` and `explore` as its only subrecipes.
- Added the `goose-instructor [source]` shell alias and documented the recipe as
  a mentoring side path, not a `goose-cycle` or routine per-story phase.

### Changed

- Updated `task-planner` to allow optional approved PM persistence after hierarchy
  and persistence-preview approval, with exactly one target per hierarchy: Jira
  or Taskwarrior. The recipe remains non-implementation and still forbids
  code/content/config/database/dependency/branch/commit/generated-artifact,
  test/build, migration, deployment, and implementation changes.
- Added Taskwarrior persistence rules for native `task` CLI usage, read-before-write
  checks, user-scoped setup, narrow project filters, safe commands, and
  `project:<project>.<epic-slug>` namespace mapping.
- Added Jira persistence rules requiring metadata-driven mapping, explicit
  preview/approval, and no hardcoded Epic/Story/Sub-task assumptions.
- Removed direct Serena, Qdrant, and Vestige extension entries from
  `config-template.yaml` now that those integrations are provided through
  `ima-mcp-gateway`.
- Bumped the package, lockfile, README release reference, and `task-planner`
  recipe version for v2.6.0.

### Validation

- Rendered templates to a temporary recipe directory with `node scripts/install.ts --validate --dest /tmp/ima-goose-instructor-recipes`.
- Validated rendered recipes, including `instructor.yaml` and `task-planner.yaml`.
- Ran `npm test`.
- Ran stale wording scans for contradictory task-planner no-write language and
  targeted scans for `goose-instructor` / `instructor` references.
- Ran `git diff --check`.


## v2.5.0 - 2026-06-16

### Added

- Added `investigate`, a HIGH-tier Sherlock-style troubleshooting recipe for
  evidence-led, non-mutating root-cause analysis with quick/standard/deep depth,
  guided/autonomous modes, visual handoff support, and read-only WordPress and
  JavaScript/browser investigation guardrails.
- Added `goose-investigate [source]` to the direct recipe aliases and help text.
- Documented `investigate` as a one-off complex troubleshooting side path in the
  README and workflow docs, explicitly outside goose-cycle and routine
  per-story delivery.

### Changed

- Changed the installer default profile from `openai` to `chatgpt_codex` so
  `node scripts/install.ts` uses Goose's native ChatGPT Codex provider by
  default.
- Reframed `openai` as the codex-acp fallback profile in installer output,
  aliases, and model-tier documentation.
- Bumped the package and lockfile release version to v2.5.0.

### Fixed

- Fixed the new `investigate` recipe profile tier rendering so its HIGH-tier
  settings render valid Goose recipe YAML.
- Corrected the stale root package version in `package-lock.json` while bumping
  the release.

### Validation

- Rendered and validated all recipe templates for `chatgpt_codex`, `openai`,
  `hybrid`, `anthropic`, and `claude-acp` profiles.
- Ran `npm test`.
- Ran `git diff --check`.

## v2.4.2 - 2026-06-15

### Fixed

- Render enabled Goose extensions at the top of every Serena/Vestige bootstrap-enabled recipe so startup bootstrap blocks, direct recipe sessions such as `goose-plan` / `goose-learn`, and subagent-launched `/bootstrap-serena`, `/serena-bootstrap`, `/bootstrap-vestige`, `/vestige-bootstrap`, and `/serena-memorize` sessions have the developer shell tool required for `ima-mcp` gateway commands.
- Fixed `test-writer` extension ordering so `extensions:` renders before `sub_recipes:` like the other parent recipes.

### Validation

- Syntax-checked `scripts/install.ts` with `node --check`.
- Ran `npm test`.
- Rendered and validated recipe templates to temporary directories for `openai`, `hybrid`, and `chatgpt_codex` profiles.
- Verified no bootstrap-enabled recipe is missing `it.enabledExtensions()` and no `sub_recipes:` declaration appears before `it.enabledExtensions()`.
- Ran `git diff --check`.

## v2.4.1 - 2026-06-15

### Added

- Added dedicated `vision-handoff` recipe pinned to `codex-acp` / `gpt-5.5/medium` for read-only image analysis.

### Changed

- Updated brainstorm, plan, implement, test, review, document/learn, design-to-code, and software-development-cycle workflows to delegate image analysis through `vision_handoff`.
- Documented the current `chatgpt_codex` GPT-5.5 image transport limitation and the standard `codex-acp` hand-off path.
- Documented temporary-destination rendered-recipe validation so agents can validate without changing a user's installed Goose recipes.

### Validation

- Syntax-checked `scripts/install.ts` with `node --check`.
- Ran `npm test`.
- Rendered and validated recipe templates to temporary directories for `openai`, `hybrid`, and `chatgpt_codex` profiles.
- Validated rendered changed recipes with `goose recipe validate`.
- Ran `git diff --check`.

## v2.4.0 - 2026-06-12

### Added

- Added `goose-cycle`, a Node 24 Taskwarrior/Vestige-backed HITL conductor for
  the per-story `plan -> implement -> test -> review -> learn` workflow.
- Added `cycle-start` and `cycle-close` recipes for lifecycle normalization and
  final operational closeout.
- Added `docs/GOOSE-CYCLE.md` with operator guidance for the cycle workflow.
- Added shared `cycle-task-context` instructions so phase recipes can receive
  project/task context from the cycle conductor.
- Added shared `vestige-bootstrap` instructions plus `/vestige-bootstrap` and
  `/bootstrap-vestige`, a read-only current-session preference bootstrap through
  `ima-mcp vestige search "preferences" --json`.
- Added `/bootstrap-serena` as an alias for `/serena-bootstrap`.

### Changed

- Updated Serena bootstrap guidance across recipes, skills, setup docs, and
  preflight to require the `ima-mcp serena` CLI gateway for project activation,
  initial instructions, status, and memory reads instead of built-in/native
  Serena bootstrap or the Goose TypeScript SDK path.
- Updated Vestige guidance across recipes, skills, setup docs, and preflight to
  require the `ima-mcp vestige` CLI gateway and to stop recommending
  `execute_typescript` / `Vestige.*` usage.
- Included Vestige preference bootstrap after Serena bootstrap in
  Serena-enabled primary workflow recipes so sessions load user preferences
  before task-specific memory discovery.
- Updated phase recipes to accept `project` and `task` lifecycle context from
  `goose-cycle`, including scoped support for implementation `resolve-review`
  and review `rereview` phases.
- Updated installer output and slash-command registration for the new Serena and
  Vestige bootstrap aliases, and added a local `~/.local/bin/goose-cycle` shim.
- Renamed the old shell alias surface to `goose-cycle-umbrella` so the
  `goose-cycle` binary can own that command name.
- Updated Quick Start provider guidance around the recommended `chatgpt_codex`
  path, ACP limitations, and `ima-mcp` gateway usage.
- Updated the Quick Start MCP setup section with top recommended install notes
  for Serena, Vestige, and Qdrant; clarified `npx`/`uvx` examples in
  `config-template.yaml`; and documented the required Atlassian REST helper
  environment variables without committing secrets.
- Refreshed `config-template.yaml` against the current representative Goose
  extension/slash-command shape while keeping all sensitive values as
  placeholders.

### Fixed

- Prevented Serena and Vestige bootstrap/preflight paths from depending on the
  Goose TypeScript SDK, which can fail during SDK generation before the intended
  MCP call runs.
- Clarified that `ATLASSIAN_API_TOKEN` and `ATLASSIAN_BEARER_TOKEN` are the same
  token value for `mcp-atlassian` REST helper usage.

### Validation

- Syntax-checked `scripts/install.ts` with `node --check`.
- Ran `npm test`.
- Rendered and validated recipe templates with `node scripts/install.ts --validate`.
- Parsed `config-template.yaml` as YAML.
- Ran `git diff --check`.

## v2.3.0 - 2026-06-11

### Added

- Added Serena activation to the canonical Goose typed SDK bootstrap examples
  and direct MCP workflow documentation.

### Changed

- Updated Serena bootstrap workflows so project activation is always the first
  Serena action before `initial_instructions`, memory listing, or memory reads.
- Updated `/serena-bootstrap`, `/serena-memorize`, `/preflight`, and high-use
  planning/development prompts to require activation before memory access.
- Bumped affected recipe template versions for the Serena activation workflow
  fix.

### Fixed

- Prevented Serena memory bootstrap from failing with `No active project` when
  agents list or read memories before activating the current project.
- Updated preflight's Serena probe guidance to activate the project before
  checking initial instructions and memories.

### Validation

- Syntax-checked `scripts/install.ts` with `node --check` using the stable
  Hermit Node path.
- Rendered and validated all 28 recipe templates for all supported profiles:
  `openai`, `chatgpt_codex`, `hybrid`, `anthropic`, and `claude-acp`.
- Confirmed changed rendered recipes were produced for `serena-bootstrap`,
  `serena-memorize`, `preflight-check`, `brainstorm`, `plan`, and
  `wp-developer`.
- Ran `git diff --check`.

## v2.2.0 - 2026-06-11

### Added

- Added per-tier profile runtime-env metadata for provider behavior that cannot
  be expressed safely in recipe YAML, including `chatgpt_codex`
  `GOOSE_THINKING_EFFORT` values.
- Added high, medium, and low Goose CLI wrappers plus matching Goose Desktop
  wrappers in `.goose-aliases.example`.

### Changed

- Updated profile rendering to support whole per-tier recipe settings, so
  providers can include supported keys and omit unsupported keys such as
  `temperature`.
- Updated all profile-tiered recipe templates to render settings through
  `profileSettings(tier)` instead of hardcoding provider/model template
  variables.
- Updated `chatgpt_codex` profile behavior to keep base `gpt-5.5` recipe models
  and scope thinking effort through aliases/runtime env.
- Added installer and alias reminders to re-copy or merge `.goose-aliases.example`
  when profile thinking effort/runtime env changes.

### Fixed

- Prevented providers that reject recipe-level settings, such as unsupported
  `temperature` keys or model-suffix thinking effort, from receiving those
  settings through rendered recipes.

### Validation

- Syntax-checked `scripts/install.ts` with `node --check`.
- Syntax-checked `.goose-aliases.example` with `bash -n`.
- Rendered and validated all 28 recipe templates with `node scripts/install.ts
  --validate` for all supported profiles: `openai`, `chatgpt_codex`,
  `hybrid`, `anthropic`, and `claude-acp`.
- Ran `git diff --check`.

## v2.1.0 - 2026-06-11

### Added

- Added `/preflight`, a read-only Goose/MCP/tooling canary recipe with quick,
  full, and offline scopes, optional `/tmp` report writing, and a child
  subrecipe marker probe for validating subrecipe spawning.
- Added `goose-preflight`, a checklist skill for local tooling, recipe render,
  installed skills, MCP endpoints, Goose TypeScript SDK wrappers, Taskwarrior,
  browser, and Atlassian readiness checks.
- Added `docs/PREFLIGHT-CHECK.md` and `/preflight` slash-command registration
  through the installer and `config-template.yaml`.
- Added `docs/MCP-GOOSE-SDK-SIGNATURES.md` plus Goose TypeScript SDK signature
  sections to all `mcp-*` skills for the currently supported SDK namespaces:
  `AtlassianRovo`, `ChromeDevtools`, `Context7`, `Fetch`, `QdrantMemory`,
  `SequentialThinking`, `Serena`, `Tavily`, and `Vestige`.
- Added a `chatgpt_codex` model profile for Goose's native ChatGPT Codex
  provider.

### Changed

- Updated Serena bootstrap instructions and the `mcp-serena` skill to allow
  loading the skill as bootstrap support, while preserving the rule that
  project-memory bootstrap happens before task-specific discovery.
- Documented correct Serena Goose SDK calls, including
  `Serena.initialInstructions({})`, `Serena.listMemories({})`,
  `Serena.readMemory({ memory_name: "core" })`, and `{ result: string }`
  response handling.
- Updated Context7 and Tavily guides to match the supported Goose SDK wrapper
  parameters and avoid unsupported fields.
- Updated README and setup docs for the 50-skill bundle, preflight workflow,
  MCP SDK reference, and native ChatGPT Codex profile.
- Removed recipe-level `temperature` settings because not all providers and
  models support them, and bumped affected recipe template versions.
- Added a shared `mode` parameter contract to the core planning,
  implementation, testing, review, and document/learn recipes. The default
  `guided` mode preserves HITL gates, while `autonomous` mode proceeds without
  routine approval prompts and stops on explicit blockers.
- Updated implementation recipes to make parent-owned verification compatible
  with autonomous benchmark orchestration.
- Updated `software-development-cycle` instructions to route JavaScript work
  through `js-developer` and keep implementation children scoped to
  parent-owned test/review closeout.
- Updated Taskwarrior guidance to prefer the default user-scoped
  `~/.taskrc`/`~/.task` setup and native `project:<name>` / `task context`
  scoping instead of project-local `TASKRC`/`TASKDATA` wrappers.

### Fixed

- Fixed MCP skill guidance that previously documented only native/direct tool
  names by adding supported Goose TypeScript SDK namespaces, function names,
  basic request shapes, and return-shape cautions.
- Fixed Serena bootstrap SDK guidance that could lead agents to use the invalid
  `memory_file_name` parameter or assume `listMemories` returns `.memories`.
- Clarified that Taskwarrior has no supported Goose SDK wrapper in this toolset;
  agents should use the `task` CLI rather than inventing `Taskwarrior.*` calls.

### Validation

- Syntax-checked `scripts/install.ts` with `node --check`.
- Rendered and validated all 28 recipe templates with `node scripts/install.ts
  --validate` for all supported profiles: `openai`, `chatgpt_codex`,
  `hybrid`, `anthropic`, and `claude-acp`.
- Directly validated rendered `preflight-check.yaml` and
  `preflight-probe.yaml` with `goose recipe validate`.
- Confirmed the installer copies all 50 skills and renders 28 recipes.
- Ran `git diff --check` and scanned for stale v2.0.3 / 49-skill references.

## v2.0.3 - 2026-06-09

### Added

- Added `docs/RECOMMENDED-USE.md`, a practical use guide for the recommended
  human-in-the-loop workflow.
- Added `goose-learn`, a dedicated shell alias for the `document-learn` closeout
  recipe.

### Changed

- Reframed the recommended workflow as two explicit HITL paths:
  `brainstorm -> task-planner -> document-learn` for product requirements and
  `plan -> implement -> test -> review -> document-learn` for per-story
  delivery.
- Marked `goose-cycle` and autonomous operation as experimental rather than the
  recommended default.
- Updated README and `goose-help` workflow guidance to match the requirements
  decomposition and per-story delivery split.

## v2.0.2 - 2026-06-09

### Changed

- Changed `scripts/install.ts` so it does not modify
  `~/.config/goose/config.yaml` by default. The installer now prints
  slash-command config for manual merging.
- Added an explicit `--register-slash-commands` installer flag for users who
  want automatic slash-command registration; it creates a timestamped
  `config.yaml` backup before writing.
- Updated setup docs to stop recommending copying `config-template.yaml` over
  an existing Goose config.

## v2.0.1 - 2026-06-09

### Fixed

- Fixed recipes that declare `sub_recipes` so they render enabled extensions
  from each developer's local `~/.config/goose/config.yaml` at install time.
  This avoids Goose's auto-injected `summon` extension becoming the only
  available extension while preserving per-machine extension compatibility.
- Fixed `goose-wp` and other sub-recipe parent sessions losing Developer,
  Serena, Vestige, Qdrant, Tavily, Context7, and other configured tools when
  launched through `goose run --recipe`.

### Changed

- Updated `scripts/install.ts` to derive recipe extension blocks from enabled
  local Goose config entries rather than a repo-maintained static baseline.
- Updated docs to describe the Goose `sub_recipes` extension behavior and the
  install-time compatibility approach.
- Bumped affected sub-recipe parent templates to `2.0.1`.

### Validation

- Rendered and validated all recipe templates with `node scripts/install.ts
  --validate`.
- Confirmed rendered `wp-developer.yaml` matches the enabled extension set from
  local Goose config with no missing or extra enabled extensions.

## v2.0.0 - 2026-06-09

### Breaking Changes

- Made `openai` the default installer profile, rendering recipes through
  `codex-acp` and GPT-5.5 effort tiers by default.
- Replaced the old recipe-tier vocabulary based on `opus`, `sonnet`, and
  `haiku` with provider-neutral `HIGH`, `MID`, and `LOW` profile tiers.
- Updated recipes to render both `goose_provider` and `goose_model` from
  profile variables, so a recipe can select the provider/model it needs
  without relying on global `goose configure` defaults.
- Removed per-recipe `extensions` whitelists. Recipes now rely on the user's
  installed and configured Goose extensions rather than redeclaring access in
  every recipe.
- Removed the active `task-master` / `task-runner` workflow and documented the
  replacement human-in-the-loop flow:
  `brainstorm -> plan -> task-planner -> implement -> test -> review -> document/learn`.
- Reworked `scripts/install.ts` to require `high`, `mid`, and `low` profile
  entries and to drop fallback handling for deprecated tier names.

### Added

- Added shared `instructions/memory-workflow.md` coverage to explain Serena,
  Vestige, and Qdrant memory roles consistently across recipes.
- Added shared `instructions/subrecipe-delegation.md` coverage for
  self-contained child-session briefs and sub-recipe execution rules.
- Added `design-to-code`, a HIGH-tier dedicated recipe for turning screenshots,
  mockups, Jira context, or implementation prompts into WordPress/Bootstrap
  implementation work.
- Added `scorecard`, a HIGH-tier recipe for evidence-based project, PR, or
  codebase quality scoring.
- Added `scorecard` as an explicit `code-review` sub-recipe mode for scoring
  requests without forcing scorecards into every normal review.
- Added `espocrm-api`, `discourse-admin`, and `ember-discourse` skills from the
  selected remaining `ima-claude` migration set.
- Added `goose-design-to-code` and `goose-scorecard` aliases.
- Added `docs/SUB-RECIPE-DELEGATION.md` and replaced the old
  task-master-oriented delegation document.

### Changed

- Converted recipes from root-level source YAML files to build-time Eta
  templates under `recipes/<name>/recipe.yaml.eta`.
- Reworked the installer into a render/install pipeline that injects shared
  snippets, writes generated Goose-compatible YAML to the recipe install
  directory, preserves Goose `{{ parameter }}` runtime syntax, rewrites
  source-template subrecipe paths to flat installed recipe paths, and applies
  provider/model profile settings during render.
- Updated model profiles for the new `high`, `mid`, and `low` schema:
  `openai`, `hybrid`, `anthropic`, and `claude-acp`.
- Updated `explore` as a LOW-tier, sub-recipe-oriented codebase discovery
  recipe.
- Updated `review-verify` to HIGH because it verifies critical review findings.
- Updated `goose-ship-it` as a MID-tier direct recipe.
- Refreshed `adversarial-review` as an experimental dual-model review flow
  with explicit child provider/model settings.
- Converted `architect` and `prompt-starter` into current-session slash-command
  recipes instead of dedicated model-pinned sessions.
- Updated brainstorm, plan, implementation, testing, review, research, and
  documentation recipes around the shared memory and sub-recipe contracts.
- Updated README, migration, implementation, model-tier, setup, workflow, and
  software-cycle docs for the 2.0 workflow architecture and 49-skill bundle.
- Bumped all recipe template versions to `2.0.0` because the recipe profile and
  provider rendering contract changed globally.

### Removed

- Removed `recipes/task-master` and `recipes/task-runner` from the active
  workflow.
- Left `quasar-fp`, `docs-organize`, and `jira-checkpoint` intentionally
  unmigrated from the remaining `ima-claude` skill review.

### Validation

- Syntax-checked `scripts/install.ts` with `node --check`.
- Ran `git diff --check`.
- Rendered and validated all 26 recipe templates with the installer for all
  supported profiles: `openai`, `hybrid`, `anthropic`, and `claude-acp`.
- Confirmed the installer copies all 49 skills, including `espocrm-api`,
  `discourse-admin`, and `ember-discourse`.
- Scanned for stale `46` skill-count references and stale `.claude` paths in
  the migrated skills.

## v1.6.2 - 2026-06-04

### Added

- Added `ima-email-creator`, an IMA-branded email HTML rendering skill with
  table-based email layouts, EspoCRM prep, CSS inlining helpers, newsletter,
  drip, campaign, and WordPress transactional email references.
- Added `mcp-taskwarrior`, a Taskwarrior CLI skill for safe local task
  inspection and updates with `task`, including temporary `TASKRC`/`TASKDATA`
  experiments, JSON export parsing, filters, dates, contexts, import/export,
  and hooks.
- Added a Serena project memory standard for cross-harness project context:
  `core`, `conventions`, `tech_stack`, `suggested_commands`,
  `task_completion`, and `memory_maintenance`.
- Added an `mcp-serena` migration helper that converts `.goosehints`,
  `CLAUDE.md`, and `AGENTS.md` into reviewable standard Serena memory blocks.
- Added the Vestige task lifecycle protocol for carrying Taskwarrior, Jira, or
  project task work through plan, implementation, review, resolution, and
  closeout with one shared task memory thread.
- Added `serena-bootstrap`, a reusable recipe registered as `/serena-bootstrap`
  for loading standardized Serena project memories on demand inside an
  interactive Goose session.
- Added `serena-memorize`, a reusable recipe registered as `/serena-memorize`
  for classifying concise project-context notes and updating the appropriate
  standardized Serena memories.

### Release Payload

This release intentionally includes all current local repository changes, not
only the latest session's work:

- Updated release and operator docs: `README.md`, `CHANGELOG.md`,
  `.goosehints`, `docs/IMPLEMENTATION-GUIDE.md`,
  `docs/MIGRATION-GUIDE.md`, and `docs/SKILLS-AND-MCP-SETUP.md`.
- Updated install/config artifacts: `scripts/install.ts`,
  `config-template.yaml`, and `.goose-aliases.example`.
- Added new recipes: `recipes/serena-bootstrap.yaml` and
  `recipes/serena-memorize.yaml`.
- Added new skills and support files: `skills/ima-email-creator/`,
  `skills/mcp-taskwarrior/`, and
  `skills/mcp-serena/scripts/migrate-context-to-serena.py`.
- Updated existing skills: `skills/mcp-serena/SKILL.md` and
  `skills/mcp-vestige/SKILL.md`.
- Updated changed root recipes:
  `adversarial-review-claude`, `adversarial-review-openai`,
  `adversarial-review`, `architect`, `brainstorm`, `code-review`,
  `document-learn`, `explore`, `implement`, `js-developer`, `plan`,
  `prompt-starter`, `review-verify`, `software-development-cycle`,
  `task-master`, `task-planner`, `task-runner`, `test-writer`,
  `ui-ux-designer`, and `wp-developer`.

### Changed

- Hardened the `plan` recipe's defect-ticket research flow so Jira keys,
  pasted tickets, defect descriptions, routes, stack traces, and feature names
  trigger autonomous Jira, memory, code, Serena, WordPress/DDEV, and browser
  discovery before asking humans for file paths.
- Updated the WordPress developer recipe to load `ima-email-creator` when
  rendering branded, email-client-safe HTML or WordPress transactional email
  templates.
- Updated README, migration, implementation, and skills/MCP setup docs for the
  46-skill bundle and 10 MCP/API guide skills.
- Updated all Serena-enabled recipes to bootstrap standard Serena memories
  before project-specific action, with read-only recipes reporting missing
  migrations instead of writing memories.
- Updated Serena-enabled recipes to follow the loaded Vestige task lifecycle
  protocol for task-scoped work.
- Hardened the Serena bootstrap so project-specific requests load standard
  memories before Taskwarrior, Jira, Vestige, file discovery, or asking users
  for local paths/config.
- Hardened Serena-enabled recipes so bootstrap is the first tool action at
  session start, before greeting or waiting for open-mode input.
- Reinforced prompt-level Serena bootstrap instructions for the most-used
  aliases: `goose-brainstorm`, `goose-plan`, `goose-wp`, `goose-js`,
  `goose-review`, `goose-implement`, and `goose-cycle`.
- Updated `plan` and `mcp-taskwarrior` so missing default Taskwarrior rc files
  trigger Serena memory lookup for `TASKRC`, `TASKDATA`, wrapper commands, and
  project-local task setup before asking the user.
- Updated `goose-implement` shell alias so it can launch open interactive
  implementation orchestration without requiring a task/Jira argument.
- Extended the Serena migration helper with `--include-org-standards` to seed
  the shared Vestige task lifecycle into project memories.
- Bumped changed Serena-enabled recipe versions and new Serena command recipes
  to `1.6.2`.
- Added the release policy that recipe YAML versions are bumped only when that
  specific recipe changes.

### Validation

- Validated frontmatter for `skills/ima-email-creator`, `skills/mcp-serena`,
  `skills/mcp-vestige`, and `skills/mcp-taskwarrior`.
- Validated all 23 active root recipe files and all 3 flat `recipes/*.yaml`
  files with `goose recipe validate`.
- Validated `.goose-aliases.example` and live `~/.goose-aliases` with
  `bash -n`.
- Ran `node ./scripts/install.ts --profile openai` and confirmed
  `ima-email-creator`, `mcp-taskwarrior`, updated Serena skills, and Serena
  command recipes install to the expected local Goose/Summon locations.
- Verified `/serena-bootstrap` and `/serena-memorize` slash-command
  registration is idempotent.
- Ran `git diff --check`.
- Verified local Taskwarrior CLI behavior against an isolated temporary
  `TASKRC`/`TASKDATA` setup.

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
