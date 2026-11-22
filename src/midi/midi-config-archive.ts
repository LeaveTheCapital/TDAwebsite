import type { MidiConfig } from "./midi-config.ts";

export type MidiConfigArchivePlace = "local" | "remote";

export interface MidiConfigAccount {
  email: string | null;
}

export type MidiConfigArchivePhase =
  | { kind: "local"; reason: "unconfigured" | "unavailable" }
  | { kind: "starting" }
  | {
      kind: "remote";
      account: MidiConfigAccount | null;
      rejection: string | null;
    };

export type MidiConfigLoadResult =
  | { place: MidiConfigArchivePlace; config: MidiConfig | null }
  | { place: MidiConfigArchivePlace; invalid: true };

export class ArchiveNotReady extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArchiveNotReady";
  }
}

export interface MidiConfigArchive {
  phase(): MidiConfigArchivePhase;
  onPhase(listener: (phase: MidiConfigArchivePhase) => void): void;
  blockedReason(): string | null;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  save(config: MidiConfig): Promise<MidiConfigArchivePlace>;
  load(): Promise<MidiConfigLoadResult>;
  failureMessage(error: unknown, fallback: string): string;
}

export interface MidiConfigFile {
  load(): MidiConfig | null;
  save(config: MidiConfig): void;
}
