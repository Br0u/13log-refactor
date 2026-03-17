# Micropost Like Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent, one-like-per-visitor heart likes to micropost cards in the public timeline.

**Architecture:** Mirror the existing post-like stack with a micropost-specific persistence path instead of refactoring both systems into a shared abstraction. Expose stored like counts through public timeline mapping, add a dedicated micropost like API route, and render a compact heart button that does not interfere with card focus behavior.

**Tech Stack:** Next.js App Router, Prisma, PostgreSQL, React, Vitest, Testing Library.

---

## Chunk 1: Persistence and API

### Task 1: Add micropost like persistence to Prisma

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_micro_post_likes/migration.sql`
- Test: `tests/lib/repositories/likes.test.js`

- [ ] **Step 1: Write the failing repository test**

Add a micropost-specific test to `tests/lib/repositories/likes.test.js` asserting:

```js
await createMicroPostLike({ id: microPost.id, visitorKey: "visitor-1" });
await createMicroPostLike({ id: microPost.id, visitorKey: "visitor-1" });
await expect(getMicroPostLikeCount(microPost.id)).resolves.toBe(1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/lib/repositories/likes.test.js`
Expected: FAIL because micropost like helpers/schema do not exist yet.

- [ ] **Step 3: Add the minimal schema changes**

Update `prisma/schema.prisma` with:

```prisma
model MicroPost {
  id          String         @id @default(cuid())
  content     String
  status      PostStatus     @default(DRAFT)
  publishedAt DateTime?
  tags        MicroPostTag[]
  likes       MicroPostLike[]
  likeCount   Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model MicroPostLike {
  id         String    @id @default(cuid())
  microPostId String
  visitorKey String
  microPost  MicroPost @relation(fields: [microPostId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())

  @@unique([microPostId, visitorKey])
}
```

Generate the matching SQL migration.

- [ ] **Step 4: Re-run the repository test**

Run: `node ./node_modules/vitest/vitest.mjs run tests/lib/repositories/likes.test.js`
Expected: still FAIL, now because repository logic is missing.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations tests/lib/repositories/likes.test.js
git commit -m "feat: add micropost like persistence schema"
```

### Task 2: Implement micropost like repository helpers

**Files:**
- Modify: `lib/repositories/likes.js`
- Modify: `tests/lib/repositories/likes.test.js`

- [ ] **Step 1: Implement the minimal repository helpers**

Add helpers parallel to the post path:

```js
async function getPublishedMicroPostRecord(id) {
  return db.microPost.findFirst({
    where: {
      id,
      status: "PUBLISHED",
    },
  });
}

export async function createMicroPostLike({ id, visitorKey }) {
  // mirror createPostLike with MicroPostLike + likeCount
}

export async function getMicroPostLikeCount(id) {
  // return stored likeCount for published micropost
}
```

- [ ] **Step 2: Re-run the repository test**

Run: `node ./node_modules/vitest/vitest.mjs run tests/lib/repositories/likes.test.js`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/repositories/likes.js tests/lib/repositories/likes.test.js
git commit -m "feat: add micropost like repository"
```

### Task 3: Add micropost like API route

**Files:**
- Create: `app/api/micro-posts/[id]/like/route.js`
- Modify: `tests/app/api/posts-like.test.js`
- Create: `tests/app/api/micro-posts-like.test.js`

- [ ] **Step 1: Write the failing API test**

Create `tests/app/api/micro-posts-like.test.js` asserting:

```js
const request = new Request("http://localhost:3000/api/micro-posts/<id>/like", {
  method: "POST",
  headers: { cookie: "visitor_key=api-visitor" },
});
const response = await likeRoute(request, { params: Promise.resolve({ id: microPost.id }) });
expect(response.status).toBe(200);
expect((await response.json()).count).toBe(1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/app/api/micro-posts-like.test.js`
Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the minimal route**

Create `app/api/micro-posts/[id]/like/route.js` by mirroring the existing post-like route:
- resolve `visitor_key` from cookies or mint one
- call `createMicroPostLike({ id, visitorKey })`
- return `{ count: result.likeCount }`

- [ ] **Step 4: Re-run the API test**

Run: `node ./node_modules/vitest/vitest.mjs run tests/app/api/micro-posts-like.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/micro-posts/[id]/like/route.js tests/app/api/micro-posts-like.test.js
git commit -m "feat: add micropost like api"
```

## Chunk 2: Public data and UI

### Task 4: Expose micropost like counts in public timeline mapping

**Files:**
- Modify: `lib/public-content.js`
- Modify: `tests/lib/public-content.test.js`

- [ ] **Step 1: Write the failing public-content test**

Add a test covering a published micropost with likes:

```js
expect(entries.find((entry) => entry.type === "micro")?.likeCount).toBe(1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/lib/public-content.test.js`
Expected: FAIL because microposts are still mapped with `likeCount: 0`.

- [ ] **Step 3: Implement the minimal mapping change**

In `lib/public-content.js`, change:

```js
likeCount: post.likeCount || 0,
```

for micropost mapping and ensure published micropost queries include the field.

- [ ] **Step 4: Re-run the test**

Run: `node ./node_modules/vitest/vitest.mjs run tests/lib/public-content.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/public-content.js tests/lib/public-content.test.js
git commit -m "feat: expose micropost like counts"
```

### Task 5: Render a compact heart like button in micropost cards

**Files:**
- Create: `components/blog/MicroPostLikeButton.jsx`
- Modify: `components/blog/PostPreviewCard.jsx`
- Modify: `app/papermod-custom.css`
- Modify: `tests/components/post-preview-card.test.jsx`
- Modify: `tests/components/posts-timeline-styles.test.js`

- [ ] **Step 1: Write the failing component test**

Extend `tests/components/post-preview-card.test.jsx` with a micropost like assertion:

```js
expect(markup).toContain("micro-post-like-button");
expect(markup).toContain("♡");
expect(markup).toContain(">3<");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/post-preview-card.test.jsx`
Expected: FAIL because micropost cards do not render the like button.

- [ ] **Step 3: Implement the minimal UI**

Create `components/blog/MicroPostLikeButton.jsx`:

```jsx
"use client";

import React, { useState } from "react";

export default function MicroPostLikeButton({ id, initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleLike(event) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/micro-posts/${encodeURIComponent(id)}/like`, { method: "POST" });
      const body = await response.json();
      if (response.ok) setCount(body.count);
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className="micro-post-like-button" onClick={handleLike} disabled={pending}>
      <span aria-hidden="true" className="micro-post-like-button__icon">♡</span>
      <span className="micro-post-like-button__count">{count}</span>
    </button>
  );
}
```

Render it from `PostPreviewCard.jsx` inside `.post-preview-card__micro-meta`.
Add minimal CSS in `app/papermod-custom.css` so it reads as a quiet footer action.

- [ ] **Step 4: Re-run the component/style tests**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/post-preview-card.test.jsx tests/components/posts-timeline-styles.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/blog/MicroPostLikeButton.jsx components/blog/PostPreviewCard.jsx app/papermod-custom.css tests/components/post-preview-card.test.jsx tests/components/posts-timeline-styles.test.js
git commit -m "feat: add micropost heart like button"
```

### Task 6: Ensure micropost like clicks do not toggle focus and do update count

**Files:**
- Modify: `tests/components/posts-timeline.test.jsx`
- Modify: `components/blog/PostPreviewCard.jsx`
- Modify: `components/blog/MicroPostLikeButton.jsx`

- [ ] **Step 1: Write the failing interaction tests**

Add tests that:

```js
fireEvent.click(screen.getByTestId("timeline-card-micro-1-like"));
expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("");
```

for idle state, and:

```js
fireEvent.click(screen.getByTestId("timeline-card-micro-1"));
fireEvent.click(screen.getByTestId("timeline-card-micro-1-like"));
expect(screen.getByTestId("posts-timeline").getAttribute("data-micro-focus")).toBe("micro-1");
```

Also mock `fetch` so a successful response updates the visible count.

- [ ] **Step 2: Run test to verify it fails**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/posts-timeline.test.jsx`
Expected: FAIL because the like control is not isolated yet.

- [ ] **Step 3: Implement the minimal interaction fixes**

Pass `dataTestId` into `MicroPostLikeButton`, ensure the button stops propagation, and keep the parent card click handler unchanged.

- [ ] **Step 4: Re-run the timeline interaction test**

Run: `node ./node_modules/vitest/vitest.mjs run tests/components/posts-timeline.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/components/posts-timeline.test.jsx components/blog/PostPreviewCard.jsx components/blog/MicroPostLikeButton.jsx
git commit -m "fix: isolate micropost like clicks from focus behavior"
```

## Chunk 3: Verification

### Task 7: Final verification

**Files:**
- No code changes unless needed

- [ ] **Step 1: Run targeted verification**

Run:

```bash
node ./node_modules/vitest/vitest.mjs run \
  tests/lib/repositories/likes.test.js \
  tests/app/api/micro-posts-like.test.js \
  tests/lib/public-content.test.js \
  tests/components/post-preview-card.test.jsx \
  tests/components/posts-timeline.test.jsx \
  tests/components/posts-timeline-styles.test.js
```

Expected: PASS.

- [ ] **Step 2: Run broader regression checks**

Run:

```bash
node ./node_modules/vitest/vitest.mjs run \
  tests/app/api/posts-like.test.js \
  tests/app/post-detail-interactions.test.jsx
```

Expected: PASS, confirming the existing post-like path still works.

- [ ] **Step 3: Commit any final fixes if needed**

```bash
git add <changed-files>
git commit -m "test: verify micropost likes"
```
