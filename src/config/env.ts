import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CORS_ORIGIN: z.string().default('*'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),

  HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),

  VIACEP_BASE_URL: z.string().url().default('https://viacep.com.br/ws'),
  IBGE_LOCALIDADES_BASE_URL: z
    .string()
    .url()
    .default('https://servicodados.ibge.gov.br/api/v1/localidades'),
  BRASILAPI_BASE_URL: z.string().url().default('https://brasilapi.com.br/api'),
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
