import { describe, expect, it } from 'vitest';
import { yearParamSchema } from '../../src/schemas/holidays.schema';

describe('yearParamSchema', () => {
  it('accepts a valid numeric-string year and coerces it to a number', () => {
    const result = yearParamSchema.safeParse({ year: '2026' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2026);
      expect(typeof result.data.year).toBe('number');
    }
  });

  it('rejects a non-numeric year', () => {
    const result = yearParamSchema.safeParse({ year: 'abcd' });
    expect(result.success).toBe(false);
  });

  it('rejects a year before 1900', () => {
    const result = yearParamSchema.safeParse({ year: '1899' });
    expect(result.success).toBe(false);
  });

  it('rejects a year far in the future', () => {
    const farFuture = new Date().getFullYear() + 50;
    const result = yearParamSchema.safeParse({ year: String(farFuture) });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer year', () => {
    const result = yearParamSchema.safeParse({ year: '2026.5' });
    expect(result.success).toBe(false);
  });
});
