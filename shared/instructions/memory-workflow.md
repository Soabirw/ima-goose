## Memory Workflow

Use the memory systems as shared infrastructure, not as interchangeable
scratchpads. Each system has a distinct job:

- `mcp-serena` is the project memory and code-navigation system. Use it for
  project bootstrap, stable project-local instructions, standard memories,
  symbol-aware lookup, and refactor-safe code operations.
- `mcp-vestige` is the working-memory system. Use it for task/session
  continuity, prior brainstorms and plans, user preferences, decisions,
  intentions, and closeout learning that should follow work across sessions.
- `mcp-qdrant` is the durable knowledge library. Use it for long-lived
  reference material such as standards, PRDs, architecture docs, research,
  reusable code patterns, and project knowledge that should not fade.

At session start, follow the Serena bootstrap first when this recipe includes
`instructions/serena-bootstrap.md`. Loading the `mcp-serena` skill solely to
learn Serena tool usage or Goose SDK signatures is bootstrap support, not
extra topic research. After bootstrap, use memory only when it is relevant to
the user's stated task. Do not pre-load extra memory, skills, or reference
material before the user has provided the topic or source.

For task-specific discovery:
1. Search Vestige first for related prior work, decisions, task threads,
   brainstorms, plans, and preferences.
2. Search Qdrant when the task needs durable reference knowledge, standards,
   prior documents, or archived research.
3. Read Serena memories when the task references named project memories or
   when project-local instructions are needed.
4. Summarize relevant memory hits before using them, including uncertainty
   when results are partial or stale.

For saving:
1. Save brainstorms, plans, decisions, task state, and closeout learning to
   Vestige unless the user explicitly chooses a different destination.
2. Save stable project instructions to Serena when they belong in project
   memory and the recipe permits memory writes.
3. Store durable reference artifacts in Qdrant when they should be searchable
   as long-lived knowledge rather than session memory.
4. When saving a handoff artifact, include enough context that the next recipe
   can continue without the original chat transcript.

If more operational detail is needed, load the relevant skill before acting:
`mcp-serena` for project memory and symbol-aware code work, `mcp-vestige` for
working-memory lifecycle and intentions, and `mcp-qdrant` for durable semantic
knowledge storage.
