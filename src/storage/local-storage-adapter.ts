import type { JsonStorageAdapter } from "./json-storage-socket";

export class LocalStorageAdapter implements JsonStorageAdapter {
  private readonly getStorage: () => Pick<Storage, "setItem">;

  constructor(getStorage: () => Pick<Storage, "setItem">) {
    this.getStorage = getStorage;
  }

  write(key: string, json: string): Promise<void> {
    return new Promise((resolve) => {
      this.getStorage().setItem(key, json);
      resolve();
    });
  }
}
