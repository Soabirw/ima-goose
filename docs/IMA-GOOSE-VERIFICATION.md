# IMA Goose Verification Checklist

Use this checklist for support, self-checks, and workstation acceptance. Prefer
read-only checks first. Do not paste secrets into Goose, tickets, or chat.

## Baseline

- [ ] Current shell can see expected user-local tools:

  ```bash
  echo "$PATH"
  command -v rg
  command -v git
  ```

- [ ] `~/.local/bin` is on `PATH` when local helper shims are expected.
- [ ] Repository checkouts live in expected locations or their custom paths are
  documented.

## Goose CLI and Desktop

- [ ] Goose CLI is installed:

  ```bash
  command -v goose
  goose --version
  ```

- [ ] Goose provider is configured with local credentials.
- [ ] Goose Desktop opens when the desktop app is part of the environment.
- [ ] Users know not to paste provider keys, API tokens, SSH keys, or passwords
  into Goose chats.

## Recipes

- [ ] IMA Goose installer ran successfully:

  ```bash
  cd ~/IMA/dev/ima-goose
  node scripts/install.ts --validate
  ```

- [ ] Rendered recipes exist:

  ```bash
  ls ~/.config/goose/recipes
  goose recipe list
  ```

- [ ] Expected workflow recipes appear, such as `brainstorm`, `plan`,
  `implement`, `test-writer`, `code-review`, `document-learn`, and `preflight`.

## Skills

- [ ] Skills are installed under `~/.agents/skills/`, not under
  `~/.config/goose`:

  ```bash
  ls ~/.agents/skills
  ls ~/.agents/skills/ima-goose-guide/SKILL.md
  ```

- [ ] Goose can list or summon skills with `/skills` when a session is running.

## Aliases

- [ ] `~/.goose-aliases` exists or the user intentionally skips aliases.
- [ ] The active shell sources it.
- [ ] Common aliases/helpers are visible:

  ```bash
  goose-help
  type goose-instructor
  type goose-cycle
  ```

## ima-mcp Gateway

- [ ] Gateway shim exists:

  ```bash
  command -v ima-mcp
  ima-mcp --version
  ima-mcp doctor --json
  ```

- [ ] Serena, Vestige, and Qdrant command groups are available or documented as
  intentionally out of scope for the environment.

## Serena

- [ ] Serena gateway responds:

  ```bash
  ima-mcp serena project status --project . --json
  ```

- [ ] In a project session, Serena can activate the project, load initial
  instructions, list memories, and read standard memories.
- [ ] If JetBrains symbol tools are expected, the IDE and Serena plugin are
  running with the project open.

## Vestige

- [ ] Vestige gateway responds:

  ```bash
  ima-mcp vestige status --json
  ima-mcp vestige search "preferences" --json
  ```

- [ ] Task lifecycle recipes can search and save Vestige memories when the
  workflow calls for it.
- [ ] Any embedding-readiness warning is documented with current evidence; do
  not delete memory stores without explicit backup/approval.

## Qdrant

- [ ] Qdrant container or service is running:

  ```bash
  curl http://localhost:6333/healthz
  ```

- [ ] Gateway responds:

  ```bash
  ima-mcp qdrant status --json
  ```

- [ ] Shared baseline collections are distinguished from user/project-private
  collections.

## Ollama

- [ ] Ollama is installed and reachable:

  ```bash
  ollama --version
  ollama list
  ```

- [ ] `nomic-embed-text` is installed when local embeddings are expected:

  ```bash
  ollama pull nomic-embed-text
  ollama list | rg 'nomic-embed-text'
  ```

## qdrant-mcp-server

- [ ] Source checkout exists where expected, commonly
  `~/IMA/dev/qdrant-mcp-server`.
- [ ] Repo-local `.venv` is used for source development/testing.
- [ ] CLI is globally callable when needed by `ima-mcp`:

  ```bash
  command -v qdrant-mcp
  ```

## ima-rag

- [ ] Source checkout exists where expected, commonly `~/IMA/dev/ima-rag`.
- [ ] Repo-local `.venv` is used for RAG scripts.
- [ ] Read-only audit/status commands work before any approved rebuild or sync.
- [ ] Private documents, credentials, chat logs, browser sessions, and personal
  project data are not mixed into a shared baseline collection.

## Taskwarrior Optional Checks

- [ ] Taskwarrior is installed when using `goose-cycle` queues:

  ```bash
  task --version
  task diagnostics
  ```

- [ ] Taskwarrior project filters are known for the active work queue.

## ima-kitty Optional Checks

- [ ] `ima-kitty` is cloned or installed when terminal layout helpers are part
  of the workstation.
- [ ] The relevant layout command opens the expected project/session layout.

## Workstation Helper Checks

For IMA Goose Workstation VM users:

- [ ] VM boots.
- [ ] User can log in.
- [ ] `~/GooseWork` exists and passes a two-way file test.
- [ ] Workstation helper commands respond:

  ```bash
  goose-workstation status
  goose-workstation credentials
  ```

- [ ] `goose-workstation credentials` does not print secret values.
- [ ] `goose-workstation support-bundle` creates a support artifact when needed.

## /preflight

- [ ] `/preflight` runs inside a Goose session.
- [ ] For deeper checks, `/preflight full` is used only when external/auth/browser
  probes are appropriate.
- [ ] Failures are handled from output-specific evidence and
  [`PREFLIGHT-CHECK.md`](PREFLIGHT-CHECK.md).

## Clean Pilot/Export State

Before exporting or sharing any VM baseline:

- [ ] No personal provider credentials remain.
- [ ] No SSH keys, password-manager sessions, browser sessions, or shell history
  secrets remain.
- [ ] No private GooseWork documents are included.
- [ ] No private Vestige/Qdrant/user memory data is included.
- [ ] Goose Desktop still launches after cleanup.
- [ ] `goose --version`, `command -v ima-mcp`, Docker/Qdrant health, Ollama
  model list, and `/preflight` still pass after cleanup.

Do not redistribute or re-export a VM after personal use.

## Success Criteria

- Goose CLI/Desktop works for the intended environment.
- Recipes render, install, and list correctly.
- Skills install to `~/.agents/skills/` and `ima-goose-guide` is present.
- Aliases and helper shims are available when expected.
- `ima-mcp` gateway status checks pass for the configured memory/knowledge
  systems.
- Serena and Vestige bootstrap behaviors work in IMA recipes.
- Qdrant, Ollama, qdrant-mcp-server, and ima-rag are either verified or clearly
  documented as out of scope.
- Workstation users can access `GooseWork`, run status checks, and run
  `/preflight`.
- Support artifacts are handled as potentially sensitive support data.
