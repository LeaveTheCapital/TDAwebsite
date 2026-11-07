export interface JsonStorageAdapter {
  write(key: string, json: string): Promise<void>;
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
}
