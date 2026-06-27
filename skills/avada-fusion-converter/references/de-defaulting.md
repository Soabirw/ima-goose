# De-defaulting: lean vs full Fusion

Reference for the `avada-fusion-converter` skill. These rules turn a verbatim
Avada container (≈160+ attributes, mostly noise) into a **lean** block that keeps
only design intent, and define how to emit a **full** block for safe re-import.

Machine-readable default map: `fusion-defaults.json` (this directory).

## Why

A real `fusion_builder_container` opening tag carries ~160+ attributes. Measured
on the `legacy-giving` Hero block: **166 attributes total**, of which **86 are
empty-valued** and **~65 are Avada defaults** that carry no design intent. Only
**~15** attributes express the actual design. Stripping the noise makes catalog
entries readable, diffable, and restylable. (This confirms AC2's "~50
mostly-default attributes" framing — empty + default attributes together vastly
outnumber the intent-bearing ones.)

## The three rules

### Rule 1 — strip empty

Remove every attribute whose value is the empty string (`attr=""`).

On the Hero block this removes 86 attributes, e.g. `margin_top=""`, `class=""`,
`id=""`, `gradient_end_color=""`, all `*_medium` / `*_small` responsive twins,
`video_*=""`, `pattern_custom_bg=""`, `box_shadow_color=""`.

### Rule 2 — strip known defaults

Remove every attribute whose value equals the Avada default for that attribute.
Use `fusion-defaults.json` as the source of default values. Examples removed on
the Hero block:

- `box_shadow="no"`, `fade="no"`, `enable_mobile="no"`
- `border_style="solid"`, `box_shadow_blur="0"`, `box_shadow_spread="0"`
- all `filter_*` at `0`/`100` (e.g. `filter_opacity="100"`, `filter_blur="0"`)
- `pattern_bg="none"`, `mask_bg="none"`, `*_bg_style="default"`,
  `*_bg_blend_mode="normal"`, `*_bg_opacity="100"`
- all `background_slider_*` defaults, all `video_*` defaults
- `sticky="off"`, `absolute="off"`, `hundred_percent="no"`,
  `equal_height_columns="no"`, `hundred_percent_height_scroll="no"`
- `align_content="stretch"`, `flex_justify_content="flex-start"`,
  `flex_wrap="wrap"`, `container_tag="div"`, `status="published"`,
  `background_repeat="no-repeat"`, `gradient_start_position="0"`,
  `radial_direction="center center"`, `animation_*` defaults,
  `background_parallax="none"`, `parallax_speed="0.3"`

### Rule 3 — never strip intent

Keep attributes that carry a real, non-default value, even if they look generic.
The canonical "kept" set for the Hero block (the ~15 survivors) is:

```
admin_label="Hero"
type="flex"
hundred_percent_height="min"
min_height="60%"
flex_align_items="flex-start"
padding_top="160px"
padding_bottom="60px"
background_color="rgba(1,99,160,0.43)"
gradient_start_color="rgba(2,150,161,0.79)"
gradient_end_position="70"
gradient_type="linear"
linear_angle="180"
background_image="https://imahealth.org/wp-content/uploads/2025/05/ima-legacy-giving-background-scaled.jpg"
background_position="center center"
background_blend_mode="multiply"
```

Intent guard notes:
- Keep `padding_*` / `margin_*` only when **non-zero / non-empty**.
- Keep `gradient_*` only when a real gradient is in play (here `gradient_start_color`
  is set and `gradient_type="linear"` with a real `linear_angle`).
- `gradient_end_position="70"`, `gradient_type`, `linear_angle`,
  `background_position`, `background_blend_mode` are kept because they shape the
  *real* gradient/background even though some look default-ish — they are not at
  their no-op default in this block.

## Lean and full emission (same source block)

From the **same** Hero `verbatimBlock`:

- **Full block** = the verbatim container, unchanged (all 166 attributes). This is
  what goes in `catalog.json.verbatimBlock`.
- **Lean block** = Full minus Rule 1 minus Rule 2 = the 15 attributes above. This
  is what goes in `catalog.json.leanBlock`.

The lean attribute set is a **strict subset** of the full attribute set (verify by
diffing attribute names). The nested rows/columns/elements get the same treatment
recursively.

```
Hero container:  full = 166 attrs   →   lean = 15 attrs   (151 stripped)
                 86 empty (Rule 1) + 65 default (Rule 2) removed
```

## A/B rationale (keep full as fallback)

Emit **both** lean and full:
- Prefer **lean** for human review, catalog readability, and restyling.
- Keep **full** as the import fallback — Avada may back-fill missing attributes
  inconsistently or choke on a too-lean import. Treat lean as the default once it
  is proven to re-import cleanly for a given pattern; until then, full is the
  safety net. (Open question carried from the brainstorm.)
