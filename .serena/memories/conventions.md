# Conventions

- Project/package release is currently `v2.7.4`; recipe template versions are bumped only when that specific recipe's behavior, instructions, parameters, or workflow changes.
- Source recipes use portable model tiers (`opus`, `sonnet`, `haiku`). `scripts/install.ts` rewrites tiers and provider fields according to `profiles/*.yaml` at install time.
- Root-level recipe directories are installed as flat files: `<recipe>/recipe.yaml` -> `~/.config/goose/recipes/<recipe>.yaml`; installer rewrites sibling subrecipe paths `../name/recipe.yaml` -> `name.yaml`.
- Full workflow should prefer `software-development-cycle`; it is intentionally flattened and declares phase recipes directly because Goose child sessions are isolated.
- Operational story workflow should prefer `goose-cycle` when Taskwarrior/Vestige hold the queue and lifecycle thread. Manual phase names are operator aliases; do not assume every alias is a recipe name.
- In goose-cycle work, `task_project`/`--task-project` is the Taskwarrior project filter, not a Serena project name/path. Serena activation is always owned by the Serena project bootstrap.
- In review/rereview phases, Taskwarrior `approved` and `needs-fix` tags are current-state markers, not append-only history. On an unambiguous narrow task selection, remove the stale opposing review tag when safe and record an explicit timestamped annotation; latest explicit review annotation wins over stale/conflicting tags. If tags conflict without a resolving annotation, stop as ambiguous rather than looping.
- `software-development-cycle` must not call `task-master`; it owns brainstorm, plan, decompose, implementation, tests, review, and document/learn phase calls directly.
- Child recipe briefs must be complete and standalone. Avoid phrases like "as discussed" or depending on prior parent context.
- Implementation children can run in `implementation_only`/parent-owned verification mode; when instructed, they must not call `write_tests` or `code_review`.
- `document-learn` consumes completed artifacts only and routes memory by durability: Serena for stable project/session state, Vestige for decisions/bugs/patterns/preferences/task lifecycle, Qdrant for durable reference docs/standards/PRDs.
- Skills are deep domain knowledge loaded by Summon; MCP extensions expose tools. Recipes should include both the extension and the relevant skill guidance when behavior matters.
- Test strategy is evidence-first: choose the smallest repository-supported level sufficient to prove approved behavior; do not invent unsupported integration or E2E infrastructure.
- Public-facing IMA copy/UI/metadata/alt text must use `Honest Medicine™`, not unmarked `Honest Medicine`.
- Serena best use: activate the project first, call `initial_instructions` before code navigation in a fresh Serena-enabled session, use Serena symbolic navigation before reading code, and maintain standard onboarding memories so future sessions can read `mem:core` first.
