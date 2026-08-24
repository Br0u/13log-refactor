# Home Sequoia Mist Night Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dark-mode rain with an original foggy conifer scene while preserving homepage layout, identity, and the approved light-mode sakura scene.

**Architecture:** Keep `HomeBackgroundDepth` and the existing night ink background unchanged, adding only one dark-only transparent conifer foreground. Rename the particle scheduler to `HomeAtmosphereLayer`; reuse its bounded DOM particles for light petals and dark forest debris, while CSS pseudo-elements provide two mist bands.

**Tech Stack:** Next.js 15, React 19, CSS transforms/masks/keyframes, Vitest, Testing Library, original PNG/WebP assets.

**Spec:** `docs/superpowers/specs/2026-08-24-home-sequoia-mist-design.md`

**Working-tree rule:** Implement in the current workspace because the approved sakura baseline is intentionally uncommitted. Do not commit, push, stash, reset, or touch unrelated files.

---

## Chunk 1: Lock the theme contract

### Task 1: Rename the atmosphere owner and describe the dark scene

**Files:**
- Create: `app/components/HomeAtmosphereLayer.jsx`
- Delete: `app/components/HomeRainLayer.jsx`
- Modify: `app/page.js`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/app/home-atmosphere-layer.test.jsx`
- Delete: `tests/app/home-rain-layer.test.jsx`
- Create: `tests/app/home-page-atmosphere.test.js`
- Delete: `tests/app/home-page-rain-overlay.test.js`
- Create: `tests/app/home-page-atmosphere-styles.test.js`
- Delete: `tests/app/home-page-rain-overlay-styles.test.js`
- Modify: `tests/app/home-background-depth.test.jsx`
- Modify: `tests/app/home-background-depth-styles.test.js`
- Modify: `tests/app/home-page-hero-styles.test.js`
- Modify: `tests/components/mobile-surface-styles.test.js`

- [x] Probe the preview with `curl --noproxy '*' -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3014`. If absent, start a PTY session with `DATABASE_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid DIRECT_URL=postgresql://invalid:invalid@127.0.0.1:1/invalid SESSION_SECRET=visual-audit-session-secret-32-characters RISK_INTERNAL_SECRET=visual-audit-risk-secret-32-characters npm run dev -- -p 3014`, then require HTTP 200.
- [x] Before changing source files, use Playwright with `colorScheme: 'light'`, remove `body.dark`, wait for `document.fonts.ready` and network idle, and save one `/private/tmp/13log-sequoia-baseline.json` containing the two sakura SHA-1 values plus `.header`, `.profile_inner`, and `.profile-avatar` bounding boxes at both 1440×1100 and 390×844.
- [x] Update component tests to require `.home-atmosphere-layer`, seeded `.home-atmosphere-particle` elements, existing petal variables, and new debris position, drift, duration, delay, angle, spin, size, and opacity variables.
- [x] Update homepage source tests to require `HomeAtmosphereLayer` after `HomeBackgroundDepth`, the `profile--atmosphere` hook, and reject `HomeRainLayer` and `profile--rainy-mask`.
- [x] Add depth assertions for a `.home-depth-background__sequoia` decorative child after sakura.
- [x] Add style assertions for the preserved `home-night-ink-bg`, a dark-only conifer foreground, two mist pseudo-elements, `homeForestDebrisDrift`, and the absence of `homeRainDrop` and dark rain gradients.
- [x] Run `npx vitest run tests/app/home-atmosphere-layer.test.jsx tests/app/home-page-atmosphere.test.js tests/app/home-page-atmosphere-styles.test.js tests/app/home-background-depth.test.jsx tests/app/home-background-depth-styles.test.js tests/app/home-page-hero-styles.test.js tests/components/mobile-surface-styles.test.js` and confirm failures identify the missing renamed component, generic profile hook, sequoia layer, mist, and debris behavior.

## Chunk 2: Build the original layered scene

### Task 2: Generate and validate project-owned assets

