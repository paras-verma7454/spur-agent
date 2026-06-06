export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export interface RateLimiter {
  check(ip: string): RateLimitResult;
}

export interface InMemoryRateLimiterConfig {
  windowMs?: number;
  maxRequests?: number;
  maxEntries?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createInMemoryRateLimiter(
  config: InMemoryRateLimiterConfig = {}
): RateLimiter & { _reset(): void } {
  const windowMs = config.windowMs || 60_000;
  const maxRequests = config.maxRequests || 20;
  const maxEntries = config.maxEntries || 10_000;
  const store = new Map<string, RateLimitEntry>();

  const intervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, windowMs);

  if (typeof intervalId === 'object' && typeof intervalId.unref === 'function') {
    intervalId.unref();
  }

  function evictIfNeeded() {
    if (store.size > maxEntries) {
      const now = Date.now();
      let deleted = 0;
      const toDelete = Math.ceil(maxEntries * 0.1);
      for (const [key, entry] of store) {
        if (deleted >= toDelete) break;
        if (now > entry.resetAt) {
          store.delete(key);
          deleted++;
        }
      }
      // If not enough expired entries, delete oldest by resetAt
      if (deleted < toDelete) {
        const entries = [...store.entries()].sort(
          (a, b) => a[1].resetAt - b[1].resetAt
        );
        for (let i = 0; i < toDelete - deleted && i < entries.length; i++) {
          store.delete(entries[i][0]);
        }
      }
    }
  }

  return {
    _reset() {
      store.clear();
    },

    check(ip: string) {
      const now = Date.now();
      const entry = store.get(ip);

      if (!entry || now > entry.resetAt) {
        evictIfNeeded();
        store.set(ip, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
      }

      entry.count++;

      if (entry.count > maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
      }

      return { allowed: true, remaining: maxRequests - entry.count, retryAfter: 0 };
    },
  };
}

export function createNoOpRateLimiter(): RateLimiter {
  return {
    check() {
      return { allowed: true, remaining: 999, retryAfter: 0 };
    },
  };
}
