# PHP FP Standards

Reference for Goose recipes. Covers core PHP FP patterns + WordPress security integration.

---

## Anti-Over-Engineering

- Never create custom FP utilities (`pipe`, `compose`, `curry`). Use established libraries (Carbon, Collections) or native patterns.
- Every abstraction costs: learning curve, debugging, maintenance.
- File size smell: >500 lines = likely multiple responsibilities. Split by cohesion.
- Match complexity to context: CLI script != production service.

4-question check before abstracting:
1. Can this be pure? — separate business logic from side effects
2. Can this use native patterns? — avoid custom FP utilities
3. Can this be simplified? — simple > complex
4. Is this complexity justified? — evidence required

---

## Core Patterns

### Purity + Side Effect Isolation

Pure core receives everything as parameters. Impure shell calls core, never vice versa.

```php
<?php
declare(strict_types=1);

function calculateTotal(array $items): float {
    return array_reduce($items, fn($sum, $item) => $sum + $item['price'], 0.0);
}

function logAndCalculate(array $items, LoggerInterface $logger): float {
    $total = calculateTotal($items);
    $logger->info("Total: {$total}");
    return $total;
}
```

### Composition Over Inheritance

Small, focused functions composed at call sites. No base classes.

```php
<?php
function validateUserEmail(string $email): array {
    if (!validateRequired($email)) return ['valid' => false, 'error' => 'Required'];
    if (!validateEmail($email))    return ['valid' => false, 'error' => 'Invalid email'];
    if (!validateLength(5, 100)($email)) return ['valid' => false, 'error' => 'Length'];
    return ['valid' => true];
}
```

### Dependency Injection

Functions receive dependencies as parameters. No globals, no hidden state. Signature tells the full story.

```php
<?php
function saveUser(array $userData, PasswordHasherInterface $hasher, DatabaseInterface $db): array {
    return $db->save([
        'name'     => $userData['name'],
        'password' => $hasher->hash($userData['password']),
    ]);
}
```

### Immutability

Never mutate. Return new arrays with spread operator.

```php
<?php
function updateUserSettings(array $user, array $settings): array {
    return [...$user, 'settings' => array_merge($user['settings'] ?? [], $settings), 'updated_at' => time()];
}

function updateItem(array $items, int $id, array $updates): array {
    return array_map(fn($i) => $i['id'] === $id ? [...$i, ...$updates] : $i, $items);
}
```

### Result Type Pattern

Return `['success' => bool, 'data' => ..., 'error' => ...]`. No exceptions for expected failures.

```php
<?php
function divide(float $a, float $b): array {
    return $b === 0.0
        ? ['success' => false, 'error' => 'Division by zero']
        : ['success' => true, 'data' => $a / $b];
}

// Chain with early return
function calculate(float $a, float $b, float $c): array {
    $r = divide($a, $b);
    if (!$r['success']) return $r;
    return divide($r['data'], $c);
}
```

---

## PHP-Specific

### Strict Types (MANDATORY)

Every file: `declare(strict_types=1);` at top.

### Native Array Functions

Prefer `array_map`, `array_filter`, `array_reduce` over imperative loops.

```php
<?php
function processUsers(array $users): array {
    return array_slice(
        array_map(
            fn($u) => [...$u, 'display_name' => "{$u['first_name']} {$u['last_name']}"],
            array_filter($users, fn($u) => $u['active'])
        ),
        0, 10
    );
}
```

### `match` Over `switch` (PHP 8.0+)

```php
<?php
function getTierDiscount(string $tier): float {
    return match($tier) {
        'bronze'   => 0.05,
        'silver'   => 0.10,
        'gold'     => 0.15,
        'platinum' => 0.20,
        default    => 0.0,
    };
}
```

### Union Types (PHP 8.0+)

```php
<?php
function processResult(array|false $result): array {
    return $result === false
        ? ['success' => false, 'error' => 'Not found']
        : ['success' => true, 'data' => $result];
}
```

---

## WordPress

### 5 Non-Negotiable Security Practices

| Practice | Rule |
|----------|------|
| Capability checks | `current_user_can()` before ANY privileged operation |
| Nonce verification | `wp_verify_nonce()` / `check_ajax_referer()` on ALL form/AJAX submissions |
| Input sanitization | Sanitize ALL user input by type (see table below) |
| Output escaping | Escape ALL output by context (see table below) |
| Prepared statements | `$wpdb->prepare()` for ALL queries |

**Sanitization (input)**:

