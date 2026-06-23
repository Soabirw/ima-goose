---
name: mcp-serena
description: "Serena MCP — use ima-mcp serena CLI as the required path for project activation, initial instructions, status, memories, generic tools, known navigation/edit aliases, and safety-gated writes/commands; do not use execute_typescript/Goose SDK for Serena bootstrap. Use native/direct Serena tools only when the CLI is unavailable or a harness exposes a proven direct tool that the CLI does not cover. Triggers on: Serena, ima-mcp, project memory, .goosehints, CLAUDE.md, AGENTS.md, find function, find class, find references, rename symbol, refactor, search code, onboarding, initial_instructions."
---

# Serena MCP - Code Navigation and Project Memory

Use Serena FIRST for all code investigation — before Read, before Grep. Reading entire files wastes 40-70% of token budget. Serena gives precise symbol-level access.

**NOTE:** JetBrains tools (`jet_brains_*`) require a JetBrains IDE (IntelliJ, WebStorm, PHPStorm) running with the Serena MCP plugin installed. Memory and onboarding tools work standalone without an IDE.

Use Serena project memories as the cross-harness replacement for project-local context files that may or may not be injected by Goose, Claude Code, Codex, or another runner. `.goosehints`, `CLAUDE.md`, and `AGENTS.md` are useful source files, but Serena memories are the reliable runtime source of truth once migrated.

## Required ima-mcp Gateway Path

Use `ima-mcp serena` as **the required path** for Serena project activation,
status, initial instructions, memory reads, generic runtime tool calls, known
navigation aliases, and safety-gated writes/commands in Goose/API harness
sessions. Do not treat this as a preference or fallback. The Goose
`execute_typescript` SDK path can fail before any Serena call runs because
registered SDK type output may contain invalid TypeScript from unrelated tools.
If a user asks for Serena bootstrap, `initial_instructions`, project memories,
code navigation, memory writes, symbol/text edits, rename/refactor, or generic
Serena tool execution, go straight to the CLI.

Canonical bootstrap:

```bash
project="${PWD}"
ima-mcp serena project activate "$project" --json
ima-mcp serena instructions --project "$project" --json
ima-mcp serena memory list --project "$project" --json
ima-mcp serena memory read core --project "$project" --json
ima-mcp serena memory read conventions --project "$project" --json
ima-mcp serena memory read tech_stack --project "$project" --json
ima-mcp serena memory read suggested_commands --project "$project" --json
ima-mcp serena memory read task_completion --project "$project" --json
```

Diagnostics:

```bash
command -v ima-mcp
ima-mcp doctor --project . --json
ima-mcp serena project status --project . --json
ima-mcp serena doctor --project . --json
```

## Expanded ima-mcp Serena CLI Surface

`ima-mcp-gateway` 0.3.0 expanded Serena from a project-memory subset into the
preferred broad CLI gateway. Expanded commands below require
`ima-mcp-gateway >= 0.3.0`; check with `ima-mcp --version`. If an older gateway
reports `unknown command`, use only the bootstrap/memory subset that exists
there or upgrade the gateway before continuing. Prefer explicit aliases when
available; use generic `tools` fallback for runtime descriptors without a
first-class alias.

### Read-only and compatibility commands

```bash
# Compatibility/bootstrap
ima-mcp serena project status --project . --json
ima-mcp serena project activate . --json
ima-mcp serena instructions --project . --json
ima-mcp serena memory list --project . --json
ima-mcp serena memory read core --project . --json
ima-mcp serena doctor --project . --json

# Direct Serena compatibility aliases
ima-mcp serena activate_project --project . --json
ima-mcp serena initial_instructions --project . --json
ima-mcp serena get_current_config --project . --json
ima-mcp serena list_memories --project . --json
ima-mcp serena read_memory --memory_name core --project . --json
ima-mcp serena prepare_for_new_conversation --project . --json

# File/directory and pattern/symbol navigation
ima-mcp serena list_dir --relative_path src --recursive --project . --json
ima-mcp serena find_file --file_mask '*.ts' --relative_path src --project . --json
ima-mcp serena read_file --relative_path src/commands/serena.ts --start_line 0 --end_line 40 --project . --json
ima-mcp serena search_for_pattern --substring_pattern registerSerena --relative_path src --context_lines_before 2 --context_lines_after 2 --project . --json
ima-mcp serena get_symbols_overview --relative_path src/commands/serena.ts --project . --json
ima-mcp serena find_symbol --name_path registerSerenaCommands --relative_path src/commands/serena.ts --depth 1 --project . --json
ima-mcp serena find_referencing_symbols --name_path registerSerenaCommands --relative_path src/commands/serena.ts --project . --json

# Onboarding/thinking and JetBrains read-only navigation
ima-mcp serena check_onboarding_performed --project . --json
ima-mcp serena think_about_collected_information --project . --json
ima-mcp serena think_about_task_adherence --project . --json
ima-mcp serena think_about_whether_you_are_done --project . --json
ima-mcp serena jet_brains_find_symbol --name_path_pattern registerSerenaCommands --relative_path src/commands/serena.ts --project . --json
ima-mcp serena jet_brains_find_referencing_symbols --name_path registerSerenaCommands --relative_path src/commands/serena.ts --project . --json
ima-mcp serena jet_brains_get_symbols_overview --relative_path src/commands/serena.ts --depth 1 --project . --json
ima-mcp serena jet_brains_find_declaration --relative_path src/commands/serena.ts --regex 'registerSerenaCommands' --project . --json
ima-mcp serena jet_brains_find_implementations --relative_path src/serena/SerenaBackend.ts --name_path SerenaBackend --project . --json
ima-mcp serena jet_brains_type_hierarchy --relative_path src/serena/SerenaBackend.ts --name_path SerenaBackend --hierarchy_type both --project . --json
ima-mcp serena jet_brains_list_inspections --language TypeScript --project . --json
```

