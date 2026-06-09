# Discourse Admin API — Full Endpoint Reference

Source-verified against Discourse source code (`config/routes.rb` and controllers).
Last verified: 2026-03-02 against Discourse 2026.2.x codebase.

## Table of Contents

1. [Site Settings](#site-settings)
2. [Categories](#categories)
3. [Groups](#groups)
4. [Users](#users)
5. [Custom User Fields](#custom-user-fields)
6. [Site Texts (i18n)](#site-texts)
7. [API Keys](#api-keys)

---

## Site Settings

### GET /admin/site_settings.json

List all site settings.

**Query params:**
- `categories` — filter by setting categories
- `plugin` — filter by plugin name
- `names` — filter specific setting names

**Response:** Array of settings, each with:
```json
{
  "setting": "title",
  "value": "My Forum",
  "default": "Discourse",
  "description": "The name of this site...",
  "type": "string",
  "category": "required"
}
```

### GET /admin/site_settings/category/{slug}.json

List settings filtered to a category.

**Category slugs:** `required`, `basic`, `users`, `email`, `login`, `security`, `onboarding`, `spam`, `rate_limits`, `developer`, `embedding`, `legal`, `branding`, `uncategorized`

### PUT /admin/site_settings/{setting_name}.json

Update a single setting.

**Body:** `{ "setting_name": "value" }`
**Response:** `200 OK` (empty body)

### PUT /admin/site_settings/bulk_update.json

Update multiple settings in one request.

**Body:**
```json
{
  "settings": {
    "setting_1": { "value": "...", "backfill": false },
    "setting_2": { "value": "..." }
  }
}
```

The `backfill` flag (optional, default false) triggers retroactive application to existing users where applicable.

### PUT /admin/site_settings/user_count.json

Get count of users affected by a setting change (useful before backfill).

---

## Categories

**NOTE:** Category routes are NOT under `/admin/`. Permission checks are inline in the controller via Guardian.

### GET /categories.json

List all categories.

**Query params:** `include_subcategories` (boolean), `page` (integer)

**Response:**
```json
{
  "category_list": {
    "categories": [
      {
        "id": 1,
        "name": "General",
        "color": "0088CC",
        "text_color": "FFFFFF",
        "slug": "general",
        "topic_count": 42,
        "position": 0,
        "read_restricted": false,
        "permission": null,
        "parent_category_id": null
      }
    ]
  }
}
```

### GET /site.json

Alternative: returns all categories in a flat array under `categories` key, plus trust levels and other site metadata.

### POST /categories.json

Create category. Requires `can_create_category` permission.

**Body (required):** `name`, `color`, `text_color`
**Body (optional):** `slug`, `parent_category_id`, `description`, `permissions`

**Permissions format:**
```json
{
  "permissions": {
    "everyone": 1,
    "staff": 1,
    "custom_group": 3
  }
}
```
Permission levels: `1` = See/Reply/Create, `2` = See/Reply, `3` = See only

### PUT /categories/{id}.json

Update category. Requires `can_edit_category` permission.

**Body:** Any category fields.

### DELETE /categories/{id}.json

Delete category. Requires `can_delete_category` permission.

---

## Groups

### GET /groups.json

List all groups. Public groups visible without auth.

**Query params:** `page` (integer)

**Response:**
```json
{
  "groups": [
    {
      "id": 50,
      "name": "moderators",
      "display_name": "Forum Moderators",
      "user_count": 5,
      "visibility_level": 0,
      "automatic": false
    }
  ]
}
```

### GET /groups/{group_name}.json

Get group details by name.

### POST /admin/groups.json

Create group. Requires staff.

**Body (all under `group` key):**
```json
{
  "group": {
    "name": "my-group",
    "display_name": "My Group",
    "visibility_level": 0,
    "mentionable_level": 0,
    "messageable_level": 0,
    "members_visibility_level": 0,
    "automatic_membership_email_domains": "",
    "title": "",
    "primary_group": false,
    "grant_trust_level": null,
    "bio_raw": "",
    "public_admission": false,
    "public_exit": false,
    "owner_usernames": "",
    "usernames": ""
  }
}
```

**Visibility levels:** `0` = public, `1` = logged-in, `2` = members, `3` = staff, `4` = owners

### PUT /groups/{id}.json

Update group. Same fields as create under `group` key.

### DELETE /admin/groups/{id}.json

Delete group. Requires admin.

### PUT /groups/{id}/members.json

Add members.

**Body:** `{ "usernames": "alice,bob,charlie" }`
**Response:** `{ "success": "OK", "usernames": ["alice", "bob", "charlie"] }`

### DELETE /groups/{id}/members.json

Remove members.

**Body:** `{ "usernames": "alice,bob" }`

### PUT /groups/{id}/owners.json

Add group owners.

**Body:** `{ "usernames": "alice" }`

### DELETE /admin/groups/{id}/owners.json

Remove group owner.

**Body:** `{ "user_id": 123 }` — NOTE: uses `user_id`, not `usernames`

---

## Users

### POST /users.json

Create user.

**Body (required):** `name`, `username`, `email`, `password`
**Body (optional):** `active` (boolean, skip email confirm), `approved` (boolean), `user_fields[{id}]` (set custom field values by field ID)

### GET /u/{username}.json

Get user profile. Returns `user_fields` keyed by field ID.

### GET /admin/users/{id}.json

Get admin user view. Includes email, IP, groups, flags, suspensions.

### PUT /u/{username}.json

Update user profile.

**Body:** `name`, `bio_raw`, `user_fields[{id}]`, `timezone`, etc.

### GET /u/by-external/{external_id}.json

Lookup user by external (SSO/DiscourseConnect) ID. Admin required.

### GET /admin/users/list/{flag}.json

List users by flag: `active`, `new`, `staff`, `suspended`, `blocked`, `suspect`

**Query params:** `page`, `show_emails`, `order` (`created`, `last_emailed`, etc.), `asc`

### GET /admin/users.json

Search/filter users.

**Query params:** `filter` (searches username/email), `show_emails`

### PUT /admin/users/{id}/activate.json

Activate user account.

### PUT /admin/users/{id}/deactivate.json

Deactivate user account.

### PUT /admin/users/{id}/suspend.json

Suspend user.

**Body (required):** `suspend_until` (ISO 8601), `reason`

### PUT /admin/users/{id}/silence.json

Silence user.

**Body (required):** `silenced_till` (ISO 8601)
**Body (optional):** `reason`

**Known quirk:** If user is already silenced, the endpoint may NOT update the date.

### DELETE /admin/users/{id}.json

Delete user.

**Body:** `delete_posts`, `block_email`, `block_urls`, `block_ip` (all boolean)

---

## Custom User Fields

**CRITICAL:** Endpoints migrated in Discourse 3.5.0 (late 2025). Old path `/admin/customize/user_fields.json` returns 404.

### GET /admin/config/user_fields.json

List all custom user fields. Both `user_fields` (underscore) and `user-fields` (hyphen) work for GET.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Company",
    "description": "Your company name",
    "field_type": "text",
    "editable": true,
    "required": false,
    "show_on_profile": true,
    "show_on_user_card": false,
    "searchable": false,
    "position": 0
  }
]
```

### POST /admin/config/user_fields.json

Create custom user field.

**Body:**
```json
{
  "user_field": {
    "name": "Company",
    "field_type": "text",
    "editable": true,
    "required": false,
    "show_on_profile": true,
    "show_on_user_card": false,
    "searchable": false,
    "description": "Your company name",
    "options": ["Option A", "Option B"]
  }
}
```

**Field types:** `text`, `confirm`, `dropdown`, `multiselect`
**`options` required for:** `dropdown`, `multiselect`

### PUT /admin/config/user_fields/{id}.json

Update custom user field. Same body as create under `user_field` key.

### DELETE /admin/config/user_fields/{id}.json

Delete custom user field.

### Setting Field Values on Users

Field values are set/read on the user object, NOT through admin user fields endpoints:

- **Create:** `POST /users.json` with `user_fields[{field_id}]`
- **Update:** `PUT /u/{username}.json` with `user_fields[{field_id}]`
- **Read:** `GET /u/{username}.json` returns `user_fields: { "1": "value" }`

---

## Site Texts

Manage i18n string overrides.

### GET /admin/customize/site_texts.json

List i18n strings.

**Query params:** `q` (search), `locale`, `overridden` ("true"), `outdated` ("true"), `untranslated` ("true"), `page`

### GET /admin/customize/site_texts/{id}.json

Get single string by key.

### PUT /admin/customize/site_texts/{id}.json

Override string translation.

**Body:** `{ "site_text": { "value": "Custom text here" } }`

### DELETE /admin/customize/site_texts/{id}.json

Revert to default translation.

---

## API Keys

### GET /admin/api/keys.json

List API keys (paginated, max 50).

### POST /admin/api/keys.json

Create API key.

**Body:**
```json
{
  "key": {
    "username": "system",
    "description": "Config management",
    "scope_mode": "granular",
    "scopes": []
  }
}
```

### DELETE /admin/api/keys/{id}.json

Delete API key.

### POST /admin/api/keys/{id}/revoke.json

Revoke key (soft delete).

### POST /admin/api/keys/{id}/undo-revoke.json

Restore revoked key.

---

## Access Control Summary

| Constraint | Who | Used by |
|------------|-----|---------|
| `AdminConstraint` | `current_user.admin?` | Site settings, user fields, delete group, API keys |
| `StaffConstraint` | `current_user.staff?` | Create group, group owner management |
| Guardian `can_*` | Permission checks | Categories CRUD, user profile updates |
