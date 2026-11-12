/** Tiny in-memory TTL cache (per server instance). Not shared across instances; fine for short TTLs. */
export class TtlCache<V> {
  private readonly store = new Map<string, { value: V; expiresAt: number }>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string, now = Date.now()): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= now) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V, ttlMs = this.defaultTtlMs, now = Date.now()): V {
    this.store.set(key, { value, expiresAt: now + ttlMs });
    // Opportunistic pruning so the map cannot grow without bound.
    if (this.store.size > 500) this.prune(now);
    return value;
  }

  async getOrSet(key: string, compute: () => Promise<V>, ttlMs = this.defaultTtlMs): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await compute();
    return this.set(key, value, ttlMs);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  prune(now = Date.now()): void {
    for (const [k, v] of this.store) if (v.expiresAt <= now) this.store.delete(k);
  }

  get size(): number {
    return this.store.size;
  }
}
