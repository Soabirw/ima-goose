## Serena Project Memory Bootstrap

At session start, before greeting, interpreting the prompt, or using any
other tool, the first tool action MUST be the Serena bootstrap. Do this before
Taskwarrior, Jira, Vestige, Qdrant, file reads, repository search, browser
inspection, or asking the user for paths/config that project memory may
already contain:
1. Call Serena `initial_instructions`.
2. List memories and read standard memories when present: `core`,
   `conventions`, `tech_stack`, `suggested_commands`, and
   `task_completion`.
3. For implementation, review, testing, planning, or automation, at minimum
   load `core`, `conventions`, and `suggested_commands` before acting.
4. If required standard memories are missing but `.goosehints`,
   `CLAUDE.md`, or `AGENTS.md` exists, use the `mcp-serena` migration
   workflow to create or refresh Serena memories. In read-only recipes,
   report the needed migration instead of writing memories.

Do not continue with task-specific discovery until the bootstrap is complete
or Serena is unavailable and you have said so explicitly. After bootstrap, if
this recipe has no concrete task/source parameter, greet briefly, ask for the
missing input, and wait.

Do not assume `.goosehints`, `CLAUDE.md`, or `AGENTS.md` was injected
by the harness. Serena memories are the runtime source of truth for
project-local instructions.

For task-scoped work, follow the Vestige task lifecycle protocol from the
loaded Serena memories so planning, implementation, review, resolution, and
closeout share one task memory thread.
