---
type: process
status: verified
verified_on: 2026-11-24
revision: 2388b4c
consumes: [../objects/editors/midi-config.md, ../objects/editors/media-library.md]
produces: [../objects/editors/storage-port.md]
description: Editor changes autosave and explicit uploads snapshot locally.
---

# Editor persistence

The MIDI and Books editors automatically save current data and explicitly snapshot uploads.

## Input → Movement → Output

The input is either editor's current form or library. Automatic save serializes to its primary local key; an explicit upload writes a separate JSON snapshot through `JsonStorageSocket`. The output is browser local storage (`src/midicc.ts:451-466`, `src/midicc.ts:521-558`, `src/books.ts:191-193`, `src/books.ts:677-701`).

## Why this shape

The snapshot is separate so later automatic edits do not change it until the next upload (`docs/midicc-storage.md:3-5`).

## Steps

1. Editors initialize `JsonStorageSocket(new LocalStorageAdapter(...))` (`src/midicc.ts:45`, `src/books.ts:193`).
2. Normal editor changes save to primary local keys (`src/midicc.ts:389-401`, `src/books.ts:677-681`).
3. Upload actions write separate snapshot keys (`src/midicc.ts:455-466`, `src/books.ts:191-193`).

## If you change this

- **Hits:** both editor upload flows and [storage port](../objects/editors/storage-port.md).
- **Does not hit:** [setlist](../objects/performance/setlist.md) saving, which uses its own key and helper.

## Surfaces

| Surface | Role |
|---|---|
| Editor pages | Save and upload |
| Browser local storage | Stores primary and snapshot keys |

## See

- Objects: [MIDI editor](../objects/editors/midi-config.md), [media library](../objects/editors/media-library.md), [storage port](../objects/editors/storage-port.md)
- Source: [MIDI storage note](../../docs/midicc-storage.md)
