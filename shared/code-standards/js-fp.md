# JavaScript FP — Reference Standard

Merged from ima-claude skills: js-fp, js-fp-api, js-fp-react, js-fp-vue, js-fp-wordpress.
Not a tutorial. Use as a reference for Goose recipes.

---

## Anti-Over-Engineering (PRIMARY RULE)

"Simple > Complex | Evidence > Assumptions"

- Never create custom FP utilities (`pipe`, `compose`, `curry`, custom monads) — use native patterns or established libraries
- Every abstraction costs: learning curve, debug complexity, maintenance burden
- File >500 lines = likely multiple responsibilities — split by cohesion
- Context-appropriate complexity: CLI script != production API

```javascript
// NEVER
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x)

// ALWAYS — native chaining is composition
const processUsers = (users) =>
  users.filter(u => u.active).map(u => ({ ...u, displayName: `${u.firstName} ${u.lastName}` }))
```

---

## Core Patterns

### Purity and Side Effect Isolation

Pure core (business logic) + impure shell (I/O). Shell calls core, never vice versa.

```javascript
// Pure logic — testable without mocks
const calculateTotal = (items) => items.reduce((sum, item) => sum + item.price, 0)

// Side effects isolated
const logAndCalculate = (items, logger) => {
  const total = calculateTotal(items)
  logger.log(`Total: ${total}`)
  return total
}
```

### Composition — No Utilities Needed

```javascript
const validateRequired = (value) => value != null && value !== ''
const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const validateLength = (min, max) => (value) => value.length >= min && value.length <= max

const validateUserEmail = (email) => {
  if (!validateRequired(email)) return { valid: false, error: 'Required' }
  if (!validateEmail(email)) return { valid: false, error: 'Invalid email' }
  if (!validateLength(5, 100)(email)) return { valid: false, error: 'Length' }
  return { valid: true }
}
```

### Dependency Injection via Parameters

```javascript
// Explicit dependencies — signature tells the full story
const saveUser = async (userData, hasher, database) => {
  const hashedPassword = await hasher.hash(userData.password)
  return database.save({ ...userData, password: hashedPassword })
}

// Function factory for repeated use
const createUserService = (hasher, database) => ({
  saveUser: (userData) => saveUser(userData, hasher, database),
  findUser: (id) => database.findById(id)
})
```

### Immutability

```javascript
const updateUserSettings = (user, settings) => ({
  ...user,
  settings: { ...user.settings, ...settings },
  updatedAt: new Date()
})

const addItem = (items, newItem) => [...items, newItem]
const removeItem = (items, id) => items.filter(item => item.id !== id)
const updateItem = (items, id, updates) =>
  items.map(item => item.id === id ? { ...item, ...updates } : item)
```

---

## Native JavaScript Idioms

### Array Methods

```javascript
users.filter(u => u.active).map(u => ({ ...u, role: u.role.toUpperCase() }))

// Avoid reduce for simple aggregations — use dedicated methods
const total = orders.reduce((sum, o) => sum + o.total, 0)   // fine for sums
const names = users.map(u => u.name)                         // map, not reduce
```

### Async/Await with Result Types

Return `{ success, data, error }` — explicit error handling, no hidden control flow.

