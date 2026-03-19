# Photo Album Status Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move photo publish state from individual photos to albums so public photos only depend on album status.

**Architecture:** Add `status` to `PhotoCategory`, update admin album management to edit that field, and remove per-photo status controls from photo create/edit flows. Keep `Photo.status` in place for compatibility, but stop using it for public visibility and stop exposing it in admin UI.

**Tech Stack:** Next.js App Router, React, Prisma, Vitest

---

### Task 1: Lock the new behavior with tests

**Files:**
- Modify: `tests/lib/repositories/photo-categories.test.js`
- Modify: `tests/lib/repositories/photos.test.js`
- Modify: `tests/app/api/photos-route.test.js`
- Modify: `tests/components/admin-photo-category-form.test.jsx`
- Modify: `tests/components/admin-photo-form.test.jsx`
- Modify: `tests/app/admin-photos-page.test.jsx`
- Modify: `tests/app/admin-edit-photo-page.test.jsx`

- [ ] **Step 1: Write failing tests for album status and removed photo status fields**
- [ ] **Step 2: Run targeted Vitest command and confirm the new assertions fail for the expected reasons**

### Task 2: Implement album-level status

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/repositories/photo-categories.js`
- Modify: `lib/repositories/photos.js`
- Modify: `app/api/photos/route.js`
- Modify: `components/admin/AdminPhotoCategoryForm.jsx`
- Modify: `components/admin/AdminPhotoForm.jsx`
- Modify: `app/admin/(protected)/photos/page.jsx`
- Modify: `app/admin/(protected)/photos/[id]/page.jsx`
- Modify: `app/admin/(protected)/photos/album/[albumId]/[photoId]/page.jsx`
- Modify: `app/admin/actions.js`

- [ ] **Step 1: Add album status support in schema/repositories**
- [ ] **Step 2: Filter public photos by published albums instead of published photos**
- [ ] **Step 3: Remove per-photo status controls from admin photo forms and pages**
- [ ] **Step 4: Add album status controls to admin album management**

### Task 3: Migrate and verify data

**Files:**
- Create: `prisma/migrations/20260318190000_add_photo_album_status/migration.sql`

- [ ] **Step 1: Add the Prisma migration for album status**
- [ ] **Step 2: Run Prisma generate and migrate**
- [ ] **Step 3: Update the `Car` album to `PUBLISHED` so its photos appear publicly**
- [ ] **Step 4: Run the targeted Vitest suite and confirm everything is green**
