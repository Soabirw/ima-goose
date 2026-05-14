# Task Master Sub-Recipes

How task-master and the software-development-cycle umbrella delegate work to
specialist sub-recipes via declarative YAML.

---

## How Sub-Recipes Work

Sub-recipes are declared in a recipe's YAML under a `sub_recipes:` key. Goose auto-generates one callable tool per sub-recipe. Parent recipes invoke them by tool call with a self-contained brief — not via a CLI flag, not via the orchestrator extension.

```yaml
# From task-master/recipe.yaml
sub_recipes:
  - name: implement
    path: ../implement/recipe.yaml
  - name: wp_implement
    path: ../wp-developer/recipe.yaml
  - name: write_tests
    path: ../test-writer/recipe.yaml
  - name: code_review
    path: ../code-review/recipe.yaml
  - name: explore
    path: ../explore/recipe.yaml
  - name: plan_task
    path: ../task-planner/recipe.yaml
```

When task-master invokes the `wp_implement` tool, Goose starts a fresh wp-developer session with its own pinned model (Sonnet 4.6), its own extensions, and the brief as input. The sub-session is fully isolated — it has no memory of the parent task-master session.

**Important:** There is no `--sub-recipe` CLI flag. Sub-recipes are a YAML declaration; no flags are needed at run time.

**No nested-subrecipe assumption:** Goose child sessions are isolated. A parent
recipe should not rely on a child recipe's own `sub_recipes:` for work that the
parent must sequence. `software-development-cycle` flattens the full workflow by
declaring every phase directly and instructing implementation children that the
parent owns tests and review.

---

## Software Development Cycle Umbrella

`software-development-cycle/recipe.yaml` is the top-level recipe for the IMA
Brainstorm -> Plan -> Decompose -> Implement -> Test -> Review -> Document/Learn
cycle. It does not call `task-master`.

```yaml
# From software-development-cycle/recipe.yaml
sub_recipes:
  - name: brainstorm
    path: ../brainstorm/recipe.yaml
  - name: plan_feature
    path: ../plan/recipe.yaml
  - name: decompose
    path: ../task-planner/recipe.yaml
  - name: explore
    path: ../explore/recipe.yaml
  - name: implement
    path: ../implement/recipe.yaml
  - name: wp_implement
    path: ../wp-developer/recipe.yaml
  - name: write_tests
    path: ../test-writer/recipe.yaml
  - name: code_review
    path: ../code-review/recipe.yaml
  - name: document_learn
    path: ../document-learn/recipe.yaml
```

The umbrella owns phase gates, story order, review/fix loop limits, and
document/learn closeout. Each child receives a complete artifact bundle because
it has no parent memory.

---

## Sub-Recipe Index

### implement
- **Model:** Sonnet 4.6
- **Use for:** Non-WordPress code — JS, Python, generic PHP, Node
- **Also declares:** `write_tests`, `code_review` as its own sub-recipes

### wp_implement (wp-developer recipe)
- **Model:** Sonnet 4.6
- **Use for:** WordPress PHP, theme, plugin, IMA Forms, Bootstrap/SCSS
- **Also declares:** `write_tests`, `code_review` as its own sub-recipes
- **Summon loads:** `php-fp-wordpress`, `ima-bootstrap`, `ima-forms-expert`, `jquery`, `wp-ddev`/`wp-local`

### write_tests (test-writer recipe)
- **Model:** Sonnet 4.6
- **Use for:** PHPUnit tests, Jest tests, Playwright E2E — after implementation completes
- **Summon loads:** `phpunit-wp`, `playwright`, `unit-testing`
- **Terminal:** no sub-recipes

### code_review (code-review recipe)
- **Model:** Opus 4.7
- **Use for:** FP compliance review, security audit, PR review
- **Read-only:** enforced in recipe instructions; no file writes
- **Declares:** `verify` (review-verify recipe, Sonnet) for advisor-pass second opinions

### explore (explore recipe)
- **Model:** Haiku 4.5
- **Use for:** File discovery, "where is X", codebase mapping, quick context gathering
- **Read-only:** yes; cheapest model — use liberally
- **Terminal:** no sub-recipes

