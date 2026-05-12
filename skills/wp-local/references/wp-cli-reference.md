# WP-CLI Command Reference

Comprehensive reference for WP-CLI commands in local development. Organized for lookup — use the TOC to jump to what you need. All examples use the `wpl` alias.

For inline essentials (database, plugin, user, theme, cache, options, post, taxonomy, menu, rewrite, scaffold, eval), see [SKILL.md](../SKILL.md).

## Table of Contents

- [Core](#core)
- [Config](#config)
- [Cron](#cron)
- [Media](#media)
- [Comment](#comment)
- [Role & Capability](#role--capability)
- [Widget](#widget)
- [Sidebar](#sidebar)
- [Site & Multisite](#site--multisite)
- [Language & i18n](#language--i18n)
- [Import & Export](#import--export)
- [Embed](#embed)
- [Package](#package)
- [Maintenance Mode](#maintenance-mode)
- [Server](#server)
- [Super Admin](#super-admin)
- [Network Meta](#network-meta)
- [Advanced Patterns](#advanced-patterns)

---

## Core

`wp core version` · `wp core check-update` · `wp core update` · `wp core download` · `wp core install`

```bash
wpl core version
wpl core check-update
wpl core update
wpl core update --minor
wpl core verify-checksums
```

**Gotchas**: `core update` in Local WP may conflict with Local's version management. Prefer updating through Local's UI for major versions.

---

## Config

`wp config list` · `wp config get <name>` · `wp config set <name> <value>` · `wp config path`

```bash
wpl config path
wpl config list --format=table
wpl config get DB_NAME
wpl config set WP_DEBUG true --raw
wpl config set WP_DEBUG_LOG true --raw
wpl config set SCRIPT_DEBUG true --raw
wpl config set WP_DEBUG false --raw
```

**Key flags**:
- `--raw` — Write value as a PHP constant (no quotes). Required for `true`/`false`/numbers.
- `--type=constant|variable` — Whether to set as `define()` or `$variable`.

**Gotchas**: Changes write to `wp-config.php` directly. Local WP may override on restart.

---

## Cron

`wp cron event list` · `wp cron event run <hook>` · `wp cron event schedule <hook> <next-run>` · `wp cron event delete <hook>`

```bash
wpl cron event list --format=table
wpl cron event run wp_update_plugins
wpl cron event run --all
wpl cron event delete my_custom_hook
wpl cron schedule list
```

**Key flags**:
- `--due-now` — List only events ready to run.
- `--format=json` — Useful for piping to jq.

**Gotchas**: Local WP sites don't have real cron. Events only fire on page load unless you configure `DISABLE_WP_CRON` + system cron.

---

## Media

`wp media import <file>` · `wp media regenerate` · `wp media image-size`

```bash
wpl media import ~/images/photo.jpg --title="My Photo"
wpl media import https://example.com/image.jpg
wpl media regenerate --yes
wpl media regenerate 42 43 44
wpl media image-size --format=table
```

**Key flags**:
- `--yes` — Skip confirmation on regenerate.
- `--only-missing` — Only regenerate missing sizes.
- `--skip-delete` — Don't delete old thumbnails during regenerate.

---

## Comment

`wp comment list` · `wp comment create` · `wp comment update <id>` · `wp comment delete <id>` · `wp comment approve <id>`

```bash
wpl comment list --format=table
wpl comment list --status=hold --fields=comment_ID,comment_author,comment_content
wpl comment create --comment_post_ID=42 --comment_content="Test comment" --comment_author="Test"
wpl comment approve 5
wpl comment spam 5
wpl comment delete 5 --force
wpl comment recount
```

---

## Role & Capability

`wp role list` · `wp role create <role> <name>` · `wp cap list <role>` · `wp cap add <role> <cap>`

```bash
wpl role list --format=table
wpl role create custom_role "Custom Role" --clone=editor
wpl cap list editor --format=table
wpl cap add editor manage_options
wpl cap remove editor manage_options
```

**Gotchas**: Role/cap changes persist in the database (`wp_options` → `wp_user_roles`). Removing a role doesn't reassign users — they lose access.

---

## Widget

`wp widget list <sidebar-id>` · `wp widget add <widget> <sidebar-id>` · `wp widget delete <widget-id>` · `wp widget reset <sidebar-id>`

```bash
wpl widget list sidebar-1 --format=table
wpl widget add text sidebar-1 --title="Hello" --text="World"
wpl widget update text-2 --title="Updated"
wpl widget delete text-2
wpl widget deactivate text-2
wpl widget reset sidebar-1
```

**Gotchas**: Widget IDs are auto-generated (e.g., `text-2`). List first to find IDs.

---

## Sidebar

`wp sidebar list`

```bash
wpl sidebar list --format=table
wpl sidebar list --fields=id,name,description
```

---

## Site & Multisite

`wp site list` · `wp site create` · `wp site activate <site-id>` · `wp site deactivate <site-id>`

```bash
wpl site list --format=table
wpl site create --slug=newsite --title="New Site" --email=admin@example.com
wpl site activate 2
wpl site deactivate 2
wpl site delete 2 --yes
```

**Key flags**:
- `--url=<url>` — Target a specific site in multisite. Use with any command.

**Gotchas**: Only works on multisite installs. Single-site installs will error.

---

## Language & i18n

`wp language core list` · `wp language core install <language>` · `wp language core activate <language>` · `wp i18n make-pot`

```bash
wpl language core list --format=table
wpl language core install es_ES
wpl language core activate es_ES
wpl language plugin install hello-dolly es_ES
wpl language theme install flavor es_ES
wpl i18n make-pot . languages/my-plugin.pot
wpl i18n make-json languages/
```

---

## Import & Export

`wp export` · `wp import <file>`

```bash
wpl export --dir=. --post_type=post
wpl export --dir=. --post_type=page --start_date=2024-01-01
wpl import export.xml --authors=mapping.csv
wpl import export.xml --authors=create
```

**Key flags**:
- `--dir` — Export directory (defaults to current dir).
- `--post_type` — Limit export to specific post type.
- `--authors=create|mapping.csv|skip` — How to handle author mapping on import.

**Gotchas**: Import requires the WordPress Importer plugin. Install with `wpl plugin install wordpress-importer --activate`.

---

## Embed

`wp embed fetch <url>` · `wp embed provider list`

```bash
wpl embed fetch "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
wpl embed provider list --format=table
wpl embed cache clear
```

---

## Package

`wp package list` · `wp package install <package>` · `wp package uninstall <package>`

```bash
wpl package list
wpl package install wp-cli/doctor-command
wpl package install wp-cli/profile-command
wpl package uninstall wp-cli/doctor-command
```

**Useful packages**:
- `wp-cli/doctor-command` — Diagnose WordPress issues
- `wp-cli/profile-command` — Profile command performance
- `wp-cli/dist-archive-command` — Create plugin/theme zip archives

---

## Maintenance Mode

`wp maintenance-mode activate` · `wp maintenance-mode deactivate` · `wp maintenance-mode status`

```bash
wpl maintenance-mode activate
wpl maintenance-mode deactivate
wpl maintenance-mode status
```

---

## Server

`wp server`

```bash
wpl server --host=0.0.0.0 --port=8080
```

**Gotchas**: Not useful with Local WP — Local manages its own server. Included for completeness.

---

## Super Admin

`wp super-admin list` · `wp super-admin add <user>` · `wp super-admin remove <user>`

```bash
wpl super-admin list
wpl super-admin add admin
wpl super-admin remove admin
```

**Gotchas**: Multisite only.

---

## Network Meta

`wp network meta get <id> <key>` · `wp network meta update <id> <key> <value>`

```bash
wpl network meta list 1 --format=table
wpl network meta get 1 site_name
wpl network meta update 1 site_name "My Network"
```

**Gotchas**: Multisite only. Network ID is usually `1`.

---

## Advanced Patterns

### JSON output + jq

Pipe `--format=json` through jq for powerful filtering:

```bash
# Get IDs of all active plugins
wpl plugin list --status=active --format=json | jq -r '.[].name'

# Get post titles containing "hello"
wpl post list --format=json | jq -r '.[] | select(.post_title | test("hello";"i")) | .post_title'

# Count posts by status
wpl post list --format=json | jq 'group_by(.post_status) | map({status: .[0].post_status, count: length})'

# Get all option names matching a pattern
wpl option list --search="woo*" --format=json | jq -r '.[].option_name'
```

### Bulk operations

```bash
# Deactivate all plugins
wpl plugin deactivate --all

# Delete all transients
wpl transient delete --all

# Regenerate all thumbnails
wpl media regenerate --yes

# Delete all spam comments
wpl comment delete $(wpl comment list --status=spam --format=ids) --force

# Reset all user passwords
wpl user list --format=ids | xargs -I{} wpl user update {} --user_pass="changeme"
```

### Common eval snippets

```bash
# Check current theme
wpl eval "echo get_template();"

# Get site health info
wpl eval "echo home_url(); echo ' | '; echo wp_get_theme()->get('Name');"

# Check if a function exists
wpl eval "echo function_exists('wc_get_products') ? 'yes' : 'no';"

# Get active plugin count
wpl eval "echo count(get_option('active_plugins'));"

# List registered post types
wpl eval "print_r(array_keys(get_post_types(['public' => true])));"

# List registered taxonomies
wpl eval "print_r(array_keys(get_taxonomies(['public' => true])));"

# Check PHP version and memory
wpl eval "echo 'PHP: ' . PHP_VERSION . ' | Memory: ' . WP_MEMORY_LIMIT;"

# Test a shortcode
wpl eval "echo do_shortcode('[my_shortcode]');"
```

### Chaining commands

```bash
# Install, activate, and verify
wpl plugin install woocommerce --activate && wpl plugin list --status=active

# Export before destructive operation
wpl db export before-change.sql && wpl search-replace 'old.com' 'new.com'

# Create user and assign role
wpl user create testuser test@test.com --role=subscriber && wpl user add-role $(wpl user get testuser --field=ID) editor
```

### Debugging plugin conflicts

```bash
# Run with all plugins disabled
wpl eval "echo home_url();" --skip-plugins

# Run with specific plugin disabled
wpl eval "echo home_url();" --skip-plugins=problematic-plugin

# Run with themes disabled
wpl eval "echo 'loaded';" --skip-themes
```

### Format reference

| Format | Use case |
|---|---|
| `table` | Human-readable terminal output (default) |
| `json` | Pipe to jq, programmatic processing |
| `csv` | Spreadsheet import, simple parsing |
| `yaml` | Config files, readable structured data |
| `ids` | Pipe to other commands (`xargs`) |
| `count` | Quick counts |
