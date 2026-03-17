# Admin Pasted Image Upload Design

## Goal

Let admin users paste images directly into the post or micro-post editor, upload them immediately, and insert Markdown image syntax without touching the local project or GitHub.

## Confirmed Product Decisions

- The primary interaction is pasting an image directly into the editor.
- Inserted Markdown should use standard image syntax: `![image](url)`.
- The same editing experience should work for both regular posts and micro posts.
- Image files should not be stored in PostgreSQL as binary data.
- Uploaded files should live in object storage.
- This project should use Vercel Blob first.
- The implementation should support future storage replacement behind a thin abstraction.
- This scope does not include a media library UI, drag-and-drop upload, or image deletion flows.

## Current State

### Editor capabilities

[`MarkdownEditorField.jsx`](/Users/brou/Documents/Project/13log-refactor/components/admin/MarkdownEditorField.jsx) currently provides a textarea plus preview tabs. It does not handle clipboard images, upload progress, or Markdown insertion helpers.

### Post and micro-post support

[`AdminPostForm.jsx`](/Users/brou/Documents/Project/13log-refactor/components/admin/AdminPostForm.jsx) and [`AdminMicroPostForm.jsx`](/Users/brou/Documents/Project/13log-refactor/components/admin/AdminMicroPostForm.jsx) both use the same markdown field, so editor-level changes can cover both surfaces.

### Rendering support

[`lib/markdown.js`](/Users/brou/Documents/Project/13log-refactor/lib/markdown.js) already renders Markdown images for both posts and micro posts. No additional public rendering work is needed to display uploaded images.

### Storage support

The project has no existing upload service or media table. Current database models only store string image paths such as `Post.coverImage`.

## Recommended Architecture

### 1. Extend the shared admin editor

Add clipboard image handling directly inside [`MarkdownEditorField.jsx`](/Users/brou/Documents/Project/13log-refactor/components/admin/MarkdownEditorField.jsx).

Behavior:

- listen for `paste` on the textarea
- inspect clipboard items for image files
- allow normal paste behavior when no image is present
- when an image is present, prevent the default paste, upload the file, and insert Markdown at the current selection
- show a short hint that image paste is supported
- show a focused uploading state and clear failure messaging

This keeps the feature in one place and automatically enables it for both post and micro-post editing.

### 2. Add an authenticated admin upload route

Create a dedicated route for image uploads, for example:

- `/api/admin/uploads/image`

Responsibilities:

- verify the admin session using the same cookie/session flow already used by other admin APIs
- parse multipart form data
- reject non-image MIME types
- reject files above a conservative size limit
- upload the file to Vercel Blob
- return a JSON payload with the uploaded image metadata

Recommended response shape:

- `url`
- `pathname`
- `mimeType`
- `size`
- `width`
- `height`

### 3. Store media metadata in the database

Add a minimal `MediaAsset` table that records uploaded image metadata without coupling uploads to a specific post or micro post.

Recommended fields:

- `id`
- `url`
- `pathname`
- `mimeType`
- `size`
- `width`
- `height`
- `createdAt`
- `updatedAt`

Intentionally omitted for now:

- post association
- micro-post association
- alt text
- foldering
- deletion status

This keeps the initial data model small while preserving a record of uploaded assets for future admin tooling.

### 4. Keep storage behind a thin boundary

Create a small storage module, for example under `lib/`, that hides the specific Vercel Blob call from the route handler.

That module should accept:

- file buffer or file object
- content type
- filename hint

And return:

- blob URL
- blob pathname
- metadata needed by the route

This avoids scattering Vercel-specific logic through the codebase and makes a later move to S3 or R2 manageable.

## Data Flow

1. Admin focuses the markdown textarea in either the post or micro-post form.
2. Admin pastes an image from the clipboard.
3. The editor detects an image item and blocks default paste behavior for that event.
4. The editor uploads the image to the authenticated admin upload route.
5. The route validates session, file type, and file size.
6. The route sends the file to Vercel Blob through the storage helper.
7. The route writes a `MediaAsset` record with the returned metadata.
8. The route returns the uploaded image URL.
9. The editor inserts `![image](url)` at the current cursor or selection.
10. The existing preview flow renders the inserted Markdown image.

## Error Handling

### Client-side

- If the clipboard contains no image, do nothing special.
- If an upload is already in progress, ignore additional image paste attempts until the current one finishes.
- If upload fails, keep the textarea value unchanged and show a short error message.
- If the response payload is malformed, treat it as a failed upload.

### Server-side

- Unauthenticated requests return `401`.
- Unsupported file types return `400`.
- Oversized files return `400`.
- Storage failures return `500`.
- Database write failure after blob upload should surface a server error; cleanup can be deferred in this first version.

## UX Details

### Editor copy

Add short helper text near the textarea:

- `Paste an image to upload and insert it here.`

### Upload state

While uploading:

- show a compact status message
- disable repeat image upload from the same field
- keep the rest of the form usable

### Markdown insertion behavior

The inserted text should be:

```md
![image](https://...)
```

Insertion rules:

- replace the current selection if text is selected
- otherwise insert at the caret position
- move the caret to the end of the inserted Markdown

## Testing Strategy

### Component tests

- image paste triggers an upload request and inserts returned Markdown
- text-only paste does not trigger upload logic
- upload failure shows an error and preserves editor content
- upload state prevents duplicate image uploads while pending

### API tests

- unauthenticated upload is rejected
- non-image upload is rejected
- oversized upload is rejected
- successful upload returns the expected JSON payload

### Repository and persistence tests

- uploaded metadata is saved to `MediaAsset`

## Implementation Boundaries

Included:

- shared editor paste-upload behavior
- authenticated admin image upload route
- Vercel Blob-backed storage helper
- minimal `MediaAsset` Prisma model and persistence
- targeted tests for editor and upload flow

Excluded:

- drag-and-drop upload
- file picker upload button
- media library browsing UI
- image deletion or blob cleanup tooling
- relational linking from images to posts or micro posts

## Risks

### Deployment configuration

The feature depends on working Vercel Blob environment configuration. Missing tokens or misconfigured environments should fail loudly in testing and deployment.

### Clipboard API variability

Different browsers expose clipboard image items slightly differently. The editor logic should stay narrow and only support the common image-file path instead of overgeneralizing.

### Partial failure after blob upload

If blob upload succeeds and the database write fails, the blob may become orphaned. This is acceptable for the first iteration but should be documented as a follow-up concern.
