# UI Feedback Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve discoverability, navigation clarity, and interaction feedback across the blog UI without changing the site's core content model.

**Architecture:** Keep the existing App Router and content pipeline intact, but strengthen shared navigation, page-level state feedback, and reading aids. Reuse the current `ClientEnhancements` pattern for incremental behavior changes, while reducing silent UI state changes that currently happen without visible confirmation.

**Tech Stack:** Next.js App Router, React 19, CSS modules via global stylesheets, existing client-side DOM enhancement layer in `app/components/ClientEnhancements.js`

---

## File Map

- Modify: `app/components/HeaderNav.js`
  Purpose: render stable primary navigation and current-page state.
- Modify: `app/layout.js`
  Purpose: host improved header navigation affordances and mobile nav trigger if needed.
- Modify: `app/components/ClientEnhancements.js`
  Purpose: add visible filter feedback, optional mobile TOC toggle behavior, and non-silent UI states.
- Modify: `app/posts/page.js`
  Purpose: add filter status region and clear-filter affordance on page 1.
- Modify: `app/posts/page/[page]/page.js`
  Purpose: keep paginated posts UI aligned with page 1 behavior.
- Modify: `app/search/page.js`
  Purpose: improve empty states, result grouping, and query/result summaries.
- Modify: `app/link/page.js`
  Purpose: expose deterministic preview loading/failure states in card markup.
- Modify: `app/posts/[slug]/page.js`
  Purpose: add a mobile-friendly TOC trigger and reduce overemphasis on related rail.
- Modify: `app/globals.css`
  Purpose: support shared search/filter feedback styling if needed.
- Modify: `app/papermod-custom.css`
  Purpose: style nav, feedback banners, mobile TOC, loading/failure states, and reading hierarchy.
- Optional follow-up: `app/papermod-base.css`
  Purpose: only if base nav styles need extension rather than override.

## Testing Strategy Note

This repo currently has no automated test runner or browser test suite wired into `package.json`. For this UI-focused work:

- Use targeted manual verification in the browser after each task.
- Prefer `npm run dev` plus Playwright-driven checks for repeatable validation.
- Do not add a large test framework in this pass unless implementation reveals repeated regressions that justify the overhead.

## Chunk 1: Navigation and Global Orientation

### Task 1: Restore a usable global header nav

**Files:**
- Modify: `app/components/HeaderNav.js`
- Modify: `app/layout.js`
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Define the primary nav items**

Use these routes unless content review reveals a stronger ordering:

```js
const NAV_ITEMS = [
  { href: "/posts", label: "Posts" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
  { href: "/link", label: "Link" },
  { href: "/photos", label: "Photos" },
];
```

- [ ] **Step 2: Render the nav with current-page state**

Implement `HeaderNav` as a client component if needed so it can read pathname and apply the active class.

Expected behavior:
- Current section is visibly highlighted.
- Header nav exists on every page, not just the homepage.
- Keyboard focus order remains logo -> theme toggle -> nav links.

- [ ] **Step 3: Add mobile-safe navigation behavior**

Choose the smallest change that keeps the header usable on narrow screens:
- either keep horizontal scrolling intentionally visible,
- or add a simple expand/collapse trigger.

Do not introduce a heavy drawer unless the current header width proves unworkable.

- [ ] **Step 4: Style the nav so it feels integrated with the current visual language**

Add CSS for:
- active link emphasis
- hover/focus state
- compact mobile spacing
- optional nav container background if readability is weak over the textured page background

- [ ] **Step 5: Manually verify navigation flow**

Run:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Verify:
- header nav appears on home, posts, post detail, search, about, and link pages
- active state follows route changes
- mobile-width layout does not collapse into overlapping controls

## Chunk 2: Browsing Feedback for Posts and Search

### Task 2: Make post filtering visible and reversible

**Files:**
- Modify: `app/posts/page.js`
- Modify: `app/posts/page/[page]/page.js`
- Modify: `app/components/ClientEnhancements.js`
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Add a visible filter status region**

Render a small status block near the chips with fields for:
- current selection
- visible result count
- clear filter action

Suggested initial DOM:

```jsx
<div className="posts-filter-status" data-posts-filter-status>
  <span data-filter-label>全部</span>
  <span data-filter-count>{posts.length}</span>
  <button type="button" data-filter-reset hidden>清除筛选</button>
</div>
```

- [ ] **Step 2: Extend the filter script to update visible feedback**

Update `initPostsFilter()` so it:
- counts visible cards after each filter
- updates the active label
- toggles reset button visibility
- optionally syncs selected tag to the URL query string

- [ ] **Step 3: Add an empty state for zero matching posts**

Render a hidden empty-state container and reveal it when filtering returns zero cards.

Suggested copy:
- title: `没有找到匹配的文章`
- helper: `试试其他标签，或者清除当前筛选。`

- [ ] **Step 4: Style status and empty-state feedback**

Add CSS for:
- compact status banner
- reset button
- zero-results empty card

- [ ] **Step 5: Manually verify tag filtering**

