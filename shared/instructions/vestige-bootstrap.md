## Vestige User Preference Bootstrap

After the Serena project-memory bootstrap and before `memory-workflow` or any
task-specific discovery, load user preferences from Vestige. Vestige bootstrap
means using the `mcp-vestige` skill's `ima-mcp vestige` CLI gateway for
read-only preference lookup. Do not use the Goose typed SDK,
`execute_typescript`, or `Vestige.*`; Vestige can break SDK generation before
tool execution.

If `ima-mcp vestige` gateway usage is not already known and the `mcp-vestige`
skill is available, you may load that skill as bootstrap support. That skill
load is part of Vestige bootstrap, not task-specific research. After it,
immediately continue with the preference bootstrap.

Do the preference bootstrap before Taskwarrior, Jira, Qdrant, repository search,
file reads, browser inspection, workflow discovery, or asking the user about
preferences that memory may already contain:

1. Verify the gateway exists with `command -v ima-mcp`.
2. Check Vestige availability with `ima-mcp vestige status --json`.
3. Search for user preferences with the tested command:
   `ima-mcp vestige search "preferences" --json`.
4. If the result set is too broad or misses obvious preference memories, run one
   focused follow-up search:
   `ima-mcp vestige search "user preferences" --json`.
5. If a search hit clearly needs full content for safe use, retrieve it with
   `ima-mcp vestige get <memory-id> --json`.
6. Summarize high-confidence preferences that are relevant to the current
   session. Include memory ids when available, and mention uncertainty for stale,
   partial, or low-confidence hits.

Canonical gateway commands:

```bash
command -v ima-mcp
ima-mcp vestige status --json
ima-mcp vestige search "preferences" --json
ima-mcp vestige search "user preferences" --json
ima-mcp vestige get <memory-id> --json
```

Preference bootstrap intentionally uses the stable high-level `status`, `search`,
and `get` commands. Do not replace bootstrap with generic `vestige tools call`
unless the bootstrap contract is explicitly changed. The v2.2 generic tool
surface and aliases are documented in the `mcp-vestige` skill for task-specific
advanced operations and preflight parity checks.

If preference search times out but `ima-mcp vestige status --json` reports
Vestige available, retry once with `--timeout-ms 300000` or report the timeout
with that recommended command. Do not fall back to the Goose SDK or `Vestige.*`.

The bootstrap report must make the sequence auditable. Do not just say
"Vestige bootstrap complete" after `status`. Return a compact status table or
bullet list that names every attempted preference-bootstrap step and its
outcome:

```text
Vestige preference bootstrap status:
- gateway: PASS (`command -v ima-mcp`) -> <path>
- status: PASS (`ima-mcp vestige status --json`) -> <short availability summary>
- preference search: PASS|EMPTY|FAIL (`ima-mcp vestige search "preferences" --json`) -> <hit count/ids or evidence>
- focused fallback: PASS|EMPTY|FAIL|SKIP (`ima-mcp vestige search "user preferences" --json`) -> <reason/evidence>
- retrieved memories: PASS|SKIP|FAIL (`ima-mcp vestige get ...`) -> <ids or reason>
```

Use these meanings:

- `PASS`: command ran successfully and returned usable output.
- `EMPTY`: command ran successfully but found no relevant preference hits.
- `FAIL`: command failed, returned unusable output, or could not be parsed enough
  to trust. Include the command name and relevant error excerpt.
- `SKIP`: acceptable only for the focused fallback or retrieval when the broad
  search gave enough information, and the reason must be stated.

Only call the preference bootstrap complete when gateway, status, and the broad
preference search are `PASS` or when the broad search is `EMPTY` and you state
that no preferences were found. If gateway or status fails, report Vestige
preference bootstrap as unavailable/blocking for preference loading, then
continue only if the task can proceed without preference memory.

This bootstrap is read-only. Do not save, edit, delete, suppress, or mutate
Vestige memories. Do not continue with task-specific Vestige searches until the
preference bootstrap is complete or Vestige is unavailable and you have said so
explicitly.
