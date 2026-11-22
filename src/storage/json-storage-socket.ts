export interface JsonStorageAdapter {
  write(key: string, json: string): Promise<void>;
  read(key: string): Promise<string | null>;
}

export class JsonStorageSocket {
  private readonly adapter: JsonStorageAdapter;

  constructor(adapter: JsonStorageAdapter) {
    this.adapter = adapter;
  }

  async write(key: string, value: unknown): Promise<void> {
    const json = JSON.stringify(value, null, 2);
    await this.adapter.write(key, json);
  }

  async read(key: string): Promise<unknown> {
    const json = await this.adapter.read(key);
    if (json === null) {
      return null;
    }
    return JSON.parse(json) as unknown;
  }
}
