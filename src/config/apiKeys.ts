import { env } from './env';

export type ApiKeyTier = 'free' | 'paid';

export interface ApiKeyRecord {
  key: string;
  tier: ApiKeyTier;
}

/**
 * API keys are sourced from comma-separated environment variables in this
 * MVP stage (no database yet). Everything outside this module only depends
 * on `resolveApiKeyTier`, so swapping this for a database-backed lookup
 * later (e.g. `SELECT tier FROM api_keys WHERE key = ?`) only requires
 * rewriting this one file — callers don't need to change.
 */
function parseKeyList(value: string): string[] {
  return value
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

function loadApiKeyRecords(): ApiKeyRecord[] {
  const freeKeys = parseKeyList(env.API_KEYS_FREE).map((key) => ({
    key,
    tier: 'free' as const,
  }));
  const paidKeys = parseKeyList(env.API_KEYS_PAID).map((key) => ({
    key,
    tier: 'paid' as const,
  }));

  return [...freeKeys, ...paidKeys];
}

const apiKeyIndex = new Map<string, ApiKeyTier>(
  loadApiKeyRecords().map((record) => [record.key, record.tier]),
);

/**
 * Returns the tier associated with an API key, or `null` if the key is
 * unknown/invalid.
 */
export function resolveApiKeyTier(key: string): ApiKeyTier | null {
  return apiKeyIndex.get(key) ?? null;
}
