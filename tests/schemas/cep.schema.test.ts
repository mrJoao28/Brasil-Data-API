import { describe, expect, it } from 'vitest';
import { cepParamSchema } from '../../src/schemas/cep.schema';

describe('cepParamSchema', () => {
  it('accepts a plain 8-digit CEP', () => {
    const result = cepParamSchema.safeParse({ cep: '69000000' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cep).toBe('69000000');
    }
  });

  it('strips non-digit characters before validating', () => {
    const result = cepParamSchema.safeParse({ cep: '69000-000' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cep).toBe('69000000');
    }
  });

  it('rejects a CEP with fewer than 8 digits', () => {
    const result = cepParamSchema.safeParse({ cep: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('CEP must contain 8 digits.');
    }
  });

  it('rejects a CEP with more than 8 digits', () => {
    const result = cepParamSchema.safeParse({ cep: '123456789' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric CEP', () => {
    const result = cepParamSchema.safeParse({ cep: 'abcdefgh' });
    expect(result.success).toBe(false);
  });
});
