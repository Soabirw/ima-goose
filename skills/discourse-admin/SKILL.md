---
name: discourse-admin
description: "Discourse admin API for site settings, configuration export/import, categories, groups, and custom user fields. Use when: managing Discourse site configuration, deploying config to staging/production, exporting settings, bulk-updating site settings, managing groups or user fields via API. Triggers on: discourse admin, discourse settings, discourse config, site settings, config-as-code, discourse deploy, discourse staging."
---

# Discourse Admin API

Manage Discourse site configuration via REST API. Export settings, apply environment configs, manage groups/user fields without clicking through admin UI.

**Not this skill**: For Discourse plugin development (Ruby/Rails/Ember), use `discourse` skill.

## Setup

Configure `~/.agents/discourse-environments.json`:
```json
{
  "local": { "url": "http://localhost:4200", "api_key": "...", "api_username": "system" },
  "staging": { "url": "https://staging.community.example.com", "api_key": "...", "api_username": "system" }
}
```

## Commands

```bash
python3 ~/.agents/skills/discourse-admin/scripts/discourse-admin.py export
python3 ~/.agents/skills/discourse-admin/scripts/discourse-admin.py import base.json staging-overlay.json
python3 ~/.agents/skills/discourse-admin/scripts/discourse-admin.py diff config.json
python3 ~/.agents/skills/discourse-admin/scripts/discourse-admin.py get title
python3 ~/.agents/skills/discourse-admin/scripts/discourse-admin.py set disable_emails yes
python3 ~/.agents/skills/discourse-admin/scripts/discourse-admin.py envs
```

## Environment Resolution (priority order)

1. `--env` flag
2. `$DISCOURSE_ENV` env var
3. `.discourse-env` file in project root or parents
4. Falls back to `"local"`

```bash
python3 discourse-admin.py --env staging export
```

## Config-as-Code Workflow

```bash
# 1. Export non-default settings (~50-100 settings, not 500+)
python3 discourse-admin.py export discourse-base.json

# 2. Structure overlays:
#   config/discourse-base.json
#   config/discourse-staging.json
#   config/discourse-production.json

# 3. Preview changes
python3 discourse-admin.py --env staging import base.json staging.json --dry-run
python3 discourse-admin.py --env staging diff base.json

# 4. Apply
python3 discourse-admin.py --env staging import discourse-base.json discourse-staging.json
```

Staging overlay example:
```json
{
  "title": "[STAGING] Community Forum",
  "disable_emails": "yes",
  "notification_email": "noreply-staging@example.com",
  "discourse_connect_provider_secrets": "staging.example.com|staging-secret-here"
}
```

## Site Settings API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/site_settings.json` | List all settings |
| GET | `/admin/site_settings/category/{slug}.json` | Filter by category |
| PUT | `/admin/site_settings/{name}.json` | Update single setting |
| PUT | `/admin/site_settings/bulk_update.json` | Update multiple (undocumented, source-verified) |

Categories: `required`, `basic`, `users`, `email`, `login`, `security`, `onboarding`, `spam`, `rate_limits`, `developer`, `embedding`, `legal`, `branding`, `uncategorized`

## Common Staging Settings

| Setting | Value | Why |
|---------|-------|-----|
| `disable_emails` | `yes` | Prevent real emails |
| `title` | `[STAGING] ...` | Visual distinction |
| `notification_email` | staging address | Don't spam real inbox |
| `discourse_connect_provider_secrets` | staging domains | SSO for staging only |
| `enable_local_logins` | `true` | Direct login for testing |
| `min_password_length` | `6` | Easier test accounts |
| `invite_only` | `true` | Prevent public signups |

## Rate Limiting

- Two independent limiters: IP-based (`max_reqs_per_ip_mode`) and API-key-based (`max_admin_api_reqs_per_minute`, default 60)
- `max=0` means BLOCK ALL (not unlimited) — use high numbers like 6000
- Flush Redis rate limit keys after changing rate limit config

## Reference Files

| File | Load When |
|------|-----------|
| `references/api-endpoints.md` | Need exact params, response formats, or edge cases (groups, categories, users, user fields, site texts, API keys) |
| `references/gotchas.md` | Hitting 404s, unexpected behavior, or working with specific Discourse versions |
| `references/staging-defaults.md` | Setting up new staging environment |

## Quick Reference (curl)

```bash
# List all settings
curl -s -H "Api-Key: $KEY" -H "Api-Username: system" "$URL/admin/site_settings.json"

# Get email settings
curl -s -H "Api-Key: $KEY" -H "Api-Username: system" "$URL/admin/site_settings/category/email.json"

# Update single setting
curl -s -X PUT -H "Api-Key: $KEY" -H "Api-Username: system" \
  -H "Content-Type: application/json" \
  -d '{"disable_emails": "yes"}' \
  "$URL/admin/site_settings/disable_emails.json"

# List groups
curl -s -H "Api-Key: $KEY" -H "Api-Username: system" "$URL/groups.json"

# List custom user fields
curl -s -H "Api-Key: $KEY" -H "Api-Username: system" "$URL/admin/config/user_fields.json"
```
