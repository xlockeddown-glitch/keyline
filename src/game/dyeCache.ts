/** 0.1.193: a keyed cache of async loads that never keeps a failure. A rejected or empty load resolves to null and is
 *  dropped, so the next request tries again; callers never see a rejection. */
export function retryingCache<T>() {
  const m = new Map<string, Promise<T | null>>();
  return {
    get(key: string, load: () => Promise<T | null>): Promise<T | null> {
      let hit = m.get(key);
      if (!hit) {
        const p: Promise<T | null> = (async () => {
          try {
            return await load();
          } catch {
            return null;
          }
        })().then((v) => {
          if (v === null && m.get(key) === p) m.delete(key);
          return v;
        });
        m.set(key, p);
        hit = p;
      }
      return hit;
    },
    delete(key: string): void {
      m.delete(key);
    },
    keys(): string[] {
      return [...m.keys()];
    },
  };
}
