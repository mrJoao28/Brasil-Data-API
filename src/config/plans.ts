import type { ApiKeyTier } from './apiKeys';

export interface PlanConfig {
  name: string;
  monthlyQuota: number;
  rateLimitPerMinute: number;
  maxApiKeys: number;
}

export const plans: Record<ApiKeyTier, PlanConfig> = {
  free: { name: 'Free', monthlyQuota: 3_000, rateLimitPerMinute: 5, maxApiKeys: 1 },
  paid: { name: 'Pro', monthlyQuota: 100_000, rateLimitPerMinute: 120, maxApiKeys: 10 },
};

export function getPlanConfig(tier: ApiKeyTier): PlanConfig {
  return plans[tier];
}
