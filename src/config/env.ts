import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CORS_ORIGIN: z.string().default('*'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),

  // Per-tier limits for authenticated /api/v1 traffic. Window reuses
  // RATE_LIMIT_WINDOW_MS above so there is a single knob for the window size.
  RATE_LIMIT_FREE_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_PAID_MAX: z.coerce.number().int().positive().default(1000),

  // Comma-separated lists of API keys per tier. Empty by default (no key
  // will authenticate) until the operator configures at least one key.
  API_KEYS_FREE: z.string().default(''),
  API_KEYS_PAID: z.string().default(''),

  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),

  VIACEP_BASE_URL: z.string().url().default('https://viacep.com.br/ws'),
  IBGE_LOCALIDADES_BASE_URL: z
    .string()
    .url()
    .default('https://servicodados.ibge.gov.br/api/v1/localidades'),
  BRASILAPI_BASE_URL: z.string().url().default('https://brasilapi.com.br/api'),

  // Provider selection. Kept separate from the base-URL config above so a
  // provider can be swapped without touching URLs, and so unimplemented
  // providers fail fast with a clear message instead of silently falling
  // back to the default. See docs/PROVIDERS.md for the licensing status
  // of each option before switching away from the default in production.
  //
  // 'correios' and 'receita-federal' are listed (not just left out) so
  // operators discover the intended extension points, but neither is
  // implemented yet: both require credentials/contracts this environment
  // does not have (SIGEP Web access; gov.br/conecta OAuth2 client). See
  // docs/PROVIDERS.md.
  CEP_PROVIDER: z.enum(['viacep', 'correios']).default('viacep'),
  CNPJ_PROVIDER: z.enum(['brasilapi', 'receita-federal']).default('brasilapi'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration. Check .env against .env.example.');
  }

  return parsed.data;
}

export const env = loadEnv();

/**
 * CORS_ORIGIN accepts "*" or a comma-separated list of origins.
 */
export function getCorsOrigins(): string | string[] {
  if (env.CORS_ORIGIN.trim() === '*') {
    return '*';
  }
  return env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
}
