# Admin Photo Edit/Delete Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins edit photo metadata and delete photos from the album management flow.

**Architecture:** Reuse the existing admin photo form for both upload and edit, add repository helpers for single-photo read/update/delete, and wire server actions so the album page offers `Edit` and `Delete` controls while a dedicated photo edit page handles metadata updates.

**Tech Stack:** Next.js App Router, server actions, Prisma repositories, Vitest

---

### Task 1: Add failing tests for photo management behavior

**Files:**
- Modify: `tests/app/admin-photo-album-page.test.jsx`
- Create: `tests/app/admin-edit-photo-page.test.jsx`
- Modify: `tests/app/admin-actions-cache.test.js`
- Modify: `tests/lib/repositories/photos.test.js`
- Modify: `tests/components/admin-photo-form.test.jsx`

- [ ] **Step 1: Write failing tests for edit/delete links, edit page rendering, photo actions, and repository helpers**
- [ ] **Step 2: Run the targeted tests to verify they fail**

### Task 2: Implement photo editing and deletion

**Files:**
- Modify: `components/admin/AdminPhotoForm.jsx`
- Modify: `lib/repositories/photos.js`
- Modify: `app/admin/actions.js`
- Modify: `app/admin/(protected)/photos/[id]/page.jsx`
- Create: `app/admin/(protected)/photos/album/[albumId]/[photoId]/page.jsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add minimal repository support for reading/updating/deleting photos**
- [ ] **Step 2: Extend the admin photo form for edit mode without breaking upload mode**
- [ ] **Step 3: Add the edit page and card actions on the album page**
- [ ] **Step 4: Run the targeted tests to verify they pass**
