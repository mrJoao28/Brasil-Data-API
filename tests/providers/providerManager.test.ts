import { describe, expect, it } from 'vitest';
import { ProviderManager } from '../../src/providers/providerManager';
import { UpstreamError } from '../../src/utils/errors';

describe('ProviderManager', () => {
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

  it('does not fallback on non-upstream errors', async () => {
    const manager = new ProviderManager<string, string>([
      { name: 'primary', execute: async () => { throw new Error('bug'); } },
      { name: 'fallback', execute: async () => 'fallback' },
    ]);

    await expect(manager.execute('test')).rejects.toThrow('bug');
  });
});