**Files:**
- Create: `public/images/home/home-sequoia-foreground.png`
- Create: `public/images/home/home-sequoia-foreground.webp`
- Create: `tests/app/home-sequoia-assets.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

- [x] Use built-in `imagegen` with this foreground prompt: `Use case: stylized-concept. Asset type: transparent 13log homepage parallax foreground, 1536×1024 landscape. Primary request: original damp conifer branches and sparse redwood sprays rendered as refined ink-and-watercolor cutout. Composition: one branch enters from lower left and bends toward the lower right; secondary sprays stay on the outer edges; preserve a large fully transparent central reading area and transparent upper-middle. Lighting: cool foggy night with subtle moss and cinnamon-bark highlights. Constraints: genuine transparent background, isolated branch only, no background scenery, no text, no UI, no people, no animals, no logos, no watermark, do not copy the ThreeUI branch silhouette.`
- [x] Inspect both outputs; reject assets with opaque checkerboards, central obstructions, logos, text, or mismatched lighting.
- [x] Copy the selected built-in output into the two project paths. Encode with `cwebp -quiet -q 72 -alpha_q 72 public/images/home/home-sequoia-foreground.png -o public/images/home/home-sequoia-foreground.webp`.
- [x] Add the already-installed Sharp version as an explicit dev dependency, then add an asset test that validates complete PNG/WebP structure and actual decodability. Require 1536×1024, real transparent pixels, and foreground WebP ≤ 300 KiB.
- [x] Run `npx vitest run tests/app/home-sequoia-assets.test.js`, `file public/images/home/home-sequoia-*`, and `du -h public/images/home/home-sequoia-*`; confirm all checks pass.

### Task 3: Implement the minimum scene and particle model

**Files:**
- Create: `app/components/HomeAtmosphereLayer.jsx`
- Delete: `app/components/HomeRainLayer.jsx`
- Modify: `app/components/HomeBackgroundDepth.tsx`
- Modify: `app/page.js`
- Modify: `app/papermod-custom.css`
- Modify: `package.json`
- Modify: `package-lock.json`

- [x] Rename the component, `.home-atmosphere-*` classes, `data-atmosphere-state`, and `profile--atmosphere` hook; preserve initial seeding, bounded scheduling, visibility pause, cleanup, and reduced-motion behavior.
- [x] Rename all generic `rain`/`drop` data and CSS variables to `particle`/`atmosphere`, add dark-debris variables, and leave the approved `--petal-*` values unchanged.
- [x] Add the sequoia foreground child to `HomeBackgroundDepth`.
- [x] Keep `home-night-ink-bg` on dark depth layers, show the sequoia foreground only in dark mode, and keep sakura visible only in light mode.
- [x] Replace all dark rain styling with two slow fog bands and sparse horizontal debris drift; remove `homeRainDrop` and all rain-line gradients entirely.
- [x] Run `npm uninstall @arayui/rainy-day` to remove the unused package and its transitive Three.js dependency.
- [x] Add mobile and reduced-motion rules that keep the center readable and stop atmosphere motion.
- [x] Run the focused test command and confirm all focused tests pass.
- [x] Run `rg -ni 'HomeRain|home-rain|rainy-day|rain-drop|homeRainDrop|profile--rainy|--rain-' app package.json package-lock.json` and require zero semantic rain-effect matches; unrelated package names containing `rain` are out of scope.

---

## Chunk 3: Verify the real homepage

### Task 4: Regression and browser checks

**Files:**
- Verify all files above; no new source files.

- [x] Run `npm test` and confirm the full suite passes.
- [x] Run `npm run typecheck` and `npm run build` and confirm both exit successfully.
- [x] Reconfirm the preview returns HTTP 200 on port 3014.
- [x] Use the bundled Playwright runtime and Chromium headless shell to inspect `http://127.0.0.1:3014` at 1440×1100 and 390×844. Toggle `document.body.classList` for light/dark and create a second context with `reducedMotion: 'reduce'`.
- [x] Confirm light mode still uses the original sakura asset and `homeSakuraFall`; dark mode still uses the original `home-night-ink-bg` plus the conifer foreground, fog bands, and `homeForestDebrisDrift`, with no `homeRainDrop`, canvas, layout shift, or horizontal overflow.
- [x] Assert in Playwright that `document.documentElement.scrollWidth === document.documentElement.clientWidth`, `document.querySelectorAll('canvas').length === 0`, and the three saved bounding boxes at both desktop and 390px differ by no more than 1 CSS pixel from the baseline.
- [x] Re-run the two sakura `shasum` values, require exact equality, require at least 40 initially seeded light particles, and verify the `homeSakuraFall` duration/waypoint custom properties remain present.
- [x] Emulate `prefers-reduced-motion: reduce` and confirm particles are hidden and parallax/mist transforms are static.
- [x] Run `git diff --check`, review the scoped status, and confirm unrelated untracked files remain untouched.
