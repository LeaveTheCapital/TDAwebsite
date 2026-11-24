---
type: object
cluster: pages
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: vite.config.ts
description: Four browser entry pages and their style boundaries.
---

# Site pages

The Vite site has four HTML entries: home, MIDI configuration, live TDA, and Books.

## Why this shape

Each page loads its own TypeScript entry, while the build lists all four explicitly (`vite.config.ts:3-11`, `index.html:111`, `tda.html:115`, `midicc.html:364`, `books.html:47`).

## Shape

- Home: `index.html` + `src/main.ts` + `main.css`; live page: `tda.html` + `src/tda.ts` + `main.css` (`src/main.ts:1`, `src/tda.ts:8`).
- MIDI editor and Books each have their own CSS, both importing `tokens.css` (`src/midicc.ts:1`, `src/books.ts:1`, `midicc.css:1`, `books.css:1`).

## Connected to

- **Owns:** four page entries and their page CSS.
- **Owned by:** Vite build configuration.
- **Joins:** [live performance](../performance/transport.md), [MIDI editor](../editors/midi-config.md), [media library](../editors/media-library.md).
- **Looks like but is not:** `dist/` is build output, not an entry source.

## If you change this

- **Hits:** matching HTML, entry TS, page CSS; Vite input if an entry is added or removed.
- **Does not hit:** song definitions in [songs](../performance/songs.md) when editing the home page.

## Surfaces

| Surface | Role |
|---|---|
| Browser | Loads one HTML entry and its module |
| Vite | Builds four configured entries |

## See

- Source: [vite.config.ts](../../../vite.config.ts)