| Function | Use For |
|----------|---------|
| `sanitize_text_field()` | Plain text |
| `sanitize_email()` | Email addresses |
| `absint()` | Positive integers |
| `wp_kses_post()` | HTML content |
| `esc_url_raw()` | URLs (storage) |

**Escaping (output)**:

| Function | Context |
|----------|---------|
| `esc_html()` | HTML body |
| `esc_attr()` | HTML attributes |
| `esc_url()` | URLs in href/src |
| `wp_json_encode()` | JavaScript data |

Minimal secure AJAX handler:

```php
<?php
add_action('wp_ajax_my_action', function() {
    if (!current_user_can('edit_posts')) {
        wp_send_json_error('Unauthorized', 403);
    }

    check_ajax_referer('my_action_nonce', 'nonce');

    $id   = absint($_POST['id']);
    $name = sanitize_text_field($_POST['name']);

    global $wpdb;
    $result = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}my_table WHERE id = %d",
        $id
    ));

    wp_send_json_success(['name' => esc_html($result->name)]);
});
```

### Pure Logic + WordPress Wrapper Pattern

Separate business logic (zero WP dependencies, fully testable) from WP integration (hooks, security).

```php
<?php
// PURE — no WordPress dependencies
namespace MyPlugin\Pure;

function calculate_discount(float $price, string $tier): float {
    $rates = ['bronze' => 0.05, 'silver' => 0.10, 'gold' => 0.15];
    return round($price * (1 - ($rates[$tier] ?? 0)), 2);
}

// WRAPPER — WordPress integration with security
namespace MyPlugin;

add_filter('product_price', function($price) {
    if (!is_user_logged_in()) return $price;
    $tier = get_user_meta(get_current_user_id(), 'tier', true);
    return Pure\calculate_discount($price, $tier);
});
```

### Hooks Over `function_exists` for Inter-Plugin Communication

ALL cross-plugin calls use WordPress hooks. Never `function_exists()` — tight coupling disguised as loose coupling.

```php
<?php
// BAD — tight coupling, breaks silently on rename
if (function_exists('ima_discourse_refresh_user_meta')) {
    ima_discourse_refresh_user_meta($user_id);
}

// GOOD — fire-and-forget side effect
do_action('ima_discourse_refresh_user_meta', $user_id);

// GOOD — data transformation with safe default
$result = apply_filters('ima_membership_cancel_subscription', ['success' => true], $user_id, $sub_id);
```

`function_exists()` is acceptable only for internal guards within a single plugin or checking PHP extensions.

- **Actions** (`do_action`): side effects — "something happened, react if you care"
- **Filters** (`apply_filters`): data transformation — chained composition with default return

### Plugin Organization

| Size | Lines | Pattern |
|------|-------|---------|
| Simple | <500 | Namespaced functions |
| Medium | 500–2000 | Classes + pure functions |
| Complex | 2000+ | DI container + services |

```
my-plugin/
├── my-plugin.php              # Bootstrap
├── includes/
│   └── functions.php          # Pure business logic
├── admin/
│   └── ajax-handlers.php      # WordPress integration
└── tests/
    ├── unit/                  # Pure function tests (fast)
    └── integration/           # WordPress tests
```

---

## Testing

Pure functions enable systematic edge-case coverage without mocks.

```php
<?php
use PHPUnit\Framework\TestCase;

class CalculatorTest extends TestCase {
    /** @dataProvider discountProvider */
    public function testCalculateDiscount(float $price, float $rate, float $expected): void {
        $this->assertEquals($expected, calculateDiscount($price, $rate));
    }

    public function discountProvider(): array {
        return [
            'standard' => [100.0, 0.1, 90.0],
            'zero'     => [100.0, 0.0, 100.0],
            'full'     => [100.0, 1.0, 0.0],
        ];
    }
}
```

Unit tests target `includes/functions.php` (pure logic, no WP bootstrap needed).
Integration tests target AJAX handlers and hook callbacks.

---

## Quality Checklist

- [ ] `declare(strict_types=1)` at top of every file
- [ ] Business logic in pure functions (zero WP dependencies)
- [ ] WP wrappers handle security, pure functions handle logic
- [ ] No custom FP utilities (pipe/compose/curry)
- [ ] Immutable array operations (spread, not mutation)
- [ ] Result type for expected failures, not exceptions
- [ ] Capability check on every privileged operation
- [ ] Nonce on every form/AJAX submission
- [ ] All input sanitized by type
- [ ] All output escaped by context
- [ ] All queries use `$wpdb->prepare()`
- [ ] Cross-plugin calls use hooks, not `function_exists()`
- [ ] Pure functions have unit tests with data providers
