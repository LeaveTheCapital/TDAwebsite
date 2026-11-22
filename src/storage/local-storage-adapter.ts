import type { JsonStorageAdapter } from "./json-storage-socket";

export class LocalStorageAdapter implements JsonStorageAdapter {
  private readonly getStorage: () => Pick<Storage, "getItem" | "setItem">;

  constructor(getStorage: () => Pick<Storage, "getItem" | "setItem">) {
    this.getStorage = getStorage;
  }

  write(key: string, json: string): Promise<void> {
    return new Promise((resolve) => {
      this.getStorage().setItem(key, json);
      resolve();
    });
  }

  read(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      resolve(this.getStorage().getItem(key));
    });
  }
}
