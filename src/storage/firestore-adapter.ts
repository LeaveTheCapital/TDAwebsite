import type { JsonStorageAdapter } from "./json-storage-socket";

export interface CloudConfigDocument {
  json: string;
  updatedAt: string;
}

export type FirestoreConfigPath = readonly [string, string, string, string];

export interface FirestoreDocumentClient {
  write(path: FirestoreConfigPath, json: string): Promise<void>;
  read(path: FirestoreConfigPath): Promise<string | null>;
}

export interface CloudSnapshot {
  exists(): boolean;
  data(): unknown;
}

export interface FirestoreSdk {
  doc(
    firestore: unknown,
    collection: string,
    userId: string,
    configs: string,
    configId: string,
  ): unknown;
  setDoc(reference: unknown, data: CloudConfigDocument): Promise<void>;
  getDocFromServer(reference: unknown): Promise<CloudSnapshot>;
}

export function firestoreConfigPath(uid: string, key: string): FirestoreConfigPath {
  assertSegment(uid, "user");
  assertSegment(key, "config key");
  return ["users", uid, "configs", key];
}

export function cloudConfigDocument(json: string, updatedAt: string): CloudConfigDocument {
  return { json, updatedAt };
}

export function jsonFromCloudDocument(exists: boolean, data: unknown): string | null {
  if (!exists) {
    return null;
  }
  if (!isCloudConfigDocument(data)) {
    throw new Error("Cloud document is missing JSON.");
  }
  return data.json;
}

const cloudConfirmTimeoutMs = 15_000;

export function createFirestoreDocumentClient(
  firestore: unknown,
  sdk: FirestoreSdk,
  now: () => string = () => new Date().toISOString(),
  confirmTimeoutMs = cloudConfirmTimeoutMs,
): FirestoreDocumentClient {
  return {
    async write(path, json) {
      const [collection, userId, configs, configId] = path;
      const reference = sdk.doc(firestore, collection, userId, configs, configId);
      await confirm(
        sdk.setDoc(reference, cloudConfigDocument(json, now())),
        confirmTimeoutMs,
      );
    },
    async read(path) {
      const [collection, userId, configs, configId] = path;
      const reference = sdk.doc(firestore, collection, userId, configs, configId);
      const snapshot = await confirm(sdk.getDocFromServer(reference), confirmTimeoutMs);
      return jsonFromCloudDocument(snapshot.exists(), snapshot.data());
    },
  };
}

export class FirestoreAdapter implements JsonStorageAdapter {
  private readonly client: FirestoreDocumentClient;
  private readonly uid: string;

  constructor(client: FirestoreDocumentClient, uid: string) {
    this.client = client;
    this.uid = uid;
  }

  async write(key: string, json: string): Promise<void> {
    await this.client.write(firestoreConfigPath(this.uid, key), json);
  }

  async read(key: string): Promise<string | null> {
    return this.client.read(firestoreConfigPath(this.uid, key));
  }
}

function assertSegment(value: string, label: string): void {
  if (value.trim() === "" || value.includes("/")) {
    throw new Error(`Invalid Firestore ${label}.`);
  }
}

function confirm<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Cloud storage did not confirm the change."));
    }, timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(
          error instanceof Error
            ? error
            : new Error("Cloud storage did not confirm the change."),
        );
      },
    );
  });
}

function isCloudConfigDocument(value: unknown): value is CloudConfigDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.json === "string" && typeof record.updatedAt === "string";
}
