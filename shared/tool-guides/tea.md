# tea — Gitea CLI Reference

Use `tea` for all Gitea-hosted repository operations. For GitHub repos, use `gh` instead.

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

### Approve
```bash
tea pr approve <PR_NUMBER>
```

### Request changes
```bash
tea pr reject <PR_NUMBER>
```

### List existing review comments
```bash
tea pr review-comments <PR_NUMBER>
```

## Code Review Pattern

```bash
# 1. Find PR
tea pr list --state open

# 2. Get full diff for review
tea pr <PR_NUMBER> --fields index,title,body,diff

# 3. Check existing feedback
tea pr review-comments <PR_NUMBER>

# 4. Post findings
tea comment <PR_NUMBER> "## Code Review

**Verdict:** APPROVED

### Critical
None

### Warnings
- file.php:45 — missing nonce verification

### Suggestions
- Consider extracting the transform to a pure function
"

# 5. Set review status
tea pr approve <PR_NUMBER>
# or
tea pr reject <PR_NUMBER>
```

## Output Format

All commands support `--output json|yaml|csv|table`:

```bash
tea pr list --output json
tea pr review-comments <PR_NUMBER> --output json
```

## Repo / Login Scoping

```bash
# Target a specific repo
tea pr list --repo owner/repo-name

# Use a specific login profile
tea pr list --login gitea
```
