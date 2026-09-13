import type { ApiKeyTier } from './apiKeys';
import { env } from './env';

export interface TierConfig {
  /** Max requests allowed per RATE_LIMIT_WINDOW_MS for this tier. */
  maxRequests: number;
}

export const tiers: Record<ApiKeyTier, TierConfig> = {
  free: { maxRequests: env.RATE_LIMIT_FREE_MAX },
  paid: { maxRequests: env.RATE_LIMIT_PAID_MAX },
};

export function getTierConfig(tier: ApiKeyTier): TierConfig {
  return tiers[tier];
}
