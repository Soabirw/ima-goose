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
- `ima-mcp` gateway fleet health (`ima-mcp doctor`, `ima-mcp mcp servers`,
  `ima-mcp mcp doctor`).
- Serena, Vestige, and Qdrant through the `ima-mcp` gateway, not the Goose
  TypeScript SDK.
- Non-gateway MCP extensions via SDK when available and in scope: Context7 and
  Sequential Thinking (quick); Tavily, Chrome DevTools, and Atlassian Rovo
  (full).
- Taskwarrior through the CLI, because no Goose TypeScript SDK wrapper is
  currently exposed for Taskwarrior.
- Subrecipe delegation via a child recipe marker:
  `IMA_GOOSE_PREFLIGHT_SUBRECIPE_OK`.

## Gateway-First MCPs

Serena, Vestige, and Qdrant are checked with the `ima-mcp` gateway as the source
of truth, not through SDK probes. This avoids false-positive failures from
SDK-generation issues and keeps the three gateway MCPs aligned with their actual
health.

## Statuses

| Status | Meaning |
|---|---|
| `PASS` | Probe succeeded with evidence. |
| `WARN` | Optional or workflow-specific capability is unavailable, unauthenticated, or not needed for every task. |
| `FAIL` | Expected enabled capability failed, timed out, or returned an unusable response. |
| `BLOCKED` | Could not test because a prerequisite is missing. |
| `SKIP` | Intentionally skipped by scope. |
| `NOT_CONFIGURED` | Extension, env var, or executable is absent by design. |

## Expected WARNs

These are normal warnings, not failures:

- Qdrant WARN only when the local Qdrant service is unreachable or its
  collections are missing.
- Atlassian Rovo unauthenticated.
- Chrome DevTools with no running browser or open page.
- Tavily missing its API key.

`configured: false` for Serena, Vestige, or Qdrant in `mcp servers` is EXPECTED
and PASS — they are gateway-managed by `ima-mcp` by design, not direct Goose
extensions. Health comes from `ima-mcp <svc> status/doctor`, not the
`configured`/`enabled` flags. Do not register these as direct Goose extensions.

## What It Does Not Mutate

The preflight check is read-only. It does not edit configuration, write
memories, change Jira, or run OAuth setup. It reports evidence and recommends
safe next actions.
