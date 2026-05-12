---
name: "wp-local"
description: "Run WordPress WP-CLI commands in Flywheel Local WP environments. Use for database queries, plugin management, user operations, theme operations, cache clearing, cron jobs. Auto-configures environment without affecting main Claude session. Triggers on: wp plugin, wp db, wp user, wp option, wp-cli, Local WP, Flywheel."
---

# WordPress WP-Local

Execute WP-CLI commands in Flywheel Local WP environments without disrupting Claude Code's main session.

## Quick Start

**Prerequisites**:
- Recommended: Kitty terminal with `$WP_LOCAL_SITE` configured
- Alternative: `.wp-local` file in project root: `echo "19efkkzWB" > .wp-local`

```bash
wpl plugin list
wpl db query "SELECT * FROM wp_posts LIMIT 5"
wpl user list
```

**Direct invocation** (auto-discovers install):
```bash
WP_LOCAL_SH=$(ls ~/.claude/skills/wp-local/scripts/wp-local.sh 2>/dev/null || ls ~/.claude/plugins/*/*/plugins/ima-claude/skills/wp-local/scripts/wp-local.sh 2>/dev/null | head -1)
bash "$WP_LOCAL_SH" plugin list
```

**Priority order**: `$WP_LOCAL_SITE` env var → `.wp-local` file → error

## How It Works

Each `wpl` command runs in subprocess with Local WP environment sourced. Main Claude session stays clean (MCPs work normally). Optional friendly name mapping via `~/.claude/wp-local-sites.json`.

## Common Commands

### Database
```bash
wpl db query "SELECT * FROM wp_users"
wpl db export dump.sql
wpl db import dump.sql
wpl search-replace 'old.com' 'new.com' --dry-run
wpl search-replace 'old.com' 'new.com' --all-tables
```

### Plugins
```bash
wpl plugin list --status=active --format=json
wpl plugin activate my-plugin
wpl plugin install contact-form-7 --activate
wpl plugin is-installed woocommerce && echo "yes"
```

### Users
```bash
wpl user list --role=administrator --format=table
wpl user create testuser test@example.com --role=editor
wpl user update 1 --display_name="Admin User"
wpl user add-role 2 editor
```

### Themes
```bash
wpl theme list
wpl theme activate twentytwentyfour
wpl theme status flavor
```

### Cache & Transients
```bash
wpl cache flush
wpl transient delete --all
wpl transient get my_transient_key
```

### Options
```bash
wpl option get siteurl
wpl option update blogname "New Site Name"
wpl option list --search="woocommerce_*" --format=table
wpl option delete my_old_option
```

### Posts
```bash
wpl post list --post_type=page --format=table
wpl post list --post_status=draft --fields=ID,post_title
wpl post create --post_type=post --post_title="Test" --post_status=publish
wpl post update 42 --post_title="Updated Title"
wpl post delete 42 --force
wpl post meta update 42 custom_field "new value"
```

### Taxonomy
```bash
wpl term list category --format=table
wpl term create category "New Category" --slug=new-category
wpl term update category 5 --name="Renamed"
wpl term delete category 5
```

### Menu
```bash
wpl menu list --format=table
wpl menu item add-post primary-menu 42
wpl menu item add-custom primary-menu "Link" https://example.com
```

### Rewrite
```bash
wpl rewrite flush
wpl rewrite structure '/%postname%/'
```

### Scaffold
```bash
wpl scaffold plugin my-plugin --plugin_name="My Plugin"
wpl scaffold post-type product --plugin=my-plugin
wpl scaffold taxonomy genre --post_types=product --plugin=my-plugin
wpl scaffold child-theme flavor-child --parent_theme=flavor
```

### Eval
```bash
wpl eval "echo home_url();"
wpl eval "var_dump(wp_get_current_user());"
wpl eval-file test-script.php
```

## Global Flags

| Flag | Description |
|---|---|
| `--format=<format>` | `table`, `csv`, `json`, `yaml`, `count`, `ids` |
| `--fields=<fields>` | Comma-separated columns |
| `--quiet` | Suppress informational messages |
| `--skip-themes` | Skip loading themes |
| `--skip-plugins` | Skip all plugins (debug conflicts) |
| `--skip-plugins=<plugin>` | Skip specific plugin |
| `--debug` | Show debug output |
| `--user=<id\|login>` | Run as specific user |

```bash
wpl help
wpl help plugin
wpl help post list
```

See [`references/wp-cli-reference.md`](references/wp-cli-reference.md) for full command reference.

## Configuration

See [`references/configuration.md`](references/configuration.md) for Kitty integration, UUID lookup, friendly name mapping, alias setup, troubleshooting.

**Quick Kitty Config** — modify Claude Code tab in `/home/eric/kitty/configs/[site].conf`:
```conf
launch bash -c "export WP_LOCAL_SITE='UUID'; exec bash"
```

## Quality Gates

Before destructive commands:
- Correct site (`.wp-local` points to intended site)
- Backup if needed (database modifications)
- Site running (Local WP app)
