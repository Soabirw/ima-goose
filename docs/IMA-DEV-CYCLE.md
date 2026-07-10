# IMA Dev Cycle with Goose

This is the recommended operating model for day-to-day IMA development with
Goose. It is intentionally human-in-the-loop: each phase produces an artifact
that the human can inspect before approving the next phase.

## The Short Version

```text
brainstorm -> plan -> implement -> test -> review -> learn
```

Use aliases for normal work:

```bash
goose-brainstorm "rough idea"
goose-plan "approved story or acceptance criteria"
goose-implement "approved implementation plan"
goose-test "implementation artifact or story key"
goose-review "PR URL, task key, or diff target"
goose-learn "completed artifact bundle" story
```

## What Each Phase Produces

| Phase | Alias | Purpose | Expected handoff |
|---|---|---|---|
| Brainstorm | `goose-brainstorm` | Shape a rough idea into product direction, questions, and requirements material. | PRD draft, decision notes, open questions. |
| Plan | `goose-plan` | Turn one approved story or acceptance-criteria set into an implementation plan. | Technical plan, files likely touched, acceptance criteria, verification plan. |
| Implement | `goose-implement` | Execute an approved plan. | Changed files, implementation notes, verification performed, blockers. |
| Test | `goose-test` | Create, repair, or run focused tests for the story. | Test files/commands/results and any skipped validation. |
| Review | `goose-review` | Review the diff or PR before closeout. | Verdict, findings, required fixes, residual risk. |
| Learn | `goose-learn` | Update docs and memories from completed artifacts. | Docs changed, memory updates, final handoff, follow-ups. |

## Handoff Rule

Every phase is a new session. Pass artifacts forward explicitly. Good inputs are:

- Jira keys or Taskwarrior task keys
- Vestige memory IDs or lifecycle-thread summaries
- Serena memory names
- PR URLs or local diff targets
- file paths
- pasted acceptance criteria, test results, and review verdicts

Do not assume Goose remembers a previous session unless the artifact was saved
or included in the next prompt.

## Product Requirements vs Story Delivery

Use product requirements work when the input is still a concept, product area,
new site, or large initiative:

```bash
goose-brainstorm "new product area"
goose-orchestrate "approved PRD or brainstorm memory"
goose-learn "approved PRD and story map artifact bundle" feature
```

Use story delivery after a specific story has requirements and acceptance
criteria:

```bash
goose-plan "story key or acceptance criteria"
goose-implement "approved plan"
goose-test "implementation artifact"
goose-review "PR or diff target"
goose-learn "completed story artifact bundle" story
```

Most stories do not need a second task-planning pass. Use localized task
planning only for unusually large stories.

## Automated Story Cycle

`goose-cycle` is the Taskwarrior/Vestige-backed conductor for the same story
workflow. It runs the phase recipes as separate Goose sessions and uses
`.goose-cycle/active.json` as a resumable pointer.

```bash
goose-cycle start --task-project <taskwarrior-project>
goose-cycle start --task-project <taskwarrior-project> --task <task-key-or-uuid>
goose-cycle next --task-project <taskwarrior-project>
goose-cycle status --task-project <taskwarrior-project> --task <task-key-or-uuid>
```

After review or rereview is approved, `goose-cycle` continues through
`document-learn` and `cycle-close`. Autonomous mode requests commit behavior;
guided mode closes without commit unless `--commit` is supplied.

See [`GOOSE-CYCLE.md`](GOOSE-CYCLE.md) for exact commands and state-machine
details.

## When to Use Other Paths

- Use `goose-instructor` when you want advice, not edits.
- Use `goose-investigate` for complex read-only troubleshooting.
- Use specialty implementation aliases only when the story domain calls for them
  such as WordPress, UI/UX, SEO, or research-heavy work.
- Use direct `goose run --recipe ...` only when an alias does not exist or when
  developing the recipe system itself.

## Closeout Checklist

Before `goose-learn`, gather:

- implementation summary and changed files
- test commands and results
- review verdict and any resolved findings
- acceptance criteria evidence
- remaining risk and follow-ups

`goose-learn` should update only the docs and memories justified by those
artifacts.

