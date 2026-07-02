## Serena Project Memory Bootstrap

At session start, before greeting, interpreting the prompt, or using any
task-specific tool, the first tool action MUST be the Serena bootstrap. Serena
bootstrap means using the `mcp-serena` skill's `ima-mcp serena` CLI gateway for
project activation, `initial_instructions`, memory listing, and memory reads.
Do not use a built-in Serena extension, native/direct Serena memory tools, or
the Goose typed SDK / `execute_typescript` path for this bootstrap.

If `ima-mcp serena` gateway usage is not already known and the `mcp-serena`
skill is available, you may load that skill first as bootstrap support. That
skill load is part of Serena bootstrap, not task-specific research. After it,
immediately continue with the Serena project-memory bootstrap.

Do the bootstrap before Taskwarrior, Jira, Vestige, Qdrant, file reads,
repository search, browser inspection, workflow discovery, or asking the user
for paths/config that project memory may already contain:

1. Use the `mcp-serena` skill's `ima-mcp` CLI wrapper, not built-in/native
   Serena tools and not `execute_typescript`, to activate the current Serena
   project: `ima-mcp serena project activate --json`. Activation is always
   first; without it, memory calls can return `No active project`.
2. Call Serena `initial_instructions` through the gateway:
   `ima-mcp serena instructions --json`.
3. List memories and read standard memories through the gateway when present:
   `ima-mcp serena memory list --json` and
   `ima-mcp serena memory read <name> --json` for `core`, `conventions`,
   `tech_stack`, `suggested_commands`, and `task_completion`.
4. For implementation, review, testing, planning, or automation, at minimum
   load `core`, `conventions`, and `suggested_commands` before acting.
5. If required standard memories are missing but `.goosehints`,
   `CLAUDE.md`, or `AGENTS.md` exists, use the `mcp-serena` migration
   workflow to create or refresh Serena memories. In read-only recipes,
   report the needed migration instead of writing memories.

Canonical gateway commands:

Serena/gateway resolves project context from the current working project context
and Serena project configuration. Do not supply recipe parameters such as
`project`, `task_project`, `task-project`, or `project_path` as a Serena project
name. A Taskwarrior `task_project` is never a Serena activation input. Serena
project identity is owned by Serena, including its `project.yml` `project_name`
and cwd/project-from-cwd behavior.

```bash
command -v ima-mcp
ima-mcp serena project activate --json
ima-mcp serena instructions --json
ima-mcp serena memory list --json
ima-mcp serena memory read core --json
ima-mcp serena memory read conventions --json
ima-mcp serena memory read tech_stack --json
ima-mcp serena memory read suggested_commands --json
ima-mcp serena memory read task_completion --json
```

The bootstrap report must make the sequence auditable. Do not just say
"Serena bootstrap complete" after activation. Return a compact status table or
bullet list that names every attempted bootstrap step and its outcome:

```text
Serena bootstrap status:
- gateway: PASS (`command -v ima-mcp`) -> <path>
- activate: PASS (`ima-mcp serena project activate ...`) -> <project/name from response>
- initial_instructions: PASS (`ima-mcp serena instructions ...`) -> loaded <short length/summary>
- memory list: PASS (`ima-mcp serena memory list ...`) -> <N/listed names or short summary>
- memory core: PASS|MISSING|FAIL -> <short evidence>
- memory conventions: PASS|MISSING|FAIL -> <short evidence>
- memory tech_stack: PASS|MISSING|FAIL -> <short evidence>
- memory suggested_commands: PASS|MISSING|FAIL -> <short evidence>
- memory task_completion: PASS|MISSING|FAIL -> <short evidence>
```

Use these meanings:

- `PASS`: command ran successfully and returned usable output.
- `MISSING`: memory list succeeded, but that memory was not present.
- `FAIL`: command failed, returned unusable output, or could not be parsed enough
  to trust. Include the command name and relevant error excerpt.
- `SKIP`: only acceptable for optional memories not relevant to the current
  recipe, and the reason must be stated.

Only call the bootstrap complete when activation, `initial_instructions`, and
memory listing are all `PASS`, and every required standard memory for the
current task is either `PASS` or explicitly `MISSING` with a migration
recommendation. If activation passes but `initial_instructions` or memory list
does not run, report bootstrap as incomplete/blocking rather than successful.

Do not use a built-in Serena extension, native/direct Serena memory tools, or
Goose typed SDK / `execute_typescript` for Serena bootstrap. The SDK path can
fail before Serena runs because generated SDK definitions from other registered
tools are invalid TypeScript. Native/direct Serena tools may also be absent or
may bypass the required project-memory gateway contract. If the `ima-mcp`
gateway is missing or fails, report that blocker explicitly.

Do not continue with task-specific discovery until the bootstrap is complete
or Serena is unavailable and you have said so explicitly. If a command fails,
show the failed step and stop unless the failure is only a missing optional
memory. After bootstrap, if this recipe has no concrete task/source parameter,
greet briefly, ask for the missing input, and wait.

Do not assume `.goosehints`, `CLAUDE.md`, or `AGENTS.md` was injected
by the harness. Serena memories are the runtime source of truth for
project-local instructions.

For task-scoped work, follow the Vestige task lifecycle protocol from the
loaded Serena memories so planning, implementation, review, resolution, and
closeout share one task memory thread.
