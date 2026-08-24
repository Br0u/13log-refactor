# Home Sequoia Mist Night Design

## Goal

Replace the homepage dark-mode rain scene with an original Sequoia Mist-inspired forest atmosphere while preserving the existing homepage layout, avatar, copy, navigation, interaction, and light-mode sakura scene.

## Reference Boundary

The public ThreeUI preview contributes only its motion and depth language: pale grove fog, diagonal conifer branches, damp muted color, and sparse wind-carried forest debris. Do not copy ThreeUI Pro source code, models, textures, UI panels, layout, or branded assets.

## Visual Direction

- Use a deep blue-gray and moss-green night palette that remains compatible with the current ink background and night cat avatar.
- Keep the central reading area open. Dense branches stay around the lower-left, lower-right, and outer edges.
- Preserve the existing `home-night-ink-bg` exactly. Add only one transparent foreground branch asset plus code-native mist and debris layers.
- Replace rain lines completely with two slow mist bands and sparse conifer needles or bark fragments drifting mostly sideways.
- Keep motion quiet and continuous: mist moves over roughly 18–30 seconds; debris moves over roughly 8–14 seconds with small vertical lift or sink and independent rotation.

## Architecture

### Background depth

`HomeBackgroundDepth` remains the only parallax scene. Add a decorative `.home-depth-background__sequoia` child beside the existing sakura child. Light mode shows sakura and hides sequoia; dark mode does the reverse.

The existing far, middle, and front masked layers continue using the current night ink background. The sequoia foreground uses the existing `--home-depth-x` and `--home-depth-y` variables with a slightly larger transform than the front background layer. No element participates in layout or pointer interaction.

### Atmosphere particles

Rename `HomeRainLayer` to `HomeAtmosphereLayer` because rain is no longer part of either theme. Rename the associated DOM classes, state attributes, generic particle variables, and homepage profile hook rather than retaining a compatibility alias. Remove the unused `@arayui/rainy-day` dependency and its transitive Three.js package. Preserve the bounded scheduler and initial seeding. Each particle carries both light-petal and dark-debris CSS variables so a theme switch needs no React reinitialization.

Light mode keeps the approved sakura fall and flutter behavior. Dark mode restyles the same particles as narrow needles or irregular bark fragments and uses a horizontal multi-stage drift animation. The atmosphere wrapper's two pseudo-elements render separate mist bands, avoiding another component or animation scheduler.

### Accessibility and performance

- All scene layers remain `aria-hidden` and `pointer-events: none`.
- `prefers-reduced-motion: reduce` hides particles and stops mist/parallax motion while retaining the static forest composition.
- Mobile uses lower foreground opacity, larger central masking, and fewer visually prominent debris shapes.
- Use WebP assets with PNG fallbacks and no new runtime dependency.

## Files and Responsibilities

- `app/components/HomeBackgroundDepth.tsx`: add the dark-only foreground layer.
- `app/components/HomeAtmosphereLayer.jsx`: schedule shared light petals and dark forest debris.
- `app/page.js`: use the renamed atmosphere component.
- `package.json` and `package-lock.json`: remove the obsolete rainy-day dependency and transitive Three.js install.
- `app/papermod-custom.css`: theme visibility, fog bands, debris animation, responsive and reduced-motion rules.
- `public/images/home/home-sequoia-foreground.{webp,png}`: original transparent conifer branch foreground.
- Focused component and stylesheet tests: lock the theme split, no-rain contract, masks, motion, fallbacks, and accessibility behavior.

## Verification

- Focused red-green tests for depth layers and atmosphere particles.
- Full `npm test`, `npm run typecheck`, and `npm run build`.
- Browser inspection at desktop and 390px mobile widths in light, dark, and reduced-motion modes.
- Confirm unchanged homepage geometry and unchanged night background asset, readable central content, no canvas, no rain animation in dark mode, and no horizontal overflow.
- Review `git diff --check` and preserve unrelated working-tree files.
