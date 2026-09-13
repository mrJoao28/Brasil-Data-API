import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getTierConfig } from '../config/tiers';
import { env } from '../config/env';

function sendRateLimited(_req: Request, res: Response): void {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  });
}

/**
 * Basic in-memory rate limiter applied to every request (including
 * unauthenticated routes like `/health`). No Redis/store is used in the
 * MVP, which means limits are per-process; that's an accepted trade-off
 * until the API is deployed behind multiple instances.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: sendRateLimited,
});

/**
 * Tier-aware limiter for authenticated `/api/v1` traffic. Must run after
 * `apiKeyAuth` so `req.apiKey`/`req.apiKeyTier` are already set. Each API
 * key gets its own bucket (rather than being limited by IP), and the
 * ceiling for that bucket depends on the key's tier (`free` vs `paid`).
 */
export const apiTierRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => req.apiKey ?? req.ip ?? 'unknown',
  max: (req: Request): number => getTierConfig(req.apiKeyTier ?? 'free').maxRequests,
  handler: sendRateLimited,
});
