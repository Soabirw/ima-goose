---
name: avada-fusion-converter
description: >-
  Avada/Fusion converter rules — copy-verbatim-block + content/color/spacing swap,
  lean vs full de-defaulting, and the shared section-pattern (patternKey) vocabulary.
  Use when deconstructing Avada Fusion exports into a section pattern catalog, or when
  generating Fusion shortcodes from a design. Complements ima-brand (brand colors/voice);
  does NOT use ima-bootstrap (this is Avada Fusion shortcodes, not a Bootstrap/CSS system).
  Triggers on: Avada, Fusion, fusion_builder_container, fusion_builder_row,
  fusion_builder_column, lean Fusion, de-default attributes, section pattern catalog,
  patternKey, verbatimBlock, leanBlock, hero-gradient.
---

# Avada / Fusion Converter

This skill encodes the human/agent-followable rules for turning real Avada/Fusion
page exports into reusable, restylable Fusion blocks, and for emitting Fusion back
out. It is a **knowledge artifact** — pure rules and a small static default map. It
has **no runtime**, no Node code, no database, and no WordPress interaction.

The data contracts it binds to (`catalog.json`, `meta.json`, `patternKey`
vocabulary, snapshot naming) are defined and committed in the `avada-builder`
repo under `reference-library/`. This skill teaches **how** to apply those
contracts; it does not redefine them.

## Scope and boundaries

**This skill owns** Fusion shortcode mechanics:
- Parsing a `fusion_builder_container` / `row` / `column` / element tag.
- Stripping empty + default attributes to derive a `leanBlock`.
- Identifying `content`, `colors`, and `spacing` slots.
- Re-emitting lean OR full Fusion.

**This skill does NOT own:**
- Brand color values, voice, or copy decisions → load **`ima-brand`**.
- CSS/SCSS or Bootstrap systems → **do NOT load `ima-bootstrap`**; Avada Fusion is
  a shortcode page-builder format, not a CSS framework.
- The serve/render/extract/screenshot runtime (`src/*.js`) — that already exists and
  is not in scope here.
- Authoring the deconstruction/generation recipes themselves.

## Decision tree

```
Deconstructing a real Avada export into the catalog?
  → Apply de-defaulting rules (references/de-defaulting.md) to produce
    catalog.json.leanBlock + slots from each verbatimBlock.

Generating Fusion from a design / catalog entry?
  → Use the copy-verbatim-block + content/color/spacing swap strategy
    (references/fusion-tag-patterns.md), then emit lean OR full Fusion.

Need the section vocabulary (what is this block called)?
  → Use the patternKey table (references/fusion-tag-patterns.md);
    canonical source is reference-library/schema/catalog.schema.json.

Swapping colors or writing copy?
  → Defer to ima-brand for brand colors/voice. This skill only moves the
    values into the right Fusion attributes/slots.
```

## Strategy: copy verbatim block + swap content/colors/spacing (AC1)

Avada blocks are large and fragile. Do **not** hand-build Fusion from scratch.
Instead:

1. **Copy a verbatim block** — take a known-good `fusion_builder_container` (and its
   nested rows/columns/elements) straight from a real export. This is the
   `verbatimBlock`.
2. **Swap only three slot families:**
   - `content` — visible text/media (e.g. `fusion_title` inner text, `fusion_button`
     label/link, image URLs).
   - `colors` — color-bearing attributes (`background_color`, `gradient_*`,
     `link_color`, etc.). Defer the *value choice* to `ima-brand`.
   - `spacing` — layout spacing (`padding_*`, `margin_*`, `min_height`, gaps).
3. **Leave structure untouched** — tag nesting, `type`, `flex_*`, and the overall
   shape stay verbatim so Avada re-imports cleanly.

A full worked example using the real `legacy-giving` Hero block lives in
`references/fusion-tag-patterns.md`.

## Lean vs full (AC2)

A single source block has two valid emission forms:

- **Full** — the verbatim block, unchanged. Use as the safe Avada-import fallback.
- **Lean** — the same block with empty attributes and Avada default-valued
  attributes stripped, keeping only intent-bearing attributes.

The de-defaulting rules (strip-empty, strip-known-default, never-strip-intent) and a
same-source lean+full demonstration (the Hero block: 166 → 15 attributes) live in
`references/de-defaulting.md`. The machine-readable default map is
`references/fusion-defaults.json`.

## Section-pattern vocabulary (AC3)

The section-level `patternKey` vocabulary is shared with the catalog schema. It is
**defined canonically** in:
- `reference-library/schema/catalog.schema.json` (`patternKey.examples`), and
- `reference-library/README.md` (Contract C).

This skill **re-states** the same terms and must never fork or rename them. The
initial six section-level terms are:

`hero-gradient`, `two-col-split`, `cta-band`, `card-grid`, `checklist-pillars`,
`quote-card`.

`patternKey` is an **open string** (with the recommended enum) so the vocabulary can
grow as more examples are deconstructed; new terms are added to the schema/README
first, then re-stated here. See `references/fusion-tag-patterns.md` for the
structural signature of each term and which currently have a real example block.

## Consumed by both recipes (AC4)

This skill is recipe-agnostic and bidirectional:

- **Deconstruction recipe (#25/#26)** — *applies* de-defaulting to **produce**
  `catalog.json.leanBlock` + `slots` from each `verbatimBlock`.
- **Generation recipes (#27/#28)** — *read* `verbatimBlock` / `leanBlock` / `slots`
  and **re-emit** lean and full Fusion.

Cross-skill rule: load **`ima-brand`** for brand colors/voice; never load
**`ima-bootstrap`**.
