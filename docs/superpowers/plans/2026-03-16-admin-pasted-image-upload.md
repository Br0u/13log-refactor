# Admin Pasted Image Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add direct clipboard image upload to the admin markdown editor so post and micro-post editing can insert hosted Markdown images without touching the repo.

**Architecture:** Extend the shared markdown editor with paste-aware upload handling, add a small authenticated admin upload route backed by a thin Vercel Blob storage wrapper, and persist uploaded image metadata in a minimal `MediaAsset` table. Keep the feature narrow so the same editor powers both post and micro-post flows without building a separate media UI.

**Tech Stack:** Next.js App Router, React client components, Prisma, Vitest, Vercel Blob.

---

## Chunk 1: Lock the New Behavior in Tests

### Task 1: Add editor regression tests for image paste upload

**Files:**
- Modify: `tests/components/markdown-editor-field.test.jsx`
- Modify: `components/admin/MarkdownEditorField.jsx`

- [ ] **Step 1: Write the failing tests**
Add assertions covering:
```jsx
it("uploads a pasted image and inserts markdown at the caret", async () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ url: "https://blob.example/test.png" }),
  }));
  vi.stubGlobal("fetch", fetchMock);

  render(<MarkdownEditorField name="markdown" label="Markdown" initialValue="hello " mode="post" />);
  const textbox = screen.getByRole("textbox", { name: "Markdown" });
  textbox.setSelectionRange(6, 6);

  const file = new File(["png"], "pasted.png", { type: "image/png" });
  fireEvent.paste(textbox, {
    clipboardData: {
      items: [{ kind: "file", type: "image/png", getAsFile: () => file }],
    },
  });

  await waitFor(() => {
    expect(screen.getByRole("textbox", { name: "Markdown" }).value)
      .toBe("hello ![image](https://blob.example/test.png)");
  });
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**
Run:
```bash
node ./node_modules/vitest/vitest.mjs run tests/components/markdown-editor-field.test.jsx
```
Expected: FAIL because the editor does not yet handle pasted image uploads.

- [ ] **Step 3: Implement the minimal editor upload behavior**
Add paste handling, upload state, helper copy, and markdown insertion in `components/admin/MarkdownEditorField.jsx`.

- [ ] **Step 4: Re-run the same test and verify it passes**

### Task 2: Add upload route validation tests

**Files:**
- Create: `tests/app/api/admin-image-upload.test.js`
- Create: `app/api/admin/uploads/image/route.js`
- Create: `lib/media-storage.js`
- Create: `lib/repositories/media-assets.js`

- [ ] **Step 1: Write the failing tests**
Cover:
```js
it("rejects upload requests without a valid admin session", async () => {
  // expect 401
});

it("rejects non-image files", async () => {
  // expect 400
});

it("returns uploaded image metadata for authenticated image uploads", async () => {
  // mock storage helper + metadata repo, expect 200 with url payload
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**
Run:
```bash
node ./node_modules/vitest/vitest.mjs run tests/app/api/admin-image-upload.test.js
```
Expected: FAIL because the route and helper modules do not exist yet.

- [ ] **Step 3: Implement the minimal route, storage, and metadata write path**
Keep storage logic behind `lib/media-storage.js` and metadata persistence behind `lib/repositories/media-assets.js`.

- [ ] **Step 4: Re-run the same test and verify it passes**

## Chunk 2: Add Persistence and Storage Wiring

### Task 3: Add the `MediaAsset` model and repository

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/repositories/media-assets.js`
- Create: `tests/lib/repositories/media-assets.test.js`

- [ ] **Step 1: Write the failing repository test**
Add a focused test that proves:
```js
const asset = await createMediaAsset({
  url: "https://blob.example/test.png",
  pathname: "admin-images/test.png",
  mimeType: "image/png",
  size: 1234,
  width: 800,
  height: 600,
});

expect(asset.url).toBe("https://blob.example/test.png");
```

- [ ] **Step 2: Run the targeted test and verify it fails**
Run:
```bash
node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/lib/repositories/media-assets.test.js
```
Expected: FAIL because the Prisma model and repository are missing.

- [ ] **Step 3: Implement the Prisma model and repository**
Add the model, generate the client, and keep the repository API minimal:
```js
export async function createMediaAsset(input) {
  return db.mediaAsset.create({ data: input });
}
```

- [ ] **Step 4: Re-run the same test and verify it passes**

### Task 4: Wire the route to storage and metadata persistence

**Files:**
- Modify: `app/api/admin/uploads/image/route.js`
- Modify: `lib/media-storage.js`
- Modify: `lib/repositories/media-assets.js`
- Modify: `tests/app/api/admin-image-upload.test.js`

- [ ] **Step 1: Add assertions for metadata persistence in the route test**
- [ ] **Step 2: Run `node ./node_modules/vitest/vitest.mjs run tests/app/api/admin-image-upload.test.js` and verify it fails for the missing write**
- [ ] **Step 3: Update the route so successful uploads create a `MediaAsset` record before returning JSON**
- [ ] **Step 4: Re-run the same test and verify it passes**

## Chunk 3: Finish UX and Verification

### Task 5: Polish editor feedback without changing scope

**Files:**
- Modify: `components/admin/MarkdownEditorField.jsx`
- Modify: `tests/components/markdown-editor-field.test.jsx`

- [ ] **Step 1: Add failing assertions for helper copy, pending state, and failed upload messaging**
- [ ] **Step 2: Run `node ./node_modules/vitest/vitest.mjs run tests/components/markdown-editor-field.test.jsx` and verify they fail**
- [ ] **Step 3: Implement the smallest UI updates needed to satisfy the tests**
- [ ] **Step 4: Re-run the same test and verify it passes**

### Task 6: Final targeted verification

**Files:**
- No code changes unless fixes are needed

- [ ] **Step 1: Run**
```bash
node ./node_modules/vitest/vitest.mjs run tests/components/markdown-editor-field.test.jsx tests/app/api/admin-image-upload.test.js
```
- [ ] **Step 2: If a database URL is available, also run**
```bash
node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/lib/repositories/media-assets.test.js
```
- [ ] **Step 3: Run**
```bash
npm run build
```
- [ ] **Step 4: If any command fails, fix the smallest relevant issue and repeat**
