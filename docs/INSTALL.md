# Install Guide

This guide explains what a full `ima-goose` setup installs and what still needs
manual configuration. For a detailed self-hosted/developer walkthrough, see [`IMA-GOOSE-FULL-SETUP.md`](IMA-GOOSE-FULL-SETUP.md). For VM users, see [`IMA-GOOSE-WORKSTATION-SETUP.md`](IMA-GOOSE-WORKSTATION-SETUP.md).

If you only need the shortest path, use the README quick start:

```bash
git clone https://github.com/Soabirw/ima-goose.git
cd ima-goose
node scripts/install.ts
goose configure
```

## Prerequisites

- Goose installed and available as `goose`
- Node 24+
- Git
- `~/.local/bin` on `PATH` for local helper scripts such as `goose-cycle`
- Optional but recommended: `rg`, Taskwarrior, and IMA's `sfw` wrapper for safer
  npm commands in supply-chain-sensitive work

## 1. Configure Goose Provider

Run:

```bash
goose configure
```

Add the provider you intend to use. The install script renders recipes against a
profile, but Goose still needs a configured provider and credentials.

Common provider choices:

- Goose native ChatGPT/Codex provider for the default `chatgpt_codex` profile
- Codex ACP fallback when needed
- Claude/Anthropic direct API for Anthropic profiles
- OpenRouter or another OpenAI-compatible endpoint for routed/self-hosted setups

See [`MODEL-TIERS.md`](MODEL-TIERS.md) for profile and model-tier behavior.

## 2. Install Recipes, Skills, and Helpers

From the repository root:

```bash
node scripts/install.ts
```

The installer:

- checks Goose and prints the detected version
- renders `*/recipe.yaml.eta` templates into `~/.config/goose/recipes/*.yaml`
- rewrites recipe model tiers from the selected provider profile
- installs all `skills/*/` directories to `~/.agents/skills/`
- installs the `goose-cycle` shim to `~/.local/bin/goose-cycle`
- warns about missing environment variables and expected local tools
- prints next steps for aliases and optional MOIM setup

Useful variants:

```bash
node scripts/install.ts --validate
node scripts/install.ts --profile chatgpt_codex --register-slash-commands
node scripts/install.ts --profile anthropic
node scripts/install.ts --dest "$(mktemp -d)" --validate
```

## 3. Install Shell Aliases

Aliases are the recommended user interface. They set recipe names, parameters,
interactive mode, and profile-specific environment.

```bash
cp .goose-aliases.example ~/.goose-aliases
echo '[ -f "$HOME/.goose-aliases" ] && source "$HOME/.goose-aliases"' >> ~/.bashrc
source ~/.bashrc
```

Use `~/.zshrc` instead of `~/.bashrc` if needed.

If you cloned the repo somewhere other than the default path, edit
`GOOSE_RECIPE_PATH` in `~/.goose-aliases`.

Verify:

```bash
goose-help
type goose-brainstorm
type goose-cycle
```

## 4. Configure MCPs and API Keys

MCP extensions expose tools. Skills teach Goose when and how to use those tools.
You usually need both.

For the full MCP walkthrough, see [`SKILLS-AND-MCP-SETUP.md`](SKILLS-AND-MCP-SETUP.md).

High-level checklist:

1. Install and verify `ima-mcp-gateway` for Serena, Vestige, and Qdrant workflows.
2. Merge needed direct Goose extensions from `config-template.yaml` into
   `~/.config/goose/config.yaml`; do not overwrite your whole Goose config.
3. Set API keys for external tools you use, such as Tavily and Atlassian.
4. Configure Atlassian Rovo MCP if Jira/Confluence access is needed.
5. Verify the gateway commands:

```bash
command -v ima-mcp
ima-mcp serena project status --project . --json
ima-mcp vestige status --json
ima-mcp qdrant status --json
```

## 5. Optional: Enable MOIM Persona Anchor

MOIM is the IMA practitioner anchor: simple over complex, evidence over
assumptions, FP-first, and slow is smooth.

To inject it into Goose sessions, open `~/.goose-aliases` and uncomment the
`GOOSE_MOIM_MESSAGE_FILE` export described there.

## 6. Verify the Installation

```bash
goose --version
goose recipe list | rg 'brainstorm|plan|implement|test-writer|code-review|document-learn'
ls ~/.agents/skills/ | wc -l
goose-help
node scripts/install.ts --validate
```

For MCP-heavy work, also run the project preflight:

```bash
goose run --recipe preflight --interactive
```

Or use the current-session command when available:

```text
/preflight
```

## Troubleshooting

- If aliases are missing, source `~/.goose-aliases` or restart your shell.
- If `goose-cycle` is missing, ensure `~/.local/bin` is on `PATH` and rerun the installer.
- If skills are missing, rerun `node scripts/install.ts` and check `~/.agents/skills/`.
- If MCP tools fail, verify `ima-mcp` status before retrying through Goose.
- If recipe validation fails, render to a temp destination and validate the
  rendered YAML, not only the Eta template source.
