# IMA Goose Full Setup Guide

This is the detailed canonical setup path for a self-hosted or developer IMA
Goose workstation. For the shorter install path, see [`INSTALL.md`](INSTALL.md).

## Who This Is For

Use this guide when you are building or repairing a local IMA Goose environment
from source. It covers Goose, provider configuration, recipes, skills, shell
aliases, MCP gateway tooling, Serena, Vestige, Qdrant, Ollama, RAG, and optional
workflow integrations.

If you are using the packaged IMA Goose Workstation VM, start with
[`IMA-GOOSE-WORKSTATION-SETUP.md`](IMA-GOOSE-WORKSTATION-SETUP.md) instead.

## Prerequisites

- Linux, macOS, WSL, or another shell environment that can run Goose and Node.
- Git.
- `~/.local/bin` on `PATH` for local helper shims.
- `rg` recommended for fast local checks.
- Permission to install user-level developer tools.
- Credentials for any AI provider or external service you choose to configure.

Do not paste API keys, passwords, SSH keys, or provider tokens into Goose chats,
support tickets, or shared logs.

## Install Goose

Install Goose from the official Goose instructions for your platform, then
verify:

```bash
command -v goose
goose --version
```

Goose Desktop is optional for command-line users, but useful for many IMA Goose
workflows.

## Configure Goose Provider

Run:

```bash
goose configure
```

Configure the model provider and credentials you intend to use. The `ima-goose`
installer renders recipe model tiers from local profiles, but Goose itself still
needs a working provider configuration.

See [`MODEL-TIERS.md`](MODEL-TIERS.md) for profile behavior.

## Install Node with NVM

Install NVM from the official NVM project, then install a current Node runtime.
This repository expects Node 24 or newer.

```bash
nvm install 24
nvm use 24
node --version
npm --version
```

If your platform standardizes on another Node 24+ install method, that is fine;
verify `node` and `npm` are available in a fresh shell.

## Add npm Supply-Chain Safety Defaults

IMA workflows prefer conservative npm behavior. Where IMA's `sfw` wrapper is
available, use it for supply-chain-sensitive npm commands:

```bash
sfw npm install || npm install
sfw npm run build || npm run build
```

Avoid Yarn unless a specific upstream project requires it. Do not add new
package managers to IMA Goose setup without a project decision.

## Clone and Install ima-goose

```bash
mkdir -p ~/IMA/dev
cd ~/IMA/dev
git clone https://gitea.theflccc.org/IMA/ima-goose.git
cd ima-goose
node scripts/install.ts
```

The installer renders recipes to `~/.config/goose/recipes/`, installs skills to
`~/.agents/skills/`, and installs local helper shims such as `goose-cycle` to
`~/.local/bin/`.

Validate when needed:

```bash
node scripts/install.ts --validate
```

## Install Shell Aliases

Aliases are the normal user interface for IMA Goose recipes.

```bash
cp .goose-aliases.example ~/.goose-aliases
echo '[ -f "$HOME/.goose-aliases" ] && source "$HOME/.goose-aliases"' >> ~/.bashrc
source ~/.bashrc
```

Use `~/.zshrc` instead of `~/.bashrc` when your shell is zsh. If you cloned the
repo somewhere other than the default path, edit `GOOSE_RECIPE_PATH` in
`~/.goose-aliases`.

## Configure Goose Recipes, Skills, and Slash Commands

Run the installer after pulling repository changes:

```bash
cd ~/IMA/dev/ima-goose
node scripts/install.ts
```

Useful install variants:

```bash
node scripts/install.ts --validate
node scripts/install.ts --profile chatgpt_codex --register-slash-commands
node scripts/install.ts --profile anthropic
```

Use [`RECIPES-AND-SKILLS.md`](RECIPES-AND-SKILLS.md) for the catalog and
[`SKILLS-AND-MCP-SETUP.md`](SKILLS-AND-MCP-SETUP.md) for MCP setup details.

## Install Python Tooling with uv / venv

Current IMA setup uses `uv`, `uv tool`, and repo-local `.venv` environments.
Do not set up new users with Conda for this workflow. Older notes may mention
Conda as historical source material; treat those instructions as superseded.

Install `uv` from the official Astral instructions, then verify:

```bash
command -v uv
uv --version
```

Use this rule of thumb:

- Use `uv tool` for Python CLI tools that must be globally callable by Goose,
  Goose Desktop, or `ima-mcp`.
- Use repo-local `.venv` environments for source repo development and tests.

## Install and Configure Serena

Serena provides project memory and code navigation support. Install it with
`uv tool` when you need the local CLI available outside one project venv:

```bash
uv tool install -p 3.13 serena-agent
uv tool update-shell
command -v serena
serena --help
```

IMA Goose recipes use the `ima-mcp serena` gateway for bootstrap and project
memory operations. See [`SKILLS-AND-MCP-SETUP.md`](SKILLS-AND-MCP-SETUP.md) for
Goose/MCP configuration details.

## Install and Configure Vestige

Vestige stores task lifecycle memory, preferences, plans, reviews, resolutions,
and closeout handoffs. Install the Vestige CLI using the current Vestige project
instructions, then verify the CLI and gateway status:

```bash
command -v vestige
vestige --version
command -v ima-mcp
ima-mcp vestige status --json
```

If Vestige health reports embedding readiness issues but the gateway status is
ready and `/preflight` passes, treat that as a support signal to investigate, not
a reason to paste secrets or delete memory stores.

## Install Docker and Run Qdrant

