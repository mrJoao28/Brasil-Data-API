import { describe, expect, it } from 'vitest';
import { brasilApiCnpjProvider } from '../../src/providers/brasilApiCnpjProvider';
import { getCnpjProvider } from '../../src/providers/cnpjProviderRegistry';

describe('cnpjProviderRegistry', () => {
  it('resolves the BrasilAPI provider by default', () => {
    expect(getCnpjProvider()).toBe(brasilApiCnpjProvider);
  });
});
