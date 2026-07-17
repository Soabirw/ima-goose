# Tech Stack

- Repo is mostly YAML recipes, Markdown skills/docs, and TypeScript setup scripts.
- Package manifest exists at repo root; Node package is private `ima-goose` at version `2.7.4`, ESM, requiring Node `>=24`.
- Installer/runtime script: `scripts/install.ts`, run directly with Node 24+ native TypeScript support.
- This repository's established test harness is Node's built-in test runner, with source/static and rendered-recipe contract coverage. Playwright is a packaged skill for downstream projects, not an established `ima-goose` verification framework unless future repository evidence changes.
- Test script: `npm test` -> `node --test tests/*.test.js`; focused tests use `node --test tests/<file>.test.js`.
- Package scripts: `npm run install:recipes`, `npm run install:recipes:validate`, `npm test`.
- Dependencies are intentionally small; current runtime dependency is `eta` for recipe templating.
- Goose recipes use YAML with `settings`, `extensions`, `sub_recipes`, `instructions`, `parameters`, `prompt`, and `activities` sections.
- Goose provider profiles live in `profiles/*.yaml`; current documented profiles include `chatgpt_codex`, `chatgpt_codex_56`, `openai`, `hybrid`, `anthropic`, `claude-acp`, and `sakana`.
- ACP binaries expected on PATH: `@agentclientprotocol/claude-agent-acp` and optionally `@zed-industries/codex-acp`.
- Core MCP baseline in recipes includes Serena, Vestige, Qdrant, Tavily, Sequential Thinking, and Context7; workflow recipes add Atlassian, Fetch, Chrome DevTools, Todo, and code execution where needed.
- Serena config: `.serena/project.yml` with project name `ima-goose`, language `typescript`, UTF-8, gitignore-respecting. JetBrains backend supplied by recipe extension args, not project.yml.
- Serena JetBrains mode requires `uvx`, JetBrains IDE open at repo root, and Serena MCP JetBrains plugin.
- Skills install target: `~/.agents/skills/`; recipes install target: `~/.config/goose/recipes/`.
- MOIM persona is opt-in via `GOOSE_MOIM_MESSAGE_FILE`, usually pointing at `moim/ima-practitioner.md`.
