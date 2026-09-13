import { describe, expect, it } from 'vitest';
import { getCepProvider } from '../../src/providers/cepProviderRegistry';
import { viaCepProvider } from '../../src/providers/viaCepProvider';

describe('cepProviderRegistry', () => {
  it('resolves the ViaCEP provider by default', () => {
    expect(getCepProvider()).toBe(viaCepProvider);
  });
});
