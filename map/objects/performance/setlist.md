---
type: object
cluster: performance
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/setlist.ts
description: Ordered song programs shared by live page and MIDI editor.
---

# Setlist

The setlist is an ordered list of song program numbers stored under `tda-setlist-v1`.

## Why this shape

Load filters unknown programs, removes duplicates and appends missing current songs, so an older order survives additions (`src/setlist.ts:15-42`).

## Shape

- `getDefaultSetlist` follows song map insertion order; live-set MIDI notes 0–12 address indexes into the ordered list (`src/setlist.ts:5-13`).
- `loadSetlist` and `saveSetlist` use browser storage (`src/setlist.ts:15-50`).

## Connected to

- **Owns:** stored ordering.
- **Owned by:** browser local storage.
- **Joins:** [songs](songs.md), [transport](transport.md), [MIDI editor](../editors/midi-config.md).
- **Looks like but is not:** the song program number is not its setlist position.

## If you change this

- **Hits:** live-set note selection and MIDI editor order (`src/tda.ts:232-240`, `src/midicc.ts:316-321`).
- **Does not hit:** [drum state](drum-state.md) calculations.

## Surfaces

| Surface | Role |
|---|---|
| MIDI editor | Writes order |
| Live page | Reads order |

## See

- Source: [src/setlist.ts](../../../src/setlist.ts)
