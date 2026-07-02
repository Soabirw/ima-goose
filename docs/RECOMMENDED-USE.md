# Recommended Use Guide

This guide describes how to use `ima-goose` 2.0 in practice. It is not a
complete reference for every recipe field; it is the recommended operating model
for day-to-day work.

The center of the system is human-in-the-loop work in two distinct workflows:

```text
Product requirements: brainstorm -> task-planner -> document-learn
Per-story delivery:  plan -> implement -> test -> review -> document-learn
```

Use the product requirements workflow when work starts as a concept, product
idea, new site, large feature, or vague Jira initiative. Use the per-story
delivery workflow after the work has already been broken into stories with
requirements and acceptance criteria.

The recommended workflow is explicit handoff between phases, with a human
reviewing each major artifact before approving the next step.

Goose can run a full-cycle umbrella recipe, but that mode is experimental. HITL
review is the default because agents make odd decisions, especially during
early requirements and planning. Humans should review plans before approval and
help review code before deployment.

## Before You Start


> `--task-project` is the Taskwarrior project used for native `task project:<name>` filtering. It is not a Serena project. Serena bootstrap discovers the current project through the `ima-mcp serena` gateway and Serena's cwd/project configuration behavior.

Run the installer after pulling recipe or skill changes:

```bash
node scripts/install.ts --validate
```

Use the shell aliases from `.goose-aliases.example` for normal work. They set
consistent recipe names, session names, parameters, and interactive mode:

```bash
goose-help
```

If an alias does not exist for a recipe, the direct Goose form is:

```bash
goose run --recipe <recipe-name> --interactive
```

Pass recipe parameters with repeated `--params key=value` flags.

## Recommended Default: HITL Manual Handoff

Use manual handoff for normal product and engineering work. It keeps humans in
the loop while requirements are still being shaped and while code is being
prepared for deployment.

### Product Requirements Workflow

Use this when turning a concept into a PRD and story map. This is the right path
for a new website, a large product area, or any initiative
that may become dozens or hundreds of stories.

```bash
goose-brainstorm "rough idea"
goose-orchestrate "brainstorm-memory-name or PRD draft"
goose-learn "PRD and story map artifact bundle" feature
```

In this workflow:

- `brainstorm` turns concepts into product requirements and open questions
- `task-planner` decomposes the PRD into epics, stories, and task checklists
- the epics, stories, and task checklists are still requirements artifacts, not
  implementation plans
- after review, `task-planner` may persist the approved hierarchy to exactly one
  PM source of truth: Jira or Taskwarrior, never both; Stories are the default
  PM lifecycle units and lower-level tasks are embedded in Story descriptions,
  checklists, annotations, or acceptance criteria unless explicitly promoted
- `document-learn` records the approved PRD, story map, PM persistence outcome,
  and durable product decisions

Do not use `plan` as the default bridge between brainstorm and task-planner.
`plan` is for implementation planning on a specific story.

### Per-Story Delivery Workflow

Use this for each approved story after the product requirements workflow has
created the story set.

```bash
goose-plan "story key, story spec, or acceptance criteria"
goose-implement "approved story implementation plan"
goose-tests
goose-review "PR URL or FNR-123"
goose-learn "story execution artifact bundle" story
```

In this workflow:

- `plan` creates the detailed implementation plan for one story
- `implement` executes that approved plan
- `test` validates the behavior
- `review` checks the final diff before deployment
- `document-learn` closes the story with docs and memory updates

Most stories should not need a separate `task-planner` pass. A story may have
three or four implementation tasks, and the harness's built-in task management
is usually enough. Use a localized `task-planner` pass only when the story is
large enough that it needs its own requirements-level breakdown before
implementation planning.

At each stage, stop and inspect the artifact before moving forward:

- approve or revise the brainstorm before PRD decomposition
- approve epics, stories, tasks, and acceptance criteria before per-story
  implementation planning
- approve or revise the per-story technical plan before implementation
- inspect implementation and test results before review
- help evaluate review findings before deployment
- run document/learn only after the relevant requirements or delivery artifact
  is complete

The important rule: pass artifacts forward explicitly. Good handoff inputs are:

