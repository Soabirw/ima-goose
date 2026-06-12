---
name: mcp-serena
description: "Serena MCP — use for code investigation, symbol-aware editing, and project-scoped memory. Use before Read/Grep for code navigation; use project memories to load cross-harness project context; use the migration workflow to convert .goosehints, CLAUDE.md, or AGENTS.md into standard Serena memories. Triggers on: Serena, project memory, .goosehints, CLAUDE.md, AGENTS.md, find function, find class, find references, rename symbol, refactor, search code, onboarding, initial_instructions."
---

# Serena MCP - Code Navigation and Project Memory

Use Serena FIRST for all code investigation — before Read, before Grep. Reading entire files wastes 40-70% of token budget. Serena gives precise symbol-level access.

**NOTE:** JetBrains tools (`jet_brains_*`) require a JetBrains IDE (IntelliJ, WebStorm, PHPStorm) running with the Serena MCP plugin installed. Memory and onboarding tools work standalone without an IDE.

Use Serena project memories as the cross-harness replacement for project-local context files that may or may not be injected by Goose, Claude Code, Codex, or another runner. `.goosehints`, `CLAUDE.md`, and `AGENTS.md` are useful source files, but Serena memories are the reliable runtime source of truth once migrated.

## ima-mcp Gateway Path

When a project has the `ima-mcp` gateway installed and current, prefer it for
stable local Serena bootstrap/status commands, especially when the active
harness does not expose every Serena MCP tool.

```bash
ima-mcp serena project status --project . --json
ima-mcp serena project activate . --json
ima-mcp serena instructions --project . --json
ima-mcp serena memory list --project . --json
ima-mcp serena memory read core --project . --json
```

Use direct Serena MCP wrappers for symbol-aware code navigation and edits when
they are exposed and reliable. The gateway complements direct MCP access; it
does not replace JetBrains-backed Serena code intelligence.

## Tools

### Code Navigation (JetBrains — requires IDE)

| Tool | Purpose |
|------|---------|
| `mcp__serena__jet_brains_get_symbols_overview` | Top-level symbols in a file (structure without bodies) |
| `mcp__serena__jet_brains_find_symbol` | Find any class, function, or method by name |
| `mcp__serena__jet_brains_find_referencing_symbols` | Find all callers/references to a symbol |
| `mcp__serena__jet_brains_find_declaration` | Jump to declaration of a symbol |
| `mcp__serena__jet_brains_find_implementations` | Find implementations of an interface/abstract |
| `mcp__serena__jet_brains_type_hierarchy` | Explore class hierarchy |
| `mcp__serena__jet_brains_debug` | Debug inspection |

### Code Editing (JetBrains — requires IDE)

| Tool | Purpose |
|------|---------|
| `mcp__serena__jet_brains_rename` | Rename symbol across entire codebase |
| `mcp__serena__jet_brains_move` | Move symbol to different location |
| `mcp__serena__jet_brains_safe_delete` | Delete symbol, verifying no references remain |
| `mcp__serena__jet_brains_inline_symbol` | Inline a variable or method |
| `mcp__serena__jet_brains_list_inspections` | List code inspection categories |
| `mcp__serena__jet_brains_run_inspections` | Run code inspections |

### Content Editing (Serena — no IDE required)

| Tool | Purpose |
|------|---------|
| `mcp__serena__replace_symbol_body` | Replace the body of a named symbol |
| `mcp__serena__replace_content` | Replace content by pattern match |
| `mcp__serena__insert_after_symbol` | Insert code after a named symbol |
| `mcp__serena__insert_before_symbol` | Insert code before a named symbol |

### Memory (Serena — no IDE required)

| Tool | Purpose |
|------|---------|
| `mcp__serena__activate_project` | Activate the project before setup or memory calls |
| `mcp__serena__write_memory` | Write project context or notes |
| `mcp__serena__read_memory` | Read stored memory by name |
| `mcp__serena__edit_memory` | Edit existing memory entry |
| `mcp__serena__delete_memory` | Delete a memory entry |
| `mcp__serena__rename_memory` | Rename a memory entry |
| `mcp__serena__list_memories` | List all memory entries |

