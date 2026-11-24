---
type: object
cluster: editors
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/midicc.ts
description: MIDI controller configuration editor and setlist controls.
---

# MIDI configuration editor

`src/midicc.ts` runs the controller configuration form and setlist editor on `midicc.html`.

## Why this shape

The page owns form types, rendering, normalization and automatic save together (`src/midicc.ts:7-45`, `src/midicc.ts:468-558`).

## Shape

- Current config saves under `tda-midi-cc-config-v1`; explicit upload snapshot uses `tda-midi-cc-config-cloud-demo-v1` (`src/midicc.ts:45-49`, `src/midicc.ts:455-466`).
- Setlist editing uses shared `src/setlist.ts` (`src/midicc.ts:5`, `src/midicc.ts:101-107`, `src/midicc.ts:316-321`).

## Connected to

- **Owns:** MIDI controller form state and rendering.
- **Owned by:** `midicc.html` entry.
- **Joins:** [storage port](storage-port.md), [setlist](../performance/setlist.md), [songs](../performance/songs.md).
- **Looks like but is not:** the upload is a browser local demo, not remote cloud storage.

## If you change this

- **Hits:** `midicc.html` form selectors, `midicc.css`, local config data and upload snapshot.
- **Does not hit:** [live transport](../performance/transport.md) MIDI event listeners.

## Surfaces

| Surface | Role |
|---|---|
| MIDI editor page | Reads and writes config |
| Browser local storage | Persists config |

## See

- Source: [src/midicc.ts](../../../src/midicc.ts)
- Behaviour note: [MIDI storage](../../../docs/midicc-storage.md)
