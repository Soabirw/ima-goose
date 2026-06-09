---
name: "espocrm-api"
description: >-
  EspoCRM v9.x REST API patterns — authentication (API Key, HMAC), CRUD operations,
  JSON WHERE filtering, relationship management, webhooks, mass operations, error
  handling, and performance. Official PHP client and Node.js patterns. Use when:
  calling EspoCRM API, building CRM integrations, querying CRM data, managing
  webhooks, bulk CRM operations. Triggers on: EspoCRM API, CRM endpoint, CRM
  query, CRM webhook, CRM filter, espo api, api/v1, X-Api-Key, HMAC auth,
  entity CRUD.
---

# EspoCRM REST API (v9.x)

**Base URL**: `https://{your-site}/api/v1/`  **Content-Type**: `application/json`
**Parent skill**: `espocrm` | **Companion skills**: `php-fp`, `js-fp-api` | **Live docs**: Context7 `/espocrm/documentation`

---

## Authentication

| Context | Method |
|---|---|
| Dev/testing, internal scripts | API Key |
| Production integrations | HMAC |
| Frontend SPA, session flows | Token auth |
| Never | Basic auth with plaintext password |

### API Key
Create API User at Administration > API Users, auth method "API Key", assign Role.
```
X-Api-Key: {key_from_api_user_detail_view}
```

### HMAC (Production)
Create API User with "HMAC" auth. Both API Key and Secret Key generated.
```
X-Hmac-Authorization: base64(apiKey + ':' + hmacSha256(METHOD + ' /' + uri, secretKey))
```
`METHOD` = uppercase verb; `uri` = path after `/api/v1/`.

```php
$hash = hash_hmac('sha256', $method . ' /' . $uri, $secretKey);
$header = base64_encode($apiKey . ':' . $hash);
```

```javascript
import { createHmac } from 'node:crypto';
const hash = createHmac('sha256', secretKey).update(`${method} /${uri}`).digest('hex');
const header = Buffer.from(`${apiKey}:${hash}`).toString('base64');
```

### Token Auth (Session only)
```
Espo-Authorization: base64(username + ':' + token)
```
Obtain token via `GET App/user`. Never use for server-to-server.

---

## CRUD Operations

Replace `{Entity}` with type name (Account, Contact, Lead, custom, etc.).

| Operation | Method | Path |
|---|---|---|
| List | GET | `{Entity}` |
| Read | GET | `{Entity}/{id}` |
| Create | POST | `{Entity}` |
| Update | PUT | `{Entity}/{id}` |
| Delete | DELETE | `{Entity}/{id}` |
| List related | GET | `{Entity}/{id}/{link}` |
| Link | POST | `{Entity}/{id}/{link}` |
| Unlink | DELETE | `{Entity}/{id}/{link}` |
| Mass update | POST | `{Entity}/action/massUpdate` |
| Mass delete | POST | `{Entity}/action/massDelete` |
| Stream/notes | GET | `{Entity}/{id}/stream` |
| Webhook CRUD | POST/DELETE | `Webhook` / `Webhook/{id}` |
| Auth token | GET | `App/user` |
| Attachment up | POST | `Attachment` |
| Attachment down | GET | `Attachment/file/{id}` |
| OpenAPI spec | GET | `OpenApi` |

- List returns `{"list": [...], "total": N}`. Total `-1` = more exist (paginate), `-2` = count disabled.
- Create: add `X-Skip-Duplicate-Check: true` to bypass dupe detection.
- Update: send only changed fields. Returns full record.
- Delete: returns `true`.

---

## Filtering & Search

Params as query params or JSON-encoded `searchParams` param.

| Param | Type | Purpose |
|---|---|---|
| `select` | string | Comma-separated fields: `id,name,status` |
| `maxSize` | int | Records per page (max 200) |
| `offset` | int | Pagination offset |
| `orderBy` | string | Sort field |
| `order` | string | `asc` or `desc` |
| `where` | array | Filter conditions |
| `primaryFilter` | string | Named server-side filter (`open`, `onlyMy`, etc.) |
| `boolFilterList` | array | `["onlyMy", "followed"]` |

v9.0+ aliases (WAF-safe): `attributeSelect` for `select`, `whereGroup` for `where`.

### WHERE Operators

Each filter: `{"type": "...", "attribute": "...", "value": "..."}`. Multiple items ANDed. Use `{"type": "or", "value": [...]}` for OR.

- **Equality**: `equals`, `notEquals`
- **Comparison**: `greaterThan`, `lessThan`, `greaterThanOrEquals`, `lessThanOrEquals`
- **Null**: `isNull`, `isNotNull`
- **Boolean**: `isTrue`, `isFalse`
- **String**: `contains`, `notContains`, `startsWith`, `endsWith`, `like`, `notLike`
- **Set**: `in`, `notIn`
- **Relationship**: `linkedWith`, `notLinkedWith`, `isLinked`, `isNotLinked`
- **Date**: `today`, `past`, `future`, `lastSevenDays`, `currentMonth`, `lastMonth`, `currentYear`, `between`, `lastXDays`, `nextXDays`
- **Logical**: `or`, `and`

