# IMA Brand Guidelines

Brand Book v4.0 (September 2025) — Independent Medical Alliance.

## Color Palette

| Name | Hex | Usage | Bootstrap/SCSS |
|------|-----|-------|---------------|
| Trustworthy Indigo | `#00066F` | Primary brand, headers, trust | `$ima-brand-primary` / `.text-primary` |
| Aquatic Pulse | `#00B8B8` | CTAs, buttons, links | `$ima-brand-secondary` / `.text-secondary` |
| Accessible Teal | `#007BB4` | Hover states, WCAG | — |
| Guidance Sky | `#A2CFF0` | Light accents, backgrounds | `$ima-brand-sky` |
| Vital Gold | `#FFCC00` | Warnings, attention | `$ima-brand-gold` / `.text-warning` |
| Red Ribbon | `#DD153B` | Urgency, errors | `$ima-brand-red` / `.text-danger` |
| Plum Velvet | `#7B024D` | Accent, distinction | — |
| Calm Stone | `#919396` | Secondary text, labels | — |
| Clarity Wash | `#F2F3F5` | Backgrounds, cards | `$ima-brand-gray-light` / `.bg-light` |
| Soft Mist | `#EDF3F4` | Light blue-gray backgrounds | — |
| Brand Gradient | `150deg, #00066F -> #00B8B8` | Hero sections, overlays | `@include ima-gradient-bg` |

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page headers | Lato | Bold/Black | 40px |
| Section headers | Lato | Bold | 20px |
| Body text | Proxima Nova / Open Sans | Regular | 16px |
| Buttons (small) | Lato | Bold, uppercase | 1em |
| Buttons (large) | Lato | Bold, uppercase | 2em |
| Form labels | Open Sans | Regular | 14px |

## Typography Mixins (SCSS)

```scss
@include ima-page-header;        // Lato Bold 40px, uppercase, primary
@include ima-section-header;     // Lato Bold 20px, primary
@include ima-provider-title;     // Lato Semi Bold 32px, primary
@include ima-button-text;        // Lato Bold 18px, uppercase
@include ima-body-text;          // Proxima Nova Regular 16px
@include ima-form-label;         // Open Sans 14px, gray
```

## Component Mixins (SCSS)

```scss
@include ima-button-primary;      // Teal bg, white text, 20px/40px padding
@include ima-button-primary-wide; // Same, 80px horizontal padding
@include ima-button-outline;      // Transparent bg, primary border
@include ima-form-field;          // 15px radius, gray border, teal focus
@include ima-card;                // Light gray bg, no shadow, 10px radius
@include ima-card-white;          // White bg, 1px gray border
@include ima-gradient-bg;         // 150deg gradient, #00066F -> #00B8B8
```

## Voice & Tone

| Context | Tone |
|---------|------|
| Website / General | Professional + Friendly |
| Medical content | Professional + Informative (cite sources) |
| Social media | Friendly + Inspirational |
| Crisis / Urgent | Supportive + Professional |
| Newsletters | Friendly + Supportive |
| Fundraising | Inspirational + Supportive |

## Anti-Patterns

| BAD | GOOD |
|-----|------|
| "FLCCC" in new content | "IMA" or "Independent Medical Alliance" |
| Stretched/recolored logo | Approved lockup variants |
| Logo on busy backgrounds | White, light, dark, or gradient bg |
| Logo below 200px width | Min 200px; IMA lettermark for small sizes |
| Jargon-heavy copy | Plain language, medical terms defined |
| Fear-based messaging | Solution-oriented, empowering language |
| Missing medical disclaimer | Standard disclaimer on health content |
| Non-brand colors for key UI | Brand palette only |

## Bootstrap Integration

Viewport Grid: `.row` + `.col-{bp}-{n}` for page layouts.
Container Grid: `.ima-row` + `.ima-col-{bp}-{n}` for components (container-query based).

IMA cards: no shadow, 10px radius, 24px padding.
IMA buttons: Lato Bold 18px, 20px/40px padding, 10px radius (15px for large).

## SCSS Architecture

```
picostrap5-child-base/sass/
├── main.scss                    # Entry point
├── _bootstrap-loader.scss       # Bootstrap import chain
├── _theme_variables.scss        # Variable overrides (loads IMA brand)
└── bootstrap5/                  # Bootstrap 5.3 source (DO NOT EDIT)

plugins/ima-brand/sass/
├── _variables.scss              # Colors, typography, spacing
├── _typography.scss             # Font mixins
├── _spacing.scss                # Component mixins, layout
└── _container-grid.scss         # .ima-row/.ima-col-*
```

Import order: Bootstrap functions -> IMA brand -> theme variables -> Bootstrap variables -> Bootstrap components -> custom styles.
