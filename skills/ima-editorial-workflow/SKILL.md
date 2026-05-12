---
name: ima-editorial-workflow
description: "Orchestrates the IMA editorial process — Plan, Write, Review, Approve, Learn. Triggers on: /write, /rewrite, /social, /brainstorm, 'draft,' 'create,' 'improve,' 'fix,' 'edit,' 'make better,' 'new newsletter,' 'new press release,' or any editorial request that isn't a standalone /scorecard review. Routes to ima-copywriting for drafting and ima-editorial-scorecard for review. Always load ima-brand alongside."
metadata:
  version: 1.0.0
---

# IMA Editorial Workflow

Traffic controller for all editorial requests. Delegates writing to `ima-copywriting`, scoring to `ima-editorial-scorecard`.

## Commands

```
/write [type]          → Plan and draft new content
/rewrite               → Review existing content, then improve
/social [category]     → Plan and draft social post
/brainstorm [topic]    → Explore ideas before committing
```

Also triggers on: "draft a newsletter," "improve this," "write a press release," etc.

**Content types (`/write`):** `newsletter` · `webinar` · `blog` · `press-release` · `fundraising` · `op-ed` · `social`

**Categories (`/social`):** `video` · `statement` · `action` · `media-hit` · `announcement` · `journal` · `webinar-promo`

## Workflow Sequence

```
PLAN → WRITE → REVIEW → APPROVE → LEARN
```

No diving straight into drafts. Gather context once, execute, review honestly.

## PLAN

### Intent Detection

| Signal | Intent | Path |
|--------|--------|------|
| `/write`, "draft," "create," "new" | Create | Plan → Write → Review → Approve |
| `/rewrite`, "improve," "fix," "edit," "make better" | Rewrite | Plan → Review → Write → Review → Approve |
| `/social` | Create social | Plan → Write → Review → Approve |
| `/brainstorm` | Explore | Brainstorm → Plan (when ready) |
| Content pasted, no instructions | Ambiguous | Ask: "Score this or rewrite it?" |
| "Continue," "next version," "apply fixes" | Iterate | Skip Plan → Write |

`/scorecard` handled directly by `ima-editorial-scorecard`, not this workflow.

### Context Gathering (One Prompt, Not a Chain)

Use `ask_user_input` widget. Collect 2–3 answers in single structured prompt. Skip already-answered questions. Default aggressively — ask only what's genuinely missing. For iteration requests, skip Plan entirely. If user says "just do it," write with available context, note assumptions, flag gaps with `[brackets]`.

**`/write [type]`:**
- Core message — ONE takeaway
- Reader action (widget: Read / Watch / Donate / Share / Sign / Attend / Download)
- Source material (widget multi-select: Study · Webinar · Quote · Press release · External article · None)
- Subject matter expert (optional)
- Responding to external events? (optional)
- Audience segment (widget: General supporters · Healthcare pros · Donors · Media · New subscribers)

**`/rewrite`:**
- What's wrong with it?
- Keep structure or rebuild? (widget: Keep structure · Rebuild)
- Preserve specific elements? (optional)

**`/social [category]`:**
- Category if not specified
- What are you promoting/announcing?
- Link or media to attach?
- Quote to feature? (optional)

**`/brainstorm [topic]`:**
- Topic or event
- Format preference (widget: Newsletter · Blog · Social · Op-ed · No preference)
- Goal (widget: Drive awareness · Drive action · Respond to news · Celebrate win · Educate)

## WRITE

1. Load `ima-brand` (always)
2. Load `ima-copywriting` (format template for content type)
3. Check project Files for published examples as style benchmarks
4. Write draft
5. Self-check against Quality Checklist in `ima-copywriting`

Deliver draft with brief note on key editorial choices. Use `[brackets]` for missing data. Never invent evidence.

## REVIEW

1. Load `ima-editorial-scorecard`
2. Auto-detect content type or use specified
3. Score: Brand Voice · Evidence Quality · Audience Clarity · Structural Craft · CTA Effectiveness
4. Present: scorecard table → What's Working → Priority Fixes → Line-Level Notes

For self-review: be honest. Separate what you can fix from what the user must provide (missing data, quotes, approvals).

For user-submitted content: score first, then ask if they want a rewrite.

## APPROVE

Present via `ask_user_input` widget:

| Option | Next |
|--------|------|
| Approve | Ready. Move to Learn. |
| Revise | Apply changes. Return to Write. |
| Rebuild | Different approach. Return to Plan. |
| Discuss | Talk through section before deciding. |

## LEARN

After approval, capture what worked:

> "Noted for future [content type] drafts: [pattern or correction]"

Examples:
- "Noted: Dr. Varon prefers 'the IMA' in formal quotes."
- "Noted: Year-end fundraising leads with match mechanic, not mission statement."

If learning should persist, ask: "Want me to remember this?" and use memory.

## Related Skills

- **ima-brand**: Voice, tone, terminology (ALWAYS load alongside)
- **ima-copywriting**: Format templates, writing principles, quality checklist
- **ima-editorial-scorecard**: Scoring rubric (handles `/scorecard` independently)
