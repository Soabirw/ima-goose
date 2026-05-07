# Implementation Guide

This guide explains how to use the new task orchestration recipes with Goose.

---

## Setup

### 1. Configure Recipe Repository

Ensure your config has:
```yaml
GOOSE_RECIPE_GITHUB_REPO: "Soabirw/ima-goose"
```

### 2. Enable Orchestrator Extension

```bash
goose configure
# Toggle Extensions → enable: orchestrator
```

---

## Daily Workflow

### Morning Session

```bash
# Step 1: Brainstorm feature
goose run --recipe prompt-starter --name "feature-X-brainstorm"

# Step 2: Create architecture
goose run --recipe architect --name "feature-X-architecture"

# Step 3: Orchestrate implementation
goose run --recipe task-master --name "feature-X-implementation"
```

### Afternoon Session

```bash
# Resume the implementation
goose run --resume --name "feature-X-implementation"

# Check status
goose run --resume --name "feature-X-architecture"

# Review specific task
goose run --recipe code-review --name "feature-X-task-1-review"
```

---

## Task Master Workflow

### Step 1: Break Down Implementation Plan

When you run `task-master` with an implementation plan, it:

1. Reads the full implementation plan
2. Breaks into 5-15 atomic tasks
3. Establishes task dependencies
4. Assigns agents to each task
5. Creates task tracking structure

### Step 2: Orchestrate Task Execution

Task-master runs tasks in dependency order:

```bash
# Example task structure
task-1 (no dependencies) → task-planner → task-runner → code-review
task-2 (no dependencies) → task-planner → task-runner → code-review
task-3 (depends on task-1,2) → waits → task-planner → task-runner → code-review
task-4 (depends on task-3) → waits → task-planner → task-runner → code-review
```

### Step 3: Monitor Progress

```bash
# Resume to check status
goose run --resume --name "feature-X-implementation"

# View session for details
goose session view <session_id>
```

---

## Sub-Recipes

### task-planner

Creates detailed implementation plans for individual tasks:

- Function signatures
- Data structures
- Code organization
- Testing requirements
- Implementation checklist

**Called by:** task-master (automatically)

**User usage:**
```bash
goose run --recipe task-planner --name "feature-X-task-1"
```

### task-runner

Executes task plans and produces working code:

- Implements code according to specifications
- Creates files with proper structure
- Adds tests for implemented functionality
- Verifies implementation works correctly

**Called by:** task-master (automatically)

**User usage:**
```bash
goose run --recipe task-runner --name "feature-X-task-1"
```

### code-review

Reviews implemented code:

- FP principles verification
- Security requirements check
- Code quality assessment
- Test coverage review

**Called by:** task-master (automatically)

**User usage:**
```bash
goose run --recipe code-review --name "feature-X-review"
```

---

## Full Orchestration Command

For one-command orchestration:

```bash
goose run --recipe task-master \
  --sub-recipe task-planner \
  --sub-recipe task-runner \
  --sub-recipe code-review \
  --name "feature-X-full" \
  --text "Implement feature X based on architecture Y"
```

This runs task-master with all sub-recipes available, and passes the implementation instructions.

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
goose run --recipe architect --name "feature-auth-architecture"
goose run --recipe task-master --name "feature-auth-implementation"

# Afternoon
goose run --resume --name "feature-auth-implementation"
goose run --recipe code-review --name "feature-auth-review"
```

### Example 2: Multiple Features in Parallel

```bash
# Morning: Start multiple features
goose run --recipe prompt-starter --name "feature-A-brainstorm"
goose run --recipe prompt-starter --name "feature-B-brainstorm"
goose run --recipe prompt-starter --name "feature-C-brainstorm"

# Afternoon: Focus on one feature
goose run --recipe architect --name "feature-A-architecture"
goose run --recipe task-master --name "feature-A-implementation"

# Next day: Resume another feature
goose run --resume --name "feature-B-brainstorm"
goose run --recipe architect --name "feature-B-architecture"
goose run --recipe task-master --name "feature-B-implementation"
```

### Example 3: Resume Mid-Workflow

```bash
# Morning: Resume partial implementation
goose run --resume --name "feature-X-implementation"

# Continue where left off
# Task-master will skip completed tasks and continue with pending ones
```

---

## Troubleshooting

### Task Fails

If a task fails:
1. Task-master marks it as failed
2. Dependent tasks don't run
3. User is notified of the failure
4. Can retry failed task once
5. After two failures, escalates to user

### Resume Issue

If you can't resume a session:
1. Check session ID: `goose session list`
2. Verify session file exists in `.goose/sessions/`
3. Try creating new session with different name
4. Check Goose logs for errors

### Orchestration Issue

If task-master doesn't orchestrate properly:
1. Verify orchestrator extension is enabled
2. Check task plan has clear dependencies
3. Verify sub-recipes are properly defined
4. Check task-master log for errors

---

## Best Practices

1. **Use descriptive names** for sessions (include feature name and phase)
2. **Resume sessions** to continue work later
3. **Break tasks** into 5-15 max for clarity
4. **Test frequently** during task execution
5. **Review code** after each task completes
6. **Document** any issues encountered

---

## Summary

The task orchestration system provides:

- **State isolation**: Each recipe has clean context
- **Persistence**: Sessions can be resumed later
- **Orchestration**: task-master coordinates sub-tasks
- **Flexibility**: Can run all-in-one or step-by-step
- **Debugging**: Each recipe has its own session file

This workflow matches your original ima-claude patterns while providing better state management and persistence.