Verify:
- selecting a tag updates visible count
- clearing filter restores all cards
- zero-match state is visible and understandable

### Task 3: Improve search result states and information scent

**Files:**
- Modify: `app/search/page.js`
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Replace the generic meta line with explicit search states**

Handle these states separately:
- no query entered
- query entered with zero results
- query entered with results

- [ ] **Step 2: Group results by section**

Split output into at least:
- `Posts`
- `Links`

Each group should show its own heading and count.

- [ ] **Step 3: Improve result card context**

For each result, show:
- title
- short description or excerpt
- section label
- date when available

If feasible without excessive markup churn, highlight matched query text in title/description.

- [ ] **Step 4: Add search empty-state guidance**

For zero results, render copy such as:
- `没有找到与 “{q}” 相关的内容`
- `可以尝试标题、标签、作者名或更短的关键词。`

- [ ] **Step 5: Manually verify search behavior**

Verify:
- empty search state gives guidance
- zero results are explicit
- mixed results are easier to scan than the current single undifferentiated masonry list

## Chunk 3: Reading Flow on Post Detail Pages

### Task 4: Replace the hidden-only desktop TOC pattern with stable structure cues

**Files:**
- Modify: `app/posts/[slug]/page.js`
- Modify: `app/components/ClientEnhancements.js`
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Keep the desktop TOC visible by default**

Adjust TOC rail styling so users do not need hover to discover the document structure.

Required behavior:
- current section is emphasized
- non-current items remain visible but visually quieter
- long headings truncate cleanly

- [ ] **Step 2: Add a mobile TOC toggle**

Render a small `目录` button near the post header when TOC content exists.

Behavior:
- hidden on desktop
- toggles a compact in-flow TOC panel on mobile/tablet
- can be closed after navigation

- [ ] **Step 3: Lower the visual weight of the related-post rail**

Keep it useful, but reduce competition with the article body.
Possible changes:
- smaller title treatment
- lighter border/background
- move below article on narrower desktop widths if needed

- [ ] **Step 4: Rebalance long-form typography**

Do not remove the current visual identity entirely. Instead:
- preserve decorative handwriting for post title
- consider a more readable serif for article body copy
- reduce paragraph fatigue by revisiting size/line-height/indent combination

- [ ] **Step 5: Manually verify reading flow**

Verify on a long post:
- TOC is discoverable immediately on desktop
- mobile users can open/close TOC without layout breakage
- related posts no longer distract from the reading start point

## Chunk 4: Link Board Feedback and Async States

### Task 5: Make link preview states explicit and stable

**Files:**
- Modify: `app/link/page.js`
- Modify: `app/components/ClientEnhancements.js`
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Add preview state hooks to the markup**

Render deterministic state containers so CSS and JS can target:
- loading
- loaded
- failed
- no-preview-data

- [ ] **Step 2: Update preview fetch behavior to reflect those states**

When a card enters the viewport:
- show loading state immediately
- switch to loaded state when metadata arrives
- switch to failed state when providers fail
- avoid leaving the user with an ambiguous blank region

- [ ] **Step 3: Add resilient fallback content**

When image/description are unavailable:
- keep a stable card height
- show site/domain fallback
- avoid layout jumping as async content arrives

- [ ] **Step 4: Improve child-link grouping clarity**

Check whether nested child links need:
- a clearer subgroup label
- lighter visual treatment than primary cards
- more obvious separation from the parent link

- [ ] **Step 5: Manually verify async feedback**

Verify:
- loading cards do not look broken
- failed preview cards still feel intentional
- preview arrival does not cause severe layout shift

## Chunk 5: Final Integration Pass

### Task 6: Polish shared feedback patterns and validate the experience

**Files:**
- Modify: `app/papermod-custom.css`
- Modify: `app/globals.css`
- Review: all modified page/component files

- [ ] **Step 1: Normalize feedback styling**

Ensure status banners, empty states, toggle buttons, and helper text share:
- spacing rhythm
- border language
- surface contrast
- hover/focus treatment

- [ ] **Step 2: Check dark mode parity**

Verify all new states remain readable in both light and dark themes.

- [ ] **Step 3: Run a full manual path review**

Check these flows:
- Home -> Posts -> filter -> open post
- Post detail -> TOC navigation -> back to list
- Search with results and without results
- Link page with previews pending and loaded

- [ ] **Step 4: Capture regression notes**

Document any follow-up work discovered during verification but out of scope for this pass, especially:
- whether `ClientEnhancements.js` should be split by concern
- whether lightweight browser regression coverage is now justified

- [ ] **Step 5: Commit**

```bash
git add app/components/HeaderNav.js app/layout.js app/components/ClientEnhancements.js app/posts/page.js app/posts/page/[page]/page.js app/search/page.js app/link/page.js app/posts/[slug]/page.js app/globals.css app/papermod-custom.css docs/superpowers/plans/13log-refactor/2026-03-14-ui-feedback-optimization.md
git commit -m "plan: define UI feedback optimization work"
```
