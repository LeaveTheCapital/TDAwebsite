---
type: object
cluster: performance
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/audio-visualizer.ts
description: Audio input visualization and optional captions.
---

# Audio and captions

`src/audio-visualizer.ts` mounts the audio canvas and speech controls on the live page.

## Why this shape

It owns media device selection, AudioContext, frame drawing and speech recognition in one page-side module (`src/audio-visualizer.ts:8-47`, `src/audio-visualizer.ts:327-396`).

## Shape

- Captions use browser offline speech support when available (`src/audio-visualizer.ts:60-188`).
- The module is imported for side effects by `src/tda.ts` (`src/tda.ts:12`).

## Connected to

- **Owns:** audio capture, visualization and captions.
- **Owned by:** [live transport](transport.md) page entry.
- **Joins:** live page DOM for caption display.
- **Looks like but is not:** [songs](songs.md) contains authored lyrics, not recognized captions.

## If you change this

- **Hits:** live page audio and caption controls (`tda.html:80-110`).
- **Does not hit:** [drum state](drum-state.md) pulse calculations.

## Surfaces

| Surface | Role |
|---|---|
| Browser media APIs | Supply audio and speech |
| Live page | Displays visualization and captions |

## See

- Source: [src/audio-visualizer.ts](../../../src/audio-visualizer.ts)
