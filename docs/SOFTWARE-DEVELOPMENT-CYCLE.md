# Software Development Cycle

`software-development-cycle` is the top-level Goose recipe for the IMA software
development workflow:

```text
Brainstorm -> Plan -> Decompose -> Implement -> Test -> Review -> Document/Learn
```

The recipe is intentionally flattened. It declares every phase recipe directly
and does not call `task-master`, because Goose subrecipe sessions are isolated
and should receive complete, standalone briefs.

## Recipe Parameters

| Parameter | Default | Options | Purpose |
|---|---:|---|---|
| `source` | `""` | string | Raw idea, Serena memory, file path, Jira key, existing plan, or story spec. |
| `mode` | `guided` | `guided`, `autonomous` | Whether to stop for user approval at phase gates. |
| `scope` | `feature` | `feature`, `story` | Whether to run the full feature flow or a single story flow. |
| `max_review_fix_cycles` | `2` | number | Maximum review/fix loops per story. |

## Flattened Phase Graph

The umbrella declares these subrecipes directly:

| Phase | Tool name | Recipe |
|---|---|---|
| Brainstorm | `brainstorm` | `brainstorm/recipe.yaml` |
| Plan | `plan_feature` | `plan/recipe.yaml` |
| Decompose | `decompose` | `task-planner/recipe.yaml` |
| Explore | `explore` | `explore/recipe.yaml` |
| Implement | `implement` | `implement/recipe.yaml` |
| WordPress implement | `wp_implement` | `wp-developer/recipe.yaml` |
| Tests | `write_tests` | `test-writer/recipe.yaml` |
| Review | `code_review` | `code-review/recipe.yaml` |
| Document/Learn | `document_learn` | `document-learn/recipe.yaml` |

Implementation children must be called with parent-owned verification context:

```text
Do implementation only. The software-development-cycle parent owns tests,
code review, and document/learn closeout. Do not call write_tests or
code_review from inside this child session.
```

## Artifact Contracts

Every phase handoff should be explicit. Do not rely on parent conversation
memory inside a child session.

```yaml
requirements_brief:
  source: string
  goal: string
  users_and_value: []
  constraints: []
  success_criteria: []
  open_questions: []

technical_plan:
  approach: string
  affected_modules: []
  api_contracts: []
  pure_core_impure_shell_boundaries: []
  test_strategy: []
  risks: []
  files_expected: []

epic_story_task_graph:
  epic:
    id: string
    stories:
      - id: string
        title: string
        acceptance_criteria: []
        tasks: []

story_execution_result:
  story_id: string
  changed_files: []
  implementation_summary: string
  known_risks: []
  test_report: {}
  review_verdict: approve|request_changes|blocked
  review_findings: []
  docs_and_memory: {}
```

## Mode Behavior

`guided` stops after Brainstorm, Plan, Decompose, each Story Review, and final
Document/Learn. The user can approve, edit, skip, or rerun each phase. Guided
mode also requires explicit approval before Jira creation, branch/PR operations,
or posting review comments.

`autonomous` proceeds through the same gates without asking, but stops on
blockers: missing credentials, ambiguous destructive actions, failed tests after
retry, review findings that exceed the fix loop cap, artifact mismatch, or dirty
worktree conflicts. It should not silently post irreversible external comments
unless the called recipe already has explicit approval handling.

## Story Execution

Feature scope runs Brainstorm, Plan, and Decompose first. Then each story runs
in dependency order:

1. Optional `explore`.
2. `implement` or `wp_implement`.
3. `write_tests`.
4. `code_review`.
5. Fix findings up to `max_review_fix_cycles`.
6. `document_learn` with `update_scope: story`.

After every story completes, run `document_learn` once with
`update_scope: feature`.

Story scope skips feature brainstorming and decomposition when the input is
already a Jira story, story spec, or story execution plan.

## Document/Learn Contract

`document-learn` consumes completed artifacts only. It does not implement code.
It updates docs using the three-tier model:

| Tier | Examples |
|---|---|
| Active | README, architecture docs, API docs, workflow docs |
| Archive | decisions, post-mortems, historical notes |
| Transient | scratch files, session notes, git-ignored working notes |

Memory routing:

| Layer | Store |
|---|---|
| Serena | project-scoped session state and handoff summaries |
| Vestige | decisions, bugs, preferences, implementation patterns |
| Qdrant | durable standards, PRDs, reference architecture docs |
