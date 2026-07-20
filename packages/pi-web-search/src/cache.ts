interface ExpiringCacheEntry<V> {
  expiresAt: number;
  size: number;
  value: V;
}

/** An expiring least-recently-used cache bounded by entry count and aggregate bytes. */
export class ExpiringLruCache<K, V> {
  readonly #entries = new Map<K, ExpiringCacheEntry<V>>();
  #byteSize = 0;

  constructor(
    readonly maxEntries: number,
    readonly maxBytes: number,
    readonly sizeOf: (value: V) => number,
    readonly now: () => number = Date.now,
  ) {}

  get byteSize(): number {
    return this.#byteSize;
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: K): V | undefined {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.#delete(key);
      return undefined;
    }
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, expiresAt: number): boolean {
    this.#delete(key);
    const size = this.sizeOf(value);
    if (size > this.maxBytes) return false;

    this.#entries.set(key, { expiresAt, size, value });
    this.#byteSize += size;
    while (this.#entries.size > this.maxEntries || this.#byteSize > this.maxBytes) {
      const oldest = this.#entries.keys().next().value;
      if (oldest === undefined) break;
      this.#delete(oldest);
    }
    return this.#entries.has(key);
  }

  #delete(key: K): void {
    const entry = this.#entries.get(key);
    if (!entry) return;
    this.#entries.delete(key);
    this.#byteSize -= entry.size;
  }
}
