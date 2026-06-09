# EspoCRM WHERE Filter Operators

Complete reference for the `where` array filter objects used in list/search requests.

Each filter: `{"type": "...", "attribute": "...", "value": "..."}`

## Equality & Comparison

| Type | Value | Example |
|---|---|---|
| `equals` | any | `{"type": "equals", "attribute": "status", "value": "New"}` |
| `notEquals` | any | `{"type": "notEquals", "attribute": "status", "value": "Canceled"}` |
| `greaterThan` | number/date | `{"type": "greaterThan", "attribute": "amount", "value": 1000}` |
| `lessThan` | number/date | `{"type": "lessThan", "attribute": "amount", "value": 5000}` |
| `greaterThanOrEquals` | number/date | `{"type": "greaterThanOrEquals", "attribute": "probability", "value": 50}` |
| `lessThanOrEquals` | number/date | `{"type": "lessThanOrEquals", "attribute": "probability", "value": 100}` |

## Null & Boolean

| Type | Notes |
|---|---|
| `isNull` | No `value` needed |
| `isNotNull` | No `value` needed |
| `isTrue` | Boolean field check |
| `isFalse` | Boolean field check |

## String Matching

| Type | Value | Behavior |
|---|---|---|
| `contains` | string | `%value%` |
| `notContains` | string | NOT `%value%` |
| `startsWith` | string | `value%` |
| `endsWith` | string | `%value` |
| `like` | string | Raw LIKE pattern (use `%` wildcards) |
| `notLike` | string | Raw NOT LIKE pattern |

## Set Membership

| Type | Value |
|---|---|
| `in` | array of strings/numbers: `["New", "Assigned"]` |
| `notIn` | array of strings/numbers: `["Canceled", "Recycled"]` |

## Relationship Filters

| Type | Value | Notes |
|---|---|---|
| `linkedWith` | array of IDs | Records linked to ANY of the given IDs |
| `notLinkedWith` | array of IDs | Records NOT linked to any of the given IDs |
| `isLinked` | — | Has at least one linked record |
| `isNotLinked` | — | Has no linked records |

## Date/Time Helpers

No `value` needed unless noted:

| Type | Notes |
|---|---|
| `today` | |
| `past` | |
| `future` | |
| `lastSevenDays` | |
| `currentMonth` | |
| `lastMonth` | |
| `currentQuarter` | |
| `currentYear` | |
| `lastXDays` | `value`: number of days |
| `nextXDays` | `value`: number of days |
| `between` | `value`: `["YYYY-MM-DD", "YYYY-MM-DD"]` |

## Logical Combinators

Multiple items in the `where` array are implicitly **ANDed**.

For OR logic, wrap in a combinator:
```json
{"type": "or", "value": [
  {"type": "equals", "attribute": "status", "value": "New"},
  {"type": "equals", "attribute": "status", "value": "Assigned"}
]}
```

Combinators nest: `and` and `or` can contain other combinators.
