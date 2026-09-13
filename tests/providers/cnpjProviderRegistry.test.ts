import { describe, expect, it } from 'vitest';
import { brasilApiCnpjProvider } from '../../src/providers/brasilApiCnpjProvider';
import { getCnpjProvider } from '../../src/providers/cnpjProviderRegistry';

describe('cnpjProviderRegistry', () => {
  it('resolves the resilient failover provider by default', () => {
    const provider = getCnpjProvider();

    expect(provider).not.toBe(brasilApiCnpjProvider);
    expect(provider.name).toBe('BrasilAPI -> OpenCNPJ');
  });
});
