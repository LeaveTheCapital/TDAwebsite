import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CloudAccessError,
  cloudAccountAllowed,
  cloudFailureMessage,
  readFirebaseWebConfig,
} from "../src/storage/firebase-web-config.ts";
import {
  FirestoreAdapter,
  cloudConfigDocument,
  createFirestoreDocumentClient,
  jsonFromCloudDocument,
  type CloudConfigDocument,
  type CloudSnapshot,
  type FirestoreSdk,
} from "../src/storage/firestore-adapter.ts";
import { JsonStorageSocket, type JsonStorageAdapter } from "../src/storage/json-storage-socket.ts";
import { LocalStorageAdapter } from "../src/storage/local-storage-adapter.ts";

void describe("JsonStorageSocket", () => {
  void it("writes pretty JSON and reads the parsed value", async () => {
    const stored = new Map<string, string>();
    const socket = new JsonStorageSocket(mapAdapter(stored));
    await socket.write("config", { b: 1, a: [2] });
    assert.equal(
      stored.get("config"),
      `{
  "b": 1,
  "a": [
    2
  ]
}`,
    );
    assert.deepEqual(await socket.read("config"), { b: 1, a: [2] });
  });

  void it("returns null when the adapter has no value", async () => {
    const socket = new JsonStorageSocket(mapAdapter(new Map()));
    assert.equal(await socket.read("missing"), null);
  });

  void it("rejects invalid JSON and failed writes", async () => {
    const failure = new Error("offline");
    const socket = new JsonStorageSocket({
      write(): Promise<void> {
        return Promise.reject(failure);
      },
      read(): Promise<string | null> {
        return Promise.resolve("{");
      },
    });
    await assert.rejects(() => socket.write("config", { ok: true }), (caught: unknown) => {
      assert.equal(caught, failure);
      return true;
    });
    await assert.rejects(() => socket.read("config"), SyntaxError);
  });
});

void describe("LocalStorageAdapter", () => {
  void it("writes and reads through the storage getter", async () => {
    let storage = memoryStorage();
    const adapter = new LocalStorageAdapter(() => storage);
    await adapter.write("config", "{\"ok\":true}");
    assert.equal(await adapter.read("config"), "{\"ok\":true}");
    storage = memoryStorage();
    assert.equal(await adapter.read("config"), null);
  });

  void it("rejects when storage throws", async () => {
    const adapter = new LocalStorageAdapter(() => ({
      getItem(): string | null {
        throw new Error("get failed");
      },
      setItem(): void {
        throw new Error("set failed");
      },
    }));
    await assert.rejects(() => adapter.write("config", "{}"), /set failed/);
    await assert.rejects(() => adapter.read("config"), /get failed/);
  });
});

void describe("FirestoreAdapter", () => {
  void it("writes and reads the signed-in user's config document", async () => {
    const documents = new Map<string, CloudConfigDocument>();
    const seen: unknown[] = [];
    const sdk = memorySdk(documents, seen);
    const client = createFirestoreDocumentClient({ name: "db" }, sdk, () => "2026-11-18T00:00:00.000Z");
    const adapter = new FirestoreAdapter(client, "owner");
    await adapter.write("tda-midi-cc-config", "{\"notes\":\"cloud\"}");
    assert.deepEqual(seen, [{ name: "db" }, "users", "owner", "configs", "tda-midi-cc-config"]);
    assert.deepEqual(documents.get("users/owner/configs/tda-midi-cc-config"), {
      json: "{\"notes\":\"cloud\"}",
      updatedAt: "2026-11-18T00:00:00.000Z",
    });
    assert.equal(await adapter.read("tda-midi-cc-config"), "{\"notes\":\"cloud\"}");
    assert.equal(await adapter.read("other"), null);
  });

  void it("rejects a bad path before calling Firestore", async () => {
    let calls = 0;
    const sdk: FirestoreSdk = {
      doc() {
        calls += 1;
        return "ref";
      },
      setDoc() {
        calls += 1;
        return Promise.resolve();
      },
      getDocFromServer() {
        calls += 1;
        return Promise.resolve(snapshot(false, undefined));
      },
    };
    const adapter = new FirestoreAdapter(createFirestoreDocumentClient({}, sdk), "owner");
    await assert.rejects(() => adapter.write("bad/key", "{}"), /Invalid Firestore config key/);
    await assert.rejects(() => adapter.read("  "), /Invalid Firestore config key/);
    await assert.rejects(
      () => new FirestoreAdapter(createFirestoreDocumentClient({}, sdk), "bad/uid").read("key"),
      /Invalid Firestore user/,
    );
    assert.equal(calls, 0);
  });

  void it("rejects when the server document is malformed or the request fails", async () => {
    const failure = new Error("permission-denied");
    const sdk: FirestoreSdk = {
      doc() {
        return "ref";
      },
      setDoc() {
        return Promise.reject(failure);
      },
      getDocFromServer() {
        return Promise.resolve(snapshot(true, { json: 4, updatedAt: "time" }));
      },
    };
    const adapter = new FirestoreAdapter(createFirestoreDocumentClient({}, sdk), "owner");
    await assert.rejects(() => adapter.write("key", "{}"), (caught: unknown) => {
      assert.equal(caught, failure);
      return true;
    });
    await assert.rejects(() => adapter.read("key"), /missing JSON/);
  });

  void it("rejects when Firestore does not confirm", async () => {
    const sdk: FirestoreSdk = {
      doc() {
        return "ref";
      },
      setDoc() {
        return new Promise(() => undefined);
      },
      getDocFromServer() {
        return new Promise(() => undefined);
      },
    };
    const adapter = new FirestoreAdapter(createFirestoreDocumentClient({}, sdk, () => "now", 20), "owner");
    await assert.rejects(() => adapter.write("key", "{}"), /did not confirm/);
    await assert.rejects(() => adapter.read("key"), /did not confirm/);
  });
});

