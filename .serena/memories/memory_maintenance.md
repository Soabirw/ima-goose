# Memory Maintenance

## Discovery Model

- Core principle: progressive discovery through references, building a graph of memories.
- Initially, agents are provided with the list of all memories (names only).
- Agents should read `mem:core` as the top-level entry point (graph root).
  This memory should contain references to other memories covering major project domains.
  The referenced memories shall, in turn, contain even more specific memories, and so on.
  The depth of the graph shall depend on the project complexity.
- Use topics/folders to group related memories in order to make the content structure explicit.
  Folders can mirror project structure (e.g. modules like frontend/backend) or topics like debugging, architecture, etc.
- Memory references must use a mem: prefix inside backticks, e.g. `mem:frontend/core`.
  The surrounding text should clearly indicate when to read the memory/which content to expect.
  The text should provide more precise guidance than the memory name alone,
  i.e. avoid a reference like "frontend debugging: `mem:frontend/debugging` and instead make clear which aspects of frontend debugging are covered.
- Memories themselves should not contain information about when to read them; this is the responsibility of the referring memory.

## Style

Dense agent notes, not prose docs. Prefer invariants, terse bullets.
Avoid obvious context, rationale, and examples unless they prevent likely mistakes.
Keep guidance durable and generalizable, not task-local.

## Add/update threshold

Add or update memories only with stable, non-obvious project conventions that avoid complex rediscovery in the future.
Do not add: quick-read facts; generic language/framework knowledge; one-off task notes; volatile line-level details; behavior likely to change soon.

## Routing

- Serena stores stable project instructions and runtime project context.
- Vestige stores the evolving task lifecycle thread across plan -> implementation -> review -> resolution -> closeout.
- Qdrant stores long-lived reference docs, standards, PRDs, architecture docs, and reusable research.

## Maintenance Actions

- Renaming memories: References are updated automatically if handled via Serena's memory rename tool.
- Checking for stale memories (e.g. after deletion): Call `serena memories check` for a report.
- 2026-06-26: refreshed `mem:core`, `mem:conventions`, `mem:tech_stack`, and `mem:suggested_commands` after the `goose-cycle` manual phase alias mapping story so future sessions know manual phase aliases map to concrete recipes and current repo tooling includes root `package.json` scripts.
- 2026-07-09: stable Serena project config and standard onboarding memories are intentionally tracked in git. `.serena/.gitignore` ignores cache, `project.local.yml`, and non-standard/task-local memories while unignoring `core`, `conventions`, `tech_stack`, `suggested_commands`, `task_completion`, and `memory_maintenance`.
- 2026-07-17: refreshed all tracked standard memories so this repository's testing contract is discoverable before test-strategy selection.
