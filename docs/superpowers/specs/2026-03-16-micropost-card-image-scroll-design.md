# Micropost card image and scroll behavior design

- Date: 2026-03-16
- Scope: unify micropost image presentation with post cards; allow internal scroll in focused micropost card before dismissing on page scroll.

## Context
- `PostsTimeline` currently dismisses focused microposts on any `wheel` or `touchmove` event at the window level.
- `PostPreviewCard` renders micropost rich text via `renderedContentHtml`, but micropost-specific image styling is not aligned with regular post card treatment.

## Design
### Image rendering
- Add micropost rich-text image styles in the shared card stylesheet.
- Constrain images to the card content width while preserving aspect ratio.
- Apply a black frame treatment consistent with post card imagery.

### Scroll behavior
- Keep the current outside-click and Escape dismissal behavior.
- When a focused micropost receives wheel or touch scrolling that starts inside the active card content, consume the gesture for internal card scrolling.
- Only dismiss the focused state when scroll input occurs outside the active card, or when a gesture inside the card attempts to scroll past the top or bottom boundary.
- Hide or reduce the visual prominence of the internal scrollbar while preserving usability.

## Testing
- Add timeline interaction tests for wheel/touch behavior inside and outside the focused card.
- Add card/style tests for micropost image markup and stylesheet rules.
