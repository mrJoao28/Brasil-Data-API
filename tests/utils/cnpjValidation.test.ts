import { describe, expect, it } from 'vitest';
import { isValidCnpjChecksum } from '../../src/utils/cnpjValidation';

describe('isValidCnpjChecksum', () => {
  it('accepts a well-known valid CNPJ (Banco do Brasil)', () => {
    expect(isValidCnpjChecksum('00000000000191')).toBe(true);
  });

  it('accepts another well-known valid CNPJ used elsewhere in the test suite', () => {
    expect(isValidCnpjChecksum('19131243000197')).toBe(true);
  });

  it('rejects a CNPJ with a wrong first check digit', () => {
    expect(isValidCnpjChecksum('19131243000297')).toBe(false);
  });

  it('rejects a CNPJ with a wrong second check digit', () => {
    expect(isValidCnpjChecksum('19131243000198')).toBe(false);
  });

  it('rejects 14 repeated digits', () => {
    expect(isValidCnpjChecksum('00000000000000')).toBe(false);
    expect(isValidCnpjChecksum('11111111111111')).toBe(false);
  });

  it('rejects strings that are not exactly 14 digits', () => {
    expect(isValidCnpjChecksum('1913124300019')).toBe(false);
    expect(isValidCnpjChecksum('191312430001977')).toBe(false);
    expect(isValidCnpjChecksum('1913124300019a')).toBe(false);
  });
});
