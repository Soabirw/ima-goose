# Security Guardrails

Consolidated from behavioral checks. Apply to ALL coding work.

## WordPress PHP Security (5 checks — NON-NEGOTIABLE)

After EVERY PHP file edit, verify:

1. **AJAX handlers have nonce + capability checks**
   - `wp_verify_nonce()` or `check_ajax_referer()` before processing
   - `current_user_can()` to restrict access
   
2. **All $wpdb queries use ->prepare()**
   - Never interpolate variables into SQL strings
   - `$wpdb->prepare("SELECT * FROM {$wpdb->posts} WHERE ID = %d", $id)`

3. **All user input is sanitized**
   - `sanitize_text_field()`, `absint()`, `sanitize_email()`, `wp_kses()`
   - Never use raw `$_POST`, `$_GET`, `$_REQUEST` values

4. **All output is escaped**
   - `esc_html()` for text content
   - `esc_attr()` for HTML attributes
   - `esc_url()` for URLs
   - `wp_kses()` for rich HTML

5. **declare(strict_types=1) present**
   - Add after opening `<?php` tag in every file

### WordPress Additional Rules
- Cross-plugin calls: use `do_action()`/`apply_filters()` hooks, NOT `function_exists()`
- jQuery IS native in WordPress (0 additional bytes) — use for DOM work

## JavaScript/TypeScript SQL Security

- **Never** use template literals with SQL keywords: `` `SELECT * FROM users WHERE id = ${userId}` ``
- **Always** use parameterized queries: `{ sql: 'SELECT * FROM users WHERE id = ?', params: [userId] }`
- Applies to: `.js`, `.ts`, `.mjs`, `.mts` files

## FP Utility Prevention

Never create custom FP utilities in any language:
- No custom `pipe()` or `compose()` backed by reduce
- No custom `curry()` definitions
- No custom monad classes (`Maybe`, `Either`, `Result`, `Option`)
- Use native language patterns: chained methods, intermediate variables, early returns, null coalescing, optional chaining

## Bootstrap Utility-First CSS

When Bootstrap 5 is available:
- Use utility classes instead of inline styles
- `style="margin-top: 16px"` -> `class="mt-3"`
- `style="display: flex"` -> `class="d-flex"`
- `style="text-align: center"` -> `class="text-center"`
- `style="font-weight: bold"` -> `class="fw-bold"`
