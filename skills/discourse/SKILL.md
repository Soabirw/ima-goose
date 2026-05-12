---
name: "discourse"
description: "Discourse plugin development - plugin.rb, after_initialize, admin routes, Guardian auth, security patterns"
---

# Discourse Plugin Development

Discourse plugins are Rails engines. Work with the framework — Plugin API, Guardian, and event hooks exist for good reason.

## Core Rules

- `after_initialize` — all plugin wiring goes here
- `Guardian` — authorization layer; every user action checks it
- `register_*` / `add_*` — use Plugin API hooks, not monkey-patches
- `StaffConstraint` — required on all admin routes; never roll your own
- `RuboCop` — enforced; Discourse ships lint rules

Foundation: `../rails/SKILL.md` (security), `../ruby-fp/SKILL.md` (patterns).

## Plugin Structure

```
my-plugin/
├── plugin.rb               # Manifest + bootstrap (required)
├── about.json
├── app/
│   ├── controllers/admin/my_plugin_controller.rb
│   ├── models/my_plugin_record.rb
│   └── serializers/my_plugin_serializer.rb
├── config/
│   ├── locales/server.en.yml
│   └── settings.yml
├── db/migrate/
├── assets/javascripts/admin/   # Ember admin UI
├── lib/my_plugin/              # Pure logic (no Discourse deps)
└── spec/plugin_helper.rb
```

## plugin.rb

```ruby
# frozen_string_literal: true

# name: my-plugin
# about: Brief plugin description
# version: 1.0.0
# authors: Your Name
# url: https://github.com/yourorg/my-plugin

module ::MyPlugin
  PLUGIN_NAME = "my-plugin"
end

require_relative "lib/my_plugin/engine"

after_initialize do
  # All wiring here — runs after Discourse core is fully loaded
end
```

## after_initialize

```ruby
after_initialize do
  User.class_eval do
    has_one :my_plugin_profile, dependent: :destroy
  end

  register_post_custom_field_type('wp_original_id', :integer)
  register_topic_custom_field_type('imported_from', :string)

  on(:user_created) { |user| MyPlugin::UserSetup.call(user) }
  on(:post_created) { |post, opts, user| MyPlugin::PostSync.call(post, user) }

  add_to_serializer(:user, :wp_user_id) { object.custom_fields['wp_user_id'] }
end
```

## Admin Routes + Controller

```ruby
# plugin.rb
add_admin_route 'my_plugin.title', 'my-plugin'

Discourse::Application.routes.append do
  get  '/admin/plugins/my-plugin'         => 'admin/my_plugin#index',  constraints: StaffConstraint.new
  post '/admin/plugins/my-plugin/action'  => 'admin/my_plugin#action', constraints: StaffConstraint.new
end
```

```ruby
# app/controllers/admin/my_plugin_controller.rb
# frozen_string_literal: true

class ::Admin::MyPluginController < ::Admin::AdminController
  # AdminController enforces: logged_in + staff
  # For admin-only actions:
  before_action :ensure_admin, only: [:dangerous_action]

  def index
    render json: { stats: MyPlugin::Stats.summary, settings: SiteSetting.my_plugin_enabled }
  end

  def action
    attrs = params.require(:my_plugin).permit(:field_one, :field_two)
    result = MyPlugin::SomeService.call(attrs.to_h.symbolize_keys)

    if result.success?
      render json: { success: true, data: result.data }
    else
      render json: { success: false, errors: result.errors }, status: :unprocessable_entity
    end
  end
end
```

## Guardian

```ruby
def update_post
  post = Post.find(params[:id])
  return render json: failed_json, status: :forbidden unless guardian.can_edit_post?(post)

  post.update!(body: params[:body])
  render json: PostSerializer.new(post, scope: guardian).as_json
end

# Extend Guardian in after_initialize:
module ::Guardian::MyPluginExtensions
  def can_use_my_feature?
    authenticated? && (is_staff? || user.trust_level >= 2)
  end
end

Guardian.prepend(::Guardian::MyPluginExtensions)
```

## Security

### SQL — no interpolation

```ruby
# BAD
User.where("username = '#{params[:username]}'")
DB.query("SELECT * FROM users WHERE id = #{user_id}")

# GOOD
User.where(username: params[:username])
DB.query("SELECT * FROM users WHERE id = :id", id: user_id.to_i)
```

### Logs — no sensitive values

```ruby
# BAD
Rails.logger.warn("[MyPlugin] Hash: #{user_hash}")

# GOOD
Rails.logger.info("[MyPlugin] Processing user #{user.id}")
```

