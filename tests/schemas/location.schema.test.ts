import { describe, expect, it } from 'vitest';
import { ufParamSchema } from '../../src/schemas/location.schema';

describe('ufParamSchema', () => {
  it('accepts a lowercase 2-letter UF and uppercases it', () => {
    const result = ufParamSchema.safeParse({ uf: 'am' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uf).toBe('AM');
    }
  });

  it('accepts an already-uppercase UF', () => {
    const result = ufParamSchema.safeParse({ uf: 'SP' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uf).toBe('SP');
    }
  });

  it('rejects a UF with more than 2 letters', () => {
    const result = ufParamSchema.safeParse({ uf: 'AMZ' });
    expect(result.success).toBe(false);
  });

  it('rejects a UF containing digits', () => {
    const result = ufParamSchema.safeParse({ uf: 'A1' });
    expect(result.success).toBe(false);
  });
});
