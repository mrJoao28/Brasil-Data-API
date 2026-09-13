import { afterEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env';
import { ProviderManager } from '../../src/providers/providerManager';
import { UpstreamError } from '../../src/utils/errors';

describe('ProviderManager', () => {
  const originalThreshold = env.PROVIDER_FAILURE_THRESHOLD;
  const originalCooldown = env.PROVIDER_COOLDOWN_MS;

  afterEach(() => {
    env.PROVIDER_FAILURE_THRESHOLD = originalThreshold;
    env.PROVIDER_COOLDOWN_MS = originalCooldown;
  });

  it('falls back after an upstream failure', async () => {
    const manager = new ProviderManager<string, string>([
      { name: 'primary', execute: async () => { throw new UpstreamError('down'); } },
      { name: 'fallback', execute: async (input) => `${input}-ok` },
    ]);
    await expect(manager.execute('test')).resolves.toEqual({ value: 'test-ok', provider: 'fallback' });
    expect(manager.getStats()[0]).toMatchObject({ errors: 1, failures: 1 });
    expect(manager.getStats()[1]).toMatchObject({ successes: 1 });
  });

  it('opens a circuit after the configured failure threshold', async () => {
    env.PROVIDER_FAILURE_THRESHOLD = 3;
    const manager = new ProviderManager<string, string>([
      { name: 'primary', execute: async () => { throw new UpstreamError('down'); } },
      { name: 'fallback', execute: async () => 'fallback' },
    ]);
    await manager.execute('a');
    await manager.execute('b');
    await manager.execute('c');
    expect(manager.getStats()[0].circuitOpen).toBe(true);
    await expect(manager.execute('d')).resolves.toEqual({ value: 'fallback', provider: 'fallback' });
  });

  it('allows one half-open probe after cooldown', async () => {
    env.PROVIDER_FAILURE_THRESHOLD = 1;
    env.PROVIDER_COOLDOWN_MS = 1;
    let calls = 0;
    const manager = new ProviderManager<string, string>([
      { name: 'primary', execute: async () => { calls += 1; if (calls === 1) throw new UpstreamError('down'); return 'recovered'; } },
      { name: 'fallback', execute: async () => 'fallback' },
    ]);
    await expect(manager.execute('a')).resolves.toEqual({ value: 'fallback', provider: 'fallback' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await expect(manager.execute('b')).resolves.toEqual({ value: 'recovered', provider: 'primary' });
    expect(manager.getStats()[0].circuitOpen).toBe(false);
  });

  it('does not fallback on non-upstream errors', async () => {
    const manager = new ProviderManager<string, string>([
      { name: 'primary', execute: async () => { throw new Error('bug'); } },
      { name: 'fallback', execute: async () => 'fallback' },
    ]);
    await expect(manager.execute('test')).rejects.toThrow('bug');
  });
});
