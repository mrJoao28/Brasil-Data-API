export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Small process-local TTL cache for slow-changing upstream data.
 * Safe for the current single-instance deployment; use a shared store
 * such as Redis if the API is horizontally scaled.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return undefined;
    }

    this.hits += 1;
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) return;
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      entries: this.store.size,
    };
  }
}
