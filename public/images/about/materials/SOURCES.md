# About materials

Downloaded 2026-09-08. Assets are served locally, with no runtime third-party requests.

## Reused assets (CC0)

- `frame-black.webp`: James Ray Cock, [Hanging Picture Frame 01](https://polyhaven.com/a/hanging_picture_frame_01), 1K glTF model downloaded via https://api.polyhaven.com/files/hanging_picture_frame_01 . Rendered locally with Three.js 0.179.1 and an orthographic camera. The photograph and mat are overlaid in HTML; the model frame remains visible.
- `frame-wood.webp`: James Ray Cock, [Hanging Picture Frame 02](https://polyhaven.com/a/hanging_picture_frame_02), 1K glTF model downloaded via https://api.polyhaven.com/files/hanging_picture_frame_02 . Rendered locally in the same way.
- `jacquard.webp`: photography by colormass, processing by Rico Cilliers, [Quatrefoil Jacquard Fabric](https://polyhaven.com/a/quatrefoil_jacquard_fabric), 1K diffuse and normal maps downloaded via https://api.polyhaven.com/files/quatrefoil_jacquard_fabric . Rendered locally on a lit plane, with an undyed cream color adjustment in the material shader. Used on scroll mounting and rolled cloth with CSS multiply blending.
- `wood.webp`: photography by Dimitrios Savva, processing by Rico Cilliers, [Wood Table 001](https://polyhaven.com/a/wood_table_001), 1K diffuse map. Used on the scroll rods.
- `paper.webp`: ambientCG / Lennart Demes, [Paper 001](https://ambientcg.com/view?id=Paper001), 1K color map. Used for paper, frame mats and wall surface. Source technique is approximation, not a scan of historical rice paper.

Licenses: https://polyhaven.com/license and https://docs.ambientcg.com/license/
Website example renders are not covered by the CC0 asset license; none are shipped. The two frame images and the lit textile image were rendered from downloaded CC0 models/maps in a temporary Three.js renderer, then converted to WebP. The renderer source and downloader are retained in output/about-material-render for inspection. Three.js is used only during asset production; no WebGL or new runtime dependency was added to the page. Other downloaded maps were converted to WebP. No complete historical scroll model was reused: the mounted scroll is assembled from the listed materials in CSS.

## Researched but not reused

- BlendSwap gift ribbons: gift-box geometry did not suit this scroll; license label and author's restrictions were inconsistent.
- BlendSwap animated silk ribbons: decorative flowing ribbons, not a tied scroll closure.
- Seido scroll care photographs: structural reference only; no reusable asset license established.
- Rawpixel / PNG aggregators: no suitable verified freely reusable photographic scroll tie found.