### plan_task (task-planner recipe)
- **Model:** Opus 4.7
- **Use for:** Architecture spec, function signatures, data structures, dependency graph for a complex task before handing to an implementer
- **Terminal:** no sub-recipes

### document_learn (document-learn recipe)
- **Model:** Sonnet 4.6
- **Use for:** Active docs updates, session handoff, and memory routing after a story or feature completes
- **Does not implement code:** consumes completed implementation/test/review artifacts
- **Terminal:** no sub-recipes

---

## Routing Matrix

task-master selects sub-recipes per task using this routing logic:

| If the task is… | Sub-recipe |
|---|---|
| WordPress PHP / theme / plugin / IMA Forms | `wp_implement` |
| Non-WordPress code (JS, Python, generic) | `implement` |
| Architecture spec / function signatures | `plan_task` |
| Tests (after implementation completes) | `write_tests` |
| PR / security / FP review | `code_review` |
| File discovery, "where is X", code map | `explore` |
| Docs and memory closeout | `document_learn` |

---

## Parallelism

Independent sub-recipes (no data dependency between them) run via parallel tool calls. Dependent sub-recipes run serial — task-master waits for the completion summary before issuing the dependent call.

Example dependency sequence:

```
1. explore             (independent — understand codebase)
        ↓ serial
2. plan_task           (needs explore output)
        ↓ serial
3. wp_implement        (independent of each other)
   write_tests         (independent of each other)
        ↓ parallel
4. code_review         (needs both 3a and 3b complete)
        ↓ serial
```

task-master issues steps 3a and 3b as concurrent tool calls, then waits for both before issuing step 4.

---

## Self-Contained Brief Requirement

Each sub-recipe gets a fresh session with no memory of the parent. Every brief must be complete and standalone. Include:

- File paths and project root
- Acceptance criteria (what "done" looks like)
- Security/FP constraints relevant to this task
- Any prior outputs the sub-agent needs as input (e.g., the function signature from plan_task)

Never say "as discussed" or reference earlier conversation. The sub-agent has not seen it.

---

## Failure Handling

1. Sub-recipe returns a summary (success or failure).
2. On failure: analyze the reason from the summary — often a missing context detail.
3. Adjust the brief and retry **once**.
4. If it fails again: surface the failure to the user with the full sub-agent output. Do not loop.
5. Failed tasks do not block independent sibling tasks — only dependent tasks wait.

---

## Running Sub-Recipes Standalone

Each sub-recipe is a full recipe and can run standalone, without task-master:

```bash
# Run explore directly
goose run --recipe explore --interactive

# Run code-review directly
goose run --recipe code-review --name "feature-X-review"

# Run test-writer directly
goose run --recipe test-writer --interactive
```

Useful for one-off tasks where you don't need full orchestration.

---

## Sub-Recipe Wiring Across All Recipes

Not just task-master — other recipes also declare sub-recipes:

| Recipe | Sub-recipes declared |
|---|---|
| `software-development-cycle` | brainstorm, plan_feature, decompose, explore, implement, wp_implement, write_tests, code_review, document_learn |
| `task-master` | implement, wp_implement, write_tests, code_review, explore, plan_task |
| `implement` | write_tests, code_review |
| `wp-developer` | write_tests, code_review |
| `task-runner` | write_tests, code_review |
| `code-review` | verify |
| `architect` | (none — terminal) |
| `task-planner` | (none — terminal) |
| `document-learn` | (none — terminal) |
| `prompt-starter` | (none — terminal) |
| `test-writer` | (none — terminal) |
| `explore` | (none — terminal) |

A wp-developer session can delegate tests and review without going through task-master. The sub-recipe contract is the same — a self-contained brief, an isolated session, a pinned model.

---

## Session Naming Convention

When task-master spawns sub-recipes, name sessions descriptively:

```
feature-X-impl-task-1
feature-X-tests-task-1
feature-X-review-task-1
```

Resume any session later:
```bash
goose session list
goose run --resume --name "feature-X-impl-task-1"
```
