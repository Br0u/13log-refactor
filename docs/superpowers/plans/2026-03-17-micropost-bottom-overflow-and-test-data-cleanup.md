# Micropost Bottom Overflow And Test Data Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the confirmed test-only content records and make focused micropost cards reposition safely when they are activated near the viewport bottom.

**Architecture:** Reuse the existing database cleanup script unchanged for data removal. For the UI fix, extend the current in-place micropost focus model in `PostsTimeline.jsx` so it computes a placement mode and viewport-safe max-height, then pass that state into `PostPreviewCard.jsx` and style both anchor directions in `app/papermod-custom.css`.

**Tech Stack:** Next.js App Router, React client components, CSS in `app/papermod-custom.css`, Vitest, Node script execution, Prisma-backed cleanup script.

---

## File Map

- Modify: `components/blog/PostsTimeline.jsx`
  - Compute focused micropost placement and safe height from viewport geometry.
- Modify: `components/blog/PostPreviewCard.jsx`
  - Expose placement data on the active micropost surface.
- Modify: `app/papermod-custom.css`
  - Add upward-anchor rules and shared safe-height styling.
- Modify: `tests/components/posts-timeline.test.jsx`
  - Add a failing behavior test for bottom-of-viewport activation.
- Modify: `tests/components/posts-timeline-styles.test.js`
  - Add a selector assertion for the upward-anchor mode.
- Run only: `scripts/cleanup-test-data.mjs`
  - Execute the already approved cleanup allowlist against the configured database.

## Chunk 1: Focus Geometry

### Task 1: Add failing behavior coverage for bottom-edge activation

**Files:**
- Modify: `tests/components/posts-timeline.test.jsx`
- Reference: `components/blog/PostsTimeline.jsx`

- [ ] **Step 1: Write the failing test**

Add a test that:

- renders one focused micropost
- mocks the active card rect so little space remains below it
- clicks the card to focus it
- asserts the active surface receives upward placement metadata, such as `data-micro-placement="up"`

Suggested assertion shape:

```jsx
expect(screen.getByTestId("timeline-card-micro-1-surface").getAttribute("data-micro-placement")).toBe("up");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/posts-timeline.test.jsx`

Expected: FAIL because no placement metadata is currently produced.

- [ ] **Step 3: Write minimal implementation**

In `components/blog/PostsTimeline.jsx`:

- compute active card geometry when focus changes
- determine available `spaceAbove` and `spaceBelow`
- choose placement mode:
  - `down` when below space is sufficient
  - `up` when below space is insufficient and above space is better
- compute a safe max-height using viewport margins
- store this in focused micropost state

Pass the placement data into `PostPreviewCard` through `microScrollChrome` or a new focused-surface prop.

In `components/blog/PostPreviewCard.jsx`:

- add `data-micro-placement`
- add an inline CSS variable such as `--micro-surface-max-height`

- [ ] **Step 4: Run test to verify it passes**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/posts-timeline.test.jsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/blog/PostsTimeline.jsx components/blog/PostPreviewCard.jsx tests/components/posts-timeline.test.jsx
git commit -m "fix: adapt micropost focus placement near viewport bottom"
```

## Chunk 2: Placement Styling

### Task 2: Add failing style coverage for upward anchoring

**Files:**
- Modify: `tests/components/posts-timeline-styles.test.js`
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Write the failing test**

Add a selector assertion that verifies the active micropost surface supports upward anchoring:

```js
expect(stylesheet).toMatch(/data-micro-placement="up"/);
```

and verify it anchors from the card bottom rather than the card top.

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/posts-timeline-styles.test.js`

Expected: FAIL because no upward placement selector exists yet.

- [ ] **Step 3: Write minimal implementation**

Update `app/papermod-custom.css` so the active micropost surface:

- uses `max-height: var(--micro-surface-max-height, min(...))`
- keeps the current downward layout for `data-micro-placement="down"`
- adds an upward-anchored rule for `data-micro-placement="up"` using bottom alignment
- preserves internal scroll, scroll-range, and mobile-friendly touch behavior

Suggested rule shape:

```css
.posts-masonry--interactive[data-micro-focus]:not([data-micro-focus=""])
  .post-preview-card--micro.is-micro-active
  .post-preview-card__micro-surface[data-micro-placement="up"] {
  top: auto;
  bottom: -0.96rem;
}
```

Adapt exact offsets to match the current active-card visual language and mobile overrides.

- [ ] **Step 4: Run test to verify it passes**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/posts-timeline-styles.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/papermod-custom.css tests/components/posts-timeline-styles.test.js
git commit -m "style: support upward micropost focus placement"
```

## Chunk 3: Cleanup And Verification

### Task 3: Remove confirmed test data and verify regressions

**Files:**
- Run-only: `scripts/cleanup-test-data.mjs`
- Run-only: `tests/components/posts-timeline.test.jsx`
- Run-only: `tests/components/posts-timeline-styles.test.js`

- [ ] **Step 1: Run focused UI tests**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/posts-timeline.test.jsx tests/components/posts-timeline-styles.test.js tests/components/post-preview-card.test.jsx`

Expected: PASS

- [ ] **Step 2: Execute the cleanup script**

Run: `node --env-file=.env scripts/cleanup-test-data.mjs`

Expected: success output confirming test posts, micro posts, tags, and categories were cleaned.

- [ ] **Step 3: Run the full suite**

Run: `npm test`

Expected: all test files pass at or above the current project baseline.

- [ ] **Step 4: Commit**

```bash
git add components/blog/PostsTimeline.jsx components/blog/PostPreviewCard.jsx app/papermod-custom.css tests/components/posts-timeline.test.jsx tests/components/posts-timeline-styles.test.js
git commit -m "chore: clean test content and fix bottom micropost overflow"
```
