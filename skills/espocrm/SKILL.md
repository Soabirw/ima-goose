---
name: "espocrm"
description: >-
  EspoCRM skill family router. Detects intent (API calls, extension development,
  UI customization) and routes to the appropriate child skill. Provides shared
  context: v9.x target, entity-based REST architecture, Salesforce mental model
  mapping. Use when: any EspoCRM work, CRM integration, CRM API, EspoCRM
  customization. Triggers on: EspoCRM, Espo, CRM API, CRM integration, CRM
  entity, CRM webhook, CRM hook.
---

# EspoCRM - Skill Family Router

**Target**: v9.x (9.0+) | **Architecture**: Entity-based REST API, PHP backend, Backbone.js frontend

## Decision Tree

```
What are you doing with EspoCRM?
├── REST API calls (external integration)?
│   → espocrm-api + php-fp or js-fp-api
│
├── PHP extension development (hooks, services, custom entities)?
│   → espocrm-extensions (Phase 2) + php-fp
│
├── Frontend/UI customization (views, fields, layouts)?
│   → espocrm-ui (Phase 3)
│
└── Not sure / mixed?
    → Start with espocrm-api, route to extension/UI once scope is clear
```

## Shared Context

Every Entity Type (Account, Contact, Lead, Opportunity, custom) gets automatic REST endpoints. Custom entities via Entity Manager are immediately API-accessible.

### Salesforce Mapping

| Salesforce | EspoCRM |
|---|---|
| sObject | Entity Type |
| Connected App + OAuth | API User + API Key |
| SOQL | WHERE JSON filters + select/orderBy params |
| SOSL | Text filter on list endpoint |
| Apex Trigger | PHP Hook (beforeSave, afterSave) |
| Apex REST endpoint | Custom API Action (Controller + routes.json) |
| LWC / Visualforce | Custom Views (JS, extending base views) |
| Platform Events / CDC | Webhooks ({Entity}.create, .update, .delete) |
| Bulk API 2.0 | No equivalent (loop individual calls or use Import) |
| Governor Limits | None (self-hosted) |
| AppExchange | EspoCRM Extensions marketplace |

### Key Differences from Salesforce

- No SOQL — structured JSON WHERE filters
- No Bulk API — mass ops (massUpdate, massDelete) but no batch create
- No Composite API — one request per operation
- No governor limits
- Simpler auth — API Key in one header
- Metadata is JSON files — changes take effect on cache clear

**Docs**: Use Context7 `resolve-library-id("espocrm")` → `/espocrm/documentation`

## Child Skill Status

| Skill | Status | Covers |
|---|---|---|
| `espocrm-api` | Active | REST API, auth, CRUD, filtering, webhooks, mass ops |
| `espocrm-extensions` | Planned | PHP hooks, services, ORM, custom entities, modules |
| `espocrm-ui` | Planned | JS views, fields, Espo.Ajax, Backbone, Handlebars |
