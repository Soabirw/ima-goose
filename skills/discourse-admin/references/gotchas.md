# Discourse Admin API — Known Gotchas & Breaking Changes

## Version History

Discourse moved from semantic versioning (3.x) to date-based versioning in January 2026.

| Old Version | New Version | Notes |
|-------------|-------------|-------|
| 3.5.0 | — | Last semantic version |
| — | 2026.1.0 | First ESR release, replaces "stable" |
| — | 2026.2.0 | Current as of March 2026 |

## Breaking Changes

### Custom User Fields URL Migration (3.5.0, late 2025)

**Old:** `/admin/customize/user_fields.json` — returns 404 on 3.5+
**New GET:** `/admin/config/user-fields.json` (hyphen) OR `/admin/config/user_fields.json` (underscore)
**New POST/PUT/DELETE:** `/admin/config/user_fields.json` (underscore only)

Both kebab-case and snake_case paths work for GET due to route aliases. For writes, use underscore.

### Admin Route Migration Pattern

Discourse is progressively moving admin routes from `/admin/customize/` to `/admin/config/`. User fields were first. Expect other admin config endpoints to follow in future releases. Always verify against your Discourse version.

### API Key Auth in Query Params (Deprecated)

Credentials MUST be passed as HTTP headers:
```
Api-Key: <key>
Api-Username: <username>
```

Query parameter auth (`?api_key=...&api_username=...`) is deprecated and may be removed.

## Rate Limiting Gotchas

### Two Independent Limiters

1. **IP-based** — `RequestTracker` middleware, controlled by `max_reqs_per_ip_mode`
2. **API key-based** — `DefaultCurrentUserProvider#admin_api_key_limiter`, uses `max_admin_api_reqs_per_minute` (default 60)

The API key limiter runs UNCONDITIONALLY regardless of `max_reqs_per_ip_mode`.

### max=0 Means BLOCK ALL

Setting any rate limit to 0 means "block all requests", NOT "unlimited". Use high numbers (e.g., 6000) for effectively unlimited.

### Redis Key Flush Required

After changing rate limit settings, you must flush the Redis rate limit keys. Settings changes alone won't clear existing rate limit counters.

## Container / Server Gotchas

### Pitchfork (Not Unicorn)

Dev containers use pitchfork, not unicorn. Do NOT send SIGHUP to pitchfork masters — it kills them instead of reloading. Restart the container instead.

### No Versioned API

Discourse has NO versioned API (no `/api/v1/`). Endpoints can change between releases without formal deprecation. Always test against staging before upgrading Discourse.

## Endpoint-Specific Gotchas

### Silence User — Date Not Updated

`PUT /admin/users/{id}/silence.json` — if user is already silenced, the endpoint may NOT update the `silenced_till` date. Un-silence first, then re-silence.

### Group Owner Removal — Different Param

`DELETE /admin/groups/{id}/owners.json` uses `user_id` (integer), NOT `usernames` (string). Every other member endpoint uses `usernames`.

### Categories — Not Under /admin

Category CRUD is at `/categories.json`, NOT `/admin/categories.json`. Permission checks are inline via Guardian, not route constraints.

### Hidden Settings

Some site settings are "hidden" and cannot be modified via the admin API (`SiteSetting.hidden_settings`). These include internal system settings that should not be changed via API.

### Site Settings Update — Empty Response

`PUT /admin/site_settings/{name}.json` returns `200 OK` with an empty body on success. Don't expect the updated value in the response — re-fetch if you need to verify.

### Bulk Update — Undocumented

`PUT /admin/site_settings/bulk_update.json` is not in the official API docs but is source-verified. It's the most efficient way to apply multiple settings changes.

## Security Vulnerabilities (Patched)

### CVE-2026-26265 (patched 2026.2.0)

IDOR in `/directory_items.json` allowed any user to retrieve private user field values via `user_field_ids` parameter. Patched to filter against `UserField.public_fields` for non-staff.

### CVE-2026-21626 (patched 2026.1.0)

ACL bypass where custom fields JSON output lacked access control checks present on other serializers.

## Self-Healing: Verifying Endpoints

When an endpoint returns unexpected results:

1. **Check Discourse version**: `GET /admin/dashboard.json` → look for `version_check.installed_version`
2. **Verify against source**: Check `config/routes.rb` in Discourse repo for current route definitions
3. **Use Context7/Tavily**: Search for recent Discourse API changes
4. **Check Meta**: https://meta.discourse.org for migration announcements