### Custom fields — register types

```ruby
register_user_custom_field_type('my_plugin_id', :integer)
DiscoursePluginRegistry.serialized_current_user_fields << 'my_plugin_id'
user_id = (user.custom_fields['my_plugin_id'].to_i rescue nil)
```

### Rate limiting

```ruby
RateLimiter.new(current_user, "my_plugin_sensitive_action", 5, 1.minute).performed!
```

## Site Settings

```yaml
# config/settings.yml
plugins:
  my_plugin_enabled:
    default: false
    client: false
  my_plugin_max_items:
    default: 100
    min: 1
    max: 1000
    type: integer
```

```ruby
return unless SiteSetting.my_plugin_enabled
SiteSetting.my_plugin_max_items
```

## Migrations

```ruby
# frozen_string_literal: true
class CreateMyPluginRecords < ActiveRecord::Migration[7.0]
  def change
    create_table :my_plugin_records do |t|
      t.integer :user_id, null: false
      t.string  :source_id, null: false
      t.text    :data
      t.timestamps
    end
    add_index :my_plugin_records, :user_id
    add_index :my_plugin_records, :source_id, unique: true
    add_foreign_key :my_plugin_records, :users
  end
end
```

## Import Script

```ruby
# frozen_string_literal: true
require_relative "base"

class ImportScripts::MyImport < ImportScripts::Base
  def initialize
    super
    @client = Mysql2::Client.new(
      host:     ENV.fetch('SOURCE_DB_HOST'),
      username: ENV.fetch('SOURCE_DB_USER'),
      password: ENV.fetch('SOURCE_DB_PASSWORD'),
      database: ENV.fetch('SOURCE_DB_NAME')
    )
  end

  def perform
    import_users
    import_categories
    import_posts
  end

  private

  def import_users
    users = @client.query(
      "SELECT id, email, username, display_name FROM wp_users WHERE user_status = 0",
      as: :hash
    )
    create_users(users) do |u|
      { id: u['id'], email: u['email'], username: normalize_username(u['username']), name: u['display_name'] }
    end
  end

  def normalize_username(raw)
    raw.to_s.strip.downcase.gsub(/[^a-z0-9_]/, '_').truncate(20)
  end
end

ImportScripts::MyImport.new.perform
```

## Testing

```ruby
require 'rails_helper'

RSpec.describe Admin::MyPluginController do
  fab!(:admin) { Fabricate(:admin) }
  fab!(:user)  { Fabricate(:user) }

  before { sign_in(admin) }

  describe "GET #index" do
    it "returns 200 for admin" do
      get "/admin/plugins/my-plugin.json"
      expect(response.status).to eq(200)
    end
  end

  describe "authorization" do
    it "rejects non-staff with 404" do
      sign_in(user)
      get "/admin/plugins/my-plugin.json"
      expect(response.status).to eq(404)
    end
  end
end

RSpec.describe MyPlugin::UserSetup do
  it "normalizes username" do
    expect(described_class.normalize("John Doe!")).to eq("john_doe_")
  end
end
```

## Security Checklist

- [ ] `StaffConstraint.new` on all admin routes
- [ ] Inherit `Admin::AdminController` for admin endpoints
- [ ] Strong params (`require().permit()`) on all mutations
- [ ] No SQL interpolation — use ActiveRecord or `DB.query` with `:named` params
- [ ] `guardian.can_*?` before user-facing mutations
- [ ] No sensitive values in logs
- [ ] Rate limiting on credential-testing / expensive endpoints
- [ ] Custom field types registered
- [ ] Feature flags via SiteSettings, not hardcoded booleans

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Monkey-patching Discourse classes | `class_eval` / `prepend` in `after_initialize` |
| SQL string interpolation | `DB.query("… WHERE id = :id", id: val)` |
| `current_user.staff?` check in controller | Inherit `Admin::AdminController` |
| Logging `user.password_hash` | Log `user.id` only |
| Raw `params[:field]` | Always `params.require().permit()` |
| Hardcoded credentials | `ENV.fetch('KEY')` |

## Reference Files

| File | Load when |
|------|-----------|
| [`references/security.md`](references/security.md) | Auth hooks, Guardian extensions, SQL safety in imports |
| [`references/admin-ui.md`](references/admin-ui.md) | Admin panel Ember components |
| [`references/import-scripts.md`](references/import-scripts.md) | Data migration: batching, lookup maps, idempotency |

---

**Evidence Base**: Discourse Developer Docs, discourse-solved, discourse-data-explorer, Discourse CVE history (2024–2026), Rails Security Guide.
