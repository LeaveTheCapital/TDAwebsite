---
type: object
cluster: performance
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/dice.ts
description: Interactive die canvas and roll controls on the live page.
---

# Dice

`src/dice.ts` owns the live page’s interactive die canvas, roll duration and result display.

## Why this shape

The module mounts its own DOM controls and handles roll animation independently of MIDI transport (`src/dice.ts:17-30`, `src/dice.ts:67-127`).

## Shape

- A click starts a timed rotation and draws the die to its canvas (`src/dice.ts:67-127`, `src/dice.ts:148-210`).
- `src/tda.ts` imports it for side effects (`src/tda.ts:18`).

## Connected to

- **Owns:** die canvas, roll interaction, result.
- **Owned by:** `tda.html` page entry.
- **Joins:** [live transport](transport.md) only through the shared page.
- **Looks like but is not:** [drum state](drum-state.md) is MIDI-clock driven.

## If you change this

- **Hits:** live page die controls and drawing (`tda.html:65-73`).
- **Does not hit:** [drum state](drum-state.md) timing.

## Surfaces

| Surface | Role |
|---|---|
| Live page | Rolls and draws die |

## See

- Source: [src/dice.ts](../../../src/dice.ts)
