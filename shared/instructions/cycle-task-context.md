## Goose Cycle Task Context

When both `task_project` and `task` are supplied, this session is part of the
`goose-cycle` HITL workflow.

`task_project` is the Taskwarrior project used for native `task project:<name>`
filtering. It is not a Serena project name, project path, or activation input.
Serena project discovery belongs only to the Serena bootstrap.

Before acting:
- Complete Serena bootstrap.
- Inspect the Taskwarrior task with a narrow filter for the supplied
  Taskwarrior project and task key/UUID.
- Search Vestige for the current lifecycle thread using the Taskwarrior
  project, task, Taskwarrior UUID, Jira key, and any source refs found on the
  task.
- Treat Vestige as the detailed lifecycle source of truth and Taskwarrior as
  the queue/status source.

During the phase:
- Use the existing recipe contract for this phase; do not implement behavior
  that belongs to another phase.
- Ask only when guided mode requires clarification or when multiple plausible
  task/thread identities exist.
- Keep child-session briefs self-contained.

Before finishing:
- Update Vestige with this phase's outcome, changed files or reviewed files,
  verification commands/results, blockers, and residual risk.
- Update Taskwarrior narrowly with an annotation or lifecycle tag when it is
  safe and specific to the selected task.
- Do not mark the Taskwarrior task done. Final completion belongs to
  `goose-cycle close` after human approval.
