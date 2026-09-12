import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Basic in-memory rate limiter. No Redis/store is used in the MVP, which
 * means limits are per-process; that's an accepted trade-off until the API
 * is deployed behind multiple instances.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
});
