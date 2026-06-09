---
name: "ember-discourse"
description: "Ember/Glimmer component development for Discourse plugins - gjs, apiInitializer, plugin outlets, @tracked, @service, admin UI"
---

# Ember for Discourse Plugins

Discourse runs Ember Octane with Glimmer components. Extension model: `apiInitializer` → `renderInOutlet` → `.gjs` component.

## Modern Stack

| What | Modern | Deprecated / Avoid |
|------|--------|--------------------|
| File format | `.gjs` (Glimmer JS) | `.hbs` + `.js` pairs, `.hbr`, `.raw.hbs` |
| Entry point | `apiInitializer` | bare `withPluginApi` initializer export |
| Inject into UI | `api.renderInOutlet` | `registerConnectorClass`, `decorateWidget` |
| Component base | `@glimmer/component` | `@ember/component` (classic) |
| Reactive state | `@tracked` | `Ember.set()`, `this.set()` |
| Services | `@service` decorator | `Ember.inject.service()` |
| Event handling | `{{on "click" this.handler}}` | `{{action "handler"}}` |

## FP Lens

- Components are view functions — args in, DOM out
- `@tracked` = isolated reactive state — use sparingly, only for state the component owns and mutates
- Derived values via getters — no duplicate state
- Actions are the imperative shell — side effects in methods, not templates
- Services are DI — inject via `@service`, don't import singletons

**Related**: `../discourse/SKILL.md` for Ruby plugin side.

## .gjs Format

`.gjs` combines class + template in one file. Standard for all new components.

```gjs
// assets/javascripts/discourse/components/my-component.gjs
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import DButton from "discourse/components/d-button";

export default class MyComponent extends Component {
  @service currentUser;
  @service siteSettings;

  @tracked isExpanded = false;

  // Derived — getter, not @tracked
  get greeting() {
    return this.currentUser
      ? `Welcome back, ${this.currentUser.username}!`
      : "Welcome to our community!";
  }

  @action
  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  <template>
    <div class="my-component">
      <p>{{this.greeting}}</p>
      <DButton
        @action={{this.toggleExpanded}}
        @label={{if this.isExpanded "collapse" "expand"}}
      />
      {{#if this.isExpanded}}
        <div class="my-component__body">{{yield}}</div>
      {{/if}}
    </div>
  </template>
}
```

Template-only (no class needed):

```gjs
<template>
  <div class="badge-card">
    <img src={{@badge.image_url}} alt={{@badge.name}} />
    <span>{{@badge.name}}</span>
  </div>
</template>
```

## apiInitializer

One initializer file per plugin feature area.

```javascript
// assets/javascripts/discourse/initializers/my-plugin.js
import { apiInitializer } from "discourse/lib/api";
import MyBanner from "../components/my-banner";
import MyComponent from "../components/my-component";

export default apiInitializer((api) => {
  api.renderInOutlet("discovery-list-container-top", MyBanner);
  api.renderInOutlet("topic-above-post-stream", MyComponent);
});
```

## Plugin Outlets

Inject at pre-defined template hooks via `api.renderInOutlet`.

```gjs
// assets/javascripts/discourse/components/my-banner.gjs
import Component from "@glimmer/component";
import { service } from "@ember/service";

export default class MyBanner extends Component {
  @service currentUser;

  // Controls whether component renders. outletArgs = DOM context.
  static shouldRender(outletArgs, helper) {
    return helper.siteSettings.my_plugin_enabled && helper.currentUser;
  }

  <template>
    <div class="my-banner">Welcome, {{this.currentUser.username}}!</div>
  </template>
}
```

Post stream outlets (Glimmer post stream — current):

```gjs
import Component from "@glimmer/component";
import { apiInitializer } from "discourse/lib/api";

export default apiInitializer((api) => {
  api.renderAfterWrapperOutlet(
    "post-content-cooked-html",
    class extends Component {
      static shouldRender(args) {
        return args.post.wiki;
      }
      <template>
        <div class="wiki-notice">This post is a wiki</div>
      </template>
    }
  );
});
```

Find outlet names:
```bash
rg '<PluginOutlet @name=' app/assets/javascripts/discourse/
```

Common outlets: `discovery-list-container-top`, `topic-above-post-stream`, `above-main-container`, `header-icons`, `user-profile-primary`, `post-content-cooked-html`, `after-topic-list-area`.

## Component Patterns

### Args vs State

```gjs
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";

export default class UserCard extends Component {
  @tracked showDetails = false;  // component owns this

  get displayName() {            // derived from args — never @tracked
    return this.args.user.name || this.args.user.username;
  }

  get isStaff() {
    return this.args.user.staff;
  }

  <template>
    <div class="user-card {{if this.isStaff 'user-card--staff'}}">
      <h3>{{this.displayName}}</h3>
      {{#if this.showDetails}}<p>{{@user.bio_raw}}</p>{{/if}}
    </div>
  </template>
}
```

### Services

