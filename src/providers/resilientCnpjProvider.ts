import type { CnpjResponse } from '../schemas/cnpj.schema';
import { UpstreamError, UpstreamTimeoutError } from '../utils/errors';
import type { CnpjProvider } from './cnpjProvider';

/**
 * Tries providers in order. Only upstream dependency failures trigger a
 * fallback; validation/not-found semantics are preserved. This keeps a
 * transient provider outage from becoming an API outage.
 */
export function createResilientCnpjProvider(providers: CnpjProvider[]): CnpjProvider {
  if (providers.length === 0) throw new Error('At least one CNPJ provider is required.');

  return {
    name: providers.map((provider) => provider.name).join(' -> '),
    async getCompanyByCnpj(cnpj: string): Promise<CnpjResponse | null> {
      let lastError: unknown;

      for (const provider of providers) {
        try {
          return await provider.getCompanyByCnpj(cnpj);
        } catch (error) {
          if (!(error instanceof UpstreamError) && !(error instanceof UpstreamTimeoutError)) {
            throw error;
          }
          lastError = error;
        }
      }

      throw lastError ?? new Error('All CNPJ providers failed.');
    },
  };
}
