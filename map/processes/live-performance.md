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

The inputs are song data, setlist order, MIDI clock, notes, program changes and transport messages. `src/tda.ts` updates pulse and section state, asks the drum calculation for hit state, and schedules lyrics. Output is the live canvas and controls.

## Why this shape

Clock pulses determine section position. A song flag selects fixed or note-driven drums.

## Steps

1. The canvas opens on the TDA intro. The first MIDI Start plays the first entry in `songs.ts` (`src/tda.ts:652-681`).
2. Clock pulses advance the current song’s sections, drums and lyrics (`src/tda.ts:734-748`).
3. Channel 10 notes cue songs by setlist position. Program Change on the same channel cues them by program number (`src/tda.ts:234-251`).
4. Stop primes the queued song for the next Start and restores the intro. With an empty queue, the next Start replays the previous song (`src/tda.ts:693-699`).

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
