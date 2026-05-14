# Implementation Guide

How to use the task orchestration recipes with Goose.

---

## Setup

### 1. Configure Recipe Repository

Ensure your config has:
```yaml
GOOSE_RECIPE_GITHUB_REPO: "Soabirw/ima-goose"
```

### 2. Enable Required Extensions

```bash
goose configure
# Toggle ON: developer, summon
```

`developer` provides file/shell access. `summon` auto-discovers skills. The `orchestrator` extension is session management only — delegation goes through `sub_recipes:` YAML, not the orchestrator.

### 3. Install Skills

```bash
node scripts/install.ts
```

Copies all 42 skills to `~/.agents/skills/`. Required for Summon auto-discovery.

---

## Daily Workflow

### Morning Session

```bash
# Step 1: Brainstorm feature
goose run --recipe prompt-starter --name "feature-X-brainstorm"

# Step 2: (Optional) Dedicated architecture pass
goose run --recipe architect --name "feature-X-architecture"

# Step 3: Orchestrate implementation
goose run --recipe task-master --name "feature-X-implementation"
```

### Afternoon Session

```bash
# Resume the implementation
goose run --resume --name "feature-X-implementation"

# Review specific output
goose run --recipe code-review --name "feature-X-task-1-review"
```

---

## Task Master Workflow

### Step 1: Break Down the Implementation Plan

When you run `task-master` with an implementation plan, it (using Opus 4.7):

1. Reads the full implementation plan or Jira issue
2. Decomposes into 5–15 atomic, FP-aligned tasks
3. Establishes task dependencies and identifies parallelizable groups
4. Selects the appropriate sub-recipe for each task

### Step 2: Orchestrate via Sub-Recipe Tool Calls

task-master delegates via the `sub_recipes:` mechanism — Goose auto-generates one tool per declared sub-recipe. task-master invokes tools with self-contained briefs. There is no `--sub-recipe` CLI flag.

Task execution order is driven by the dependency graph:

```
Independent tasks → parallel tool calls (concurrent)
Dependent tasks → serial tool calls (wait for parent completion)

Example:
  explore (understand context)
      ↓ serial
  plan_task (design the approach)
      ↓ serial
  wp_implement + write_tests (independent, run in parallel)
      ↓ serial (both must complete)
  code_review (needs both outputs)
```

Each sub-recipe runs in a fresh session with its own pinned model:
- `wp_implement` → wp-developer at Sonnet 4.6
- `plan_task` → task-planner at Opus 4.7
- `explore` → explore at Haiku 4.5
- `code_review` → code-review at Opus 4.7
- `write_tests` → test-writer at Sonnet 4.6

### Step 3: Monitor Progress

```bash
# Resume to check status
goose run --resume --name "feature-X-implementation"

# List sessions
goose session list

# View session details
goose session view <session_id>
```

---

## Sub-Recipes

### task-planner

Creates detailed implementation plans for individual tasks:

- Function signatures and data structures
- Code organization and file locations
- Testing requirements and acceptance criteria
- Implementation checklist

**Model:** Opus 4.7 (design decisions need the top model)

**Called by:** task-master (via `plan_task` tool call)

**Standalone usage:**
```bash
goose run --recipe task-planner --name "feature-X-task-1-plan"
```

### task-runner

Executes task plans and produces working code:

- Implements code according to specifications
- Creates files with proper structure
- Verifies implementation is correct

**Model:** Sonnet 4.6

**Called by:** Used directly for pre-planned tasks; task-master routes to `implement` or `wp_implement` instead

**Standalone usage:**
```bash
goose run --recipe task-runner --name "feature-X-task-1-run"
```

### code-review

Reviews implemented code:

- FP principles verification
- Security requirements check (WP nonces, $wpdb->prepare, sanitize, escape)
- Code quality and complexity assessment
- Test coverage review

**Model:** Opus 4.7 (security flaws need the top model)

**Read-only:** enforced in recipe instructions — produces a report, never modifies files.

