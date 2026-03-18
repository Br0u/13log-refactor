# Footer Badge Footer Design

## Goal

Upgrade the global site footer so it carries the same structure and mood as the reference:

- a quiet divider line above the footer
- a centered badge row with two certification-like items
- a small copyright line below

The result should feel editorial and intentional, not like imported WordPress block markup.

## Context

The current global footer lives in [app/layout.js](/Users/brou/Documents/Project/13log-refactor/app/layout.js) and is rendered as two plain inline spans inside `.footer`.

The site already uses a restrained visual language:

- black borders
- compact card framing
- light backgrounds
- editorial typography
- generous breathing room around major sections

The new footer should extend that system rather than introducing a new design vocabulary.

## Requirements

### Structure

Replace the current footer content with three visual layers:

1. top divider line
2. centered badge section
3. muted copyright line

The footer remains global and appears on every page through `app/layout.js`.

### Badge Content

Render two native badges:

1. Human-written badge
2. Content license badge

Each badge contains:

- a framed "plate" area with short title text
- a smaller label line beneath the plate

Planned copy:

- Human-written plate: `HUMAN WRITTEN`
- Human-written label: `/ 非 AI 创作`
- License plate: `CC BY-NC-SA`
- License label: `/ 内容许可协议`

Each badge should be clickable and open the corresponding external destination:

- human-written statement -> `https://notbyai.fyi/`
- license statement -> `https://creativecommons.org/licenses/by-nc-sa/4.0/`

External links should preserve current site safety conventions such as opening in a new tab with appropriate rel attributes.

### Visual Direction

The footer should be structurally similar to the reference but visually translated into this codebase's style:

- no WordPress block classes
- no remote badge images
- no thick card UI
- no promotional CTA look

Badge styling should feel like a miniature version of the site's post-card language:

- thin black border
- shallow corner treatment with slight asymmetry if it fits the current style
- compact vertical stack
- restrained contrast
- subtle hover/focus emphasis only

The copyright line should stay visibly secondary.

### Responsive Behavior

Desktop:

- badges sit in one centered row
- spacing feels airy but not oversized

Mobile:

- badges stack vertically
- width is capped so they do not stretch edge to edge
- vertical rhythm remains balanced

### Interaction

Do not add strong animation.

Allowed interaction feedback:

- slight border/foreground contrast lift
- very small translate or shadow change
- clear focus-visible treatment for keyboard users

The footer should remain calm and low-noise.

## Implementation Outline

### Layout

Update [app/layout.js](/Users/brou/Documents/Project/13log-refactor/app/layout.js) so `.footer` contains:

- a wrapper for the badge row
- two semantic link blocks for the badges
- a separate copyright line

Suggested semantic structure:

- `footer.footer`
- `div.footer__badges`
- `a.footer-badge`
- `span.footer-badge__plate`
- `span.footer-badge__label`
- `p.footer__meta`

### Styling

Implement footer-specific styles in [app/papermod-custom.css](/Users/brou/Documents/Project/13log-refactor/app/papermod-custom.css), extending rather than fighting the existing `.footer` baseline.

Expected style areas:

- footer top border and spacing
- badge row alignment
- badge plate appearance
- muted metadata text
- mobile stacking rules
- dark-theme compatibility

### Accessibility

Requirements:

- links remain keyboard reachable
- focus-visible is obvious
- labels remain readable at small sizes
- decorative styling does not replace text meaning

## Testing

Add or update tests to cover:

1. global layout renders the two footer badges
2. both badges point to the expected external URLs
3. footer copyright text still renders
4. responsive/style assertions for the new footer classes where the current test suite already checks structural CSS behavior

## Non-Goals

This change does not include:

- replacing the site logo or header
- adding newsletter / CTA blocks
- adding social icon rows
- copying the exact reference HTML
- using externally hosted badge images

## Approval State

Design approved in chat on 2026-03-17 for:

- structure and mood similar to the reference
- two badge topics preserved
- badges implemented as native site components rather than images
