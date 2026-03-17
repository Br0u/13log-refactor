# Post Image Rendering Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade standalone Markdown images into styled blog illustration figures with optional captions.

**Architecture:** Keep the current Markdown pipeline, but add a narrow HTML post-processing step that upgrades image-only paragraphs into figure markup. Style that markup in the article CSS without disturbing inline images or unrelated content blocks.

**Tech Stack:** unified/remark/rehype Markdown rendering, CSS, Vitest.

---

### Task 1: Lock standalone image rendering in tests

**Files:**
- Modify: `tests/lib/markdown.test.js`

- [ ] **Step 1: Write failing tests for standalone image figure conversion and caption behavior**
- [ ] **Step 2: Run `node ./node_modules/vitest/vitest.mjs run tests/lib/markdown.test.js` and verify they fail**
- [ ] **Step 3: Implement the minimal Markdown post-processing in `lib/markdown.js`**
- [ ] **Step 4: Re-run the same test and verify it passes**

### Task 2: Style upgraded figure blocks

**Files:**
- Modify: `app/papermod-custom.css`

- [ ] **Step 1: Add blog-illustration styles for `.post-figure*` while keeping generic image rules safe**
- [ ] **Step 2: Re-run `node ./node_modules/vitest/vitest.mjs run tests/lib/markdown.test.js` to confirm no rendering regressions**

### Task 3: Final verification

**Files:**
- No code changes unless needed

- [ ] **Step 1: Run `node ./node_modules/vitest/vitest.mjs run tests/lib/markdown.test.js tests/app/api/admin-markdown-preview.test.js`**
- [ ] **Step 2: If needed, run `npm run build` with the configured environment**