- Serena memory names
- Vestige task keys
- Jira issue keys
- PR URLs
- file paths
- pasted summaries with acceptance criteria and test results

Do not assume a new recipe session remembers the previous session. Child
sessions and separate recipe sessions need complete context.

## Mentoring Side Path

Use `goose-instructor` when you want context-aware guidance, not an agent doing
the work. It researches enough read-only evidence to explain what the human
should do next, why it matters, what to avoid, and where to go deeper.

```bash
goose-instructor "What should I do next with this review finding?"
goose-instructor "Vestige memory or Jira key"
goose-instructor "task question" --task-project ima-mcp-gateway --task S01
```

Use it when:

- you are unsure which workflow or command is appropriate
- you need a mentor-style explanation before acting
- you want evidence-backed guidance without code edits, tests, migrations,
  deploys, or operational changes
- you need help thinking through risk before choosing `plan`, `investigate`,
  `implement`, `code-review`, or no agent workflow at all

Avoid it when:

- you already have an approved implementation plan and want code changes
- you need root-cause reproduction and evidence synthesis; use `investigate`
- you need a formal implementation plan; use `plan`
- you need review of a diff or PR; use `code-review`

`instructor` is a side path, not a mandatory per-story phase and not a
`goose-cycle` step. It may suggest commands for you to run, but it labels risk
and must not run tests, builds, migrations, deploys, database changes, or file
edits itself.

## HITL Cycle Helper

Use `goose-cycle` when you want a Taskwarrior/Vestige-backed conductor for the
per-story delivery workflow. It runs existing top-level recipes in sequence and
keeps detailed continuity in Vestige rather than relying on child session
memory.

```bash
goose-cycle start --task-project ima-mcp-gateway
goose-cycle start --task-project ima-mcp-gateway --task S01
goose-cycle status --task-project ima-mcp-gateway --task S01
goose-cycle close --task-project ima-mcp-gateway --task S01
```

This calls the normal phase recipes as separate top-level Goose sessions:
`cycle-start`, `plan`, `implement`, `test-writer`, `code-review`, and, after an
approved review state, `document-learn`. It stops after document/learn for final
human review. `goose-cycle close` performs operational closeout after that
approval.

Use it when:

- Taskwarrior has the project/story queue
- Vestige should carry the detailed lifecycle thread
- you want the standard plan -> implement -> test -> review -> learn loop
- you are prepared to inspect final output before closeout

Avoid this mode when:

- you only need read-only exploration
- you already know the exact small edit and want a direct implementation recipe
- you only need a review, scorecard, UI inspection, research answer, or release
  prep
- Taskwarrior does not have a clear task identity yet

The older experimental umbrella recipe is still available as
`goose-cycle-umbrella` for explicit orchestration experiments. See
`docs/GOOSE-CYCLE.md` for the operational helper details.

## Experimental: Autonomous Mode

Autonomous mode is not the recommended workflow. Use it only for low-risk
experiments where you are explicitly testing orchestration behavior.

Do not use autonomous mode for work that can affect production, customer data,
payments, medical content, release branches, external comments, or deployment
state. For normal engineering work, keep the default HITL flow and approve each
artifact before moving to the next phase.

## Phase Guidance

### Brainstorm

Use `goose-brainstorm` for early product shaping. It is for turning a rough
idea, product concept, new site, large feature, or Jira-fuzzy item into a PRD
draft or requirements brief.

Good inputs:

- "users need a better renewal reminder flow"
- "FNR-123 feels underspecified"
- "we keep getting form spam and need options"

Expected output: a saved brainstorm, PRD draft or requirements brief, open
questions, and next-step recommendation.

### Task Planner

Use `goose-orchestrate` after brainstorm when the work should become an Epic ->
Story -> Task requirements breakdown. `task-planner` is non-implementation: it
must not edit project code/content/config, run tests/builds, branch, commit, or
deploy. Stories are the default lifecycle units. Lower-level tasks are Story
checklist items by default, not independent PM items. After you approve the
hierarchy, it may show a persistence preview and, after explicit approval,
create or update Story-level lifecycle items in exactly one PM system: Jira or
Taskwarrior. Choose memory/file only when you do not want PM items.

