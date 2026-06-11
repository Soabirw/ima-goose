## Serena Project Memory Bootstrap

At session start, before greeting, interpreting the prompt, or using any
task-specific tool, the first tool action MUST be the Serena bootstrap.
If Serena tool usage or Goose SDK signatures are not already known and the
`mcp-serena` skill is available, you may load that skill first as bootstrap
support. That skill load is part of Serena bootstrap, not task-specific
research. After it, immediately continue with the Serena project-memory
bootstrap.

Do the bootstrap before Taskwarrior, Jira, Vestige, Qdrant, file reads,
repository search, browser inspection, workflow discovery, or asking the user
for paths/config that project memory may already contain:

1. Activate the Serena project with the current project path or registered
   project name. Activation is always first; without it, memory calls can return
   `No active project`.
2. Call Serena `initial_instructions`.
3. List memories and read standard memories when present: `core`,
   `conventions`, `tech_stack`, `suggested_commands`, and
   `task_completion`.
4. For implementation, review, testing, planning, or automation, at minimum
   load `core`, `conventions`, and `suggested_commands` before acting.
5. If required standard memories are missing but `.goosehints`,
   `CLAUDE.md`, or `AGENTS.md` exists, use the `mcp-serena` migration
   workflow to create or refresh Serena memories. In read-only recipes,
   report the needed migration instead of writing memories.

Goose typed SDK reminder: wrapper methods are camelCase and return
`{ result: string }`:

```ts
await Serena.activateProject({ project: "." });
await Serena.initialInstructions({});
await Serena.listMemories({});
await Serena.readMemory({ memory_name: "core" });
```

Use the current project path or a registered Serena project name for `project`.
Do not call `readMemory` with `memory_file_name`, and do not assume
`listMemories` returns an object with a `.memories` property. Read `.result`
and parse only when a caller explicitly needs structured data.

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
