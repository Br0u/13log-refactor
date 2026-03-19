# Photos Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Photos page with a database-backed gallery managed from admin, including image upload and photo categories.

**Architecture:** Add dedicated `Photo` and `PhotoCategory` models so the gallery stays separate from generic media assets and post categories. Reuse the existing admin image upload storage path, add photo repositories and admin server actions for CRUD, then render `/photos` from published photo records with category filtering.

**Tech Stack:** Next.js App Router, React server/client components, Prisma/PostgreSQL, Vitest, existing admin session and upload utilities.

---

## Chunk 1: Data model and repository layer

### Task 1: Add failing repository and route tests

**Files:**
- Modify: `tests/app/public-content.test.js`
- Create: `tests/app/admin-photos-page.test.jsx`
- Create: `tests/app/admin-photo-actions.test.js`
- Create: `tests/lib/repositories/photos.test.js`

- [ ] Step 1: Write failing tests for listing published photos, creating a photo with category validation, and rendering the admin photos page.
- [ ] Step 2: Run the targeted Vitest commands and confirm failures mention missing photo repository/model behavior.
- [ ] Step 3: Commit the failing tests.

### Task 2: Add Prisma models and repositories

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_photos/migration.sql`
- Create: `lib/repositories/photo-categories.js`
- Create: `lib/repositories/photos.js`

- [ ] Step 1: Add `PhotoCategory` and `Photo` models with title, caption, imageUrl, status, category, publishedAt, sortOrder, and timestamps.
- [ ] Step 2: Implement repository helpers for listing categories, creating photos, listing admin photos, and listing published photos grouped/order-ready for `/photos`.
- [ ] Step 3: Run repository-focused tests until they pass.
- [ ] Step 4: Commit the schema and repository layer.

## Chunk 2: Admin management flow

### Task 3: Add admin actions and Photos page

**Files:**
- Modify: `app/admin/actions.js`
- Modify: `app/admin/(protected)/layout.jsx`
- Create: `app/admin/(protected)/photos/page.jsx`
- Create: `components/admin/AdminPhotoForm.jsx`
- Create: `components/admin/AdminPhotoCategoryForm.jsx`

- [ ] Step 1: Write failing admin tests covering page rendering, form submission validation, and category selection.
- [ ] Step 2: Add a Photos nav item and build an admin page with upload/create form plus a simple existing-photo list.
- [ ] Step 3: Add server actions for creating photo categories and photo records after upload.
- [ ] Step 4: Run admin photo tests until they pass.
- [ ] Step 5: Commit the admin flow.

### Task 4: Connect upload to photo creation UX

**Files:**
- Modify: `components/admin/MarkdownEditorField.jsx` (only if shared upload helpers are worth extracting)
- Modify: `app/api/admin/uploads/image/route.js` (only if metadata response needs extension)
- Create or Modify: `components/admin/AdminPhotoForm.jsx`

- [ ] Step 1: Reuse the current image upload endpoint from the new admin photo form.
- [ ] Step 2: Ensure uploaded image metadata flows into photo creation without affecting post editor behavior.
- [ ] Step 3: Run the admin upload/photo tests until they pass.
- [ ] Step 4: Commit any shared upload integration changes.

## Chunk 3: Frontend Photos page

### Task 5: Replace static redirect with gallery page

**Files:**
- Modify: `app/photos/page.js`
- Create: `components/photos/PhotosGallery.jsx`
- Create: `components/photos/PhotosGalleryFilters.jsx`
- Modify: `app/globals.css` or `app/papermod-custom.css`
- Modify: `tests/app/public-content.test.js`
- Create: `tests/components/photos-gallery.test.jsx`

- [ ] Step 1: Add failing tests for `/photos` rendering published photos and category filters.
- [ ] Step 2: Replace the redirect page with a real gallery view powered by the photo repository.
- [ ] Step 3: Add responsive gallery styling with category chips and a stronger visual hierarchy than the current static page.
- [ ] Step 4: Run photo page tests until they pass.
- [ ] Step 5: Commit the frontend gallery.

## Chunk 4: Verification

### Task 6: End-to-end verification

**Files:**
- Modify: relevant files above only if fixes are needed

- [ ] Step 1: Run the targeted Vitest suite for admin photos, repositories, and public photos rendering.
- [ ] Step 2: Run Prisma generate/migrate commands if required by the schema change.
- [ ] Step 3: Sanity-check that existing post image upload tests still pass.
- [ ] Step 4: Commit final fixes.
