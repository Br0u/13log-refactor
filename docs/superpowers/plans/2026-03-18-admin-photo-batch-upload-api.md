# Admin Photo Batch Upload API Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make admin photo batch upload resilient on mobile by moving raw file transfer off Server Actions.

**Architecture:** Keep the existing authenticated image upload API for binary transfer, add an authenticated admin photos metadata API for record creation, and switch the album upload form to a client-side two-step flow: upload each file first, then submit only uploaded URLs and metadata.

**Tech Stack:** Next.js App Router, route handlers, client React form logic, Vitest

---

### Task 1: Add failing tests for the new batch-upload flow

**Files:**
- Create: `tests/app/api/admin-photos-route.test.js`
- Create: `tests/components/admin-photo-form-client.test.jsx`
- Modify: `tests/app/api/admin-image-upload.test.js`

- [ ] **Step 1: Write failing tests for admin photo metadata creation, client-side upload flow, and larger single-image acceptance**
- [ ] **Step 2: Run the targeted tests to verify they fail**

### Task 2: Implement the two-step upload flow

**Files:**
- Create: `app/api/admin/photos/route.js`
- Modify: `components/admin/AdminPhotoForm.jsx`
- Modify: `app/admin/(protected)/photos/[id]/page.jsx`
- Modify: `app/api/admin/uploads/image/route.js`

- [ ] **Step 1: Add the authenticated metadata API for batch photo creation**
- [ ] **Step 2: Switch album upload form to client-side upload + metadata submit**
- [ ] **Step 3: Raise the single-image API limit to a practical value**
- [ ] **Step 4: Run the targeted tests to verify they pass**