### Onboarding (Serena — no IDE required)

| Tool | Purpose |
|------|---------|
| `mcp__serena__activate_project` | Activate the project before setup or memory calls |
| `mcp__serena__initial_instructions` | Read Serena setup instructions |
| `mcp__serena__check_onboarding_performed` | Check if onboarding is done |
| `mcp__serena__onboarding` | Run project onboarding |
| `mcp__serena__serena_info` | Get Serena server info |
| `mcp__serena__open_dashboard` | Open Serena dashboard |

## Goose TypeScript SDK

Direct MCP/client examples use snake_case tool names such as
`mcp__serena__activate_project`, `mcp__serena__initial_instructions`,
`mcp__serena__list_memories`, and `mcp__serena__read_memory`. Goose's typed SDK wrapper exposes supported tools
under the `Serena` namespace with camelCase method names. Use the wrapper shape
that fits the current harness.

Serena Goose SDK calls return `{ result: string }` for the supported tools below.
Read `.result`; do not assume list calls return arrays or object properties unless
the specific tool documents that inside the string payload.

### Memory and onboarding

| Direct/native tool | Goose SDK wrapper | Required input | Optional input |
|---|---|---|---|
| `mcp__serena__activate_project` | `Serena.activateProject` | `project: string` | — |
| `mcp__serena__initial_instructions` | `Serena.initialInstructions` | `{}` | — |
| `mcp__serena__list_memories` | `Serena.listMemories` | — | `topic?: string` |
| `mcp__serena__read_memory` | `Serena.readMemory` | `memory_name: string` | — |
| `mcp__serena__write_memory` | `Serena.writeMemory` | `memory_name: string`, `content: string` | `max_chars?: number` |
| `mcp__serena__edit_memory` | `Serena.editMemory` | `memory_name`, `needle`, `repl`, `mode: "literal" \| "regex"` | `allow_multiple_occurrences?: boolean` |
| `mcp__serena__delete_memory` | `Serena.deleteMemory` | `memory_name: string` | — |
| `mcp__serena__rename_memory` | `Serena.renameMemory` | `old_name: string`, `new_name: string` | — |
| `mcp__serena__onboarding` | `Serena.onboarding` | `{}` | — |
| `mcp__serena__serena_info` | `Serena.serenaInfo` | `topic: string` | — |
| `mcp__serena__open_dashboard` | `Serena.openDashboard` | `{}` | — |

Correct bootstrap pattern:

```ts
await Serena.activateProject({ project: "." });
await Serena.initialInstructions({});
const listed = await Serena.listMemories({});
const core = await Serena.readMemory({ memory_name: "core" });
console.log(listed.result, core.result);
```

Do not call `readMemory` with `memory_file_name`, and do not assume
`listMemories` returns `.memories`.

### Content editing

| Direct/native tool | Goose SDK wrapper | Required input | Optional input |
|---|---|---|---|
| `mcp__serena__replace_content` | `Serena.replaceContent` | `relative_path`, `needle`, `repl`, `mode: "literal" \| "regex"` | `allow_multiple_occurrences?: boolean` |
| `mcp__serena__replace_symbol_body` | `Serena.replaceSymbolBody` | `relative_path`, `name_path`, `body` | — |
| `mcp__serena__insert_after_symbol` | `Serena.insertAfterSymbol` | `relative_path`, `name_path`, `body` | — |
| `mcp__serena__insert_before_symbol` | `Serena.insertBeforeSymbol` | `relative_path`, `name_path`, `body` | — |

Use symbol/content editing only after targeted retrieval confirms the exact symbol
or content to change.

### JetBrains code intelligence and refactoring

These require a JetBrains IDE with the Serena MCP plugin running.

