# Discourse Staging Environment — Recommended Defaults

Safe defaults for a staging Discourse instance. Apply these as an environment overlay on top of your base config.

## Critical: Prevent External Communication

| Setting | Value | Why |
|---------|-------|-----|
| `disable_emails` | `yes` | Prevent ALL outbound email |
| `notification_email` | staging-specific address | Catch any that slip through |
| `contact_email` | staging-specific address | Don't expose real contact |
| `disable_digest_emails` | `true` | No digest emails to real users |

## Visual Distinction

| Setting | Value | Why |
|---------|-------|-----|
| `title` | `[STAGING] {original title}` | Immediately obvious this is staging |
| `site_description` | `Staging environment — not for real use` | Clear in meta/search |
| `short_site_description` | `STAGING` | Short variant |
| `logo_url` | staging-branded logo if available | Visual cue |

## SSO / DiscourseConnect

| Setting | Value | Why |
|---------|-------|-----|
| `discourse_connect_provider_secrets` | staging WP domains + secrets | Only staging WP sites can SSO |
| `enable_discourse_connect` | `true` (if using SSO) | Keep SSO active for testing |
| `discourse_connect_url` | staging SSO endpoint | Point to staging identity provider |

Format for `discourse_connect_provider_secrets`:
```
staging.site1.com|secret1
staging.site2.com|secret2
```

## Access Control

| Setting | Value | Why |
|---------|-------|-----|
| `invite_only` | `true` | No public signups |
| `must_approve_users` | `true` | Extra safety gate |
| `enable_local_logins` | `true` | Allow direct login for testing |
| `min_password_length` | `6` | Easier test accounts |

## Indexing Prevention

| Setting | Value | Why |
|---------|-------|-----|
| `allow_index_in_robots_txt` | `false` | Block search engines |
| `include_robots_info_header` | `false` | Don't advertise in headers |

## Rate Limits (Relaxed for Testing)

| Setting | Value | Why |
|---------|-------|-----|
| `max_admin_api_reqs_per_minute` | `600` | Higher limit for automated testing |
| `max_reqs_per_ip_per_10_seconds` | `100` | Don't throttle test runners |

## Webhook Safety

| Setting | Value | Why |
|---------|-------|-----|
| Webhooks | Point to staging receivers only | Never fire to production endpoints |

Review all configured webhooks at `/admin/api/web_hooks` and update URLs.

## Sample Staging Overlay JSON

```json
{
  "title": "[STAGING] Community Forum",
  "site_description": "Staging environment — not for real use",
  "short_site_description": "STAGING",
  "disable_emails": "yes",
  "notification_email": "noreply-staging@example.com",
  "contact_email": "staging-admin@example.com",
  "disable_digest_emails": "true",
  "invite_only": "true",
  "must_approve_users": "true",
  "enable_local_logins": "true",
  "min_password_length": "6",
  "allow_index_in_robots_txt": "false",
  "max_admin_api_reqs_per_minute": "600",
  "discourse_connect_provider_secrets": "staging.site1.com|secret\nstaging.site2.com|secret"
}
```

## Checklist: Before Deploying Config to Staging

- [ ] Email disabled (`disable_emails: yes`)
- [ ] Title prefixed with `[STAGING]`
- [ ] SSO secrets point to staging WP domains only
- [ ] Robots.txt blocks indexing
- [ ] Webhooks point to staging receivers
- [ ] Rate limits relaxed for test automation
- [ ] Public signup disabled (`invite_only: true`)
- [ ] Credentials are staging-specific (not production API keys)
