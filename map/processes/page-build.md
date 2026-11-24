---
type: process
status: verified
verified_on: 2026-11-24
revision: 2388b4c
consumes: [../objects/pages/site-pages.md]
produces: [../objects/pages/site-pages.md]
description: Build four browser entries from the repository.
---

# Page build

Vite builds the four HTML entry pages and their imported modules.

## Input → Movement → Output

The inputs are four HTML files. TypeScript checks source, then Vite follows each page module. Output is the built site in `dist/` (`package.json:7-11`, `vite.config.ts:3-11`).

## Why this shape

Explicit inputs keep the non-home pages in the build (`vite.config.ts:4-10`).

## Steps

1. `npm run build` invokes `tsc --noEmit && vite build` (`package.json:8`).
2. Vite uses `index.html`, `midicc.html`, `tda.html`, and `books.html` (`vite.config.ts:4-10`).

## If you change this

- **Hits:** page entry inclusion and build output.
- **Does not hit:** [song](../objects/performance/songs.md) content unless its imported code changes.

## Surfaces

| Surface | Role |
|---|---|
| Developer or CI | Runs build |
| Browser | Loads output |

## See

- Objects: [site pages](../objects/pages/site-pages.md)
- Source: [vite.config.ts](../../vite.config.ts)