| Direct/native tool | Goose SDK wrapper | Required input | Useful optional input |
|---|---|---|---|
| `mcp__serena__jet_brains_get_symbols_overview` | `Serena.jetBrainsGetSymbolsOverview` | `relative_path` | `depth?`, `max_answer_chars?`, `include_file_documentation?` |
| `mcp__serena__jet_brains_find_symbol` | `Serena.jetBrainsFindSymbol` | `name_path_pattern` | `relative_path?`, `depth?`, `include_body?`, `include_info?`, `search_deps?`, `max_matches?` |
| `mcp__serena__jet_brains_find_referencing_symbols` | `Serena.jetBrainsFindReferencingSymbols` | `relative_path`, `name_path` | `max_answer_chars?` |
| `mcp__serena__jet_brains_find_declaration` | `Serena.jetBrainsFindDeclaration` | `relative_path`, `regex` | `include_body?` |
| `mcp__serena__jet_brains_find_implementations` | `Serena.jetBrainsFindImplementations` | `relative_path`, `name_path` | — |
| `mcp__serena__jet_brains_type_hierarchy` | `Serena.jetBrainsTypeHierarchy` | `relative_path`, `name_path` | `hierarchy_type?`, `depth?`, `max_answer_chars?` |
| `mcp__serena__jet_brains_rename` | `Serena.jetBrainsRename` | `relative_path`, `new_name` | `name_path?`, `rename_in_comments?`, `rename_in_text_occurrences?` |
| `mcp__serena__jet_brains_move` | `Serena.jetBrainsMove` | `relative_path` | `name_path?`, `target_relative_path?`, `target_parent_name_path?` |
| `mcp__serena__jet_brains_safe_delete` | `Serena.jetBrainsSafeDelete` | `relative_path` | `name_path?`, `delete_even_if_used?`, `propagate?` |
| `mcp__serena__jet_brains_inline_symbol` | `Serena.jetBrainsInlineSymbol` | `relative_path`, `name_path` | `keep_definition?` |
| `mcp__serena__jet_brains_debug` | `Serena.jetBrainsDebug` | `expression` | `repl_key?` |
| `mcp__serena__jet_brains_run_inspections` | `Serena.jetBrainsRunInspections` | `relative_path` | `min_severity?`, `inspection_names?`, `start_line?`, `end_line?`, `max_answer_chars?` |
| `mcp__serena__jet_brains_list_inspections` | `Serena.jetBrainsListInspections` | — | `language?`, `group_path_contains?`, `max_answer_chars?` |

## Project Memory Bootstrap

At the start of project-specific work in any Serena-enabled harness, Serena
bootstrap is the first workstream. If this skill was loaded first to learn
Serena mechanics or Goose wrapper signatures, that load is bootstrap support,
not task-specific research. After loading the skill, immediately run the Serena
project-memory calls below before greeting, interpreting the prompt, or using
Taskwarrior, Jira, Vestige, Qdrant, file reads, repository search, browser
inspection, or local workflow discovery.

1. Activate the Serena project with the current project path or registered
   project name. Activation is always first; without it, memory calls can
   return `No active project`.
   - Direct MCP: `mcp__serena__activate_project` with `project`
   - Goose SDK: `await Serena.activateProject({ project: "." })`
2. Call Serena initial instructions:
   - Direct MCP: `mcp__serena__initial_instructions`
   - Goose SDK: `await Serena.initialInstructions({})`
3. List memories:
   - Direct MCP: `mcp__serena__list_memories`
   - Goose SDK: `await Serena.listMemories({})`
4. Read the standard memories that exist and are relevant to the task:
   - Direct MCP: `mcp__serena__read_memory` with `memory_name`
   - Goose SDK: `await Serena.readMemory({ memory_name: "core" })`
   - Always read `core`, `conventions`, and `suggested_commands` before implementation, review, testing, planning, or automation.
   - Read `tech_stack` when choosing libraries, commands, file locations, or integration points.
   - Read `task_completion` before final verification, release work, or handoff.
   - Read `memory_maintenance` when updating or migrating project knowledge.
