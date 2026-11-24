---
type: object
cluster: editors
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/books.ts
description: Books page media library and local save.
---

# Media library

`src/books.ts` runs the Books page library for books, films, series and games.

## Why this shape

The page contains its domain types and the rendering, editing and save logic together (`src/books.ts:5-100`, `src/books.ts:1082-1109`).

## Shape

- Automatic save uses `tda-books-library-v1`; explicit snapshot uses `tda-books-library-cloud-demo-v1` (`src/books.ts:191-193`, `src/books.ts:677-701`).
- The editor renders entries and forms from its in-memory `library` (`src/books.ts:250`, `src/books.ts:1282-1439`).

## Connected to

- **Owns:** media library entries and page rendering.
- **Owned by:** `books.html` entry.
- **Joins:** [storage port](storage-port.md) for explicit upload.
- **Looks like but is not:** [songs](../performance/songs.md) are performance content, not media records.

## If you change this

- **Hits:** `books.html`, `books.css`, local library persistence.
- **Does not hit:** [setlist](../performance/setlist.md) order.

## Surfaces

| Surface | Role |
|---|---|
| Books page | Reads and writes library |
| Browser local storage | Persists library |

## See

- Source: [src/books.ts](../../../src/books.ts)
