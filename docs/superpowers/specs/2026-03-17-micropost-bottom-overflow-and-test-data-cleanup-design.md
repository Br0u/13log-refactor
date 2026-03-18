# Micropost Bottom Overflow And Test Data Cleanup Design

## Goal

Address two tightly scoped issues:

1. remove the confirmed test-only post and micropost records from the database
2. prevent focused micropost cards near the bottom of the viewport from expanding downward, blowing out the layout, or clipping unread content

## Context

The project already has a dedicated cleanup script at [scripts/cleanup-test-data.mjs](/Users/brou/Documents/Project/13log-refactor/scripts/cleanup-test-data.mjs). It defines explicit test-only slugs, category slugs, tag slugs, and micropost contents that can be safely removed.

Focused micropost cards are currently handled in [components/blog/PostsTimeline.jsx](/Users/brou/Documents/Project/13log-refactor/components/blog/PostsTimeline.jsx) and styled in [app/papermod-custom.css](/Users/brou/Documents/Project/13log-refactor/app/papermod-custom.css). The current active state always expands from the card using a downward-oriented absolute surface. That works in the middle of the page but breaks near the viewport bottom because the surface does not adapt its anchor direction to available space.

## Requirements

### Test Data Cleanup

Use the existing cleanup script rather than introducing new deletion logic.

The cleanup scope is the already confirmed set in `scripts/cleanup-test-data.mjs`, including:

- test posts identified by known slugs
- test microposts identified by known content strings
- linked tags and categories defined in the script

This change should not widen deletion criteria beyond the confirmed allowlist.

### Micropost Focus Positioning

When a micropost is focused:

- if there is enough space below the card, it may continue to expand downward
- if there is not enough space below, the focused surface must reposition upward
- the visible focused surface must stay within the viewport-safe area
- content must remain fully reachable through the existing internal scroll behavior
- the page should not be stretched by the focused surface

The interaction should still feel like an in-place expansion rather than a centered modal takeover.

### Scroll Behavior

Existing focused-card scroll rules must remain intact:

- card-internal wheel and touch scrolling stays within the card
- card-outside scroll still dismisses focus
- scroll range indicator still tracks the active surface

### Responsive Behavior

The adaptive positioning must work on both desktop and mobile.

Mobile-specific constraints:

- keep the current internal scrolling behavior
- do not let the focused card escape the screen bottom
- preserve a small visual breathing room from viewport edges

## Proposed Approach

### Cleanup Execution

Do not modify the cleanup allowlist unless a confirmed test record is missing from the script. The preferred path is to run the existing script directly against the configured database.

### Adaptive Focus Geometry

Add focused-card geometry calculation in [components/blog/PostsTimeline.jsx](/Users/brou/Documents/Project/13log-refactor/components/blog/PostsTimeline.jsx):

- read the active card's `getBoundingClientRect()`
- measure available space above and below the card
- decide a placement mode for the active surface, such as `down` or `up`
- compute a viewport-safe max height for the active surface

Pass that placement data into [components/blog/PostPreviewCard.jsx](/Users/brou/Documents/Project/13log-refactor/components/blog/PostPreviewCard.jsx) so the active card exposes stable data attributes or inline CSS variables for the chosen mode.

### Styling

Extend [app/papermod-custom.css](/Users/brou/Documents/Project/13log-refactor/app/papermod-custom.css) so the active surface supports both anchor directions:

- downward anchored mode for normal cases
- upward anchored mode for cards near the viewport bottom

Use existing active-card selectors where possible. Keep the internal scroll container, range frame, and max-height rules aligned with the new placement mode.

## Testing

### Behavior Tests

Add a focused behavior test in [tests/components/posts-timeline.test.jsx](/Users/brou/Documents/Project/13log-refactor/tests/components/posts-timeline.test.jsx) that simulates an active micropost near the viewport bottom and verifies the component switches to the upward placement mode.

### Style Tests

Add or update assertions in [tests/components/posts-timeline-styles.test.js](/Users/brou/Documents/Project/13log-refactor/tests/components/posts-timeline-styles.test.js) to confirm the focused micropost surface supports an upward anchor rule in addition to the existing active absolute positioning.

### Cleanup Verification

After implementation, run the cleanup script and verify it completes successfully against the configured database.

## Non-Goals

This change does not include:

- redesigning micropost focus into a modal dialog
- changing dismissal behavior
- changing like behavior
- broadening test data deletion beyond the confirmed allowlist
- rewriting the public timeline data model

## Approval State

Approved in chat on 2026-03-17 for:

- using the confirmed cleanup list only
- keeping the current in-place micropost expansion model
- adapting active-card placement when the card sits near the viewport bottom