```gjs
import Component from "@glimmer/component";
import { service } from "@ember/service";

export default class MyFeature extends Component {
  @service currentUser;   // logged-in user (null if anonymous)
  @service siteSettings;  // site configuration
  @service router;        // programmatic navigation
  @service store;         // Ember Data store
  @service session;       // session data
  @service modal;         // open modals
  @service toasts;        // toast notifications (Discourse 3.2+)

  get canUseFeature() {
    return this.currentUser?.trust_level >= 2
      && this.siteSettings.my_plugin_enabled;
  }

  <template>
    {{#if this.canUseFeature}}...{{/if}}
  </template>
}
```

### Actions

```gjs
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";

export default class SearchBox extends Component {
  @tracked query = "";
  @tracked results = [];

  @action updateQuery(event) { this.query = event.target.value; }

  @action
  async search() {
    if (!this.query.trim()) return;
    this.results = await this.args.onSearch(this.query);
  }

  <template>
    <input type="text" value={{this.query}} {{on "input" this.updateQuery}} />
    <button type="button" {{on "click" this.search}}>Search</button>
  </template>
}
```

## Admin UI

Admin components live in `admin/` asset tree, same Glimmer patterns.

```
assets/javascripts/
├── discourse/initializers/my-plugin.js
└── admin/
    ├── components/my-plugin-admin.gjs
    └── routes/admin-plugins-my-plugin.js
```

```gjs
// assets/javascripts/admin/components/my-plugin-admin.gjs
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import DButton from "discourse/components/d-button";
import LoadingSpinner from "discourse/components/loading-spinner";

export default class MyPluginAdmin extends Component {
  @service currentUser;
  @tracked stats = null;
  @tracked isLoading = false;

  @action
  async loadStats() {
    this.isLoading = true;
    try {
      const response = await ajax("/admin/plugins/my-plugin.json");
      this.stats = response.stats;
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isLoading = false;
    }
  }

  <template>
    <div class="my-plugin-admin">
      <h2>My Plugin Admin</h2>
      {{#if this.isLoading}}
        <LoadingSpinner />
      {{else if this.stats}}
        <p>Total users: {{this.stats.total_users}}</p>
        <p>Pending: {{this.stats.pending}}</p>
      {{/if}}
      <DButton @action={{this.loadStats}} @label="my_plugin.admin.load_stats" @disabled={{this.isLoading}} />
    </div>
  </template>
}
```

## AJAX

Always use `discourse/lib/ajax` — handles CSRF tokens, error formatting, session state automatically. Never use raw `fetch`.

```javascript
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

const data = await ajax("/my-plugin/endpoint.json");

const result = await ajax("/my-plugin/action", {
  type: "POST",
  data: { user_id: userId, value: someValue }
});

try {
  await ajax("/my-plugin/action", { type: "DELETE" });
} catch (e) {
  popupAjaxError(e);
}
```

## Security

- Client checks are UX only — backend enforces everything. Client-side auth is trivially bypassed.
- No raw HTML with user content — Glimmer auto-escapes `{{user.bio}}`. Use `{{html-safe post.cooked}}` only for server-sanitized HTML.
- CSP: no inline `<script>`, no `eval`, no `innerHTML`, no external CDN imports.

## Deprecations

```javascript
// DEPRECATED — connector class (shows deprecation warning)
api.registerConnectorClass("outlet-name", "connector-name", { ... });

// DEPRECATED — widget system (being removed 2025/2026)
api.decorateWidget("post:after", (helper) => { ... });
api.createWidget("my-widget", { ... });

// DEPRECATED — raw handlebars (.hbr, .raw.hbs) — breaks Glimmer topic list (default 2025)

// DEPRECATED — classic component
import Component from "@ember/component";  // use @glimmer/component

// DEPRECATED — Ember object mutation
this.set("myProp", value);   // use @tracked + direct assignment
Ember.set(obj, "key", val);
```

## File Naming

```
assets/javascripts/discourse/
├── initializers/my-plugin.js       # apiInitializer — one per feature area
├── components/my-feature.gjs       # kebab-case
└── lib/my-utils.js                 # pure helpers, no Ember dependency

assets/javascripts/admin/
├── components/admin-my-plugin.gjs  # prefix admin components with "admin-"
└── routes/admin-plugins-my-plugin.js
```

## Checklist

- [ ] `.gjs` (not `.hbs`/`.js` pairs) for new components
- [ ] `apiInitializer` entry point, not bare `withPluginApi`
- [ ] `api.renderInOutlet` — not `decorateWidget`
- [ ] `@tracked` only for component-owned state, not derived values
- [ ] Derived values are getters
- [ ] Services via `@service` — not imported singletons
- [ ] AJAX via `discourse/lib/ajax` — not `fetch`
- [ ] Errors via `popupAjaxError`
- [ ] No raw HTML with user-supplied content
- [ ] Backend enforces all authorization

## Quick Reference: Imports

```javascript
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import DButton from "discourse/components/d-button";
import LoadingSpinner from "discourse/components/loading-spinner";
import DModal from "discourse/components/d-modal";
import { i18n } from "discourse-i18n";  // replaces I18n.t()
```

## Reference Files

| File | Load when |
|------|-----------|
| [`references/admin-ui.md`](references/admin-ui.md) | Building admin routes, tables, forms, settings UI |
| [`references/outlets.md`](references/outlets.md) | Finding outlet names, understanding outletArgs context |
