import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getTierConfig } from '../config/tiers';
import { env } from '../config/env';
import { redisEnabled } from '../config/redis';
import { RedisRateLimitStore } from './redisRateLimitStore';

function sendRateLimited(_req: Request, res: Response): void {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  });
}

const globalStore = redisEnabled ? new RedisRateLimitStore('ratelimit:global') : null;
const tierStore = redisEnabled ? new RedisRateLimitStore('ratelimit:tier') : null;

const globalLimiterOptions = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: sendRateLimited,
};

export const rateLimiter = globalStore
  ? rateLimit({ ...globalLimiterOptions, store: globalStore })
  : rateLimit(globalLimiterOptions);

const tierLimiterOptions = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => req.apiKey ?? req.ip ?? 'unknown',
  max: (req: Request): number => getTierConfig(req.apiKeyTier ?? 'free').maxRequests,
  handler: sendRateLimited,
};

export const apiTierRateLimiter = tierStore
  ? rateLimit({ ...tierLimiterOptions, store: tierStore })
  : rateLimit(tierLimiterOptions);