This is usually a product decomposition step, not implementation planning. For
large initiatives, the output may be 100+ stories. Stories should describe user
value, requirements, acceptance criteria, dependencies, and routing guidance.
They should not try to prescribe low-level implementation details.

Expected output: epics, story boundaries, story-level acceptance criteria,
dependencies, recommended lifecycle route for each Story, and lower-level
implementation checklist items embedded under each Story. A checklist item should
only become an independent Jira issue, Jira subtask, or Taskwarrior task after
explicit approval because that promotes it to its own plan/implement/test/review/learn lifecycle.

### Plan

Use `goose-plan` when the next artifact should be a detailed technical plan for
one approved story, not code. It can start from a Jira key, story spec,
acceptance criteria, file path, or existing notes.

Good inputs:

- a story key with acceptance criteria
- a story spec from task-planner
- a bug description that needs root-cause analysis before edits
- a small refactor request with a clear behavioral goal

Expected output: affected modules, approach, pure-core/imperative-shell
boundaries, test strategy, risks, and implementation-ready steps.

If a story is too large for a straightforward implementation plan, use a
localized `goose-orchestrate` pass to break that story into smaller
requirements-level work items. That should be the exception, not the default.

### Instructor

Use `goose-instructor` when the next artifact should be human understanding or
a safe next-step recommendation. It is a HIGH-tier read-only mentor: it can
inspect context, memories, docs, Jira/Confluence, visual sources, and repository
evidence, then explain what you should do and why.

Good inputs:

- "Which recipe should I use for this issue?"
- "Explain what this migration command would do before I run it"
- "What should I check before closing this task?"
- a memory, Jira key, file path, screenshot reference, or pasted context that
  needs mentor-style interpretation

Expected output: short answer, reasoning, evidence checked, what to avoid, and
optional deeper paths. It does not implement, edit files, run tests/builds,
start services, migrate data, deploy, or change external systems.

### Implement

Use `goose-implement` for plan-bound coding. Prefer it when the task has an
approved plan or a clear story source.

For WordPress-specific implementation, use `goose-wp` or pass a WordPress story
to `goose-implement` with a clear plan source.

For JavaScript/TypeScript-specific implementation, use `goose-js`.

Expected output: focused code changes, a summary of changed files, test notes,
and any follow-up risk.

### Test

Use `goose-tests` when tests are the primary task:

- add missing unit tests
- repair failing tests
- characterize existing behavior before a risky refactor
- build a focused regression suite for a bug

In the full cycle, tests are part of the story loop. Direct `goose-tests` is
for standalone test work.

### Review

Use `goose-review` for read-only code review. Pass a PR URL, Jira key, or open
it without arguments and let the recipe ask for the target.

```bash
goose-review FNR-123
goose-review https://git.example/owner/repo/pulls/45
```

Use `goose-adversarial-review` for higher-risk changes where you want two
independent adversarial reviewers and a reconciled objection set.

### Document/Learn

Use `goose-learn` after implementation, tests, and review have completed.

```bash
goose-learn
goose-learn "story execution artifact bundle" story
goose-learn "feature closeout artifact bundle" feature
goose-learn "release closeout artifact bundle" release
```

This is a terminal closeout recipe. It should update docs and route learning to
Serena, Vestige, and Qdrant. It should not implement code or reopen product
decisions.

## Complex troubleshooting

Use `goose-investigate` for hairy, ambiguous, cross-system problems where the
root cause is not clear and normal bug-fix tools would start changing code too
soon.

This is a one-off investigation tool, not a required per-story phase.

Good inputs:
- unclear production-like symptom
- intermittent failure
- browser console/network issue with unknown source
- WordPress hook/form/AJAX behavior that crosses plugins/themes
- stack trace without an obvious owner
- environment-specific failure
- "we do not know where this is breaking yet"

`investigate` produces an evidence-backed root-cause report or ranked
hypotheses. After that, choose the next workflow based on the finding:
`plan`, `wp-developer`, `js-developer`, `implement`, `code-review`, or no
code-change workflow at all.

