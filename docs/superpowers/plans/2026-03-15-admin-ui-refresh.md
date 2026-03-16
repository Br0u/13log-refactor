# Admin UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the `/admin` UI into a quieter editorial workspace with a narrow sidebar, independent page header, and consistent light-panel content area.

**Architecture:** Keep the existing admin route structure and data flow, but introduce a shared workspace skeleton in `app/admin/layout.jsx` plus reusable page/panel class names used by dashboard, posts, comments, taxonomy, and post-form pages. Consolidate the visual change in `app/globals.css` so the whole admin area reads as one system instead of page-specific overrides.

**Tech Stack:** Next.js App Router, React server components, shared global CSS, Vitest server-render tests.

---

## Chunk 1: Workspace Skeleton

### Task 1: Lock the new layout in tests

**Files:**
- Modify: `tests/app/admin-layout.test.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/app/admin-layout.test.js` and verify the new assertions fail**
- [ ] **Step 3: Update `app/admin/layout.jsx` to render the workspace shell, rail, and main stage wrappers**
- [ ] **Step 4: Re-run the same test and verify it passes**

### Task 2: Lock page framing on high-frequency pages

**Files:**
- Modify: `tests/app/admin-dashboard.test.jsx`
- Create: `tests/app/admin-posts-page.test.jsx`
- Create: `tests/app/admin-comments-page.test.jsx`

- [ ] **Step 1: Add failing assertions for independent page headers and content panels**
- [ ] **Step 2: Run the targeted Vitest files and verify they fail for missing structure**
- [ ] **Step 3: Update the admin page components to use shared page-stage / panel wrappers**
- [ ] **Step 4: Re-run the same tests and verify they pass**

## Chunk 2: Shared Styling

### Task 3: Refresh shared admin CSS tokens and surfaces

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Refine `.admin-shell*`, `.admin-page*`, `.admin-panel*`, table, button, and form classes toward the editorial workspace layout**
- [ ] **Step 2: Add responsive behavior for the narrower rail and stacked mobile layout**
- [ ] **Step 3: Re-run the admin layout/page tests to confirm structure still matches**

### Task 4: Follow-through on secondary pages

**Files:**
- Modify: `app/admin/categories/page.jsx`
- Modify: `app/admin/tags/page.jsx`
- Modify: `app/admin/posts/new/page.jsx`
- Modify: `app/admin/posts/[id]/page.jsx`

- [ ] **Step 1: Move these pages onto the same panel and header primitives without changing data behavior**
- [ ] **Step 2: Run the relevant existing tests to confirm markup still contains required inputs/actions**

## Chunk 3: Verification

### Task 5: Final validation

**Files:**
- No code changes unless fixes are needed

- [ ] **Step 1: Run `node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/app/admin-layout.test.js tests/app/admin-dashboard.test.jsx tests/app/admin-posts-page.test.jsx tests/app/admin-comments-page.test.jsx tests/app/admin-taxonomy.test.jsx tests/app/admin-post-form.test.jsx`**
- [ ] **Step 2: Run `npm run build`**
- [ ] **Step 3: If either command fails, fix the smallest relevant issue and repeat**
