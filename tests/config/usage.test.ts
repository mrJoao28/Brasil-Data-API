import { beforeEach, describe, expect, it } from 'vitest';
import { resetUsage, consumeUsage, getUsage } from '../../src/config/usage';

describe('usage metering', () => {
  beforeEach(() => resetUsage());

  it('starts empty and increments per API key', () => {
    expect(getUsage('key', 'free').used).toBe(0);
    expect(consumeUsage('key', 'free')).toMatchObject({ used: 1, remaining: 2999, limit: 3000 });
    expect(consumeUsage('key', 'free').used).toBe(2);
  });

  it('isolates usage buckets by API key', () => {
    consumeUsage('key-a', 'free');
    expect(getUsage('key-b', 'free').used).toBe(0);
  });
});