## Specialty Recipes

These recipes are useful, but they are not mandatory phases in every compound
engineering workflow.

| Need | Recommended command | Use when |
|---|---|---|
| Complex troubleshooting | `goose-investigate [source]` | You need Sherlock-style root-cause investigation before deciding whether to plan, implement, review, or escalate. |
| Fast codebase discovery | `goose-explore` | You need read-only answers about structure, dependencies, or likely edit points. |
| WordPress implementation | `goose-wp` | The task is clearly WordPress/PHP/Bootstrap/IMA Forms work. |
| JavaScript/TypeScript implementation | `goose-js` | The task is Svelte, Node, API, CLI, TUI, or browser JS work. |
| UI/UX inspection | `goose-ui` | You need browser-based layout, responsive, accessibility, or Bootstrap/IMA CSS review. |
| Design to implementation | `goose-design-to-code [source]` | You have a screenshot, mockup, Jira design context, or design prompt to convert into code work. |
| Image interpretation | `vision_handoff` subrecipe | Parent recipes route screenshots, mockups, design comps, visual diffs, diagrams, scanned docs/forms, Jira image attachments, and image URLs through the standard vision hand-off. |
| Project or PR scorecard | `goose-scorecard [target]` | You want a graded assessment of standards, security, tests, docs, and maintainability. |
| Release prep | `goose-ship-it stg|prod [project-path]` | You are intentionally preparing staging or production release branches/tags. |
| MCP config migration | `goose run --recipe mcp-migration --interactive` | You need to migrate MCP servers from Claude Code config into Goose config. |
| Medical literature research | `goose-ima-research [question]` | You need IMA-style primary-source medical research synthesis. |
| Patristic research | `goose-patristic [question]` | You need early Church research using the theology corpus and primary-source verification. |

## Current-Session Commands

These run inside an existing Goose session rather than starting a dedicated
recipe session.

| Command | Use when |
|---|---|
| `/architect` | You want architecture judgment on the current topic before choosing a design. |
| `/prompt-starter` | You want to turn rough context into a prompt for a future recipe session. |
| `/serena-bootstrap` (`/bootstrap-serena` alias) | You need to reload standard Serena project memories mid-session. |
| `/vestige-bootstrap` (`/bootstrap-vestige` alias) | You need to load user preferences from Vestige mid-session. |
| `/serena-memorize <note>` | You need to persist stable project context into Serena. |

## Choosing The Right Path

Use HITL product requirements workflow for concepts and large initiatives:

```text
concept -> brainstorm -> task-planner -> document-learn
```

Use HITL per-story delivery for each approved story:

```text
story -> plan -> implement -> test -> review -> document-learn
```

Use `goose-cycle` when Taskwarrior and Vestige already hold the story queue
and lifecycle state:

```text
Taskwarrior story -> goose-cycle start -> document-learn -> human review -> goose-cycle close
```

Use `goose-cycle-umbrella` only when intentionally testing the experimental
single-session umbrella recipe.

Use a specialty recipe when the task has one clear shape:

- `goose-explore` before touching unfamiliar code
- `goose-ui` before CSS/layout fixes
- `goose-scorecard` before quality conversations
- `goose-design-to-code` when the source of truth is visual
- `goose-ship-it` only for explicit release prep

## Handoff Checklist

Before moving from one recipe to the next, make the handoff explicit:

- objective
- source artifact, memory name, ticket, PR, or file path
- acceptance criteria
- relevant constraints
- changed files or expected files
- test command and result, if available
- review verdict and unresolved findings, if available
- desired closeout scope: `story`, `feature`, or `release`

This keeps recipe sessions small, auditable, and less dependent on hidden chat
history.


## Vision-heavy sources

When a workflow depends on screenshots, mockups, design comps, browser captures, visual regression diffs, diagrams, scanned docs/forms, Jira image attachments, or image URLs, route interpretation through `vision_handoff`. The child recipe is pinned to `codex-acp` / `gpt-5.5/medium` because `chatgpt_codex` currently cannot pass images to GPT-5.5 vision. Parent recipes use the returned visual evidence for planning, implementation, tests, review, or closeout decisions.
