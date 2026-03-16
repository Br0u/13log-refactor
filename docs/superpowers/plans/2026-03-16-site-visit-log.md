# Site Visit Log Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight public-site visit log that records visit time, page path, referer, and masked IP information, then expose it inside admin.

**Architecture:** Track visits from a small client component mounted in the root layout and send them to a server API route. Persist the records in Prisma, filter out admin/API/static paths, and render a simple admin visits page with recent entries and a few summary numbers.

**Tech Stack:** Next.js App Router, React client component, Prisma/PostgreSQL, Vitest

---

### Task 1: Add the visit-log data model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_visit_logs/migration.sql`

- [ ] Add a `VisitLog` model with `path`, `referer`, `ipSummary`, `userAgent`, and `createdAt`
- [ ] Add indexes for `createdAt` and `path`
- [ ] Apply the migration and regenerate Prisma client

### Task 2: Capture lightweight visit events

**Files:**
- Create: `lib/repositories/visit-logs.js`
- Create: `app/api/visits/route.js`
- Create: `app/components/VisitTracker.jsx`
- Modify: `app/layout.js`
- Test: `tests/app/api/visits.test.js`

- [ ] Add helpers for path filtering and IP masking
- [ ] Add a POST route that stores public-page visits only
- [ ] Mount a tiny client tracker in the root layout that reports pathname changes
- [ ] Verify API behavior with route tests

### Task 3: Show logs in admin

**Files:**
- Create: `app/admin/visits/page.jsx`
- Modify: `app/admin/layout.jsx`
- Modify: `app/admin/page.jsx`
- Modify: `app/globals.css`
- Test: `tests/app/admin-visits-page.test.jsx`
- Test: `tests/app/admin-layout.test.js`
- Test: `tests/app/admin-dashboard.test.jsx`

- [ ] Add an admin page with summary cards and a recent visits table
- [ ] Add the page to the admin nav and dashboard links
- [ ] Keep the UI aligned with the existing admin table/card patterns

### Task 4: Verify

**Files:**
- Test: `tests/app/api/visits.test.js`
- Test: `tests/app/admin-visits-page.test.jsx`
- Test: `tests/app/admin-layout.test.js`
- Test: `tests/app/admin-dashboard.test.jsx`

- [ ] Run focused tests for the new route and admin surfaces
- [ ] Confirm Prisma client and database migration are in sync
