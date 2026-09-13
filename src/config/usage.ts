import type { ApiKeyTier } from './apiKeys';
import { getPlanConfig } from './plans';

interface UsageBucket {
  period: string;
  count: number;
}

const usage = new Map<string, UsageBucket>();

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export function getUsage(key: string, tier: ApiKeyTier): UsageStatus {
  const period = currentPeriod();
  const bucket = usage.get(key);
  const used = bucket?.period === period ? bucket.count : 0;
  const limit = getPlanConfig(tier).monthlyQuota;
  const resetAt = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1));
  return { used, limit, remaining: Math.max(0, limit - used), resetAt };
}

export function consumeUsage(key: string, tier: ApiKeyTier): UsageStatus {
  const period = currentPeriod();
  const current = usage.get(key);
  const count = current?.period === period ? current.count + 1 : 1;
  usage.set(key, { period, count });
  return getUsage(key, tier);
}

export function resetUsage(): void {
  usage.clear();
}
