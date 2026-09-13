import type { Store, IncrementResponse } from 'express-rate-limit';
import { env } from '../config/env';
import { redisDecr, redisDelete, redisEnabled, redisExpire, redisIncr, redisTtl } from '../config/redis';

export class RedisRateLimitStore implements Store {
  windowMs = env.RATE_LIMIT_WINDOW_MS;

  constructor(private readonly prefix: string) {}

  async increment(key: string): Promise<IncrementResponse> {
    if (!redisEnabled) throw new Error('Redis rate-limit store is not configured.');
    const redisKey = `${this.prefix}:${key}`;
    const totalHits = await redisIncr(redisKey);
    if (totalHits === 1) await redisExpire(redisKey, Math.ceil(this.windowMs / 1000));
    const ttl = await redisTtl(redisKey);
    return { totalHits, resetTime: new Date(Date.now() + Math.max(1, ttl) * 1000) };
  }

  async decrement(key: string): Promise<void> {
    if (!redisEnabled) return;
    await redisDecr(`${this.prefix}:${key}`);
  }

  async resetKey(key: string): Promise<void> {
    if (!redisEnabled) return;
    await redisDelete(`${this.prefix}:${key}`);
  }
}
