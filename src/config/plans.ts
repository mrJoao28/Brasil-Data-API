import type { ApiKeyTier } from './apiKeys';
import { env } from './env';

export interface PlanConfig {
  name: string;
  monthlyQuota: number;
  rateLimitPerMinute: number;
  maxApiKeys: number;
}

export const plans: Record<ApiKeyTier, PlanConfig> = {
  free: { name: 'Free', monthlyQuota: env.PLAN_FREE_MONTHLY_QUOTA, rateLimitPerMinute: env.RATE_LIMIT_FREE_MAX, maxApiKeys: 1 },
  paid: { name: 'Pro', monthlyQuota: env.PLAN_PAID_MONTHLY_QUOTA, rateLimitPerMinute: env.RATE_LIMIT_PAID_MAX, maxApiKeys: 10 },
};

export function getPlanConfig(tier: ApiKeyTier): PlanConfig {
  return plans[tier];
}
