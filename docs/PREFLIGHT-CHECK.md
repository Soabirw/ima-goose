# Goose / MCP Preflight Check

The preflight check is a read-only canary for ima-goose configuration. It answers
one question: can this session actually use the recipes, skills, MCP endpoints,
and Goose TypeScript SDK wrappers or required CLI gateways the workflow expects?

Run it from an interactive Goose session:

```text
/preflight
/preflight quick
/preflight full
/preflight offline
```

Or run the rendered recipe directly after installation:

```bash
goose run --recipe preflight-check
```

## Scopes

| Scope | Use |
|---|---|
| `quick` | Default. Local tooling, temporary recipe validation, installed skills, non-auth MCPs, memory MCPs, Taskwarrior, and a subrecipe spawning probe. |
| `full` | Quick plus external/auth/browser checks such as Tavily, Atlassian Rovo, and Chrome DevTools. |
| `offline` | Local shell/config checks only. Avoids external network and remote auth services. |

## What It Checks

- Goose CLI, Node/npm, ACP provider binaries, `npx`, `uvx`, and Taskwarrior.
- Temporary recipe rendering and validation in `/tmp` so the real user config is
  not mutated.
- Installed skill directories and expected `mcp-*` skills.
- Serena memory tools and optional JetBrains capability classification.
- Vestige through `ima-mcp vestige`; Qdrant, Context7, Sequential Thinking, Fetch, Tavily, Chrome DevTools,
  and Atlassian Rovo when available and in scope.
- Taskwarrior through the CLI, because no Goose TypeScript SDK wrapper is
  currently exposed for Taskwarrior.
- Subrecipe spawning via a child recipe marker:
  `IMA_GOOSE_PREFLIGHT_SUBRECIPE_OK`.

## Statuses

| Status | Meaning |
|---|---|
| `PASS` | Probe succeeded with evidence. |
| `WARN` | Optional or workflow-specific capability is unavailable, unauthenticated, or not needed for every task. |
| `FAIL` | Expected enabled capability failed, timed out, or returned an unusable response. |
| `BLOCKED` | Could not test because a prerequisite is missing. |
| `SKIP` | Intentionally skipped by scope. |
| `NOT_CONFIGURED` | Extension, env var, or executable is absent by design. |

The preflight recipe does not fix problems. It reports evidence and recommends
safe next actions.
