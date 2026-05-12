#!/usr/bin/env bash
# wp-local.sh - Run wp-cli in Flywheel Local WP environment
# Usage: wp-local.sh [wp-args...]

set -euo pipefail

SSH_ENTRY_DIR="$HOME/.config/Local/ssh-entry"
SITES_MAP="$HOME/.claude/wp-local-sites.json"

# Function to find .wp-local file by searching upward
find_wp_local_file() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/.wp-local" ]]; then
      echo "$dir/.wp-local"
      return 0
    fi
    dir=$(dirname "$dir")
  done
  return 1
}

# Determine site identifier (priority: $WP_LOCAL_SITE > .wp-local > error)
SITE_ID=""
if [[ -n "${WP_LOCAL_SITE:-}" ]]; then
  SITE_ID="$WP_LOCAL_SITE"
elif WP_LOCAL_FILE=$(find_wp_local_file); then
  SITE_ID=$(cat "$WP_LOCAL_FILE" | tr -d '[:space:]')
else
  echo "Error: No site configured. Set WP_LOCAL_SITE env var or create .wp-local file" >&2
  echo "See: ~/.claude/skills/wp-local/references/configuration.md" >&2
  exit 1
fi

# Map friendly name to UUID if needed
SITE_UUID="$SITE_ID"
if [[ -f "$SITES_MAP" ]] && ! [[ -f "$SSH_ENTRY_DIR/${SITE_ID}.sh" ]]; then
  SITE_UUID=$(jq -r ".\"$SITE_ID\" // \"$SITE_ID\"" "$SITES_MAP")
fi

# Verify environment script exists
ENV_SCRIPT="$SSH_ENTRY_DIR/${SITE_UUID}.sh"
if [[ ! -f "$ENV_SCRIPT" ]]; then
  echo "Error: Local WP environment not found: $ENV_SCRIPT" >&2
  echo "Available sites:" >&2
  ls "$SSH_ENTRY_DIR"/*.sh 2>/dev/null | xargs -n1 basename | sed 's/.sh$//' >&2
  exit 1
fi

# Source environment (suppress echo statements)
source <(grep -v "^echo" "$ENV_SCRIPT" | grep -v "^exec")

# WP-CLI 2.12+ passes --no-defaults to the mysql binary, which causes it to
# ignore MYSQL_HOME/my.cnf and fall back to /tmp/mysql.sock (wrong).
# MYSQL_UNIX_PORT is respected regardless of --no-defaults.
if [[ -n "${MYSQL_HOME:-}" && -f "$MYSQL_HOME/my.cnf" ]]; then
  MYSQL_UNIX_PORT=$(grep "^socket" "$MYSQL_HOME/my.cnf" | head -1 | awk -F= '{print $2}' | tr -d ' ')
  export MYSQL_UNIX_PORT
fi

exec wp "$@"
