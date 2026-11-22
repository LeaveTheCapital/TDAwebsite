import type { MidiConfigArchive, MidiConfigFile } from "../midi/midi-config-archive.ts";
import { BrowserMidiConfigArchive } from "./browser-midi-config-archive.ts";
import { readFirebaseWebConfig } from "./firebase-web-config.ts";
import { LocalStorageAdapter } from "./local-storage-adapter.ts";
import { createMidiConfigFile } from "./midi-config-file.ts";

const localConfigKey = "tda-midi-cc-config-v1";
const cloudConfigKey = "tda-midi-cc-config";

export interface MidiConfigStorage {
  file: MidiConfigFile;
  archive: MidiConfigArchive;
}

export function openMidiConfigStorage(): MidiConfigStorage {
  const file = createMidiConfigFile(localStorage, localConfigKey);
  const local = new LocalStorageAdapter(() => localStorage);
  const config = readFirebaseWebConfig(import.meta.env);
  if (config === null) {
    return {
      file,
      archive: new BrowserMidiConfigArchive(
        { kind: "local", reason: "unconfigured" },
        local,
        cloudConfigKey,
        null,
      ),
    };
  }
  const archive = new BrowserMidiConfigArchive(
    { kind: "starting" },
    local,
    cloudConfigKey,
    async () => {
      const { connectFirebase } = await import("./firebase-cloud.ts");
      return connectFirebase(config);
    },
  );
  void archive.connect();
  return { file, archive };
}