5. If standard memories are missing and `.goosehints`, `CLAUDE.md`, or `AGENTS.md` exists, migrate the source file content into Serena memories before depending on it. In read-only recipes, report that migration is needed instead of writing memories.

Do not assume `.goosehints`, `CLAUDE.md`, or `AGENTS.md` was injected into the model context. If the task depends on project conventions, load Serena memories explicitly.

Do not ask the user for project paths, task configuration, `TASKRC`, `TASKDATA`,
Jira setup, wrapper commands, or local workflow details until the standard
memories have been checked. Project memory may already contain that information.

## Standard Project Memories

Use these memory names consistently across projects:

| Memory | Contents |
|--------|----------|
| `core` | Project purpose, key directories, domain model, architecture overview, ownership boundaries |
| `conventions` | Coding standards, security rules, release/version policy, naming, review expectations, team preferences, task lifecycle memory rules |
| `tech_stack` | Languages, frameworks, runtimes, package managers, infrastructure, integrations |
| `suggested_commands` | Taskwarrior commands, Vestige search/store patterns, test/build/dev commands, environment commands, safe read-only diagnostics |
| `task_completion` | Required validation, Vestige closeout updates, docs/changelog/release expectations, commit/PR rules |
| `memory_maintenance` | Source files migrated, refresh policy, what belongs in each memory, last known migration notes |

Keep memories concise and operational. Prefer a clear summary with exact commands and paths over dumping a whole context file into one memory.

## Org-Standard Memory Seeds

When bootstrapping a project for IMA-style task work, seed these cross-project
rules into the standard Serena memories:

- `conventions`: For task-scoped project work, use Vestige as the living task
  memory across planning, implementation, review, resolution, and closeout.
  Search Vestige by the Taskwarrior ID/UUID, Jira key, or project task key before
  planning, implementing, reviewing, or closing the task.
- `suggested_commands`: Search Vestige for the active task key and related keys
  before acting. Example queries include `CM-001`, `CM-010`, `CM-011`, Jira
  keys, Taskwarrior UUIDs, and feature names from the task source.
- `task_completion`: Before marking a Taskwarrior task or equivalent tracker
  item complete, update Vestige with final outcome, verification performed,
  review concerns resolved, remaining risk, and any follow-up tasks.
- `memory_maintenance`: Note that Serena stores stable project instructions,
  while Vestige stores the evolving task lifecycle thread.

## Migrate Context Files

Use this workflow when a project has `.goosehints`, `CLAUDE.md`, or `AGENTS.md` and Serena memories are missing or stale:

1. Inspect the source files at the project root.
2. Run the helper from this skill directory. Include org standards when this is
   an IMA-style project or the user asks for the shared task lifecycle workflow:

```bash
python3 skills/mcp-serena/scripts/migrate-context-to-serena.py --root .
python3 skills/mcp-serena/scripts/migrate-context-to-serena.py --root . --include-org-standards
```

3. Review the generated memory blocks. Adjust anything that was routed poorly.
4. Write each block with `mcp__serena__write_memory` using the standard memory name.
5. Record the migrated source files in `memory_maintenance`.

The helper does not call Serena. It only converts source files into suggested memory content so the agent can review before writing.

## Memorize New Project Context

Use `/serena-memorize <note>` inside Goose when the user wants to add a concise
project-context fact or workflow rule to the standardized Serena memories. The
memorize recipe bootstraps Serena, reads existing memories, classifies the note,
rewrites it into operational memory text, updates the smallest appropriate
memory set, and summarizes what changed.

Good examples:

```text
/serena-memorize Our Claude Code design exists at ./claude-design and should be referenced when implementing app feature tasks.
/serena-memorize Use the default user-scoped Taskwarrior setup and scope this project with task project:Example next.
```

