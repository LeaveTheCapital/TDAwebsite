import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeMidiConfig,
  parseMidiConfig,
  serializeMidiConfig,
  type AxisControl,
  type MidiConfig,
  type MidiControl,
} from "../src/midi/midi-config.ts";
import { BrowserMidiConfigArchive, type CloudSession } from "../src/storage/browser-midi-config-archive.ts";
import type { CloudAccount } from "../src/storage/firebase-web-config.ts";
import type { JsonStorageAdapter } from "../src/storage/json-storage-socket.ts";
import { createMidiConfigFile } from "../src/storage/midi-config-file.ts";

void describe("MIDI config domain", () => {
  void it("keeps a current config and migrates the legacy axis name", () => {
    const current = sampleConfig();
    assert.deepEqual(normalizeMidiConfig(current), current);
    const legacy = {
      ...current,
      intechZoya: current.intechZona,
      notes: undefined,
    };
    delete (legacy as { intechZona?: unknown }).intechZona;
    const migrated = normalizeMidiConfig(legacy);
    assert.ok(migrated);
    assert.deepEqual(migrated.intechZona, current.intechZona);
    assert.equal(migrated.notes, "");
    assert.equal(Object.hasOwn(migrated, "intechZoya"), false);
  });

  void it("normalises ezeptocore banks and drops an unreadable one", () => {
    const current = sampleConfig();
    const named = normalizeMidiConfig({
      ...current,
      ezeptocore: { banks: [["Kick"]] },
    });
    assert.ok(named);
    assert.ok(named.ezeptocore);
    const firstBank = named.ezeptocore.banks[0];
    const secondBank = named.ezeptocore.banks[1];
    assert.ok(firstBank);
    assert.ok(secondBank);
    assert.equal(named.ezeptocore.banks.length, 16);
    assert.equal(firstBank[0], "Kick");
    assert.equal(firstBank.length, 16);
    assert.equal(secondBank[0], "");
    const dropped = normalizeMidiConfig({ ...current, ezeptocore: { banks: "nope" } });
    assert.ok(dropped);
    assert.equal(Object.hasOwn(dropped, "ezeptocore"), false);
    const plain = normalizeMidiConfig(current);
    assert.ok(plain);
    assert.equal(Object.hasOwn(plain, "ezeptocore"), false);
  });

  void it("parses stored JSON and rejects a broken document", () => {
    const current = sampleConfig();
    assert.deepEqual(parseMidiConfig(serializeMidiConfig(current)), current);
    assert.equal(serializeMidiConfig(current).includes("\n"), false);
    assert.equal(parseMidiConfig("{\"notes\":1}"), null);
    assert.throws(() => parseMidiConfig("{"), SyntaxError);
  });
});

void describe("automatic MIDI config file", () => {
  void it("saves compact JSON and loads a legacy snapshot without rewriting it", () => {
    const values = new Map<string, string>();
    const file = createMidiConfigFile(mapStorage(values), "tda-midi-cc-config-v1");
    const current = sampleConfig();
    file.save(current);
    assert.equal(values.get("tda-midi-cc-config-v1"), JSON.stringify(current));
    const legacy = {
      ...current,
      intechZoya: current.intechZona,
    };
    delete (legacy as { intechZona?: unknown }).intechZona;
    values.set("tda-midi-cc-config-v1", JSON.stringify(legacy));
    const loaded = file.load();
    assert.deepEqual(loaded?.intechZona, current.intechZona);
    assert.equal(values.get("tda-midi-cc-config-v1"), JSON.stringify(legacy));
    values.delete("tda-midi-cc-config-v1");
    assert.equal(file.load(), null);
    values.set("tda-midi-cc-config-v1", "{");
    assert.throws(() => file.load(), SyntaxError);
  });
});

