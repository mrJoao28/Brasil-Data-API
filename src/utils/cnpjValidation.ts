const FIRST_CHECK_DIGIT_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_CHECK_DIGIT_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calculateCheckDigit(base: string, weights: number[]): number {
  const sum = base
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (weights[index] ?? 0), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Validates the two check digits ("dígitos verificadores") of a Brazilian
 * CNPJ using the standard Receita Federal modulo-11 algorithm.
 *
 * Expects `cnpj` to already be normalized to 14 digits only (see
 * `cnpjParamSchema`, which strips punctuation before this runs). Also
 * rejects the well-known degenerate case of 14 repeated digits (e.g.
 * "00000000000000"), which passes the checksum arithmetically but is
 * never a real registration.
 */
export function isValidCnpjChecksum(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj)) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const firstCheckDigit = calculateCheckDigit(cnpj.slice(0, 12), FIRST_CHECK_DIGIT_WEIGHTS);
  if (firstCheckDigit !== Number(cnpj[12])) return false;

  const secondCheckDigit = calculateCheckDigit(cnpj.slice(0, 13), SECOND_CHECK_DIGIT_WEIGHTS);
  if (secondCheckDigit !== Number(cnpj[13])) return false;

  return true;
}