Do not use `/serena-memorize` for one-off session notes, secrets, or active task
progress. Use Vestige for evolving task lifecycle state.

## Decision Matrix

```
Need to understand code structure?
  → jet_brains_get_symbols_overview (NOT Read)

Need to find a function/class?
  → jet_brains_find_symbol (NOT Grep)

Need to find all callers?
  → jet_brains_find_referencing_symbols (NOT Grep)

Need project rules, commands, or local workflow?
  → activate_project first, then initial_instructions, list_memories, read standard memories
     (NOT relying on .goosehints/CLAUDE.md injection)

Need to migrate .goosehints or CLAUDE.md?
  → scripts/migrate-context-to-serena.py, then write_memory

Need the function body to modify it?
  → jet_brains_find_symbol with include_body: true
     THEN Read only the specific file/lines

Renaming across codebase?
  → jet_brains_rename (handles all references)

Non-code file (YAML, JSON, Markdown)?
  → Native Read tool (Serena/LSP doesn't index these)

Serena unavailable?
  → Fall back to native Read/Grep
```

## Common Patterns

### Get file structure (before reading)

```
mcp__serena__jet_brains_get_symbols_overview
  relative_path: "src/services/auth.ts"
  depth: 1
```

Returns all top-level symbols without reading the file. Use `depth: 2` to see methods inside classes.

### Find a function

```
mcp__serena__jet_brains_find_symbol
  name_path_pattern: "getUserById"
  include_body: false
```

Set `include_body: true` only when you need to modify the implementation. Use `relative_path` to narrow scope.

### Find all callers

```
mcp__serena__jet_brains_find_referencing_symbols
  name_path: "AuthService/validateToken"
  relative_path: "src/services/auth.ts"
  include_info: true
```

### Replace a function body

```
mcp__serena__replace_symbol_body
  symbol_name: "getUserById"
  relative_path: "src/services/user.ts"
  new_body: "{ return await db.users.findUnique({ where: { id } }); }"
```

### Write project context to memory

```
mcp__serena__write_memory
  memory_name: "core"
  content: "Auth uses JWT. Tokens validated in AuthService.validateToken. Refresh handled by /api/auth/refresh endpoint."
```

### Read standard project memories

```
mcp__serena__activate_project
  project: <current project path or registered project name>

mcp__serena__initial_instructions

mcp__serena__list_memories

mcp__serena__read_memory
  memory_name: "core"

mcp__serena__read_memory
  memory_name: "conventions"

mcp__serena__read_memory
  memory_name: "suggested_commands"
```

## Setup

Serena is started via `uvx` from the Serena GitHub repo. It runs standalone (no npm package).

### Direct Config Edit

Add to `~/.config/goose/config.yaml`:

```yaml
extensions:
  serena:
    enabled: true
    name: serena
    type: stdio
    cmd: uvx
    args:
      - "--from"
      - "git+https://github.com/oraios/serena"
      - "serena"
      - "start-mcp-server"
      - "--context=claude-code"
      - "--language-backend"
      - "JetBrains"
      - "--project-from-cwd"
    timeout: 300
```

### JetBrains IDE Setup

For `jet_brains_*` tools:
1. Install the [Serena MCP plugin](https://plugins.jetbrains.com/plugin/27337-serena-mcp) in your JetBrains IDE
2. Open your project in the IDE before starting a Goose session
3. The plugin connects the MCP server to the IDE's language intelligence

Without the IDE plugin, only memory/onboarding tools are available. Content editing tools (`replace_symbol_body`, etc.) work with LSP backend but require language servers configured in `.serena/project.yml`.

### Project Config

Each project that uses Serena needs a `.serena/project.yml` at the project root. Minimal config:

```yaml
project_name: "my-project"
languages: ["typescript"]   # or php, python, etc.
encoding: "utf-8"
```

The ima-goose repo already has `.serena/project.yml` configured.
