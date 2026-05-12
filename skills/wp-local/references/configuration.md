# WP-Local Configuration Guide

## Recommended: Kitty Terminal Integration

### 1. Modify Kitty Configs

Update your site-specific Kitty configs to set `$WP_LOCAL_SITE` for Claude Code tab.

**File**: `/home/eric/kitty/configs/imanetwork.conf`

**Before**:
```conf
# Claude Code tab (PRIMARY)
new_tab "Claude Code"
cd /home/eric/Local Sites/imanetwork/app/public
layout tall
launch bash -c "source ~/kitty/load-localwp-env.sh imanetwork; exec bash"
```

**After**:
```conf
# Claude Code tab (PRIMARY) - Clean env for MCPs + WP_LOCAL_SITE for wp-local
new_tab "Claude Code"
cd /home/eric/Local Sites/imanetwork/app/public
layout tall
launch bash -c "export WP_LOCAL_SITE='-hJRW0lQL'; exec bash"
```

**Why this works:**
- Claude Code tab has clean environment → MCP servers work
- Claude Code tab has `$WP_LOCAL_SITE` set → wp-local skill finds the site
- Other tabs (WP CLI, Development, etc.) keep full Local WP environment → direct wp works

### 2. Site UUID Mapping

Your existing sites:
```
-hJRW0lQL → imanetwork
JfZ8r8eL0 → imabloglc
kHOz3MCik → flcccjournal
klZPACFw2 → kornfeld-backup-2025-10-13
VpVdumzlE → kornfeld2-prod
19efkkzWB → journal-back-2025-10-13
```

Update each Kitty config accordingly.

### 3. Reload Kitty

After updating configs:
1. Close all Kitty windows
2. Reopen Kitty with site-specific config: `kitty --session ~/kitty/configs/imanetwork.conf`
3. Claude Code tab should have `$WP_LOCAL_SITE` set, verify with: `echo $WP_LOCAL_SITE`

## Alternative: `.wp-local` File (Project-Specific)

### 1. Create `.wp-local` File

In your WordPress project root:
```bash
echo "19efkkzWB" > .wp-local
```

Add to `.gitignore`:
```bash
echo ".wp-local" >> .gitignore
```

### 2. Finding Site UUIDs

**List all sites**:
```bash
ls ~/.config/Local/ssh-entry/*.sh
```

**Map UUIDs to site names**:
```bash
for f in ~/.config/Local/ssh-entry/*.sh; do
  uuid=$(basename "$f" .sh)
  site=$(grep "echo -n -e" "$f" | sed 's/.*0;//' | sed 's/ Shell.*//')
  echo "$uuid -> $site"
done
```

**Output** (your sites):
```
19efkkzWB -> journal-back-2025-10-13
-hJRW0lQL -> imanetwork
JfZ8r8eL0 -> imabloglc
kHOz3MCik -> flcccjournal
klZPACFw2 -> kornfeld-backup-2025-10-13
VpVdumzlE -> kornfeld2-prod
```

### 3. Optional: Friendly Name Mapping

Create `~/.claude/wp-local-sites.json`:
```json
{
  "journal-back": "19efkkzWB",
  "imanetwork": "-hJRW0lQL",
  "imabloglc": "JfZ8r8eL0",
  "flcccjournal": "kHOz3MCik",
  "kornfeld-backup": "klZPACFw2",
  "kornfeld2-prod": "VpVdumzlE"
}
```

Then use friendly names in `.wp-local`:
```bash
echo "journal-back" > .wp-local
```

### 4. Shell Alias Setup

Add to `~/.bashrc` or `~/.zshrc`:
```bash
wpl() {
  local s=~/.claude/skills/wp-local/scripts/wp-local.sh
  [[ -f "$s" ]] || s=$(ls ~/.claude/plugins/*/*/plugins/ima-claude/skills/wp-local/scripts/wp-local.sh 2>/dev/null | head -1)
  bash "$s" "$@"
}
```

This works for both local installs (`~/.claude/skills/`) and marketplace installs (`~/.claude/plugins/marketplaces/*/`).

Reload shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

**Usage**:
```bash
wpl plugin list
wpl db query "SELECT * FROM wp_posts LIMIT 5"
```

## Environment Variable Fallback

Alternative to `.wp-local` file:
```bash
export WP_LOCAL_SITE="19efkkzWB"
```

Or per-command:
```bash
WP_LOCAL_SITE="19efkkzWB" wpl plugin list
```

## Multi-Project Workflow

Each project has its own `.wp-local`:
```
~/projects/client-a/
  .wp-local  (contains: imanetwork)

~/projects/client-b/
  .wp-local  (contains: kornfeld2-prod)
```

wp-local automatically finds correct `.wp-local` by searching upward from current directory.

## Troubleshooting

### Error: "No site configured"

**Cause**: No `.wp-local` file found and `$WP_LOCAL_SITE` not set.

**Fix**: Create `.wp-local` in project root:
```bash
echo "19efkkzWB" > .wp-local
```

### Error: "Local WP environment not found"

**Cause**: UUID in `.wp-local` doesn't match any script in `~/.config/Local/ssh-entry/`.

**Fix**:
1. Check available UUIDs:
   ```bash
   ls ~/.config/Local/ssh-entry/*.sh
   ```
2. Update `.wp-local` with correct UUID

### Error: "wp: command not found"

**Cause**: Local WP environment not sourcing correctly, or site not running.

**Fix**:
1. Verify site is running in Local WP app
2. Test manual source:
   ```bash
   source ~/.config/Local/ssh-entry/19efkkzWB.sh
   wp --version
   ```

### Wrong site being used

**Cause**: `.wp-local` file in parent directory overriding.

**Fix**: Check for `.wp-local` files in parent directories:
```bash
find ~ -name ".wp-local" -type f
```
