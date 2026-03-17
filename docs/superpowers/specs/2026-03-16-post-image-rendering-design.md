# Post Image Rendering Design

## Goal

Improve rendered Markdown images so standalone post illustrations feel like intentional blog insertions instead of plain inline images.

## Confirmed Product Decisions

- The target style is a refined blog illustration treatment, not a photo-gallery layout.
- Only Markdown-driven images are in scope.
- Standalone image paragraphs should get enhanced rendering.
- Inline or mixed-content images should keep simpler behavior.
- The implementation should support optional captions derived from meaningful alt text.
- No lightbox, zoom, gallery, or WordPress HTML conversion is included.

## Current State

- Markdown images are currently rendered as plain `<img>` inside normal paragraphs.
- The article CSS gives images only a small radius and a generic shadow.
- There is no dedicated image card structure, caption treatment, or larger illustration spacing.

## Recommended Architecture

### 1. Detect standalone Markdown image blocks

During Markdown-to-HTML rendering, detect paragraphs whose content is only a single image.

### 2. Convert standalone image paragraphs into figure blocks

Convert those cases to a dedicated structure:

- `<figure class="post-figure">`
- `<img class="post-figure__image">`
- optional `<figcaption class="post-figure__caption">`

Caption rule:

- if alt text is present and not the generic placeholder, use it as caption text
- otherwise omit `figcaption`

### 3. Keep mixed-content images simple

If an image appears inside a paragraph with surrounding text or other inline content, do not wrap it as a figure card.

### 4. Style the figure as a blog illustration card

The illustration card should:

- sit centered in the article column
- use larger vertical spacing than body paragraphs
- have a soft panel background and subtle border
- keep the image at natural aspect ratio with no crop
- use a calmer, less floating shadow than the current generic image treatment
- render caption text in a quieter style below the image

## Data Flow

1. Admin writes Markdown containing images.
2. Markdown rendering produces HTML.
3. A post-processing step upgrades standalone image paragraphs into figure markup.
4. Article CSS applies the enhanced illustration styling.

## Testing Strategy

- Markdown helper test for converting standalone images into `figure.post-figure`
- Markdown helper test confirming mixed-content image paragraphs are not converted
- Markdown helper test confirming caption output only appears for meaningful alt text

## Risks

- Regex-based HTML rewriting can over-match if the output pattern is too broad.
- Generic alt placeholder text must not leak into visible captions.
- Existing HTML image embeds should remain visually stable even if they do not opt into the new figure card structure.
