export interface Cached<T> {
  value: T;
  fetchedAt: Date;
  stale: boolean;
}

/** TTL cache with stale-if-error: if refresh fails, the last value is returned with `stale: true`. */
export class TtlCache<T> {
  private entry: { value: T; fetchedAt: Date } | null = null;

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async get(fetcher: () => Promise<T>): Promise<Cached<T>> {
    const at = this.now();
    if (this.entry && at.getTime() - this.entry.fetchedAt.getTime() < this.ttlMs) {
      return { ...this.entry, stale: false };
    }
    try {
      this.entry = { value: await fetcher(), fetchedAt: at };
      return { ...this.entry, stale: false };
    } catch (err) {
      if (this.entry) return { ...this.entry, stale: true };
      throw err;
    }
  }
}
