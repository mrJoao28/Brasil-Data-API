import { env } from '../config/env';
import { brasilApiCnpjProvider } from './brasilApiCnpjProvider';
import { openCnpjProvider } from './openCnpjProvider';
import type { CnpjProvider } from './cnpjProvider';

export function getCnpjProvider(): CnpjProvider {
  switch (env.CNPJ_PROVIDER) {
    case 'brasilapi':
      return brasilApiCnpjProvider;
    case 'opencnpj':
      return openCnpjProvider;
    case 'receita-federal':
      throw new Error(
        'CNPJ_PROVIDER=receita-federal is not implemented yet. It requires OAuth2 client credentials registered at gov.br/conecta. See docs/PROVIDERS.md.',
      );
    default: {
      const exhaustiveCheck: never = env.CNPJ_PROVIDER;
      throw new Error(`Unknown CNPJ_PROVIDER: ${String(exhaustiveCheck)}`);
    }
  }
}
