---
type: process
status: verified
verified_on: 2026-11-24
revision: 2388b4c
consumes: [../objects/performance/songs.md, ../objects/performance/setlist.md]
produces: [../objects/performance/transport.md, ../objects/performance/drum-state.md, ../objects/performance/animated-text.md]
description: MIDI events advance song, drum, and text state.
---

# Live performance

MIDI selection and transport events advance a song and draw its live visuals.

## Input → Movement → Output

The inputs are song data, setlist order, MIDI clock, notes and transport messages. `src/tda.ts` updates pulse and section state, asks the drum calculation for hit state, and schedules lyrics. Output is the live canvas and controls (`src/tda.ts:650-989`).

## Why this shape

Clock pulses determine section position; a song flag selects fixed or note-driven drums (`src/tda.ts:619-629`, `src/tda.ts:757-765`).

## Steps

1. Selected MIDI input receives clock, note and program listeners (`src/tda.ts:1183-1189`).
2. Start resets transport position, and clock advances it (`src/tda.ts:650-680`, `src/tda.ts:757-765`).
3. Song sections advance at their pulse boundary, while drum and lyric views update (`src/tda.ts:619-648`, `src/tda.ts:944-1018`).

## If you change this

- **Hits:** [transport](../objects/performance/transport.md), [drum state](../objects/performance/drum-state.md), [animated text](../objects/performance/animated-text.md).
- **Does not hit:** [media library](../objects/editors/media-library.md).

## Surfaces

| Surface | Role |
|---|---|
| MIDI device | Sends events |
| Live page | Draws results |

## See

- Objects: [songs](../objects/performance/songs.md), [setlist](../objects/performance/setlist.md), [transport](../objects/performance/transport.md)
- Source: [src/tda.ts](../../src/tda.ts)
