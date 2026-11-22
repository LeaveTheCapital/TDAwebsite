import {
  ArchiveNotReady,
  type MidiConfigArchive,
  type MidiConfigArchivePhase,
  type MidiConfigArchivePlace,
  type MidiConfigLoadResult,
} from "../midi/midi-config-archive.ts";
import { normalizeMidiConfig, type MidiConfig } from "../midi/midi-config.ts";
import { cloudFailureMessage, type CloudAccount } from "./firebase-web-config.ts";
import { JsonStorageSocket, type JsonStorageAdapter } from "./json-storage-socket.ts";

export interface CloudSession {
  onAccount(listener: (account: CloudAccount | null, rejection: string | null) => void): void;
  signIn(): Promise<CloudAccount>;
  signOut(): Promise<void>;
  adapterFor(account: CloudAccount): JsonStorageAdapter;
}

const signedOutStorage: JsonStorageAdapter = {
  write(): Promise<void> {
    return Promise.reject(new Error("Sign in with Google first."));
  },
  read(): Promise<string | null> {
    return Promise.reject(new Error("Sign in with Google first."));
  },
};

export class BrowserMidiConfigArchive implements MidiConfigArchive {
  private phaseState: MidiConfigArchivePhase;
  private session: CloudSession | null = null;
  private signedIn: CloudAccount | null = null;
  private readonly listeners = new Set<(phase: MidiConfigArchivePhase) => void>();
  private readonly local: JsonStorageAdapter;
  private readonly cloudKey: string;
  private readonly connectSession: (() => Promise<CloudSession>) | null;

  constructor(
    initial: MidiConfigArchivePhase,
    local: JsonStorageAdapter,
    cloudKey: string,
    connectSession: (() => Promise<CloudSession>) | null,
  ) {
    this.phaseState = initial;
    this.local = local;
    this.cloudKey = cloudKey;
    this.connectSession = connectSession;
  }

  phase(): MidiConfigArchivePhase {
    return this.phaseState;
  }

  onPhase(listener: (phase: MidiConfigArchivePhase) => void): void {
    this.listeners.add(listener);
    listener(this.phaseState);
  }

  blockedReason(): string | null {
    if (this.phaseState.kind === "starting") {
      return "Cloud storage is still starting. Try again in a moment.";
    }
    if (this.phaseState.kind === "remote" && this.signedIn === null) {
      return "Sign in with Google first.";
    }
    return null;
  }

  async connect(): Promise<void> {
    if (this.connectSession === null) {
      return;
    }
    try {
      const session = await this.connectSession();
      this.session = session;
      session.onAccount((account, rejection) => {
        this.signedIn = account;
        this.setPhase({
          kind: "remote",
          account: account === null ? null : { email: account.email },
          rejection,
        });
      });
    } catch {
      this.session = null;
      this.signedIn = null;
      this.setPhase({ kind: "local", reason: "unavailable" });
    }
  }

  async signIn(): Promise<void> {
    if (this.session === null || this.phaseState.kind !== "remote") {
      return;
    }
    await this.session.signIn();
  }

  async signOut(): Promise<void> {
    if (this.session === null || this.phaseState.kind !== "remote") {
      return;
    }
    await this.session.signOut();
  }

  async save(config: MidiConfig): Promise<MidiConfigArchivePlace> {
    this.assertReady();
    const place = this.place();
    await this.socket().write(this.cloudKey, config);
    return place;
  }

  async load(): Promise<MidiConfigLoadResult> {
    this.assertReady();
    const place = this.place();
    const stored = await this.socket().read(this.cloudKey);
    if (stored === null) {
      return { place, config: null };
    }
    const config = normalizeMidiConfig(stored);
    if (config === null) {
      return { place, invalid: true };
    }
    return { place, config };
  }

  failureMessage(error: unknown, fallback: string): string {
    if (error instanceof ArchiveNotReady) {
      return error.message;
    }
    return cloudFailureMessage(error, fallback);
  }

  private assertReady(): void {
    const blocked = this.blockedReason();
    if (blocked !== null) {
      throw new ArchiveNotReady(blocked);
    }
  }

  private place(): MidiConfigArchivePlace {
    return this.phaseState.kind === "remote" ? "remote" : "local";
  }

  private socket(): JsonStorageSocket {
    if (this.phaseState.kind === "remote" && this.session !== null && this.signedIn !== null) {
      return new JsonStorageSocket(this.session.adapterFor(this.signedIn));
    }
    if (this.phaseState.kind === "remote") {
      return new JsonStorageSocket(signedOutStorage);
    }
    return new JsonStorageSocket(this.local);
  }

  private setPhase(phase: MidiConfigArchivePhase): void {
    this.phaseState = phase;
    for (const listener of [...this.listeners]) {
      listener(this.phaseState);
    }
  }
}