void describe("cloud document payload", () => {
  void it("requires the stored JSON string", () => {
    assert.deepEqual(cloudConfigDocument("{}", "now"), { json: "{}", updatedAt: "now" });
    assert.equal(jsonFromCloudDocument(false, undefined), null);
    assert.equal(jsonFromCloudDocument(true, { json: "{}", updatedAt: "now" }), "{}");
    assert.throws(() => jsonFromCloudDocument(true, { json: "{}" }), /missing JSON/);
    assert.throws(() => jsonFromCloudDocument(true, null), /missing JSON/);
  });
});

void describe("Firebase web config", () => {
  const complete = {
    VITE_FIREBASE_API_KEY: "api",
    VITE_FIREBASE_AUTH_DOMAIN: "project.firebaseapp.com",
    VITE_FIREBASE_PROJECT_ID: "project",
    VITE_FIREBASE_STORAGE_BUCKET: "project.appspot.com",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "123",
    VITE_FIREBASE_APP_ID: "app",
    VITE_FIREBASE_ALLOWED_EMAIL: " Owner@Example.com ",
    VITE_FIREBASE_ALLOWED_UID: " uid-1 ",
  };

  void it("reads a complete config and treats blanks as unset", () => {
    assert.deepEqual(readFirebaseWebConfig(complete), {
      apiKey: "api",
      authDomain: "project.firebaseapp.com",
      projectId: "project",
      storageBucket: "project.appspot.com",
      messagingSenderId: "123",
      appId: "app",
      allowedEmail: "Owner@Example.com",
      allowedUid: "uid-1",
    });
    assert.equal(readFirebaseWebConfig({}), null);
    assert.equal(readFirebaseWebConfig({ ...complete, VITE_FIREBASE_APP_ID: "  " }), null);
    const open = readFirebaseWebConfig({
      ...complete,
      VITE_FIREBASE_ALLOWED_EMAIL: "",
      VITE_FIREBASE_ALLOWED_UID: "",
    });
    if (open === null) {
      throw new Error("Expected Firebase config");
    }
    assert.equal(open.allowedEmail, null);
    assert.equal(open.allowedUid, null);
  });

  void it("checks the optional account allowlist", () => {
    const policy = { allowedEmail: "owner@example.com", allowedUid: "uid-1" };
    assert.equal(cloudAccountAllowed({ uid: "uid-1", email: "Owner@Example.com" }, policy), true);
    assert.equal(cloudAccountAllowed({ uid: "other", email: "owner@example.com" }, policy), false);
    assert.equal(cloudAccountAllowed({ uid: "uid-1", email: null }, policy), false);
    assert.equal(
      cloudAccountAllowed({ uid: "someone", email: "someone@example.com" }, { allowedEmail: null, allowedUid: null }),
      true,
    );
  });

  void it("maps cloud failures to status text", () => {
    assert.equal(
      cloudFailureMessage(new CloudAccessError("This Google account cannot access the cloud copy."), "fallback"),
      "This Google account cannot access the cloud copy.",
    );
    assert.equal(cloudFailureMessage({ code: "auth/popup-closed-by-user" }, "fallback"), "Sign-in was cancelled.");
    assert.equal(cloudFailureMessage({ code: "auth/popup-blocked" }, "fallback"), "The browser blocked Google sign-in. Allow popups and try again.");
    assert.equal(cloudFailureMessage({ code: "auth/unauthorized-domain" }, "fallback"), "This domain is not authorised for Google sign-in.");
    assert.equal(cloudFailureMessage({ code: "permission-denied" }, "fallback"), "Cloud storage denied this account. Check that Firestore rules allow it.");
    assert.equal(cloudFailureMessage({ code: 12 }, "fallback"), "fallback");
    assert.equal(cloudFailureMessage(new Error("nope"), "fallback"), "fallback");
  });
});

function mapAdapter(stored: Map<string, string>): JsonStorageAdapter {
  return {
    write(key, json) {
      stored.set(key, json);
      return Promise.resolve();
    },
    read(key) {
      return Promise.resolve(stored.get(key) ?? null);
    },
  };
}

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const values = new Map<string, string>();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function memorySdk(documents: Map<string, CloudConfigDocument>, seen: unknown[]): FirestoreSdk {
  return {
    doc(firestore, collection, userId, configs, configId) {
      seen.push(firestore, collection, userId, configs, configId);
      return [collection, userId, configs, configId].join("/");
    },
    setDoc(reference, data) {
      if (typeof reference !== "string") {
        return Promise.reject(new Error("bad reference"));
      }
      documents.set(reference, data);
      return Promise.resolve();
    },
    getDocFromServer(reference) {
      if (typeof reference !== "string") {
        return Promise.reject(new Error("bad reference"));
      }
      const data = documents.get(reference);
      return Promise.resolve(snapshot(data !== undefined, data));
    },
  };
}

function snapshot(exists: boolean, data: unknown): CloudSnapshot {
  return {
    exists: () => exists,
    data: () => data,
  };
}
