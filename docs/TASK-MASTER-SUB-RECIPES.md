# Task Master Sub-Recipes

The task-master recipe can delegate to these sub-recipes:

## 1. task-planner
Creates detailed implementation plans for individual tasks

## 2. task-runner
Executes task plans and produces working code

## 3. code-review
Reviews implemented code for FP principles, security, and quality

## 4. test-writer
Creates tests for implemented functionality

## 5. explore
Read-only codebase exploration (for context gathering)

## 6. architect
Creates technical architecture specifications

---

## Sub-Recipe Usage

### Single Command (All-in-One)

```bash
goose run --recipe task-master \
  --sub-recipe task-planner \
  --sub-recipe task-runner \
  --sub-recipe code-review \
  --name "full-feature-implementation" \
  --text "Implement feature X"
```

### Step-by-Step Orchestration

```bash
# Task master orchestrates
goose run --recipe task-master --name "feature-X"

# Task master internally calls:
goose run --recipe task-planner --name "feature-X-task-1"
goose run --recipe task-runner --name "feature-X-task-1"
goose run --recipe code-review --name "feature-X-task-1-review"

# Task master continues with next task
goose run --recipe task-planner --name "feature-X-task-2"
goose run --recipe task-runner --name "feature-X-task-2"
goose run --recipe code-review --name "feature-X-task-2-review"
```

### Resume Task Master

```bash
goose run --resume --name "feature-X"
```

This resumes the task-master session, which should include all sub-tasks.

---

## Dependency Chain

```
task-master (orchestrator)
├── task-planner (planner)
│   └── output → task-runner
├── task-runner (executor)
│   └── output → task-master
└── code-review (reviewer)
    └── output → task-runner (fixes) or task-master (approval)
```

---

## Task States

Each task has a status:
- `pending` - Not yet started
- `planning` - Being planned by task-planner
- `planned` - Planning complete
- `executing` - Being executed by task-runner
- `completed` - Task completed
- `failed` - Task failed (requires user intervention)

---

## Parallel Execution

Task-master can run independent tasks in parallel:

```bash
# Independent tasks run in parallel
task-1 (no dependencies) → task-planner → task-runner → code-review
task-2 (no dependencies) → task-planner → task-runner → code-review
task-3 (no dependencies) → task-planner → task-runner → code-review

# Dependent tasks run sequentially
task-4 (depends on task-1,2,3) → waits → task-planner → task-runner → code-review
```

---

## Error Handling

- If a task fails, task-master marks it and stops dependent tasks
- Can retry failed tasks once
- After two failures, escalates to user
- Failed tasks don't block other independent tasks
