---
name: goose-preflight
description: "Goose preflight checklist — run read-only configuration, recipe, skill, MCP, SDK, memory, browser, Atlassian, and Taskwarrior probes before relying on the tool stack. Use for /preflight, MCP health checks, setup validation, canary checks, and diagnosing what is or is not configured."
---

# Goose Preflight Checklist

Use this skill to verify whether the current Goose configuration can actually use
its recipes, skills, MCP endpoints, and Goose TypeScript SDK wrappers. This is a
read-only diagnostic workflow: probe, classify, report, and recommend next
steps. Do not fix config, start OAuth flows intentionally, mutate Jira, write
memories, or change project files unless the user explicitly asks.

## Status Levels

| Status | Meaning |
|---|---|
| `PASS` | Probe succeeded with evidence. |
| `WARN` | Optional or workflow-specific capability is unavailable, unauthenticated, or not needed for every task. |
| `FAIL` | Expected enabled capability failed, timed out, or returned an unusable response. |
| `BLOCKED` | Could not test because a prerequisite is missing. |
| `SKIP` | Intentionally skipped by scope. |
| `NOT_CONFIGURED` | Extension, env var, or executable is absent by design. |

Overall status should be the worst material status: any required `FAIL` means
`FAIL`; only optional/auth/browser warnings means `WARN`; all expected probes
passing means `PASS`.

## Scopes

| Scope | Probes |
|---|---|
| `offline` | Local shell/config checks only. Avoid external network and remote auth services. Local Qdrant/Taskwarrior checks are allowed. |
| `quick` | Default. Local checks, install/render validation when in the ima-goose repo, non-auth MCPs, memory MCPs, Taskwarrior, and subrecipe probe. |
| `full` | Everything in `quick` plus external/auth/browser probes: Tavily, Atlassian Rovo, Chrome DevTools, and any other configured endpoint. |

## Local Checks

Run these from the repository root when available:

```bash
pwd
git status --short
goose --version
node --version
npm --version
command -v codex-acp || true
command -v claude-agent-acp || true
command -v uvx || true
command -v npx || true
command -v task || true
```

For recipe rendering, use a temporary HOME and destination so the preflight does
not mutate the real Goose setup:

```bash
HOME=/tmp/ima-goose-preflight-home \
node scripts/install.ts \
  --profile openai \
  --dest /tmp/ima-goose-preflight-recipes \
  --validate
```

Check installed skills separately when validating an actual user setup:

```bash
ls ~/.agents/skills
ls ~/.agents/skills | wc -l
```

## Probe Pattern

Probe Serena through the `ima-mcp` CLI gateway first. Do not use Goose typed SDK
/ `execute_typescript` for Serena preflight; that path can fail before Serena
runs because SDK generation includes unrelated registered tools.

```bash
project="${PWD}"
command -v ima-mcp
ima-mcp serena project activate "$project" --json
ima-mcp serena instructions --project "$project" --json
ima-mcp serena memory list --project "$project" --json
ima-mcp serena memory read core --project "$project" --json
```

When the Goose typed SDK is available, batch independent **non-Serena** probes
in one TypeScript execution and catch errors per probe. Tool results are already
parsed JavaScript values. Do not `JSON.parse` whole results unless a specific
string field is known to contain JSON.

Recommended non-Serena probes:

```ts
const checks: Record<string, unknown> = {};

async function probe(name: string, fn: () => Promise<unknown>) {
  try {
    checks[name] = { status: "PASS", evidence: await fn() };
  } catch (error) {
    checks[name] = {
      status: "FAIL",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

await probe("vestige.systemStatus", () => Vestige.systemStatus({}));
await probe("qdrant.find", () => QdrantMemory.qdrantFind({ query: "preflight", limit: 1 }));
await probe("context7.resolve", () => Context7.resolveLibraryId({ libraryName: "React", query: "React documentation" }));
await probe("sequentialThinking", () => SequentialThinking.sequentialthinking({
  thought: "Preflight one-step reasoning probe.",
  nextThoughtNeeded: false,
  thoughtNumber: 1,
  totalThoughts: 1,
}));
await probe("fetch.example", () => Fetch.fetch({ url: "https://example.com", max_length: 500 }));
```

Full-mode probes may add:

```ts
await probe("tavily.search", () => Tavily.tavilySearch({
  query: "Goose AI agent Block 2026",
  search_depth: "fast",
  max_results: 1,
}));
await probe("chrome.listPages", () => ChromeDevtools.listPages({}));
await probe("atlassian.userInfo", () => AtlassianRovo.atlassianUserInfo({}));
```

Classify Chrome with no open browser/page as `WARN`, not `FAIL`, unless browser
inspection is required for the user's workflow. Classify unauthenticated
Atlassian as `WARN` by default unless the user explicitly needs Atlassian for the
current task.

## Taskwarrior Probe

No Goose TypeScript SDK wrapper is currently exposed for Taskwarrior. Probe via
shell:

```bash
task --version
task diagnostics
```

If no default `~/.taskrc` exists, classify as `WARN` unless the current workflow
requires Taskwarrior writes.

## Report Format

Return a concise Markdown report:

```markdown
# Goose / MCP Preflight Report

Generated: <timestamp>
Scope: quick | full | offline
Overall: PASS | WARN | FAIL | BLOCKED

## Summary
| Area | Status | Evidence | Next action |
|---|---|---|---|

## Details
[Grouped evidence and errors]

## Recommended Next Actions
[Prioritized fixes]
```

If the user requests a file, prefer `/tmp/ima-goose-preflight-<timestamp>.md` so
the diagnostic does not create tracked repository noise.
