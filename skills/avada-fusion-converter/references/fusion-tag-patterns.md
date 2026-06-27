# Fusion tag patterns & section vocabulary

Reference for the `avada-fusion-converter` skill. Covers (1) Fusion shortcode
anatomy, (2) the shared `patternKey` section vocabulary, and (3) a real worked
verbatim block from the repo's reference exports.

## 1. Fusion shortcode anatomy

Avada (Fusion Builder) pages are nested shortcodes. Each `.fusion` export is a
single enormous line; the logical nesting is:

```
[fusion_builder_container admin_label="..." type="flex" ...]
  [fusion_builder_row]
    [fusion_builder_column type="1_1" ...]
      [fusion_title ...]Heading text[/fusion_title]
      [fusion_text]<p>Body copy</p>[/fusion_text]
      [fusion_button link="..." ...]Button label[/fusion_button]
    [/fusion_builder_column]
  [/fusion_builder_row]
[/fusion_builder_container]
```

Key facts:
- **Section/container granularity.** The converter operates at the
  `fusion_builder_container` level (a whole section), **never** at atomic
  element level.
- **`admin_label`** is the human name Avada shows for the section; use it to
  identify and label a block (it maps to the optional catalog `adminLabel`).
- **Where content lives:** visible text is the *inner text* between an element's
  open/close tags (`fusion_title`, `fusion_text`, `fusion_button`), not an
  attribute. Media lives in attributes such as `background_image` or
  `image` URLs.
- **Every element carries ~50+ attributes**, most empty or default. That is what
  the de-defaulting rules (see `de-defaulting.md`) exist to strip.

### Slot families (what the converter swaps)

| Slot family | Where it lives | Examples |
|-------------|----------------|----------|
| `content` | inner text / media URLs | `fusion_title` text, `fusion_button` label+`link`, `background_image` |
| `colors`  | color attributes | `background_color`, `gradient_start_color`, `gradient_end_color`, `link_color` |
| `spacing` | layout attributes | `padding_top`, `padding_bottom`, `margin_*`, `min_height` |

These map to the catalog `slots` shape: `slots.content[]` (contentSlot:
`{slot, selector?, value}`), `slots.colors[]` and `slots.spacing[]` (attrSlot:
`{slot, attr, value}`).

## 2. Section-pattern vocabulary (`patternKey`)

Canonical source: `reference-library/schema/catalog.schema.json`
(`patternKey.examples`) and `reference-library/README.md` (Contract C). This
table **re-states** those terms — it must not add or rename any. `patternKey` is
an open string with this recommended enum; grow it in the schema/README first.

| patternKey | Definition | Structural signature | Real example in repo? |
|------------|------------|----------------------|-----------------------|
| `hero-gradient` | Full-width hero section with a gradient/blended background over an image | container `type=flex` with `gradient_*` + `background_image` + `background_blend_mode`; tall `padding_top` | **Yes** — `legacy-giving` Hero (worked below) |
| `two-col-split` | Two balanced columns (text/media split) | one row, two `fusion_builder_column type="1_2"` | Vocabulary-only until deconstructed |
| `cta-band` | Narrow full-width call-to-action strip | short container with centered title + `fusion_button` | Vocabulary-only until deconstructed |
| `card-grid` | Repeating equal-height cards | row with 3–4 equal columns, `equal_height_columns="yes"` | Vocabulary-only until deconstructed |
| `checklist-pillars` | Icon/checklist "pillars" row | row of columns each with an icon + short text | Vocabulary-only until deconstructed |
| `quote-card` | Pull-quote / testimonial card | single column with quote text + attribution | Vocabulary-only until deconstructed |

> Truthfulness rule: only `hero-gradient` is verified present in the current
> reference exports. Do **not** fabricate verbatim blocks for the others; mark
> them vocabulary-only until a real example is deconstructed.

## 3. Worked verbatim example — `hero-gradient` (real)

Source: `reference-library/legacy-giving/page-content.fusion`, the
`[fusion_builder_container admin_label="Hero" ...]` section. This is a **real**
block from the provided `.fusion` files (AC1). Abbreviated here to its opening
container tag; the full verbatim block includes its nested row/column/elements.

Opening container tag (verbatim, intent-bearing attributes highlighted):

```
[fusion_builder_container admin_label="Hero" type="flex"
  hundred_percent_height="min" min_height="60%"
  flex_align_items="flex-start"
  padding_top="160px" padding_bottom="60px"
  background_color="rgba(1,99,160,0.43)"
  gradient_start_color="rgba(2,150,161,0.79)"
  gradient_end_position="70" gradient_type="linear" linear_angle="180"
  background_image="https://imahealth.org/wp-content/uploads/2025/05/ima-legacy-giving-background-scaled.jpg"
  background_position="center center" background_blend_mode="multiply"
  ... (≈151 more empty/default attributes omitted; see de-defaulting.md) ]
```

How the swap strategy applies to this block:
- **content** swap: `background_image` URL; inner text of the nested
  `fusion_title` / `fusion_text` / `fusion_button`.
- **colors** swap: `background_color`, `gradient_start_color` (and
  `gradient_end_color` if a real gradient end is wanted) — values chosen via
  `ima-brand`.
- **spacing** swap: `padding_top`, `padding_bottom`, `min_height`.
- **structure** (verbatim, do not touch): `type="flex"`, `flex_align_items`,
  `gradient_type`, `linear_angle`, `background_position`,
  `background_blend_mode`.

See `de-defaulting.md` for the lean form of this exact block (166 → 15
attributes) and the full-vs-lean A/B demonstration.
