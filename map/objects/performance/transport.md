---
type: object
cluster: performance
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/tda.ts
description: Live MIDI transport and performance canvas.
---

# Live transport

`src/tda.ts` owns MIDI selection, transport position, song state, and live canvas drawing.

## Why this shape

The selected MIDI input attaches clock, note, program, start and stop listeners to one live state machine (`src/tda.ts:1144-1189`).

## Shape

- Pulse and song state are held in this module (`src/tda.ts:146-148`); Start, Stop and Clock are handled here (`src/tda.ts:650`, `src/tda.ts:701`, `src/tda.ts:757`).
- The page module imports song data, setlist, glyphs, drums, audio and dice (`src/tda.ts:9-101`).

## Connected to

- **Owns:** live transport, canvas, selected MIDI input.
- **Owned by:** `tda.html` entry.
- **Joins:** [songs](songs.md), [setlist](setlist.md), [drum state](drum-state.md), [animated text](animated-text.md), [audio and captions](audio-captions.md), [dice](dice.md).
- **Looks like but is not:** [drum state](drum-state.md) calculates timing without drawing.

## If you change this

- **Hits:** live page event handling, canvas and browser integration evidence (`tests/tda-drums.spec.ts:1`).
- **Does not hit:** [MIDI editor](../editors/midi-config.md) config persistence.

## Surfaces

| Surface | Role |
|---|---|
| MIDI device | Sends events |
| Live page | Draws performance |

## See

- Source: [src/tda.ts](../../../src/tda.ts)
