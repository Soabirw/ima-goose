# Sub-Recipe Delegation

Goose sub-recipes are isolated child sessions declared in `sub_recipes:` blocks.
The old `task-master` / `task-runner` recipes are deprecated and removed; this
document now describes the shared sub-recipe contract used by the active
recipes.

## Active Parents

| Parent recipe | Sub-recipes |
|---|---|
| `software-development-cycle` | brainstorm, plan, task-planner, explore, implement, wp-developer, test-writer, code-review, document-learn |
| `brainstorm` | explore |
| `plan` | explore |
| `implement` | test-writer, code-review |
| `wp-developer` | test-writer, code-review |
| `js-developer` | test-writer, code-review |
| `code-review` | review-verify, scorecard |
| `design-to-code` | explore, wp-developer, test-writer, code-review |
| `adversarial-review` | adversarial-review-claude, adversarial-review-openai |
| `instructor` | vision-handoff, explore |

`instructor` is a HIGH-tier read-only parent; its child briefs must remain evidence-gathering or visual-interpretation only, not implementation/testing/review/documentation work.

## Child Session Contract

A parent must pass a complete brief:

```markdown
## Objective
[what this child must do]

## Context
[memory names, file paths, ticket keys, PR URL, relevant prior decisions]

## Scope
[in scope / out of scope]

## Constraints
[read-only, no external posting, approved files, security rules]

## Acceptance Criteria
[how the parent will judge the result]

## Expected Output
[summary, diff, test result, review findings, memory update]
```

The child should not rely on the parent session's hidden context. If the brief
is insufficient, the child should return a blocker instead of guessing.

## Tier Assignments

| Sub-recipe | Tier | Notes |
|---|---|---|
| `explore` | LOW | Read-only, focused findings packet only |
| `implement` | MID | General coding |
| `wp-developer` | MID | WordPress implementation |
| `js-developer` | MID | JavaScript/TypeScript implementation |
| `test-writer` | MID | Test creation and repair |
| `code-review` | HIGH | Security/correctness review |
| `review-verify` | HIGH | Verifies critical findings, not lower than reviewer |
| `scorecard` | HIGH | Project, PR, or codebase quality scoring |
| `design-to-code` | HIGH | Design artifact translation and implementation orchestration |
| `task-planner` | HIGH | Human-in-the-loop decomposition |
| `document-learn` | MID | Docs and memory closeout |

## Parallelism

Parents may call independent sub-recipes in parallel, but dependent work should
be serial. For example, implementation and tests can sometimes run in parallel
when a plan is precise; code review should wait for the final diff and test
results.

## Direct-Only Recipes

`goose-ship-it` is not a sub-recipe. It manipulates release branches/tags and
should be launched directly with explicit user intent.
