import { beforeEach, describe, expect, it } from 'vitest';
import { resetUsage, consumeUsage, getUsage } from '../../src/config/usage';

describe('usage metering', () => {
  beforeEach(() => resetUsage());

  it('starts empty and increments per API key', async () => {
    expect((await getUsage('key', 'free')).used).toBe(0);
    expect(await consumeUsage('key', 'free')).toMatchObject({ used: 1, remaining: 2999, limit: 3000 });
    expect((await consumeUsage('key', 'free')).used).toBe(2);
  });

  it('isolates usage buckets by API key', async () => {
    await consumeUsage('key-a', 'free');
    expect((await getUsage('key-b', 'free')).used).toBe(0);
  });
});
