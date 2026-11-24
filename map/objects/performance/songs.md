---
type: object
cluster: performance
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/songs.ts
description: Program-keyed songs, sections, and lyric cues.
---

# Songs

`songsByProgram` is the program-keyed source for live song sections and lyric text.

## Why this shape

Sections carry bars, beats, lyrics, optional notes and silence, so MIDI clock can advance performance state from data (`src/songs.ts:1-17`, `src/tda.ts:965-989`).

## Shape

- `Map<number, Song>` holds the three currently defined songs (`src/songs.ts:42`, `src/songs.ts:195`).
- `{bars}` markers in lyric strings are parsed into cues (`src/songs.ts:24-40`). `hasMidiDrumNotes` chooses note-driven drums (`src/songs.ts:11-15`, `src/tda.ts:627-629`).

## Connected to

- **Owns:** song and section definitions.
- **Owned by:** live performance content.
- **Joins:** [setlist](setlist.md), [transport](transport.md), [drum state](drum-state.md), [animated text](animated-text.md).
- **Looks like but is not:** setlist order is stored separately.

## If you change this

- **Hits:** transport section lengths and lyrics; MIDI editor song names and setlist defaults (`src/midicc.ts:4-5`, `src/setlist.ts:5-7`).
- **Does not hit:** [media library](../editors/media-library.md).

## Surfaces

| Surface | Role |
|---|---|
| Live page | Reads song and cue data |
| MIDI editor | Reads song names |

## See

- Source: [src/songs.ts](../../../src/songs.ts)