### Generic runtime tools fallback

```bash
ima-mcp serena tools list --project . --json
ima-mcp serena tools describe jet_brains_find_symbol --project . --json
ima-mcp serena tools call jet_brains_find_symbol --project . --args-json '{"name_path_pattern":"registerSerenaCommands","relative_path":"src/commands/serena.ts"}' --json
```

`tools call` accepts either `--args-json '{...}'` or `--args-file <path>`.
Arguments must be a JSON object; omitted args default to `{}`. Prefer direct
aliases when their CLI schema covers the operation; use generic `tools call` for
runtime descriptors without a first-class alias, for descriptor inspection, or
when a direct alias intentionally does not bridge a schema mismatch. Generic
calls use exact runtime tool names. Describe/known-route resolution may use the
approved candidate map, but generic execution does not perform fuzzy matching or
silent symbol-to-JetBrains bridging. The one approved semantic fallback is
`get_symbols_overview`: it prefers the plain runtime tool and may fall back to
schema-compatible `jet_brains_get_symbols_overview`; `find_symbol` does not
silently fall back to `jet_brains_find_symbol` because `name_path` and
`name_path_pattern` schemas differ.

### Safety-gated writes, state, and commands

```bash
# Memory and code/text writes require --allow-write
ima-mcp serena write_memory --memory_name core --content 'stable project fact' --project . --allow-write --json
ima-mcp serena replace_symbol_body --name_path SomeSymbol --relative_path src/file.ts --body 'replacement text' --project . --allow-write --json
ima-mcp serena insert_before_symbol --name_path SomeSymbol --relative_path src/file.ts --body-file /tmp/body.txt --project . --allow-write --json
ima-mcp serena insert_after_symbol --name_path SomeSymbol --relative_path src/file.ts --body 'inserted text' --project . --allow-write --json
ima-mcp serena create_text_file --relative_path notes/example.md --content 'text' --project . --allow-write --json
ima-mcp serena insert_at_line --relative_path notes/example.md --line 1 --content 'text' --project . --allow-write --json
ima-mcp serena delete_lines --relative_path notes/example.md --start_line 1 --end_line 2 --project . --allow-write --json
ima-mcp serena replace_lines --relative_path notes/example.md --start_line 1 --end_line 2 --content 'text' --project . --allow-write --json
ima-mcp serena replace_regex --relative_path src/file.ts --regex 'oldName' --replacement 'newName' --allow-multiple-occurrences --project . --allow-write --json
ima-mcp serena switch_modes --mode editing --project . --allow-write --json
ima-mcp serena restart_language_server --project . --allow-write --json
ima-mcp serena rename_symbol --name_path OldName --relative_path src/file.ts --new_name NewName --project . --allow-write --json
ima-mcp serena jet_brains_rename --name_path OldName --relative_path src/file.ts --new_name NewName --project . --allow-write --json

# Command-classified tools require --allow-command; --allow-write is not enough.
ima-mcp serena execute_shell_command --command 'pwd' --project . --allow-command --json
ima-mcp serena tools call execute_shell_command --project . --args-json '{"command":"pwd"}' --allow-command --json
```

Safety policy:

- Read-only commands need no approval flag and do not require `--allow-write`.
- Write, state-changing, and unknown generic calls require `--allow-write`.
- Command/shell-classified calls require `--allow-command`; `--allow-write` does
  not authorize shell execution.
