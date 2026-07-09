# Task Completion

- For recipe YAML/instruction changes: run `node scripts/install.ts --validate` or validate the rendered changed recipe YAML with `goose recipe validate <path-to-rendered-recipe.yaml>`. For broad recipe changes, validate all rendered recipes.
- For installer/profile changes: run `node scripts/install.ts --profile <affected-profile>` when safe for the local environment, or at minimum syntax-review `scripts/install.ts` and verify profile parsing logic against changed `profiles/*.yaml`.
- Always run `git diff --check` before final handoff on code/docs/recipe edits.
- For docs-only changes: inspect rendered Markdown mentally for broken links/headings and run `git diff --check`.
- For skill changes: ensure frontmatter has `name` and `description`; verify referenced relative files exist; run installer/validation if the global skill copy should be updated locally.
- For workflow changes touching subrecipes: verify parent/child paths still match installer flattening behavior and child briefs remain standalone.
- For goose-cycle workflow changes: verify Taskwarrior project filtering uses `--task-project`; `task_project` is not a Serena project input. Confirm `.goose-cycle/active.json` resume statuses, `next` behavior, approved review/rereview automatic `document-learn -> cycle-close`, and guided/autonomous commit semantics are covered by docs/tests.
- For goose-cycle review/rereview verdicts, ensure Taskwarrior annotations provide the latest explicit verdict and stale opposing `approved`/`needs-fix` tags are cleared when safe; do not let stale tag history drive loops.
- For public-facing IMA copy or UI text: check visible copy, metadata, alt text, examples, and docs for `Honest Medicine™` trademark rule.
- Before final response, summarize changed files or memories, validations run, and any validation not run.