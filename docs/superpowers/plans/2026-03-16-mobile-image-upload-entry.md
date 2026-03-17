# Mobile Image Upload Entry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let mobile users upload images from the shared admin markdown editor using a compact picker button.

**Architecture:** Extend `MarkdownEditorField` with a hidden image file input and a compact trigger button, then reuse the existing upload-and-insert flow already used by clipboard paste handling.

**Tech Stack:** React client components, existing admin upload API, Vitest, Testing Library.

---

### Task 1: Lock picker upload behavior in tests

**Files:**
- Modify: `tests/components/markdown-editor-field.test.jsx`

- [ ] **Step 1: Add failing tests for picker-triggered upload and markdown insertion**
- [ ] **Step 2: Run `node ./node_modules/vitest/vitest.mjs run tests/components/markdown-editor-field.test.jsx` and verify they fail**
- [ ] **Step 3: Implement the minimal editor changes in `components/admin/MarkdownEditorField.jsx`**
- [ ] **Step 4: Re-run the same test and verify it passes**

### Task 2: Final verification

**Files:**
- No code changes unless needed

- [ ] **Step 1: Run `node ./node_modules/vitest/vitest.mjs run tests/components/markdown-editor-field.test.jsx tests/app/api/admin-image-upload.test.js tests/app/api/admin-markdown-preview.test.js`**
- [ ] **Step 2: Run `npm run build`**
