# MIDI configuration upload storage

The existing automatic save uses `tda-midi-cc-config-v1`. Clicking **Upload to cloud** takes a complete snapshot of the current form, including controls and notes, and writes JSON to `tda-midi-cc-config-cloud-demo-v1` through `JsonStorageSocket` and `LocalStorageAdapter`. Later edits leave that snapshot unchanged until the next upload. Reloading restores the existing automatic save.

The demo stays in local storage on the current browser and origin. It does not yet provide remote storage or access from another device.

`JsonStorageAdapter` is the asynchronous write contract (the socket/port); this is a ports-and-adapters design rather than a network WebSocket connection. To add GCP or another destination, implement `write(key: string, json: string): Promise<void>` and inject that adapter into `JsonStorageSocket` where `uploadStorage` is constructed in `src/midicc.ts`. Resolve only after the destination confirms persistence and reject on failure. The UI handles pending, success, and failure states independently of automatic local saves. Remote credentials should be handled by an authenticated backend rather than embedded in the browser bundle.
