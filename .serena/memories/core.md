# Core

- Project: `ima-goose`, IMA Goose recipe + skill repository for FP-aware development workflows, WordPress work, review, testing, architecture, research, and documentation closeout.
- Current release in package/changelog: v2.6.8; latest release added `ima-goose-guide`, canonical IMA Goose setup/workstation/verification docs, and Instructor trigger guidance.
- Primary user-facing artifact: Goose recipes under root-level `<recipe>/recipe.yaml` directories.
- Secondary artifact: cross-agent skills under `skills/<name>/SKILL.md`, installed globally to `~/.agents/skills/` by `scripts/install.ts`; current repository skill count is 52.
- Setup/config artifacts: `config-template.yaml`, `profiles/*.yaml`, `.goose-aliases.example`, `moim/ima-practitioner.md`, `shared/` runtime references.
- Preferred workflow: flattened `software-development-cycle`, not `task-master`, for full feature delivery: Brainstorm -> Plan -> Decompose -> Story loop -> Document/Learn.
- Operational story workflow: `goose-cycle` is the Taskwarrior/Vestige-backed Node 24 conductor installed by `scripts/install.ts`; it runs top-level recipes as separate Goose sessions and maps manual operator phase aliases to recipes: `test` -> `test-writer`, `review`/`rereview` -> `code-review`, `learn` -> `document-learn`, `resolve-review` -> `implement`.
- `goose-cycle` treats `.goose-cycle/active.json` as a resumable phase pointer. `next` resumes from recorded state instead of restarting; terminal `closed` is a no-op. Approved review/rereview flows continue through `document-learn` and `cycle-close`; autonomous closeout requests commit behavior, while guided closeout commits only when `--commit` is supplied.
- A supplied `task_project`/`--task-project` plus `task`/`--task` is concrete planning source material. The plan recipe should load Taskwarrior/Vestige/repository evidence and must not fall through to open-planning prompts in that path.
- `task-master` remains the manual/orchestration fallback using declarative `sub_recipes:` tools.
- Goose subrecipe sessions are isolated. Parent recipes must pass complete standalone briefs and artifact bundles; never rely on parent conversation memory in child sessions.
- Recipe source files are `.yaml.eta` templates; validate rendered YAML, not the source templates directly. `node scripts/install.ts --validate` validates all rendered recipes and copies skills to the configured install target; use `--dest "$(mktemp -d)"` when validation should avoid updating the user's installed Goose recipes/skills.
- Read `mem:tech_stack` for runtime/tooling details, `mem:conventions` for recipe/skill/workflow invariants, `mem:suggested_commands` for setup and validation commands, and `mem:task_completion` for done-checks.