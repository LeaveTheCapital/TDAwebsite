---
type: object
cluster: performance
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/glyphs.ts
description: Glyph geometry and live text animation.
---

# Animated text

`src/glyphs.ts` supplies declarative letter and number geometry that `src/tda.ts` animates on canvas.

## Why this shape

The glyph definitions separate normalized contour geometry and pixel contracts from the live animation loop (`src/glyphs.ts:1-43`, `src/tda.ts:2831-3026`).

## Shape

- Glyph definitions include contour strokes and required/forbidden pixel points (`src/glyphs.ts:3-43`).
- Live text also uses `src/scrolling-lyrics.ts`, `src/animation-timing.ts`, and SVG wordmark geometry (`src/tda.ts:9-17`, `src/tda.ts:91-100`, `src/svg-wordmark.ts:1-35`).

## Connected to

- **Owns:** outlined glyph geometry.
- **Owned by:** live text and wordmark rendering.
- **Joins:** [songs](songs.md) provides lyrics; [transport](transport.md) schedules them.
- **Looks like but is not:** lyric words are content in `src/songs.ts`, not glyph definitions.

## If you change this

- **Hits:** live text and possibly SVG wordmark (`src/tda.ts:91-100`, `src/svg-wordmark.ts:1`). Read the full [font guide](../../../font.md) first.
- **Does not hit:** [drum state](drum-state.md) timing.

## Surfaces

| Surface | Role |
|---|---|
| Live page | Animates text |
| SVG wordmark | Reads A definition |

## See

- Source: [src/glyphs.ts](../../../src/glyphs.ts)
