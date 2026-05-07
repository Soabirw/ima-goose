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

Provide your raw feature idea. The recipe asks 3–5 clarifying questions, then
outputs a brainstorm summary document.

**Output:** A Markdown summary of the feature — goals, constraints, open questions.

---

## Phase 2 — Epic/Story Breakdown + Jira Creation

**Goal:** Break the brainstorm into Epics and Stories, then create them in Jira.

```bash
goose run --recipe task-master --name "feature-planning-$(date +%Y%m%d)"
```

Paste the brainstorm summary as input. task-master breaks it into an
Epic > Story > Task hierarchy.

**Option A — In-session Jira creation:**
At the end of planning, tell the agent:
> "Create these epics and stories in Jira project FNR using mcp-atlassian."

The agent will use `createJiraIssue` for each Epic and Story.

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

The recipe fetches the issue from Jira (Summary, Description, Acceptance Criteria)
and produces a structured implementation planning prompt. Ask any clarifying
questions about file paths, WordPress hooks, or environment specifics.

**Output:** A complete implementation prompt ready for task-master.

---

### 3b — Implement the Story

```bash
goose run --recipe task-master --name "story-FNR-123-impl"
```

Paste the implementation prompt from 3a.

task-master will:
1. Transition FNR-123 to "In Progress" in Jira
2. Break work into tasks
3. Delegate to specialized agents via `summon`:
   - `wp-developer` — WordPress PHP code
   - `test-writer` — PHPUnit coverage
   - `task-planner` — complex function design
4. Verify integration across tasks
5. Open a PR when implementation completes
6. Comment the PR link on FNR-123 and transition to "In Review"

**Output:** Code committed, PR opened, Jira story updated.

---

## Phase 4 — Code Review

```bash
goose run --recipe code-review --name "story-FNR-123-review"
```

The recipe will:
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

## Agent Delegation in task-master

task-master uses `summon.delegate` to spawn isolated sub-agents.
Each sub-agent gets complete context — they have no memory of the parent session.

```
task-master
├── summon → wp-developer    (WordPress PHP implementation)
├── summon → test-writer     (PHPUnit coverage)
├── summon → task-planner    (complex design decisions)
└── summon → code-review     (optional in-session review)
```

This preserves task-master's context window across large features.

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
