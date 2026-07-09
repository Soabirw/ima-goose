---
name: ima-goose-guide
description: Guide for IMA Goose setup, configuration, operation, local VM/workstation support, MCP gateway usage, recipes, skills, goose-cycle, and related IMA tooling. Use when users ask about ima-goose, goose-workstation, ima-mcp-gateway, qdrant-mcp-server, ima-kitty, ima-rag, ~/.config/goose, ~/.agents/skills, recipe installation, skill installation, aliases, MCP setup, preflight, or IMA Goose troubleshooting.
---

# IMA Goose Guide

## Purpose

Use this skill to answer questions about the IMA Goose ecosystem: setup,
configuration, operation, troubleshooting, installed recipes and skills,
goose-cycle, the IMA Goose Workstation VM, MCP gateway usage, Qdrant/RAG,
Serena, Vestige, and related IMA tools.

Answer from evidence, not memory. Prefer local installed state for questions
about the user's current machine, local docs for setup questions, sibling repo
READMEs for ecosystem-specific tools, and upstream Goose docs only when the
question depends on Goose's official semantics.

## Authoritative IMA Goose Sources

Primary workflow system:
- Repo: https://gitea.theflccc.org/IMA/ima-goose
- README: https://gitea.theflccc.org/IMA/ima-goose/src/branch/main/README.md
- Local default checkout: `~/IMA/dev/ima-goose`
- Key local docs:
  - `README.md`
  - `docs/INSTALL.md`
  - `docs/IMA-GOOSE-FULL-SETUP.md`
  - `docs/IMA-GOOSE-WORKSTATION-SETUP.md`
  - `docs/IMA-GOOSE-VERIFICATION.md`
  - `docs/RECOMMENDED-USE.md`
  - `docs/RECIPES-AND-SKILLS.md`
  - `docs/SKILLS-AND-MCP-SETUP.md`
  - `docs/GOOSE-CYCLE.md`
  - `docs/PREFLIGHT-CHECK.md`

Workstation / VM helper:
- Repo: https://gitea.theflccc.org/IMA/goose-workstation
- README: https://gitea.theflccc.org/IMA/goose-workstation/src/branch/main/README.md
- Local default checkout: `~/IMA/dev/goose-workstation`

Qdrant MCP server:
- Repo: https://gitea.theflccc.org/IMA/qdrant-mcp-server
- README: https://gitea.theflccc.org/IMA/qdrant-mcp-server/src/branch/main/README.md
- Local default checkout: `~/IMA/dev/qdrant-mcp-server`

Terminal/session launcher:
- Repo: https://gitea.theflccc.org/IMA/ima-kitty
- README: https://gitea.theflccc.org/IMA/ima-kitty/src/branch/main/README.md
- Local default checkout: `~/IMA/dev/ima-kitty`

MCP gateway:
- Repo: https://gitea.theflccc.org/IMA/ima-mcp-gateway
- README: https://gitea.theflccc.org/IMA/ima-mcp-gateway/src/branch/main/README.md
- Local default checkout: `~/IMA/dev/ima-mcp-gateway`

RAG / knowledge base:
- Repo: https://gitea.theflccc.org/IMA/ima-rag
- README: https://gitea.theflccc.org/IMA/ima-rag/src/branch/main/README.md
- Local default checkout: `~/IMA/dev/ima-rag`

Installed Goose state:
- Goose config: `~/.config/goose/config.yaml`
- Rendered recipes: `~/.config/goose/recipes/`
- Skills: `~/.agents/skills/`
- Local helper shims: `~/.local/bin/`
- Common shims: `~/.local/bin/goose-cycle`, `~/.local/bin/ima-mcp`

## Evidence Ladder

1. For questions about the user's current machine, inspect local installed state
   first with read-only commands only.
2. For setup/how-to questions, read local `ima-goose` docs first.
3. For ecosystem-specific questions, read the relevant sibling repo README if it
   is available locally; otherwise use the Gitea URL as a source reference.
4. For upstream Goose semantics, load/use `goose-doc-guide`; do not duplicate
   upstream Goose docs in this skill.
5. If evidence is missing, state what was checked and ask for the smallest
   missing input.

## Safe Read-Only Checks

When the active recipe permits local read-only checks, these commands are safe
starting points:

```bash
command -v goose
goose --version
goose recipe list
command -v ima-mcp
ima-mcp vestige status --json
ima-mcp qdrant status --json
ima-mcp serena project status --project . --json
ls ~/.config/goose/recipes
ls ~/.agents/skills
ls ~/.local/bin | rg 'goose|ima-mcp'
```

Do not automatically run commands that mutate local state, call external
providers, change containers, write credentials, install dependencies, update
repositories, or reset/delete configuration. Only run or recommend those after
checking that the active recipe permits the action and the user has approved the
risk.

## Troubleshooting Routing

- `goose` missing → use Goose install/provider configuration docs, then verify
  `command -v goose` and `goose --version`.
- recipes missing → rerun or inspect `node scripts/install.ts`; check
  `~/.config/goose/recipes/`.
- skills missing → rerun or inspect `node scripts/install.ts`; check
  `~/.agents/skills/`.
- aliases missing → check `~/.goose-aliases` and whether the shell startup file
  sources it.
- `ima-mcp` missing → use `ima-mcp-gateway` install docs and confirm the local
  shim is available on `PATH`.
- Serena, Vestige, or Qdrant failing → check gateway status first, then use the
  relevant docs and sibling repo README.
- `/preflight` failing → use `docs/PREFLIGHT-CHECK.md` and the output-specific
  evidence before recommending changes.
- GooseWork/shared folder issues → use `docs/IMA-GOOSE-WORKSTATION-SETUP.md`,
  especially the GooseWork and Guest Additions troubleshooting sections.
- credentials missing → use workstation/helper credential docs; never ask users
  to paste secrets.

## Output Style

Answer with:

- short answer;
- evidence checked;
- recommended next steps;
- command risk labels when commands are suggested;
- where to go deeper.

Prefer practical, support-friendly language. Make uncertainty explicit and avoid
turning old notes into current instructions unless current docs or local state
confirm them.
