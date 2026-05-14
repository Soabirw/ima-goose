# tea — Gitea CLI Reference

Use `tea` for all Gitea-hosted repository operations. For GitHub repos, use `gh` instead.

## First Checks

```bash
tea --version
tea login list --output json
tea pr list --state open --output json
```

`tea` behavior varies by version. Verify local syntax with `tea <command> --help`
before relying on examples from upstream docs.

## Setup

Config lives at `~/.config/tea/config.yml` (auto-created on first login).

```bash
tea login add \
  --name gitea \
  --url https://gitea.example.com \
  --token YOUR_GITEA_TOKEN        # Gitea Settings > Applications > API Token
```

## Pull Request Workflow

### List open PRs
```bash
tea pr list --state open
tea pr list --state open --fields index,title,state,author
```

### View a PR (with full diff)
```bash
tea pr <PR_NUMBER>
tea pr <PR_NUMBER> --fields index,title,body,diff
```

### Add a review comment
```bash
tea comment <PR_NUMBER> "Review conclusion text here"
```

For long Markdown, review reports, tables, logs, or code fences, do not pass the
body as an inline string. Write it to a temp file and pipe it through stdin:

```bash
tmp="$(mktemp)"
cat > "$tmp" <<'EOF'
## Code Review

**Verdict:** COMMENT

- Markdown remains intact.
- Code fences and tables are not collapsed into one shell argument.
EOF

tea comment <PR_NUMBER> < "$tmp"
rm -f "$tmp"
```

Avoid `tea comment <PR_NUMBER> "$(cat report.md)"` for large comments; command
substitution still passes a single shell string and can mangle formatting.

### Approve
```bash
tea pr approve <PR_NUMBER> "Approved"
```

### Request changes
```bash
tea pr reject <PR_NUMBER> "Changes requested"
```

## Code Review Pattern

```bash
# 1. Find PR
tea pr list --state open

# 2. Get full diff for review
tea pr <PR_NUMBER> --fields index,title,body,diff

# 3. Check existing feedback
tea pr <PR_NUMBER> --fields comments

# 4. Post findings
tmp="$(mktemp)"
cat > "$tmp" <<'EOF'
## Code Review

**Verdict:** APPROVED

### Critical
None

### Warnings
- file.php:45 — missing nonce verification

### Suggestions
- Consider extracting the transform to a pure function
EOF
tea comment <PR_NUMBER> < "$tmp"
rm -f "$tmp"

# 5. Set review status
tea pr approve <PR_NUMBER> "Approved"
# or
tea pr reject <PR_NUMBER> "Changes requested"
```

## Output Format

Most list/detail commands support `--output simple|table|csv|tsv|yaml|json`:

```bash
tea pr list --output json
tea issue list --output json
```

## Repo / Login Scoping

```bash
# Target a specific repo
tea pr list --repo owner/repo-name

# Use a specific login profile
tea pr list --login gitea
```

## Direct API Fallback

Use `tea api` when a high-level command cannot safely express the operation.
Local `tea` 0.12.0 documents `-F key=@file` for file input:

```bash
tea api -X POST '/repos/{owner}/{repo}/issues/<PR_NUMBER>/comments' -F "body=@comment.md"
```

Some upstream examples use `-d @file`; check `tea api --help` on the installed
version before using raw JSON body flags.
