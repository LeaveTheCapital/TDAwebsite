import type { MidiConfigFile } from "../midi/midi-config-archive.ts";
import { parseMidiConfig, serializeMidiConfig, type MidiConfig } from "../midi/midi-config.ts";

export function createMidiConfigFile(
  storage: Pick<Storage, "getItem" | "setItem">,
  key: string,
): MidiConfigFile {
  return {
    load(): MidiConfig | null {
      const json = storage.getItem(key);
      if (json === null) {
        return null;
      }
      return parseMidiConfig(json);
    },
    save(config: MidiConfig): void {
      storage.setItem(key, serializeMidiConfig(config));
    },
  };
}
