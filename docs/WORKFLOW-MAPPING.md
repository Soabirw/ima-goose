# Goose Workflow Mapping

This document explains how your ima-claude workflow maps to Goose recipes.

---

## Original Workflow (ima-claude)

```
/prompt-starter let's brainstorm new feature x
/clear
/architect [paste brainstorming prompt]
/prompt-starter let's take this brainstorming session and create an implementation plan
/clear
/task-master [past implementation plan]
```

With sub-agents:
- `/task-planner` - Detailed task planning
- `/task-runner` - Task execution

---

## Goose Workflow Mapping

| Original | Goose Equivalent | Session Type |
|----------|------------------|--------------|
| `/prompt-starter` | `goose run --recipe prompt-starter` | Standalone session |
| `/architect` | `goose run --recipe architect` | Standalone session |
| `/task-master` | `goose run --recipe task-master` | Standalone session |
| `/task-planner` | `goose run --recipe task-planner` | Standalone session (called by task-master) |
| `/task-runner` | `goose run --recipe task-runner` | Standalone session (called by task-master) |

---

## Full Workflow in Goose

### Step 1: Brainstorm with Prompt Starter

```bash
# Start the session
goose run --recipe prompt-starter --name "feature-brainstorm"

# User provides feature idea
# Prompt-starter asks clarifying questions
# User answers and provides context
# Prompt-starter creates brainstorming prompt
# User runs the prompt-starter again with the brainstorming output
# Prompt-starter creates implementation plan
```

### Step 2: Architecture Review

```bash
# Save the implementation plan to a file or copy to clipboard
# Start a new session
goose run --recipe architect --name "feature-architecture"

# User provides the implementation plan
# Architect creates technical specifications
# Architect creates architecture diagrams
# Architect documents integration points
# Architect creates security checklist
```

### Step 3: Task Master Orchestration

```bash
# Save the architecture specification
# Start a new session
goose run --recipe task-master --name "feature-implementation"

# User provides the architecture specification
# Task-master breaks down into sub-tasks
# Task-master assigns tasks to appropriate agents
# Task-master orchestrates task execution
```

### Step 4: Task Planning (Delegated by Task Master)

```bash
# Task-master internally runs:
goose run --recipe task-planner --name "feature-task-1"

# Task-planner creates detailed implementation plan
# Task-planner returns plan to task-master
```

### Step 5: Task Execution (Delegated by Task Master)

```bash
# Task-master internally runs:
goose run --recipe task-runner --name "feature-task-1"

# Task-runner implements the task
# Task-runner creates/updates files
# Task-runner adds tests
# Task-runner verifies implementation
# Task-runner returns results to task-master
```

### Step 6: Task Review (Optional, Delegated by Task Master)

```bash
# Task-master internally runs:
goose run --recipe code-review --name "feature-task-1-review"

# Code-reviewer reviews implementation
# Code-reviewer provides feedback
# Task-master may re-run task-runner with fixes
```

---

## Single-Session Alternative (Using --sub-recipe)

If you prefer to run everything from one command:

```bash
goose run --recipe task-master \
  --sub-recipe task-planner \
  --sub-recipe task-runner \
  --sub-recipe code-review \
  --name "full-feature-implementation" \
  --text "Implement feature X based on architecture Y"
```

This runs task-master with task-planner, task-runner, and code-review available as sub-recipes.

---

## Resume Points

Each recipe creates a persistent session that can be resumed:

```bash
# Resume the brainstorming session
goose run --resume --name "feature-brainstorm"

# Resume the architecture session
goose run --resume --name "feature-architecture"

# Resume the implementation session
goose run --resume --name "feature-implementation"

# Resume a specific task
goose run --resume --name "feature-task-1"
```

---

## Session Management

List all sessions:
```bash
goose session list
```

View a session:
```bash
goose session view <session_id>
```

Delete a session:
```bash
goose session delete <session_id>
```

---

## Comparison: ima-claude vs Goose

| Aspect | ima-claude | Goose |
|--------|------------|-------|
| **Invocation** | `/skill` within session | `goose run --recipe recipe-name` (new session) |
| **Context** | Persistent session memory | Session file that can be resumed |
| **Flexibility** | Switch skills anytime | Pick recipe upfront, run to completion |
| **Orchestration** | Agent() tool | Sub-recipes + orchestrator extension |
| **Persistence** | In-memory (if Qdrant configured) | File-based (`.goose/sessions/`) |

---

## Key Benefits of Goose Approach

1. **State isolation**: Each recipe session has clean context, no state leakage
2. **Persistence**: Sessions are saved as files, can be resumed later
3. **Automation friendly**: Recipes can run in CI/CD pipelines
4. **Multi-agent orchestration**: Sub-recipes enable agent teams
5. **Model control**: Each recipe can use different models (Light/Standard/Heavy)
6. **Debugging**: Each recipe has its own session file for debugging

---

## Practical Usage Pattern

### Daily Development Workflow

```bash
# Morning: Brainstorm and architect
goose run --recipe prompt-starter --name "feature-A-brainstorm"
goose run --recipe architect --name "feature-A-architecture"

# Afternoon: Implement with task master
goose run --recipe task-master --name "feature-A-implementation"

# Review and iterate
goose run --resume --name "feature-A-implementation"  # Check progress
goose run --recipe code-review --name "feature-A-review"

# Final verification
goose run --recipe test-writer --name "feature-A-tests"
goose run --resume --name "feature-A-tests"
```

### Resume Work Later

```bash
# The next day
goose run --resume --name "feature-A-implementation"  # Continue where left off
```

### Parallel Feature Development

```bash
# Start multiple features in parallel
goose run --recipe prompt-starter --name "feature-A-brainstorm"
goose run --recipe prompt-starter --name "feature-B-brainstorm"
goose run --recipe prompt-starter --name "feature-C-brainstorm"

# Then focus on one feature
goose run --recipe architect --name "feature-A-architecture"
goose run --recipe task-master --name "feature-A-implementation"
```

---

## Migration Notes

### From ima-claude to Goose

1. **Replace `/skill` calls** with `goose run --recipe skill-name`
2. **Replace Agent() calls** with `goose run --recipe agent-name`
3. **Replace session memory** with `--name` for resuming sessions
4. **Replace /clear** with new session for each major task
5. **Replace manual task breakdown** with task-master orchestration

### Naming Conventions

- Use hyphenated names for sessions: `feature-A-brainstorm`
- Include context in names: `feature-A-architecture`
- Use descriptive names: `feature-A-implementation`
- Include timestamps if needed: `feature-A-implementation-2025-05-06`

---

## Summary

Your workflow translates cleanly to Goose's recipe-based architecture:

- **Each skill** becomes a **recipe**
- **Each session** is a **separate Goose session**
- **Agent delegation** becomes **sub-recipes**
- **Session memory** becomes **resumable sessions**
- **Persistent state** becomes **file-based sessions**

The recipe-based approach actually provides better state isolation, persistence, and orchestration than the skill-based approach in ima-claude.