```javascript
const fetchUserData = async (userId, fetcher) => {
  try {
    const [user, preferences] = await Promise.all([
      fetcher.getUser(userId),
      fetcher.getPreferences(userId)
    ])
    return { success: true, data: { ...user, preferences } }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### Result Types over Exceptions

```javascript
// Returns {success, data, error} — caller decides how to handle
const getUser = async (id) => {
  try {
    const user = await fetchUser(id)
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

---

## Framework Sections

### React

Business logic in custom hooks. Components are pure presentational functions.

```typescript
// Hook encapsulates logic
const useUserLogic = (userData: UserData, config: UserConfig) => {
  const displayData = useMemo(() => ({
    ...userData,
    displayName: userData.name.trim(),
    shouldShowEmail: config.showEmail && userData.email
  }), [userData, config])

  return { displayData }
}

// Pure component with memo
const UserCard = memo<UserCardProps>(({ userData, config }) => {
  const { displayData } = useUserLogic(userData, config)
  return <div className={`user-card--${config.variant}`}><h3>{displayData.displayName}</h3></div>
})
```

HOC for dependency injection:

```typescript
export const withUserService = <P extends object>(
  WrappedComponent: React.ComponentType<P & ServiceDependencies>
) => {
  const WithUserServiceComponent = (props: P) => (
    <WrappedComponent {...props} userService={useUserService()} logger={useLogger()} />
  )
  WithUserServiceComponent.displayName = `withUserService(${WrappedComponent.displayName || WrappedComponent.name})`
  return WithUserServiceComponent
}
```

Memoization rules:
- `memo` — genuinely expensive renders only
- `useMemo` — expensive computations, not simple expressions
- `useCallback` — only when child is memoized

Anti-patterns:

| Avoid | Use Instead |
|-------|-------------|
| `createContext` for 2-component data | Props |
| `useMemo(() => 1 + 1, [])` | Direct computation |
| `useCallback` when child isn't memoized | Plain function |

### Vue 3

Business logic in composables. Wrapper pattern for side effects. Composables over Pinia stores (95% of cases).

```vue
<script setup lang="ts">
const useUserLogic = (userData: Readonly<Ref<UserData>>, config: Readonly<Ref<UserConfig>>) => {
  const displayData = computed(() => ({
    ...userData.value,
    displayName: userData.value.name.trim()
  }))
  return { displayData }
}

const props = defineProps<{ userData: UserData; config: UserConfig }>()
const { displayData } = useUserLogic(readonly(toRef(props, 'userData')), readonly(toRef(props, 'config')))
</script>
```

Wrapper pattern — pure inner component + wrapper handles all I/O:

```vue
<!-- PureComponent.vue: receives data, emits events, no API calls -->
<!-- WrapperComponent.vue: fetches, handles errors, passes to pure -->
<template>
  <PureComponent v-if="user && !loading" :user="user" @update="handleUpdate" />
</template>
```

Reactivity rules:
- `ref` — primitives and simple objects (default)
- `reactive` — complex nested objects only
- `computed` over `watch` for derived state

Anti-patterns:

| Avoid | Use Instead |
|-------|-------------|
| Pinia store for component-scoped state | Composable |
| `watch` for derived values | `computed` |
| Nested `reactive({ a: reactive({}) })` | `ref` + `computed` |

### WordPress / jQuery

jQuery is a core WordPress dependency — 0 additional bytes. "Native patterns > FP utilities" targets custom `pipe`/`curry`, not established libraries like jQuery.

Decision matrix:

| Context | Use |
|---------|-----|
| New isolated component | Vanilla JS |
| AJAX, form submission | jQuery `$.ajax` |
| WordPress plugin integration (GF, ACF) | jQuery (required — GF fires on jQuery only) |
| Animation | CSS transitions |
| Pure business logic | Vanilla JS — no DOM, fully testable |

Pure business logic pattern:

```javascript
(function($) {
  'use strict';

  // PURE — testable without DOM
  function calculatePricing(quantity, unitPrice, discountPercent) {
    var subtotal = Math.max(0, quantity) * Math.max(0, unitPrice);
    var discount = subtotal * (Math.min(100, Math.max(0, discountPercent)) / 100);
    return { subtotal, discountAmount: discount, total: subtotal - discount };
  }

  // IMPURE — DOM wrapper, side effects isolated here
  function PriceCalculator($container) {
    this.$container = $container;
    this.$container.on('change', 'input', this.update.bind(this));
  }

  PriceCalculator.prototype.update = function() {
    var qty = parseInt(this.$container.find('#quantity').val()) || 0;
    this.$container.find('#total').text('$' + calculatePricing(qty, 10, 0).total.toFixed(2));
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculatePricing };
  }
})(jQuery);
```

File organization:

```
plugin-name/assets/js/
├── plugin-base.js      # jQuery — AJAX, GF integration
├── plugin-admin.js     # jQuery — Admin UI
├── plugin-repeater.js  # Vanilla — Isolated component
└── pure/
    ├── formatting.js   # Pure functions (testable)
    └── calculations.js # Pure functions (testable)
```

Anti-patterns:
- Rewriting working jQuery to vanilla for no benefit (YAGNI)
- `document.addEventListener('gform_post_render', ...)` — GF fires on jQuery only
- Mixing jQuery and vanilla selectors in the same scope

### Node.js API

Security-first SQL is mandatory. Middleware DI. Self-contained routes.

**SQL: always parameterized, never string concatenation.**

```javascript
// NEVER — SQL injection risk
const sql = `SELECT * FROM events WHERE domain LIKE '%${domain}%'`

// ALWAYS — {sql, params} pattern
const buildDomainFilter = (domain) => ({
  sql: 'AND from_address LIKE @domain_pattern',
  params: { domain_pattern: `%${domain}%` }
})
```

Route pattern:

```javascript
const validateRequest = (ctx) => {
  const validation = validateDomain(ctx.req.query('domain'))
  if (!validation.valid) { const e = new Error(validation.error); e.status = 400; throw e }
  return { domain: validation.domain }
}

const buildQuery = (env, { domain }) => {
  const filters = buildDomainFilter(domain)
  return { sql: `SELECT * FROM events WHERE 1=1 ${filters.sql}`, params: filters.params }
}

route.get('/', async (c) => {
  try {
    const params = validateRequest(c)
    const { sql, params: qp } = buildQuery(c.env, params)
    const raw = await c.db.queryWithParams(sql, qp)
    return c.json({ success: true, data: raw })
  } catch (error) {
    return c.json({ success: false, error: error.message }, error.status || 500)
  }
})
```

Middleware DI:

```javascript
// middleware/database.js — inject once, available as c.db throughout
export const databaseMiddleware = async (c, next) => {
  c.db = createDatabaseClient(c.env.DATABASE_URL)
  await next()
}
```

Extract to `business/` only if used by 3+ routes AND purely transformational.

Architecture:

```
/api/
├── middleware/      # DI only (database.js, auth.js)
├── shared/          # Only if 3+ routes use it (validators, filters, constants)
├── business/        # Pure functions only — calculations, transformations
└── routes/
    └── [domain]/
        ├── index.js         # Route orchestrator
        └── [endpoint].js   # 300–500 lines MAX
```

---

## Testing

Pure functions enable systematic edge case coverage with no mocks.

```javascript
// Table-driven — covers valid, edge, and invalid cases
describe('calculateDiscount', () => {
  const cases = [[100, 0.1, 10], [50, 0.2, 10], [0, 0.1, 0]]
  cases.forEach(([price, rate, expected]) =>
    it(`${rate * 100}% on ${price} = ${expected}`, () =>
      expect(calculateDiscount(price, rate)).toBe(expected)))

  [null, undefined, NaN, '100'].forEach(input =>
    it(`handles ${typeof input} gracefully`, () => {
      expect(() => calculateDiscount(input, 0.1)).not.toThrow()
      expect(calculateDiscount(input, 0.1)).toBe(0)
    }))
})
```

React hooks:

```typescript
import { renderHook } from '@testing-library/react-hooks'

it('processes user data correctly', () => {
  const { result } = renderHook(() =>
    useUserLogic({ id: '1', name: '  John  ', email: 'john@test.com' }, { showEmail: true, variant: 'compact' })
  )
  expect(result.current.displayData.displayName).toBe('John')
})
```

Node API routes — inject mock dependencies:

```javascript
const mockDb = { queryWithParams: jest.fn().mockResolvedValue([{ id: 1, total: 100 }]) }
const res = await app.request('/orders', { method: 'GET' }, { db: mockDb })
expect(res.status).toBe(200)
```

---

## Quality Checklist

Before merging any JavaScript:

- [ ] Pure? — business logic separated from side effects
- [ ] Native patterns? — no custom pipe/compose/curry utilities
- [ ] Simplified? — prefer simple over clever, evidence-based complexity
- [ ] Testable? — pure functions, injectable dependencies
- [ ] Immutable? — no direct state mutation
- [ ] Context-appropriate? — CLI != production service
- [ ] Result types? — `{ success, data, error }` not thrown exceptions for expected failures

Node API extras:
- [ ] SQL uses `{sql, params}`, no string concatenation
- [ ] Route <500 lines
- [ ] Dependencies via middleware (`c.db`, `c.logger`), not per-request instantiation
- [ ] `business/` extraction only for 3+ route reuse

React extras:
- [ ] Business logic in custom hook, not component body
- [ ] Dependencies injected via HOC
- [ ] `memo`/`useMemo`/`useCallback` only with evidence of need

Vue extras:
- [ ] Business logic in composable, not component
- [ ] Side effects isolated to wrapper component
- [ ] `computed` over `watch` for derived state
- [ ] Composable instead of store (unless truly global)

WordPress extras:
- [ ] jQuery for plugin integration, vanilla for isolated components
- [ ] One approach per file — no mixing
- [ ] Pure business logic in `pure/` directory, testable without DOM
