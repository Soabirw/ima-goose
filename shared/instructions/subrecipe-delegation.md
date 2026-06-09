## Subrecipe Delegation

The parent recipe orchestrates; specialist recipes do bounded work in
fresh sessions with their own generated provider/model settings.

This instruction only describes the delegation contract. The parent recipe
must still declare its available tools with `sub_recipes:`. Do not assume a
specialist exists unless it is declared in the current recipe.

### Delegation Model

When a recipe declares `sub_recipes`, Goose exposes each declared subrecipe as
a callable tool. Calling that tool starts a separate session and returns a
summary to the parent.

Subrecipe sessions are isolated:
- They do not share the parent conversation history.
- They do not share sibling subrecipe history.
- They do not inherit unstated assumptions from the parent.
- They should receive a complete, standalone brief every time.

Do not rely on nested subrecipe behavior for work the parent must sequence.
If the parent owns the workflow, declare every phase it needs directly.

### When to Delegate

Delegate when a task is bounded, separable, and cheaper or cleaner for a
specialist recipe to handle. Keep orchestration and judgment in the parent;
push focused discovery, implementation, testing, review, and closeout to the
appropriate specialist.

Common routing:
- `explore`: read-only file discovery, code maps, "where is this?", quick
  architecture context, and focused search.
- `plan_task`: local architecture, signatures, data flow, or task decomposition
  before implementation.
- `implement`: non-WordPress implementation, bug fixes, refactors, and generic
  coding tasks.
- `wp_implement`: WordPress, PHP plugin/theme work, IMA Forms, Bootstrap,
  WP-CLI, and WordPress security-sensitive work.
- `write_tests`: test creation, test repair, and verification harness work.
- `code_review`: read-only review, security analysis, FP compliance, PR/diff
  review, and second-pass validation.
- `document_learn`: documentation updates, memory closeout, and durable
  learning after implementation/review is complete.

Only use routes that are actually declared by the current parent recipe.

### Parallelism

Run independent subrecipes in parallel when they do not depend on each other's
outputs and do not write overlapping files.

Run dependent subrecipes serially when one output becomes another's input.
Examples:
- `explore` before `plan_task` when the plan needs codebase findings.
- implementation before tests when tests need changed file paths.
- tests before review when review needs test results.
- review before closeout when closeout needs final findings.

### Self-Contained Briefs

Every subrecipe brief must be complete enough to execute without the parent
chat. Never write "as discussed", "see above", or "use the previous context".

Include:
- Goal and exact expected output.
- Project root and relevant file paths.
- Acceptance criteria and non-goals.
- Security, brand, FP, regulatory, or workflow constraints.
- Prior artifacts the child needs, quoted or summarized directly.
- Ownership boundaries, especially files the child may edit.
- Whether the child is read-only, implementation-only, or allowed to run
  verification.
- How to report back: files changed, findings, blockers, risks, tests run,
  and recommended next step.

For multiple implementation children, assign disjoint write scopes. Tell each
child that other work may be happening in parallel and it must not revert
unrelated changes.

### Failure and Escalation

If a subrecipe fails, read the returned summary and identify whether the brief
was missing context, the task was too broad, tools were unavailable, or the
requirements were ambiguous.

Retry at most once with a revised brief that adds the missing decision or
context. Do not blindly retry the same prompt.

If the child surfaces an architectural fork, scope conflict, security concern,
or ambiguous requirement, treat it as an escalation to the parent. Decide in
the parent whether to narrow scope, expand scope, ask the user, abandon the
task, or dispatch a different specialist. Re-dispatch only after adding the
decision to the brief.

### Parent Responsibilities

The parent recipe owns:
- Decomposition and dependency ordering.
- Selecting declared subrecipes.
- Making tradeoff decisions and resolving escalations.
- Tracking outputs and integration state.
- Ensuring tests/review/closeout happen at the right workflow level.
- Producing the final user-facing summary.

The child recipe owns only the task in its brief.