Install Docker using the official Docker instructions for your distribution.
Verify:

```bash
docker --version
docker compose version
```

Run Qdrant with persistent storage. One common local pattern is:

```bash
docker volume create qdrant_storage
docker run -d \
  --name ima-qdrant \
  --restart unless-stopped \
  -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant
curl http://localhost:6333/healthz
```

Adjust container naming or orchestration only when your local environment has an
approved standard.

## Install Ollama and Embedding Model

Install Ollama from the official Ollama instructions, then pull the embedding
model used by IMA's local Qdrant/RAG setup:

```bash
ollama --version
ollama pull nomic-embed-text
ollama list
```

Keep embedding model choices consistent across Qdrant/RAG setup unless a project
explicitly migrates collections.

## Install qdrant-mcp-server

Clone the IMA Qdrant MCP server and use a repo-local `.venv` for source work:

```bash
cd ~/IMA/dev
git clone https://gitea.theflccc.org/IMA/qdrant-mcp-server.git
cd qdrant-mcp-server
uv venv
. .venv/bin/activate
uv pip install -e ".[test]"
```

If the CLI must be callable by `ima-mcp`, expose it with `uv tool` from the
source checkout when supported by the project:

```bash
uv tool install ~/IMA/dev/qdrant-mcp-server
command -v qdrant-mcp
```

## Install ima-mcp-gateway

`ima-mcp-gateway` is the stable gateway for Serena, Vestige, and Qdrant in IMA
Goose workflows.

```bash
cd ~/IMA/dev
git clone https://gitea.theflccc.org/IMA/ima-mcp-gateway.git
cd ima-mcp-gateway
sfw npm install || npm install
sfw npm run build || npm run build
sfw npm test || npm test
sfw npm run install:local || npm run install:local
```

Verify:

```bash
command -v ima-mcp
ima-mcp --version
ima-mcp doctor --json
ima-mcp serena project status --project . --json
ima-mcp vestige status --json
ima-mcp qdrant status --json
```

## Install or Prepare ima-rag

`ima-rag` is the source-managed knowledge/RAG repository. Prepare it with a
repo-local `.venv`; do not ingest private, proprietary, credential, browser,
chat-log, or user project data into a shared baseline collection.

```bash
cd ~/IMA/dev
git clone https://gitea.theflccc.org/IMA/ima-rag.git
cd ima-rag
uv venv
. .venv/bin/activate
uv pip install -r scripts/qdrant-rag/requirements.txt
```

Run only read-only audit/status commands unless ingestion or rebuild is approved
for the current environment.

## Optional: Taskwarrior

Taskwarrior is useful for local story queues and `goose-cycle` workflows.
Install it from your OS packages or Taskwarrior's official source instructions,
then verify:

```bash
task --version
task diagnostics
```

## Optional: ima-kitty

`ima-kitty` provides terminal/session layouts for IMA workstations.

```bash
cd ~/IMA/dev
git clone https://gitea.theflccc.org/IMA/ima-kitty.git
```

Follow that repository's README for the current install command and layout
names.

## Optional: Atlassian, Tavily, and Other Extensions

Configure external integrations only when your workflow needs them. Keep secrets
in your shell, OS keychain, or approved local config. Do not paste them into
Goose chats.

See [`SKILLS-AND-MCP-SETUP.md`](SKILLS-AND-MCP-SETUP.md) and
[`PREFLIGHT-CHECK.md`](PREFLIGHT-CHECK.md) for supported checks.

## Full Smoke Test

```bash
goose --version
goose recipe list | rg 'brainstorm|plan|implement|test-writer|code-review|document-learn'
ls ~/.agents/skills/ | wc -l
goose-help
node scripts/install.ts --validate
command -v ima-mcp
ima-mcp serena project status --project . --json
ima-mcp vestige status --json
ima-mcp qdrant status --json
```

Then run `/preflight` inside Goose when slash commands are available, or run the
preflight recipe directly as documented in [`PREFLIGHT-CHECK.md`](PREFLIGHT-CHECK.md).

## Troubleshooting

- `goose` missing: install Goose and confirm your shell `PATH`.
- Provider errors: rerun `goose configure` and verify credentials locally; do
  not paste keys into chat.
- Recipes missing: rerun `node scripts/install.ts` and check
  `~/.config/goose/recipes/`.
- Skills missing: rerun `node scripts/install.ts` and check `~/.agents/skills/`.
- Aliases missing: source `~/.goose-aliases` from your shell startup file.
- `ima-mcp` missing: reinstall `ima-mcp-gateway` and ensure `~/.local/bin` is on
  `PATH`.
- Docker permission errors: follow Docker's post-install Linux group guidance,
  then restart your shell or log in again.
- Qdrant collection missing: confirm Qdrant is healthy first; missing collection
  data is usually a seeding or RAG sync issue.
- Serena opens browser or native MCP tools fail: use the `ima-mcp serena`
  gateway path documented in this repository.

## Completion Criteria

- Goose is installed and configured with a provider.
- Node 24+ is active.
- `ima-goose` installer completes and validates.
- Recipes are visible under `~/.config/goose/recipes/`.
- Skills are visible under `~/.agents/skills/`.
- Aliases load and `goose-help` works.
- `uv` is installed; Python CLI tools use `uv tool` and source repos use
  repo-local `.venv` environments.
- Serena, Vestige, Qdrant, and `ima-mcp` gateway checks pass or have documented
  non-blocking follow-up notes.
- `/preflight` passes or has specific output-backed remediation steps.