- There is no `allowState`, `--allow-state`, or `--allow-state-change` path.
- Missing optional runtime descriptors should return `serena_tool_missing`.

If `ima-mcp` is missing or the CLI reports Serena is unavailable, stop and
report the blocker with the command output. Do not silently fall back to
`execute_typescript` for Serena bootstrap.

Use native/direct Serena MCP wrappers only when `ima-mcp serena` is missing,
blocked, or a proven direct wrapper is needed for a runtime tool not covered by
the CLI. The gateway is the stable default for project lifecycle, instructions,
memories, navigation, editing, generic runtime calls, and safety gates; direct
Serena remains useful documentation for harnesses that expose native tools.

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

## Goose TypeScript SDK Boundary

Do **not** use `execute_typescript` / Goose TypeScript SDK calls for Serena
bootstrap, status, initial instructions, or memory access in this project. The
SDK signatures may look correct, but the execution harness can fail during
TypeScript generation before it reaches Serena. A known failure shape is:

```text
Expected ident ...
    export
    ~~~~~~
```

That error can be caused by an unrelated registered SDK namespace and still
blocks Serena calls. Re-trying `Serena.initialInstructions({})` through
`execute_typescript` wastes turns and does not activate the project. Use the
`ima-mcp serena ... --json` commands above instead.

The direct/native tool names below remain useful documentation for harnesses
that expose Serena MCP tools directly, outside the broken TypeScript execution
path. Use them for direct MCP access only when the native tools are available
and have already proven reliable in the current session.

### Direct/native memory and onboarding tool names

| Direct/native tool | Required input | Optional input |
|---|---|---|
| `mcp__serena__activate_project` | `project: string` | — |
| `mcp__serena__initial_instructions` | `{}` | — |
| `mcp__serena__list_memories` | — | `topic?: string` |
| `mcp__serena__read_memory` | `memory_name: string` | — |
| `mcp__serena__write_memory` | `memory_name: string`, `content: string` | `max_chars?: number` |
| `mcp__serena__edit_memory` | `memory_name`, `needle`, `repl`, `mode: "literal" \| "regex"` | `allow_multiple_occurrences?: boolean` |
| `mcp__serena__delete_memory` | `memory_name: string` | — |
| `mcp__serena__rename_memory` | `old_name: string`, `new_name: string` | — |
| `mcp__serena__onboarding` | `{}` | — |
| `mcp__serena__serena_info` | `topic: string` | — |
| `mcp__serena__open_dashboard` | `{}` | — |

### Content editing

| Direct/native tool | Required input | Optional input |
|---|---|---|
| `mcp__serena__replace_content` | `relative_path`, `needle`, `repl`, `mode: "literal" \| "regex"` | `allow_multiple_occurrences?: boolean` |
| `mcp__serena__replace_symbol_body` | `relative_path`, `name_path`, `body` | — |
| `mcp__serena__insert_after_symbol` | `relative_path`, `name_path`, `body` | — |
| `mcp__serena__insert_before_symbol` | `relative_path`, `name_path`, `body` | — |

Use symbol/content editing only after targeted retrieval confirms the exact
symbol or content to change.

### JetBrains code intelligence and refactoring

These require a JetBrains IDE with the Serena MCP plugin running.

| Direct/native tool | Required input | Useful optional input |
|---|---|---|
| `mcp__serena__jet_brains_get_symbols_overview` | `relative_path` | `depth?`, `max_answer_chars?`, `include_file_documentation?` |
| `mcp__serena__jet_brains_find_symbol` | `name_path_pattern` | `relative_path?`, `depth?`, `include_body?`, `include_info?`, `search_deps?`, `max_matches?` |
| `mcp__serena__jet_brains_find_referencing_symbols` | `relative_path`, `name_path` | `max_answer_chars?` |
| `mcp__serena__jet_brains_find_declaration` | `relative_path`, `regex` | `include_body?` |
| `mcp__serena__jet_brains_find_implementations` | `relative_path`, `name_path` | — |
| `mcp__serena__jet_brains_type_hierarchy` | `relative_path`, `name_path` | `hierarchy_type?`, `depth?`, `max_answer_chars?` |
| `mcp__serena__jet_brains_rename` | `relative_path`, `new_name` | `name_path?`, `rename_in_comments?`, `rename_in_text_occurrences?` |
| `mcp__serena__jet_brains_move` | `relative_path` | `name_path?`, `target_relative_path?`, `target_parent_name_path?` |
| `mcp__serena__jet_brains_safe_delete` | `relative_path` | `name_path?`, `delete_even_if_used?`, `propagate?` |
| `mcp__serena__jet_brains_inline_symbol` | `relative_path`, `name_path` | `keep_definition?` |
| `mcp__serena__jet_brains_debug` | `expression` | `repl_key?` |
| `mcp__serena__jet_brains_run_inspections` | `relative_path` | `min_severity?`, `inspection_names?`, `start_line?`, `end_line?`, `max_answer_chars?` |
| `mcp__serena__jet_brains_list_inspections` | — | `language?`, `group_path_contains?`, `max_answer_chars?` |