**Called by:** task-master (via `code_review` tool), implement, wp-developer, task-runner

**Standalone usage:**
```bash
goose run --recipe code-review --name "feature-X-review"
```

---

## Session Management

### List All Sessions

```bash
goose session list
```

### View Session

```bash
goose session view <session_id>
```

### Resume Session

```bash
goose run --resume --name "feature-X"
```

### Delete Session

```bash
goose session delete <session_id>
```

---

## Practical Examples

### Example 1: Single Feature

```bash
# Morning
goose run --recipe prompt-starter --name "feature-auth-brainstorm"
goose run --recipe task-master --name "feature-auth-implementation"

# Afternoon
goose run --resume --name "feature-auth-implementation"
goose run --recipe code-review --name "feature-auth-review"
```

### Example 2: Multiple Features

```bash
# Morning: Generate prompts for multiple features
goose run --recipe prompt-starter --name "feature-A-brainstorm"
goose run --recipe prompt-starter --name "feature-B-brainstorm"

# Afternoon: Focus on one feature
goose run --recipe task-master --name "feature-A-implementation"

# Next day: Continue another feature
goose run --resume --name "feature-B-brainstorm"
goose run --recipe task-master --name "feature-B-implementation"
```

### Example 3: Resume Mid-Workflow

```bash
# Morning: Resume partial implementation
goose run --resume --name "feature-X-implementation"

# task-master will have its sub-recipe delegation history in the session;
# ask it to continue or summarize what completed so far
```

### Example 4: Direct Sub-Recipe (Skip task-master)

For well-defined single tasks, invoke the specialist recipe directly:

```bash
# Known WordPress task — go straight to wp-developer
goose run --recipe wp-developer --name "fnr-456-meta-box"

# Known test coverage gap — go straight to test-writer
goose run --recipe test-writer --name "fnr-456-phpunit"

# Known security audit — go straight to code-review
goose run --recipe code-review --name "fnr-456-review"
```

---

## Troubleshooting

### Sub-Recipe Not Delegating

Symptom: task-master writes code itself instead of delegating.

Cause: The recipe instructions direct it to delegate, but if the model misses the routing table — provide an explicit delegation instruction in your prompt:
```
"Decompose this task and delegate to the appropriate sub-recipe tool calls."
```

### Task Fails

If a sub-recipe returns a failure:
1. task-master analyzes the reason — usually a missing context detail in the brief
2. It retries once with an adjusted brief
3. After two failures, it surfaces the failure to you with the full sub-agent output
4. Other independent tasks continue; only dependent tasks wait

### Resume Issue

If you can't resume a session:
1. Check session exists: `goose session list`
2. Verify name matches exactly (case-sensitive)
3. Try: `goose session view <id>` to inspect
4. Create new session if the original is corrupted

---

## Best Practices

1. **Use descriptive session names** — include feature name and phase (e.g., `story-FNR-123-impl`)
2. **Let task-master decompose** — resist the urge to prescribe the exact sub-recipe sequence; the routing matrix handles it
3. **Keep briefs self-contained** — sub-agents have no memory of the parent session; every brief must stand alone
4. **Use explore first** for unfamiliar codebases — Haiku 4.5 is cheap; burn it on context gathering before expensive delegation
5. **Resume sessions** rather than starting fresh — context of completed sub-recipe outputs is preserved in the parent session
6. **Direct sub-recipe for single tasks** — if you know exactly what's needed, skip task-master and run the specialist directly

---

## Summary

The task orchestration system provides:

- **Model-per-task**: Opus for decisions/review, Sonnet for coding, Haiku for exploration
- **Declarative delegation**: `sub_recipes:` YAML → tool calls → isolated sessions
- **Parallelism**: independent tasks run concurrently via parallel tool calls
- **State isolation**: each sub-recipe session has clean context; no shared mutable state
- **Resumability**: named sessions persist; resume at any point
- **Failure safety**: retry once with adjusted brief, then surface — no infinite loops
