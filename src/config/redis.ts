import { z } from 'zod';

const redisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

const parsed = redisEnvSchema.parse({
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
});

export const redisConfig = {
  enabled: Boolean(parsed.UPSTASH_REDIS_REST_URL && parsed.UPSTASH_REDIS_REST_TOKEN),
  url: parsed.UPSTASH_REDIS_REST_URL,
  token: parsed.UPSTASH_REDIS_REST_TOKEN,
};