## Project Memory Bootstrap

At the start of project-specific work in any Serena-enabled harness, Serena
bootstrap is the first workstream. If this skill was loaded first to learn
Serena gateway mechanics or native/direct tool names, that load is bootstrap support,
not task-specific research. After loading the skill, immediately run the Serena
project-memory calls below before greeting, interpreting the prompt, or using
Taskwarrior, Jira, Vestige, Qdrant, file reads, repository search, browser
inspection, or local workflow discovery.

1. Activate the Serena project with the current project path or registered
   project name by using `ima-mcp serena project activate "$project" --json`.
   Activation is always first; without it, memory calls can return
   `No active project`.
2. Call Serena initial instructions with
   `ima-mcp serena instructions --project "$project" --json`.
3. List memories with `ima-mcp serena memory list --project "$project" --json`.
4. Read the standard memories that exist and are relevant to the task with
   `ima-mcp serena memory read <name> --project "$project" --json`.
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
  → ima-mcp serena get_symbols_overview or jet_brains_find_symbol (NOT Read)

Need to find a function/class?
  → ima-mcp serena find_symbol or jet_brains_find_symbol (NOT Grep)

Need to find all callers?
  → ima-mcp serena find_referencing_symbols or jet_brains_find_referencing_symbols (NOT Grep)

Need project rules, commands, or local workflow?
  → ima-mcp serena project activate, instructions, memory list, memory read
     (NOT execute_typescript and NOT relying on .goosehints/CLAUDE.md injection)

Need to migrate .goosehints or CLAUDE.md?
  → scripts/migrate-context-to-serena.py, then ima-mcp serena write_memory --allow-write

Need the function body to modify it?
  → ima-mcp serena find_symbol --include_body or jet_brains_find_symbol --include_body
     THEN edit via explicit --allow-write route only after reviewing the exact target

Renaming across codebase?
  → ima-mcp serena rename_symbol or jet_brains_rename with --allow-write

Non-code file (YAML, JSON, Markdown)?
  → Native Read tool (Serena/LSP doesn't index these)

Serena unavailable?
  → Report the ima-mcp/Serena blocker explicitly, then fall back only for the
     task-specific work the user still wants done
```

## Common Patterns

### Get file structure (before reading)

```bash
ima-mcp serena get_symbols_overview --relative_path src/services/auth.ts --project . --json
ima-mcp serena jet_brains_find_symbol --name_path_pattern AuthService --relative_path src/services/auth.ts --depth 2 --project . --json
```

Returns top-level symbols without reading the file. Use `--depth 2` to see methods inside classes when the runtime supports it.

### Find a function

```bash
ima-mcp serena find_symbol --name_path getUserById --relative_path src/services/user.ts --project . --json
ima-mcp serena jet_brains_find_symbol --name_path_pattern getUserById --relative_path src/services/user.ts --project . --json
```

Set `--include_body` only when you need to inspect or modify the implementation. Use `--relative_path` to narrow scope.

### Find all callers

```bash
ima-mcp serena find_referencing_symbols --name_path 'AuthService/validateToken' --relative_path src/services/auth.ts --project . --json
ima-mcp serena jet_brains_find_referencing_symbols --name_path 'AuthService/validateToken' --relative_path src/services/auth.ts --project . --json
```

### Replace a function body

```bash
ima-mcp serena replace_symbol_body --name_path getUserById --relative_path src/services/user.ts --body '{ return await db.users.findUnique({ where: { id } }); }' --project . --allow-write --json
```

### Write project context to memory

```bash
ima-mcp serena write_memory --memory_name core --content 'Auth uses JWT. Tokens validated in AuthService.validateToken. Refresh handled by /api/auth/refresh endpoint.' --project . --allow-write --json
```

### Read standard project memories

```bash
project="${PWD}"
ima-mcp serena project activate "$project" --json
ima-mcp serena instructions --project "$project" --json
ima-mcp serena memory list --project "$project" --json
ima-mcp serena memory read core --project "$project" --json
ima-mcp serena memory read conventions --project "$project" --json
ima-mcp serena memory read suggested_commands --project "$project" --json
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
      - "--context=desktop-app"
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
