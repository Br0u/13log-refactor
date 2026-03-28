# Legacy Photo Import Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the old `Random`, `April`, and `Again` photo albums from the repository's existing static image files into the current DB-backed Photos system.

**Architecture:** Keep the legacy album mapping in a focused import module, expose a one-shot script that can be rerun safely, and rely on existing photo/category repositories so the imported records immediately feed the current `/api/photos` and admin flows. The import must create or reuse the three legacy albums first, and it must be idempotent using the canonical public image path (for example `/images/gallery/...`) as the non-null `pathname` key so reruns do not duplicate photos.

**Tech Stack:** Node.js scripts, Prisma repositories, Vitest

---

## Chunk 1: Legacy Import Support

### Task 1: Capture the legacy album mapping in testable code

**Files:**
- Create: `lib/legacy-photo-import.js`
- Create: `tests/lib/legacy-photo-import.test.js`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Add the legacy album definitions and import helper**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: Add a rerunnable import script

**Files:**
- Create: `scripts/import-legacy-photos.mjs`
- Modify: `package.json`
- Test: `tests/lib/legacy-photo-import.test.js`

- [ ] **Step 1: Extend the failing test to cover duplicate-skipping behavior**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Add the script and wire a package command**
- [ ] **Step 4: Run test to verify it passes**

## Chunk 2: Execute And Verify

### Task 3: Run the import against the current database

**Files:**
- No code changes expected

- [ ] **Step 1: Execute the import script**
- [ ] **Step 2: Check created album/photo counts and sample records**
- [ ] **Step 3: Check the imported categories keep the original `Random / April / Again` sort order**

### Task 4: Verify the existing photos flow still reads imported data

**Files:**
- Test: `tests/app/api/photos-route.test.js`
- Test: `tests/lib/repositories/photos.test.js`

- [ ] **Step 1: Run the targeted test suite**
- [ ] **Step 2: Query the live DB or `/api/photos` data and confirm the imported albums/photos appear in the expected order**
- [ ] **Step 3: Confirm green results and imported data summary**
