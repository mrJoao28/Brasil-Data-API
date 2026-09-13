import { env } from './env';

export type ApiKeyTier = 'free' | 'paid';

export interface ApiKeyRecord {
  key: string;
  tier: ApiKeyTier;
}

function parseKeyList(value: string): string[] {
  return value
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

function loadApiKeyRecords(): ApiKeyRecord[] {
  const freeKeys = parseKeyList(env.API_KEYS_FREE).map((key) => ({ key, tier: 'free' as const }));
  const paidKeys = parseKeyList(env.API_KEYS_PAID).map((key) => ({ key, tier: 'paid' as const }));
  return [...freeKeys, ...paidKeys];
}

const revokedKeys = new Set(parseKeyList(env.API_KEYS_REVOKED));
const apiKeyIndex = new Map<string, ApiKeyTier>(loadApiKeyRecords().map((record) => [record.key, record.tier]));

export function resolveApiKeyTier(key: string): ApiKeyTier | null {
  if (revokedKeys.has(key)) return null;
  return apiKeyIndex.get(key) ?? null;
}