Full reference with examples: `references/where-operators.md`

---

## Relationships

Link names visible at Administration > Entity Manager > {Entity} > Relationships (4th column).

```
GET Account/{id}/contacts?select=id,name,emailAddress&maxSize=50
POST Account/{id}/contacts        {"id": "contactId"}
POST Account/{id}/contacts        {"ids": ["id1", "id2"]}
POST Account/{id}/contacts        {"massRelate": true, "where": [...]}
DELETE Account/{id}/contacts      {"id": "contactId"}
DELETE Account/{id}/contacts      {"ids": ["id1", "id2"]}
```

---

## Webhooks

### Register
```
POST Webhook
{"event": "Contact.create", "url": "https://your-server.com/hook"}
```
Returns `{"id": "webhookId", "secretKey": "generatedKey"}`. Save both.

### Event Types
- `{Entity}.create` — all attributes in payload
- `{Entity}.update` — only changed attributes
- `{Entity}.delete` — ID only
- `{Entity}.fieldUpdate.{field}` — specific field changed

Payload is always an array: `[{"id": "abc123", ...}]`

### Signature Verification
`Signature` header = `base64(webhookId + ':' + hmacSha256(rawBody, secretKey))`.
```php
$expected = base64_encode($webhookId . ':' . hash_hmac('sha256', $rawBody, $secretKey));
$valid = hash_equals($expected, $_SERVER['HTTP_SIGNATURE']);
```

### Lifecycle
Processed by "Process Webhook Queue" scheduled job (default 5 min). Failed deliveries retried; persistent failures deactivate webhook. Add internal URLs to `webhookAllowedAddressList` in `data/config.php`.

---

## Mass Operations

### Mass Update / Delete
```
POST Lead/action/massUpdate
POST Lead/action/massDelete
```
By IDs: `{"ids": ["id1", "id2"], "data": {"status": "Assigned"}}`
By filter: `{"where": [...], "data": {"status": "Assigned"}}`

No native batch create — loop individual POSTs, use Administration > Import for CSV, or write custom API action for high volume.

**Note**: API Before-Save Scripts (Formula) are NOT executed during mass update.

---

## Error Handling

| Code | Meaning | Action |
|---|---|---|
| 200 | Success | — |
| 400 | Bad Request | Check required fields, validation |
| 401 | Unauthorized | Check auth headers/credentials |
| 403 | Forbidden | Check API User role/ACL |
| 404 | Not Found | Record missing or no read access |
| 409 | Conflict | Duplicate or record locked |
| 500 | Server Error | Check `data/log` on server |

Error reason in `X-Status-Reason` response header. Duplicate 409 body: `{"reason": "Duplicate", "data": {"idList": ["existingId1"]}}`. Bypass with `X-Skip-Duplicate-Check: true`.

---

## Performance

1. `?select=id,name,status` — load only needed fields
2. `X-No-Total: true` header — skip COUNT query on lists
3. Paginate with `offset` + `maxSize` (keep at 50–100)
4. Use `primaryFilter` — server-optimized, faster than complex WHERE
5. Dedicated API users with minimal scopes only
6. No native rate limiter — implement at reverse proxy (nginx/Apache)
7. `GET OpenApi` — full schema for your instance incl. custom entities (v9.3+, admin)

---

## Client Libraries

### PHP (Official)
```
composer require espocrm/php-espo-api-client
```
`Espo\ApiClient\Client` — constructor takes base URL. Auth via `setApiKey()` / `setApiKey()` + `setSecretKey()` for HMAC. All requests: `$client->request(METHOD, path, params, payload)`.

### Node.js
No official npm package. Build thin client around `fetch`:
- Base URL + `/api/v1/` prefix, `X-Api-Key` or per-request HMAC, `Content-Type: application/json`
- JSON-encode `searchParams` as query param; extract errors from `X-Status-Reason` header

---

## Field Types

| Field Type | JSON Type | Example |
|---|---|---|
| varchar, text | string | `"name": "Test"` |
| int, float | number | `"quantity": 5`, `"rate": 4.5` |
| boolean | boolean | `"isActive": true` |
| enum | string | `"status": "New"` |
| multiEnum | string[] | `"tags": ["A", "B"]` |
| date | string | `"closeDate": "2025-06-15"` |
| datetime | string (UTC) | `"createdAt": "2025-06-15 14:30:00"` |
| currency | number + string | `"amount": 1000, "amountCurrency": "USD"` |
| link | string (ID) | `"accountId": "someId"` |
| linkMultiple | string[] + object | `"teamsIds": ["id1"], "teamsNames": {"id1": "Sales"}` |
| email, phone | string | `"emailAddress": "test@example.com"` |
| address | multiple fields | `"billingAddressStreet": "123 Main", "billingAddressCity": "NYC"` |
| file | string (ID) | `"fileId": "attachmentId"` |

All datetimes UTC. Date: `YYYY-MM-DD`. Datetime: `YYYY-MM-DD HH:mm:ss`.
