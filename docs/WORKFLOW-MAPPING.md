# WordPress Development Workflow — Goose Edition

The primary IMA development cycle, translated from ima-claude to Goose recipes.
Each `/clear` in the original workflow becomes a new `goose run` session here.

---

## The Full Cycle

```
[Brainstorm] → [Epic/Story Planning + Jira Creation] → [Story Implementation] → [Review]
                                                              ↑ repeat per story ↑
```

---

## Phase 1 — Feature Brainstorm

**Goal:** Turn a rough feature idea into a structured brainstorm summary.

```bash
goose run --recipe prompt-starter --name "feature-brainstorm-$(date +%Y%m%d)"
```

Provide your raw feature idea. The recipe (Opus 4.7) asks 3–5 clarifying questions, then outputs a brainstorm summary document.

**Output:** A Markdown summary of the feature — goals, constraints, open questions.

---

## Phase 2 — Epic/Story Breakdown + Jira Creation

**Goal:** Break the brainstorm into Epics and Stories, then create them in Jira.

```bash
goose run --recipe task-master --name "feature-planning-$(date +%Y%m%d)"
```

Paste the brainstorm summary as input. task-master (Opus 4.7) breaks it into an Epic > Story > Task hierarchy using declarative sub-recipe delegation — not the orchestrator extension. Each sub-recipe tool call spawns a fresh session with its own pinned model.

**Option A — In-session Jira creation:**
At the end of planning, tell the agent:
> "Create these epics and stories in Jira project FNR using mcp-atlassian."

Summon will load the `mcp-atlassian` skill on demand; the agent will use `createJiraIssue` for each Epic and Story.

**Option B — Save then create (if Jira connection not active):**
Ask the agent to write the structure to a local file:
> "Write the epic/story breakdown to `.goose/planning/feature-name.md`"

Then start a fresh session:
```bash
goose run --recipe task-master --name "jira-create-$(date +%Y%m%d)"
# Input: "Create the Jira epics and stories from .goose/planning/feature-name.md"
```

**Output:** Jira epics and stories created. Copy the story keys (FNR-XXX) for Phase 3.

---

## Phase 3 — Story Implementation (repeat per story)

### 3a — Generate Implementation Prompt from Jira Story

```bash
goose run --recipe prompt-starter --name "story-FNR-123-prompt"
```

Input: just the Jira story key, e.g., `FNR-123`

The recipe fetches the issue from Jira (Summary, Description, Acceptance Criteria) via the mcp-atlassian skill and produces a structured implementation planning prompt.

**Output:** A complete implementation prompt ready for task-master.

---

### 3b — Implement the Story

```bash
goose run --recipe task-master --name "story-FNR-123-impl"
```

Paste the implementation prompt from 3a.

task-master will:
1. Transition FNR-123 to "In Progress" in Jira
2. Decompose work into 5–15 atomic tasks with a dependency graph
3. Delegate to sub-recipes via declarative tool calls:
   - `wp_implement` tool → wp-developer recipe (WordPress PHP code, Sonnet 4.6)
   - `write_tests` tool → test-writer recipe (PHPUnit coverage, Sonnet 4.6)
   - `plan_task` tool → task-planner recipe (complex function design, Opus 4.7)
   - `explore` tool → explore recipe (file discovery, Haiku 4.5)
4. Run independent tasks via parallel tool calls; dependent tasks serial
5. Verify integration across tasks
6. Open a PR when implementation completes
7. Comment the PR link on FNR-123 and transition to "In Review"

**Output:** Code committed, PR opened, Jira story updated.

---

## Phase 4 — Code Review

```bash
goose run --recipe code-review --name "story-FNR-123-review"
```

The recipe (Opus 4.7) will:
1. Run project validators (`composer test:unit`, `composer phpcs:report`)
2. Detect Git platform (Gitea → `tea`, GitHub → `gh`)
3. Fetch the PR diff
4. Review for correctness, FP compliance, WordPress security
5. Post review conclusion as a comment on the PR
6. Approve or request changes
7. Update FNR-123 in Jira with review outcome and transition status

**Output:** PR reviewed, commented, status set. Jira story transitioned.

---

## Repeat Phase 3–4 for Each Story

---

## Quick Reference

| Phase | Recipe | Key Input | Key Output |
|-------|--------|-----------|------------|
| Brainstorm | `prompt-starter` | Raw feature idea | Brainstorm summary |
| Planning | `task-master` | Brainstorm summary | Jira epics + stories |
| Story prompt | `prompt-starter` | Jira key (FNR-123) | Implementation prompt |
| Implement | `task-master` | Implementation prompt | Code + PR + Jira updated |
| Review | `code-review` | PR number (auto-detected) | PR comment + Jira updated |

---

## Session Naming Convention

```
feature-brainstorm-YYYYMMDD
feature-planning-YYYYMMDD
story-FNR-123-prompt
story-FNR-123-impl
story-FNR-123-review
```

---

## Resume a Session

```bash
goose session list
goose run --resume --name "story-FNR-123-impl"
```

---

## Git Platform Detection

| Platform | CLI | PR Comment | Review Status |
|----------|-----|------------|---------------|
| Gitea (internal) | `tea` | `tea comment <PR#> "..."` | `tea pr approve/reject <PR#>` |
| GitHub | `gh` | `gh pr comment <PR#> --body "..."` | `gh pr review <PR#> --approve/--request-changes` |

See `shared/tool-guides/tea.md` for full `tea` CLI reference.

---

## How task-master Delegates (Sub-Recipe Mechanism)

task-master uses declarative `sub_recipes:` YAML — not the orchestrator extension and not `summon.delegate`. Goose generates one callable tool per sub-recipe. task-master invokes by tool call with a complete, self-contained brief. Each sub-agent gets no memory of the parent session.

```
task-master (Opus 4.7 — orchestration)
├── explore tool → explore recipe (Haiku 4.5 — read-only context)
├── plan_task tool → task-planner recipe (Opus 4.7 — design)
├── wp_implement tool → wp-developer recipe (Sonnet 4.6 — WordPress code)
├── write_tests tool → test-writer recipe (Sonnet 4.6 — PHPUnit)
└── code_review tool → code-review recipe (Opus 4.7 — security review)
```

Independent tool calls run in parallel. Dependent calls are serial. This preserves task-master's context window across large features while giving each specialist the right model for the job.

---

## Jira MCP Extension

Jira interactions require the Atlassian extension to be enabled in config:

```yaml
# ~/.config/goose/config.yaml
extensions:
  atlassian:
    enabled: true   # set to true when actively working with Jira
```

See `skills/mcp-atlassian/SKILL.md` for full Jira/Confluence operation reference.
