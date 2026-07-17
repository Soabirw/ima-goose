# Suggested Commands

- Fresh setup from repo root: `node scripts/install.ts`.
- Install with provider profile: `node scripts/install.ts --profile chatgpt_codex|chatgpt_codex_56|openai|hybrid|anthropic|claude-acp|sakana`.
- Validate Goose sees a recipe without executing: `goose run --recipe <recipe-name> --explain`.
- Run preferred full cycle interactively: `goose run --recipe software-development-cycle --interactive`.
- Run a Taskwarrior/Vestige-backed story cycle: `goose-cycle start --task-project <taskwarrior-project> [--task <id-or-uuid>]`.
- Resume the active Taskwarrior/Vestige-backed story cycle from `.goose-cycle/active.json`: `goose-cycle next --task-project <taskwarrior-project> [--dry-run]`.
- Run one manual story phase: `goose-cycle plan|implement|test|review|learn|resolve-review|rereview --task-project <taskwarrior-project> --task <id-or-uuid> [--dry-run]`.
- Close an approved story manually: `goose-cycle close --task-project <taskwarrior-project> --task <id-or-uuid> [--commit]`. Autonomous automatic close requests commit behavior; guided automatic close omits commit unless `--commit` was supplied.
- Manual `goose-cycle` phase aliases map to concrete recipes; dry-run to verify command shape without writing `.goose-cycle/active.json`.
- Run a local recipe directly: `goose run --recipe ./implement/recipe.yaml --interactive`.
- Validate recipe files after YAML/instruction changes: `node scripts/install.ts --validate`; for isolated checks, validate the rendered recipe YAML with `goose recipe validate <path-to-rendered-recipe.yaml>`.
- Run repository tests: `npm test` or focused `node --test tests/<file>.test.js`.
- Check whitespace errors before commit: `git diff --check`.
- Inspect changed files: `git status --short` and `git diff -- <path>`.
- Verify skills installed globally: `ls ~/.agents/skills/ | wc -l` (current expected repository count: 52) and check `/skills` inside Goose.
- Verify Goose provider binaries: `which claude-agent-acp`; optionally `which codex-acp`.
- Serena memory reference sanity check after memory edits: use the available Serena memory check command if present; otherwise inspect `ima-mcp serena memory list --json` and targeted `ima-mcp serena memory read <name> --json`.
- Canonical testing paths: focused `node --test tests/<file>.test.js`; full `npm test`; rendered-recipe validation `node scripts/install.ts --validate --dest "$(mktemp -d)"`.
