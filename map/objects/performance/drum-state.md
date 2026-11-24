---
type: object
cluster: performance
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/drum-pattern.ts
description: Pure pulse and note calculations for drum visuals.
---

# Drum state

`src/drum-pattern.ts` calculates the fixed clock pattern or incoming note state consumed by live drum drawing.

## Why this shape

Timing is independent of canvas rendering and BPM (`src/drum-pattern.ts:30-127`, `src/tda.ts:619-629`).

## Shape

- A bar has 96 pulses and hits last six pulses (`src/drum-pattern.ts:1-5`); recognized note numbers map to six instrument kinds (`src/drum-pattern.ts:7-28`).
- Both calculation paths return `DrumPatternState` (`src/drum-pattern.ts:30-82`).

## Connected to

- **Owns:** drum hit and decay calculation.
- **Owned by:** [live transport](transport.md) at render time.
- **Joins:** [songs](songs.md) chooses note or fixed pattern.
- **Looks like but is not:** `src/tda.ts` draws and colors instruments.

## If you change this

- **Hits:** live drum drawing and authoritative pulse tests (`src/tda.ts:619-648`, `tests/drum-pattern.test.ts:1-10`). Read the full [drum guide](../../../drum.md) first.
- **Does not hit:** [animated text](animated-text.md) contour geometry.

## Surfaces

| Surface | Role |
|---|---|
| Live page | Reads calculated state |
| Unit tests | Check pulse timing |

## See

- Source: [src/drum-pattern.ts](../../../src/drum-pattern.ts)
