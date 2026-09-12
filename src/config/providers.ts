import { env } from './env';

/**
 * Central registry of external provider base URLs.
 *
 * Every provider is free/public. See README.md for licensing/terms notes
 * for each one. Base URLs are configurable via environment variables so
 * they can be swapped (e.g. self-hosted mirrors) without code changes.
 */
export const providers = {
  viaCep: {
    name: 'ViaCEP',
    baseUrl: env.VIACEP_BASE_URL,
    docs: 'https://viacep.com.br/',
  },
  ibgeLocalidades: {
    name: 'IBGE Localidades',
    baseUrl: env.IBGE_LOCALIDADES_BASE_URL,
    docs: 'https://servicodados.ibge.gov.br/api/docs/localidades',
  },
  brasilApi: {
    name: 'BrasilAPI',
    baseUrl: env.BRASILAPI_BASE_URL,
    docs: 'https://brasilapi.com.br/docs',
  },
} as const;
