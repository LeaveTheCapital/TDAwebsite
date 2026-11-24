---
type: object
cluster: editors
universe: live
status: verified
verified_on: 2026-11-24
revision: 2388b4c
entity: src/storage/json-storage-socket.ts
description: Asynchronous JSON write contract with local storage adapter.
---

# Storage port

`JsonStorageSocket` serializes a value and delegates its write to a `JsonStorageAdapter`.

## Why this shape

The adapter boundary lets each editor request an asynchronous snapshot write while the current implementation targets browser local storage (`src/storage/json-storage-socket.ts:1-16`, `src/storage/local-storage-adapter.ts:1-16`).

## Shape

- The port is `write(key, json): Promise<void>`; the local adapter calls `setItem` (`src/storage/json-storage-socket.ts:1-3`, `src/storage/local-storage-adapter.ts:10-15`).
- Both editors construct it with `LocalStorageAdapter` (`src/midicc.ts:45`, `src/books.ts:193`).

## Connected to

- **Owns:** explicit JSON snapshot write contract.
- **Owned by:** shared `src/storage/` module.
- **Joins:** [MIDI editor](midi-config.md), [media library](media-library.md).
- **Looks like but is not:** a WebSocket or remote cloud backend.

## If you change this

- **Hits:** both editors' explicit upload actions and adapter implementations.
- **Does not hit:** automatic saves, which call `localStorage.setItem` directly (`src/midicc.ts:521-523`, `src/books.ts:677-681`).

## Surfaces

| Surface | Role |
|---|---|
| MIDI editor | Writes snapshot |
| Books page | Writes snapshot |

## See

- Source: [src/storage/json-storage-socket.ts](../../../src/storage/json-storage-socket.ts)
- Adapter: [src/storage/local-storage-adapter.ts](../../../src/storage/local-storage-adapter.ts)
