---
name: mcp-serena
description: "Serena MCP — use for ALL code investigation before Read/Grep. Saves 40-70% tokens. Triggers on: find function, find class, find method, where is X defined, what calls X, find references, find callers, show usage, understand this code, explore this file, what does X do, rename symbol, refactor, search pattern in code, symbol-aware editing, replace function body, insert after function, get file structure overview, list methods in class, navigate codebase, locate implementation."
---

# Serena MCP - Code Symbol Navigation

Use Serena FIRST for all code investigation — before Read, before Grep. Reading entire files wastes 40-70% of token budget. Serena gives precise symbol-level access.

**NOTE:** JetBrains tools (`jet_brains_*`) require a JetBrains IDE (IntelliJ, WebStorm, PHPStorm) running with the Serena MCP plugin installed. Memory and onboarding tools work standalone without an IDE.

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
| `mcp__serena__write_memory` | Write project context or notes |
| `mcp__serena__read_memory` | Read stored memory by name |
| `mcp__serena__edit_memory` | Edit existing memory entry |
| `mcp__serena__delete_memory` | Delete a memory entry |
| `mcp__serena__rename_memory` | Rename a memory entry |
| `mcp__serena__list_memories` | List all memory entries |

### Onboarding (Serena — no IDE required)

| Tool | Purpose |
|------|---------|
| `mcp__serena__initial_instructions` | Read Serena setup instructions |
| `mcp__serena__check_onboarding_performed` | Check if onboarding is done |
| `mcp__serena__onboarding` | Run project onboarding |
| `mcp__serena__serena_info` | Get Serena server info |
| `mcp__serena__open_dashboard` | Open Serena dashboard |

## Decision Matrix

```
Need to understand code structure?
  → jet_brains_get_symbols_overview (NOT Read)

Need to find a function/class?
  → jet_brains_find_symbol (NOT Grep)

Need to find all callers?
  → jet_brains_find_referencing_symbols (NOT Grep)

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
  memory_file_name: "auth-architecture"
  memory: "Auth uses JWT. Tokens validated in AuthService.validateToken. Refresh handled by /api/auth/refresh endpoint."
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
