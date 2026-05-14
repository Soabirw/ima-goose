---
name: "ima-git"
description: "IMA git workflow. Trunk-based development with release branches: main = dev trunk, release/* = release candidate branches, v* tags = production releases. Covers branch promotion, hotfix flow, push cadence for deploy-gate verification, commit atomicity. Use when: creating branches, opening PRs, cutting releases or tags, writing hotfixes, or asked about git workflow, branching strategy, trunk-based development, release process, or when a deploy gate fails because commits weren't pushed."
---

# IMA Git Workflow

**Strategy:** Trunk-based development with release branches.

## Branch model

| Branch / tag | Role | Source | Deploys to |
|---|---|---|---|
| `main` | Dev trunk — latest integrated work | All new work lands here first | Dev environment |
| `release/<name>` | Release candidate | Fast-forwarded from `main` when ready | Staging environment |
| `v<version>` (tags) | Production release | Tag cut from a release branch at promotion | Production environment |
| `hotfix/<name>` | Emergency production fix | Branched off the production tag | Merged back to `main` + new tag cut |

## Core rules

1. **Commits originate on `main`.** Not on release branches. Feature work, bug fixes, refactors — all start on the trunk.
2. **Release branches only fast-forward from `main`.** Never merge sideways; never commit directly to a release branch.
3. **Hotfixes branch off the production tag**, not main. After the fix lands, cut a new tag and merge the hotfix back into `main`.
4. **Tags are immutable.** Rolling back to a prior production state means deploying the prior tag — not force-pushing or retagging.

## Deploy-gate verification cadence

Deploy tools (e.g., `trn-deploy` at `/home/eric/IMA/dev/sites/trn/deploy/`) **clone fresh from the remote** — they do not read the local filesystem. Unpushed commits are invisible to the gate.

**To verify a change:** push to `main` first, then invoke the dry-run.

Between commits in a multi-commit sequence:

1. Commit locally
2. `git push origin main`
3. Run `./deploy dev --dry-run`
4. Confirm exit 0 in `log.jsonl` before the next commit

## Commit atomicity

- **Security fixes: separate commits** from test-only changes and mechanical sweeps. A security change should land in a reviewable, revertable commit of its own.
- One commit per logical change class. Don't batch "fix XSS + rename variable + reformat whitespace" into one diff.
- Pure tests-only changes never mix with production code changes in the same commit.

## Commit messages

- Use a HEREDOC to pass multi-line messages: `git commit -m "$(cat <<'EOF' ... EOF)"`.
- Single-quoted `EOF` marker (`<<'EOF'`) prevents shell expansion — required to keep `$_POST`, `$_GET`, `$variable` etc. unescaped.
- A message with literal `\$_POST` in the body is a shell-escape artifact — amend before pushing, or treat it as a signal the HEREDOC was wrong.

## Deploy tool exit codes

Shared convention across IMA deploy tools:

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Generic failure |
| 2 | Validation / config error |
| 3 | Pre-flight failure (tests, lint, clean-state check) |
| 4 | Remote push failure (WPEngine or similar) |

The authoritative record is the tool's `log.jsonl`: `tail -1 log.jsonl` shows the last run's sha, exitCode, duration. The shell's `$?` may be masked by a pipe (`| tail`), so trust the log over stdout exit.

## Gitea / GitHub

- IMA internal repos live on Gitea: `ssh://git@gitea.theflccc.org:2222/IMA/<repo>.git`
- Some are mirrored to GitHub for FOSS / public presence.
- Use `tea-gitea` / `tea` for internal repo operations, `mcp-github` or `gh-cli` for public.

## When the deploy gate fails

1. Check `log.jsonl` for the exit code. Don't guess from terminal output.
2. Exit 3 = pre-flight. Look at the pipeline stage that failed — tests, lint, clean-state, composer check.
3. Reproduce locally with the project's configured validators (`composer check`, `npm run check`, `make check`, etc.) before touching code.
4. If a pre-flight failure is tests, invoke the source-quality triage pattern: categorize each failure as test rot, code bug, or design question **before** changing anything.

## Reference

- Qdrant `ima-knowledge` → article "IMA Git Workflow & Pre-flight Deploy Gate" for full detail on the gate architecture and the source-quality triage playbook.
- Project-specific deploy specifics live in the project's Serena memory (typically named `project-workflow` or similar).
