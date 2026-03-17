# Micropost Like Design

## Goal

Add persistent, per-visitor likes to micropost cards using the same one-like-per-visitor rule as regular posts, while keeping the UI minimal with a heart icon.

## Confirmed Product Decisions

- Micropost likes should be persisted.
- A single visitor can only like the same micropost once.
- The visual treatment should be minimal and use a heart icon.
- Micropost likes should feel lighter than full post detail interactions, but follow the same behavioral rules.

## Current State

- Regular posts already support likes through `PostLikeButton`, `/api/posts/[slug]/like`, `lib/repositories/likes.js`, and persisted `PostLike` records.
- Microposts currently expose `likeCount: 0` in `lib/public-content.js` and have no stored like data or API route.
- Micropost cards already have a footer/meta area that can hold a compact action without changing the overall card layout.

## Recommended Architecture

### 1. Add micropost like persistence

Extend Prisma with:

- `MicroPost.likeCount Int @default(0)`
- `MicroPostLike` model with:
  - `microPostId`
  - `visitorKey`
  - unique constraint on `[microPostId, visitorKey]`

This mirrors the existing post-like shape and keeps the logic explicit instead of prematurely abstracting both content types into one shared polymorphic table.

### 2. Add a micropost like repository path

Create repository helpers parallel to post likes:

- lookup only published microposts
- insert a like once per `visitorKey`
- increment `likeCount` transactionally
- return the current count for duplicate likes as well

This keeps the rules symmetric with regular posts and minimizes behavioral drift.

### 3. Expose micropost like counts in public timeline data

Update the public-content mapping so published micropost timeline entries carry the stored `likeCount` instead of hardcoded zero.

### 4. Add a dedicated micropost like API route

Add `POST /api/micro-posts/[id]/like` that:

- resolves the visitor key from cookies like the existing post-like route
- writes the like through the micropost like repository
- returns `{ count }`

### 5. Add a compact heart-like button to micropost cards

Render a minimal button in the micropost footer/meta area:

- icon-first treatment using a heart glyph
- count shown inline beside it
- lighter styling than the long-form post interaction section
- no additional label-heavy chrome

The button should be isolated from the card expand/collapse click behavior so tapping the like control does not toggle micropost focus.

## Data Flow

1. Public timeline fetches published microposts with stored `likeCount`.
2. Card renders a compact heart button with the current count.
3. Visitor taps the like button.
4. Client sends `POST /api/micro-posts/[id]/like`.
5. Server resolves `visitor_key`, writes at most one `MicroPostLike`, and returns the canonical count.
6. Client updates the displayed count from the server response.

## UI Behavior

- Unliked state shows a quiet heart icon and current count.
- After a successful like request, the count updates immediately from the server response.
- Repeated clicks by the same visitor should stay idempotent and keep the same count.
- The like control must stop click propagation so it does not expand or collapse the micropost card.

## Testing Strategy

- Prisma/repository test: duplicate likes from the same visitor only count once.
- API test: liking a published micropost returns the current count.
- Timeline/component test: micropost cards render the heart-like control and clicking it does not toggle card focus.
- UI test: successful like response updates the visible count.

## Risks

- If the like button does not stop propagation, it will conflict with the existing micropost focus interaction.
- If micropost timeline mapping keeps hardcoded `likeCount: 0`, persisted counts will never surface publicly.
- Reusing the full post-like button styling directly would likely feel too heavy inside the compact micropost footer.
