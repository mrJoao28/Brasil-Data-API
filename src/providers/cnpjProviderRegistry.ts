import { env } from '../config/env';
import { brasilApiCnpjProvider } from './brasilApiCnpjProvider';
import type { CnpjProvider } from './cnpjProvider';

/**
 * Resolves the active CNPJ provider from `CNPJ_PROVIDER`. Only
 * 'brasilapi' is implemented today. 'receita-federal' is a documented
 * extension point (see docs/PROVIDERS.md) for the official "Consulta
 * CNPJ" API via gov.br/conecta — selecting it now fails fast with an
 * explicit configuration error instead of silently falling back to
 * BrasilAPI.
 */
export function getCnpjProvider(): CnpjProvider {
  switch (env.CNPJ_PROVIDER) {
    case 'brasilapi':
      return brasilApiCnpjProvider;
    case 'receita-federal':
      throw new Error(
        'CNPJ_PROVIDER=receita-federal is not implemented yet. It requires OAuth2 client credentials registered at gov.br/conecta for the official Consulta CNPJ API. See docs/PROVIDERS.md before configuring this in any environment.',
      );
    default: {
      const exhaustiveCheck: never = env.CNPJ_PROVIDER;
      throw new Error(`Unknown CNPJ_PROVIDER: ${String(exhaustiveCheck)}`);
    }
  }
}
