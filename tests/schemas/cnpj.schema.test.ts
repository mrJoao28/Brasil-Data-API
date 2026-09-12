import { describe, expect, it } from 'vitest';
import { cnpjParamSchema } from '../../src/schemas/cnpj.schema';

describe('cnpjParamSchema', () => {
  it('accepts a plain 14-digit CNPJ', () => {
    const result = cnpjParamSchema.safeParse({ cnpj: '19131243000197' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cnpj).toBe('19131243000197');
    }
  });

  it('strips formatting punctuation before validating', () => {
    const result = cnpjParamSchema.safeParse({ cnpj: '19.131.243/0001-97' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cnpj).toBe('19131243000197');
    }
  });

  it('rejects a CNPJ with fewer than 14 digits', () => {
    const result = cnpjParamSchema.safeParse({ cnpj: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects a CNPJ with more than 14 digits', () => {
    const result = cnpjParamSchema.safeParse({ cnpj: '191312430001975' });
    expect(result.success).toBe(false);
  });
});
