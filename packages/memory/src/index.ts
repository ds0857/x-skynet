import type { MemoryProvider } from "@xskynet/contracts";

export class InMemoryProvider implements MemoryProvider {
  #store = new Map<string, unknown>();

  async read(key: string): Promise<unknown> {
    return this.#store.get(key);
  }
  async write(key: string, value: unknown): Promise<void> {
    this.#store.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.#store.delete(key);
  }
}

export type { MemoryProvider } from "@xskynet/contracts";