## Example Session

### Brainstorm to PRD/Tasks

```bash
$ goose-brainstorm "Let's make a change calculator PWA"
# discussion, Q&A, etc
> Save this brainstorming session to a vestige for handoff
> /exit

$ goose run --recipe task-planner --interactive
> Review the brainstorming session from vestige memory `<VESTIGE_MEMORY_ID>`.
  Present an Epic and Story breakdown for me to review and approve.
# discussion, Q&A, etc until plan is presented
> Write these epics/stories to Jira/Taskwarrior/Markdown/etc
> Update Vestige memory with our task structure and details
> /exit
```

### IMA Dev Cycle

Here we take each task and iterate through our "human-in-the-loop" dev cycle.

```bash
$ goose-plan
> We need to plan out this Jira/Taskwarrior task: <LINK_OR_ID>
# discussion, Q&A, etc until plan is presented
> Save this plan to vestige for handoff
# this will print out vestige ID(s) for you and an example handoff prompt
> /exit
```

```bash
$ goose-implement # or goose-wp or goose-js depending on tech stack
> <PASTE_PROMPT> or "Let's implement this task from vestige memory `<VESTIGE_MEMORY_ID>`"
# implementation performs immediate appropriate verification and diff inspection,
# saves its lifecycle artifact, and stops for the separate formal test phase
# HITL: review the work to check for any issues.
> Update vestige memories and generate me a handoff prompt for the tester
> /exit
```

```bash
$ goose-test
> <PASTE_PROMPT> or "Make sure our work is sufficiently tested to our standards. See vestige memories: <INSERT_IDS>"
# Testing will be executed and updated as needed
> Update vestige memories with your work
> Generate me a handoff prompt for the reviewer
> /exit
```

```bash
$ goose-review
> <PASTE_PROMPT>
> or "Do a full review of this PR: <INSERT_URL>"
> or "Do  a full review of our local work, see vestige memory <INSERT_IDS>"
# Full review will crunch for a while and will return a summary.
# If a PR, it will ask to submit a comment
> Save your review findings to vestige for handoff back to implementer.
> Generate me a handoff prompt
# NOTE: the review plan is instructed to be very detailed on HOW to fix it,
# so the higher model is making the key decisions, not the lower implementer model
> /exit
```

```bash
$ goose-implement
> <PASTE_PROMPT> or "Review found some issues to resolve. See vestige memory <INSERT_MEMORY_ID>"
# implementer will verify and resolve each issue
> Update vestige with your work
> /exit
```

```bash
$ goose-review # or flip to review tab already open
> Fixes from previous review have been implemented.  Please re-review.  See vestige memory `<INSERT_ID>`
> Update vestige memories with your findings/resolution
> Generate me a handoff prompt for the document/learn agent
> /exit
```

```bash
$ goose-learn
> Make sure our documentation, memories, serena core instruction files, qdrant, wikis, stories, etc
  are up to date based on the work we just did.  See vestige memories <INSERT_IDS>
# Be explicit on what documentation/memories/systems you want updated for a more targeted update.
> Update vestige memories for closeout
> /exit
```

The benefit of this workflow is your memory system is constantly and consistently updated with your vision, plans,
implementation, found issues, resolutions, etc. It isn't just your documentation that gets kept up to date, but your core
semantic memory system as well.  In the future, when working on other tasks, hunting down bugs, planning a new feature, etc.
it can find this detailed information.  It gets smarter and more capable over time, with a deeper understanding of the
application.

The `goose-cycle` helper takes this same approach, but tracks and automates it.  Each step it does while auto-approving
its recommendations.  When you type `/exit` after final review of each step, it immediately goes into the next cycle phase
pre-prompted to kick off the work.  This can be automated further by removing `--interactive` so they auto-exit.

## HITL lifecycle handoffs

The formal sequence is `plan -> implement -> test-writer -> code-review -> document-learn`. Implementation runs immediate verification and diff inspection, saves its correlated Vestige artifact, and stops; it does not invoke formal test or review children. Manual phases return a next alias and pasteable prompt. Cycle phases rely on the conductor and a validated Vestige save receipt before active-state advancement.
