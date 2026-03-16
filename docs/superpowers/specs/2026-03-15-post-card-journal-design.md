# Posts Card Journal Design

Date: 2026-03-15
Area: `/posts` post preview cards
Status: Draft for review

## Goal

Push the post preview card closer to the reference's "journal excerpt" feeling without making it look distressed, decorative, or archival.

The chosen direction is:

- Light Journal overall structure
- Quiet metadata row
- Excerpt-first card body
- A centered standalone `//` divider between excerpt blocks
- A restrained `[展开全文]` affordance

## Non-Goals

- Do not introduce notebook paper textures or heavy ruled backgrounds
- Do not turn the card into an archive/index record style
- Do not prioritize stronger CTA styling in this pass
- Do not add explanatory divider labels such as "日志分隔"

## Visual Direction

The card should feel like a clean personal log entry rather than a blog summary module.

It should read as:

1. Context first: this is a dated entry
2. Title second: this is the entry heading
3. Excerpt third: this is a clipped journal segment
4. Read-more last: this is a quiet continuation link

The overall tone should stay calm and literary, with stronger rhythm coming from spacing and separators rather than from boxes, icons, or textures.

## Structure

### Header

- Keep the current stacked structure: metadata row above or adjacent to the title block depending on the existing layout constraints
- Metadata is visually subdued
- Metadata order: date, divider, primary category
- Divider remains simple and thin
- Title remains the strongest text element in the card, but should not feel like a large editorial hero

### Body

- The first excerpt block appears immediately after the header
- If there is a second excerpt block, insert a standalone centered `//` between blocks
- The `//` divider gets more vertical breathing room than normal paragraph spacing
- The divider is decorative rhythm, not labeled UI
- Excerpt text should still feel readable and fluid, not boxed into distinct content modules

### Read More

- Keep `[展开全文]`
- Present it as a quiet inline continuation marker
- Avoid button styling or heavy hover emphasis in this pass

## Styling Guidance

### Spacing

- Increase the sense of rhythm between title, first excerpt, divider, second excerpt, and read-more
- Let the `//` separator carry the strongest pause in the card body
- Prefer spacing changes over additional ornament

### Divider

- Divider content: `//`
- Placement: standalone centered line
- Tone: subtle, not bold, not interactive
- It should feel like a natural handwritten pause translated into UI

### Metadata Tone

- Time and category should support the journal feel without reading as badges
- Keep contrast lower than title and excerpt
- Avoid icon-led emphasis in this phase

## Implementation Notes

- Primary component: `components/blog/PostPreviewCard.jsx`
- Primary styling surface: `app/papermod-custom.css`
- Use existing preview block extraction from `getPostPreviewBlocks(post)`
- Only show the centered `//` when there are at least two rendered excerpt blocks
- Preserve current card clickability behavior

## Acceptance Criteria

- Cards feel closer to a journal excerpt than a generic blog card
- The centered `//` divider appears only between excerpt blocks, not after the last block
- Metadata remains present but visually secondary
- `[展开全文]` stays readable and discoverable without becoming button-like
- The result feels cleaner than the notebook/archive alternatives explored during brainstorming

## Open Follow-Up

Possible next pass after this one:

- category icon treatment
- stronger `[展开全文]` interaction language
- more reference-like meta/header detailing