void describe("MIDI config archive", () => {
  void it("keeps an unconfigured archive on the local adapter", async () => {
    const local = memoryAdapter();
    const archive = new BrowserMidiConfigArchive(
      { kind: "local", reason: "unconfigured" },
      local.adapter,
      "tda-midi-cc-config",
      null,
    );
    assert.equal(archive.blockedReason(), null);
    const config = sampleConfig();
    assert.equal(await archive.save(config), "local");
    assert.equal(local.docs.get("tda-midi-cc-config")?.includes("\n"), true);
    const loaded = await archive.load();
    assert.equal("config" in loaded && loaded.config?.notes, config.notes);
  });

  void it("requires a signed-in remote session before it writes", async () => {
    const local = memoryAdapter();
    const remote = fakeSession();
    const archive = new BrowserMidiConfigArchive(
      { kind: "starting" },
      local.adapter,
      "tda-midi-cc-config",
      () => Promise.resolve(remote.session),
    );
    const kinds: string[] = [];
    archive.onPhase((phase) => {
      kinds.push(phase.kind);
    });
    assert.equal(archive.blockedReason(), "Cloud storage is still starting. Try again in a moment.");
    await assert.rejects(() => archive.save(sampleConfig()), /still starting/);
    await archive.connect();
    assert.deepEqual(kinds, ["starting", "remote"]);
    assert.equal(archive.blockedReason(), "Sign in with Google first.");
    await assert.rejects(() => archive.save(sampleConfig()), /Sign in with Google first/);
    assert.equal(local.docs.size, 0);
    assert.equal(remote.docs.size, 0);
    await archive.signIn();
    assert.equal(archive.phase().kind, "remote");
    assert.equal(await archive.save(sampleConfig()), "remote");
    assert.equal(remote.docs.has("owner/tda-midi-cc-config"), true);
    const loaded = await archive.load();
    assert.equal("config" in loaded && loaded.config?.notes, "hello");
    remote.docs.set("owner/tda-midi-cc-config", "{\"notes\":1}");
    const invalid = await archive.load();
    assert.equal("invalid" in invalid, true);
  });

  void it("falls back to this browser when the session cannot start", async () => {
    const local = memoryAdapter();
    const archive = new BrowserMidiConfigArchive(
      { kind: "starting" },
      local.adapter,
      "tda-midi-cc-config",
      () => Promise.reject(new Error("firebase unavailable")),
    );
    await archive.connect();
    const phase = archive.phase();
    assert.equal(phase.kind, "local");
    assert.equal(phase.reason, "unavailable");
    assert.equal(await archive.save(sampleConfig()), "local");
    assert.equal(
      archive.failureMessage({ code: "permission-denied" }, "fallback"),
      "Cloud storage denied this account. Check that Firestore rules allow it.",
    );
  });

  void it("publishes an account rejection without storing a signed-in user", async () => {
    const remote = fakeSession();
    const archive = new BrowserMidiConfigArchive(
      { kind: "starting" },
      memoryAdapter().adapter,
      "tda-midi-cc-config",
      () => Promise.resolve(remote.session),
    );
    await archive.connect();
    remote.reject("This Google account cannot access the cloud copy.");
    const phase = archive.phase();
    assert.equal(phase.kind, "remote");
    assert.equal(phase.account, null);
    assert.equal(phase.rejection, "This Google account cannot access the cloud copy.");
    assert.equal(archive.blockedReason(), "Sign in with Google first.");
  });
});

function sampleControl(): MidiControl {
  return {
    mode: "cc",
    channel: "1",
    number: "2",
    description: "Filter",
    button: "Reset",
  };
}

function sampleAxis(): AxisControl {
  return { channel: "1", number: "3", description: "Mix" };
}

function sampleConfig(): MidiConfig {
  return {
    oxiE16: Array.from({ length: 16 }, sampleControl),
    lightreftMonolit: Array.from({ length: 8 }, sampleControl),
    intechZona: { x: sampleAxis(), y: sampleAxis(), z: sampleAxis() },
    notes: "hello",
  };
}

function mapStorage(values: Map<string, string>): Pick<Storage, "getItem" | "setItem"> {
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function memoryAdapter(): { docs: Map<string, string>; adapter: JsonStorageAdapter } {
  const docs = new Map<string, string>();
  return {
    docs,
    adapter: {
      write(key, json) {
        docs.set(key, json);
        return Promise.resolve();
      },
      read(key) {
        return Promise.resolve(docs.get(key) ?? null);
      },
    },
  };
}

function fakeSession(): {
  session: CloudSession;
  docs: Map<string, string>;
  reject: (message: string) => void;
} {
  let listener: ((account: CloudAccount | null, rejection: string | null) => void) | null = null;
  const docs = new Map<string, string>();
  const session: CloudSession = {
    onAccount(next) {
      listener = next;
      next(null, null);
    },
    signIn() {
      const account = { uid: "owner", email: "owner@example.com" };
      listener?.(account, null);
      return Promise.resolve(account);
    },
    signOut() {
      listener?.(null, null);
      return Promise.resolve();
    },
    adapterFor(account) {
      return {
        write(key, json) {
          docs.set(`${account.uid}/${key}`, json);
          return Promise.resolve();
        },
        read(key) {
          return Promise.resolve(docs.get(`${account.uid}/${key}`) ?? null);
        },
      };
    },
  };
  return {
    session,
    docs,
    reject(message) {
      listener?.(null, message);
    },
  };
}
