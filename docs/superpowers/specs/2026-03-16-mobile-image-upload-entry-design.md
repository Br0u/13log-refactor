# Mobile Image Upload Entry Design

## Goal

Add a compact image picker entry to the shared admin markdown editor so mobile users can upload images without relying on clipboard paste support.

## Confirmed Decisions

- The new entry should be a small `+ Image` control.
- It should live inside the existing markdown editor surface.
- It should use the system image picker rather than a custom camera flow.
- It should reuse the existing admin image upload endpoint and insertion logic.
- It should work for both post and micro-post editors.

## Scope

- Add a hidden `input[type=file]` accepting images
- Trigger it from a compact visible button
- Upload the selected image through the same path as pasted images
- Insert `![image](url)` at the caret
- Reuse pending and error states

## Out of Scope

- Multi-image upload
- Drag-and-drop
- Media library browsing
- Delete/replace flows
