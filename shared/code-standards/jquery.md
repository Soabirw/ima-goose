# jQuery — FP-Aligned Patterns (WordPress)

**Key insight: jQuery IS native in WordPress — 0 additional bytes. Reach for it first.**

Agents default to verbose vanilla JS even when jQuery is loaded. `$('.foo').on('click', fn)` beats `document.querySelectorAll('.foo').forEach(el => el.addEventListener('click', fn))` every time in WordPress context.

---

## Decision Tree

```
Writing browser JS in WordPress?
├── YES: Touches DOM (select, manipulate, events, AJAX)?
│   ├── YES → Use jQuery (default)
│   │   Exception: Pure business logic → vanilla JS, extracted to pure function
│   └── NO (pure data transforms) → Vanilla JS
├── jQuery already loaded (non-WP)?
│   ├── YES → Use jQuery for DOM work
│   └── NO → See js-fp
└── No WordPress context → See js-fp
```

**Use jQuery:** WordPress theme/plugin JS, Bootstrap component interaction, Gravity Forms/ACF, `admin-ajax.php`, event delegation on dynamic content.

**Use vanilla JS:** Pure business logic (extracted functions), isolated ES module, Node.js, React/Vue internals.

---

## jQuery + FP: Compatible

### Chaining IS Composition

```javascript
$('.user-card')
    .filter('.active')
    .find('.username')
    .addClass('highlighted')
    .text(function(i, text) { return text.toUpperCase(); });
// No custom pipe() needed
```

### Pure Logic Extraction

```javascript
(function($) {
    'use strict';

    // PURE: no DOM, fully testable
    function calculateShipping(weight, zone) {
        var rates = { domestic: 0.5, international: 1.2 };
        return Math.max(0, weight) * (rates[zone] || rates.domestic);
    }

    function formatPrice(amount) { return '$' + Math.max(0, amount).toFixed(2); }

    // IMPURE: DOM wrapper around pure core
    function ShippingCalculator($container) {
        this.$container = $container;
        this.$container.on('change', 'select, input', this.update.bind(this));
    }

    ShippingCalculator.prototype.update = function() {
        var weight = parseFloat(this.$container.find('[name="weight"]').val()) || 0;
        var zone   = this.$container.find('[name="zone"]').val();
        this.$container.find('.shipping-cost').text(formatPrice(calculateShipping(weight, zone)));
    };

    $('.shipping-calculator').each(function() { new ShippingCalculator($(this)); });

    // Export pure logic for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { calculateShipping, formatPrice };
    }
})(jQuery);
```

---

## Quick Reference

### IIFE Wrapper (WordPress Standard)

```javascript
(function($) {
    'use strict';
    // All jQuery code here — $ aliased safely
})(jQuery);

// Document ready shorthand
jQuery(function($) { /* DOM ready */ });
```

### Selectors and Traversal

```javascript
$('.class')                    // By class
$('#id')                       // By ID
$('[data-action="delete"]')    // By attribute
$('input[type="text"]')        // Attribute + type

$('.item').closest('.container')  // Up: nearest ancestor
          .find('.target')        // Down: all descendants
          .siblings('.active')    // Sideways: siblings
          .parent()               // Up: direct parent
          .children('.row')       // Down: direct children
          .filter('.visible')
          .not('.disabled')
          .eq(2)                  // By index

var $form = $('#my-form');
$form.find('.field')           // Scoped selection — efficient
```

### DOM Manipulation

```javascript
// Classes
$el.addClass('active') / $el.removeClass('loading') / $el.toggleClass('visible')
$el.hasClass('hidden')          // → boolean

// Content
$el.text('Plain text')          // Safe — escapes HTML
$el.html('<strong>Markup</strong>')
$el.val() / $el.val('new value')

// Attributes / Data
$el.attr('href') / $el.attr('href', '/new')
$el.prop('checked', true)       // Checkboxes, disabled, selected
$el.data('user-id')             // Parsed, cached data-* value
$el.removeAttr('disabled')

// Insertion
$container.append($el) / $container.prepend($el)
$el.after($sibling) / $el.before($sibling)
$el.remove() / $el.empty() / $el.clone()

// CSS / Visibility
$el.css({ color: 'red', fontSize: '14px' })
$el.show() / $el.hide() / $el.toggle()
```

### Events

```javascript
$el.on('click', handler)                       // Direct binding
$container.on('click', '.child', handler)       // Delegated — works on dynamic content
$el.off('click', handler) / $el.off('click')

$el.on('click.myPlugin', handler)              // Namespaced — clean removal
$el.off('.myPlugin')

$el.one('click', handler)                      // Fires once, auto-unbinds
```

### AJAX (WordPress)

```javascript
$.ajax({
    url: myVars.ajaxUrl,
    type: 'POST',
    data: { action: 'my_action', nonce: myVars.nonce, id: itemId },
    success: function(response) {
        if (response.success) { /* response.data */ }
    },
    error: function(xhr, status, error) { console.error('AJAX failed:', error); }
});

// Promise-style
$.ajax({ url: myVars.ajaxUrl, dataType: 'json' })
    .done(function(data) { })
    .fail(function(xhr) { })
    .always(function() { });
```

Always verify nonces server-side: `check_ajax_referer('my_action', 'nonce')`.

---

## FP Alignment Patterns

### Cache Selections

```javascript
// Cache, then chain
var $el = $('.my-element');
$el.addClass('active').find('.child').show();

// Chain with .end() to avoid re-querying
$('.my-element')
    .addClass('active')
    .find('.child').show()
    .end()
    .data('loaded', true);
```

### Delegated Events for Dynamic Content

```javascript
// BAD: won't fire on dynamically added elements
$('.delete-btn').on('click', handleDelete);

// GOOD: fires for current and future elements
$('.item-list').on('click', '.delete-btn', handleDelete);
```

### $.map / $.grep Are Declarative

```javascript
// For jQuery collections
var admins = $.grep(users, function(user) { return user.role === 'admin'; });

// For plain arrays — use native
var activeNames = users.filter(u => u.active).map(u => u.name);
```

---

## Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `querySelectorAll` + `forEach` in WordPress | `$('.selector').each()` |
| Mixing jQuery and vanilla in same file | Pick one per file |
| `$(this)` re-queried inside loops | `var $this = $(this)` cached once |
| `$('.selector')` inside loops | Cache selection outside loop |
| Direct binding on dynamic elements | Delegated `.on(parent, child, fn)` |
| Custom `pipe()` / `compose()` | jQuery chaining IS composition |
| Deprecated `$.isArray` / `$.type` | `Array.isArray()` / `typeof` |

---

## WordPress Coding Standards

- Tabs for indentation (not spaces)
- IIFE with `jQuery` passed as `$`
- `'use strict'` inside IIFE
- Spaces inside parens in control structures: `if ( condition )`
- `var` at top of scope unless using ES6+ build tools

---

## Utilities

```javascript
$.each(array, function(index, value) { });
$.each(object, function(key, value) { });

var merged = $.extend(true, {}, defaults, options);  // deep merge
var data = $form.serialize();                         // URL-encoded string
```
