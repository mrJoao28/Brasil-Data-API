import type { ApiKeyTier } from './apiKeys';
import { getPlanConfig } from './plans';
import { redisEnabled, redisEval, redisGet } from './redis';

interface UsageBucket {
  period: string;
  count: number;
}

const usage = new Map<string, UsageBucket>();

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function resetAtForPeriod(period: string): Date {
  const [yearText, monthText] = period.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid usage period: ${period}`);
  }
  return new Date(Date.UTC(year, month, 1));
}

function secondsUntilReset(resetAt: Date): number {
  return Math.max(60, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
}

export interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}

function memoryGet(key: string, tier: ApiKeyTier, period = currentPeriod()): UsageStatus {
  const bucket = usage.get(key);
  const used = bucket?.period === period ? bucket.count : 0;
  const limit = getPlanConfig(tier).monthlyQuota;
  return { used, limit, remaining: Math.max(0, limit - used), resetAt: resetAtForPeriod(period) };
}

export async function getUsage(key: string, tier: ApiKeyTier): Promise<UsageStatus> {
  const period = currentPeriod();
  if (!redisEnabled) return memoryGet(key, tier, period);

  const raw = await redisGet(`usage:${key}:${period}`);
  const used = raw ? Number(raw) : 0;
  const limit = getPlanConfig(tier).monthlyQuota;
  const resetAt = resetAtForPeriod(period);
  return { used, limit, remaining: Math.max(0, limit - used), resetAt };
}

const consumeScript = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
if current >= limit then
  return {current, 0}
end
local next = current + 1
redis.call('SET', KEYS[1], next, 'EX', ttl)
return {next, 1}
`;

export async function consumeUsage(key: string, tier: ApiKeyTier): Promise<UsageStatus> {
  const period = currentPeriod();
  const limit = getPlanConfig(tier).monthlyQuota;
  const resetAt = resetAtForPeriod(period);

  if (!redisEnabled) {
    const current = memoryGet(key, tier, period);
    if (current.used >= current.limit) return current;
    const count = current.used + 1;
    usage.set(key, { period, count });
    return { ...current, used: count, remaining: Math.max(0, current.limit - count) };
  }

  const [used, allowed] = await redisEval<[number, number]>(consumeScript, [`usage:${key}:${period}`], [String(limit), String(secondsUntilReset(resetAt))]);
  if (allowed === 0) return { used, limit, remaining: 0, resetAt };
  return { used, limit, remaining: Math.max(0, limit - used), resetAt };
}

export function resetUsage(): void {
  usage.clear();
}
