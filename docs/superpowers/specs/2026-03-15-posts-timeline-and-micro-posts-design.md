# Posts Timeline And Micro Posts Design

## Goal

Reduce the reading density of the `/posts` list while adding a new short-form content type that mixes into the same reverse-chronological timeline as regular posts.

## Confirmed Product Decisions

- Regular posts and micro posts are mixed together in `/posts`.
- Ordering is unified by publish time, newest first.
- Tag filtering applies to both regular posts and micro posts.
- Regular post cards should show less text than they do today.
- Micro posts have no detail page.
- The visual language is unified across the timeline rather than split into two unrelated card styles.
- Admin gets a dedicated entry point for micro posts instead of overloading the regular post editor.

## Current Problems

### Posts list density

The current preview card renders multiple excerpt blocks, visual separators, and a read-more marker. In a masonry layout this creates heavy cards with little breathing room and inconsistent scan speed.

### Data model mismatch

Regular posts currently assume a full article lifecycle: slug, detail page, summary, markdown body, and editor flow. A short-form status-like entry does not fit that contract cleanly.

## Recommended Architecture

### 1. Introduce a dedicated `MicroPost` model

Add a separate database model for short-form content instead of stretching `Post` with conditional behavior.

Required fields:

- `id`
- `content`
- `status`
- `publishedAt`
- `createdAt`
- `updatedAt`

Relations:

- many-to-many tagging via a join table similar to `PostTag`

Intentionally omitted:

- `slug`
- `summary`
- `category`
- detail-page route

This keeps long-form and short-form concerns separate while still allowing both to feed the same public timeline.

### 2. Add a unified timeline entry mapper

Create a service-layer function that returns a normalized list of public timeline entries.

Normalized shape:

- `type`: `"post"` or `"micro"`
- `id`
- `title`
- `summary`
- `content`
- `date`
- `tags`
- `href`

Mapping rules:

- Regular posts map to timeline entries with `type: "post"` and a valid `href`
- Micro posts map to timeline entries with `type: "micro"` and no `href`
- Both participate in the same date sort and tag filter pipeline

This aggregation should be the source for:

- `/posts`
- paginated `/posts/page/[page]`
- tag filtering logic on those pages

Regular post detail fetching remains unchanged and should continue to use the existing post-specific query path.

### 3. Simplify regular post preview cards

Regular post cards should become quieter.

Changes:

- keep top metadata row
- keep title
- replace multi-block excerpt rendering with a single short summary paragraph
- remove inline excerpt separators
- remove `[展开全文]`

The result should be easier to scan and more consistent in height.

### 4. Add micro posts to the same card language

Micro posts should reuse the same card family but render a smaller content payload:

- no title
- no detail link
- body text as the main content
- time and tags as metadata

This preserves a unified timeline while making short entries visually lighter by content, not by introducing a disconnected design system.

### 5. Keep tag filtering unified

The current `/posts` tag filtering should operate on normalized timeline entries, not on regular posts only.

Implications:

- tag counts should include micro posts
- clicking a tag chip should filter both content types
- entries without matching tags should be excluded regardless of type

## Admin Design

### New admin area

Add a dedicated admin section for micro posts rather than merging them into the existing regular post editor.

Recommended route:

- `/admin/micro-posts`

Recommended capabilities:

- list recent micro posts
- create a micro post
- edit a micro post
- delete a micro post
- set publish status
- assign tags

The form should stay intentionally small:

- content textarea
- tags input
- status select

No slug, category, summary, or cover fields.

## Data Flow

1. Admin writes and publishes either a regular post or a micro post.
2. Public content service fetches published regular posts and published micro posts.
3. Service maps both into timeline entries.
4. `/posts` sorts the combined entries by time descending.
5. Tag filters are computed from the combined set.
6. Timeline card rendering branches only on the minimal differences needed for `post` vs `micro`.

## Routing And SEO

### Regular posts

- keep existing detail route
- remain eligible for existing post-specific SEO flows

### Micro posts

- no detail route
- not linked from timeline cards
- should not be emitted into post-detail-only surfaces that require permalinks unless explicitly designed later

Open question deferred by design:

- whether micro posts should be included in RSS and search. Initial implementation can safely exclude them until product intent is clear.

## Error Handling

- Micro post creation should validate non-empty content.
- Timeline aggregation should ignore unpublished entries of both types.
- Missing or invalid dates should be sorted after valid dated entries, following existing content conventions.
- Cards must tolerate missing tags.

## Testing Strategy

### Service tests

- combined timeline sorts posts and micro posts correctly by date
- tag filtering includes both types
- unpublished micro posts do not leak into public timeline

### Component tests

- regular post preview card renders reduced content density
- micro post card renders without detail link
- timeline page renders mixed entry types in one list

### Admin tests

- micro post admin page renders form and list
- create/update actions parse content, tags, and status correctly

## Incremental Implementation Order

1. Add schema and repository support for micro posts
2. Add public timeline aggregation service
3. Simplify post preview card rendering
4. Add micro post card rendering in the shared timeline UI
5. Switch `/posts` and paginated posts pages to timeline entries
6. Add admin micro post management
7. Expand tests around aggregation, cards, and admin flows

## Risks

### Pagination drift

Once micro posts join the timeline, page contents and counts will shift. Tests and assumptions tied to post-only pagination need updating.

### Shared card regression

If the unified card component branches too much, it may become unclear. Keep the shared surface narrow and push data normalization into the service layer.

### Admin sprawl

Reusing the full post editor for micro posts would create complexity quickly. The dedicated admin area avoids that.
