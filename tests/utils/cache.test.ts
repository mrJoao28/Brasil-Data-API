import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../../src/utils/cache';

describe('TtlCache', () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    cache = new TtlCache<string>();
  });

  it('returns a cached value before its TTL expires', () => {
    cache.set('states', 'cached-value', 60_000);

    expect(cache.get('states')).toBe('cached-value');
    expect(cache.getStats()).toEqual({ hits: 1, misses: 0, entries: 1 });
  });

  it('treats expired entries as misses and removes them', () => {
    vi.useFakeTimers();
    try {
      cache.set('states', 'cached-value', 1_000);
      vi.advanceTimersByTime(1_001);

      expect(cache.get('states')).toBeUndefined();
      expect(cache.getStats()).toEqual({ hits: 0, misses: 1, entries: 0 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('can clear all cached values and statistics', () => {
    cache.set('a', 'one', 60_000);
    cache.get('missing');

    cache.clear();

    expect(cache.get('a')).toBeUndefined();
    expect(cache.getStats()).toEqual({ hits: 0, misses: 1, entries: 0 });
  });
});
