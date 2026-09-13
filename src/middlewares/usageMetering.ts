import type { RequestHandler } from 'express';
import { getPlanConfig } from '../config/plans';
import { consumeUsage } from '../config/usage';
import { ApiError } from '../utils/errors';

export const usageMetering: RequestHandler = async (req, res, next) => {
  const key = req.apiKey;
  const tier = req.apiKeyTier;

  if (!key || !tier) {
    next(new ApiError(500, 'USAGE_CONTEXT_MISSING', 'API key usage context is missing.'));
    return;
  }

  try {
    const plan = getPlanConfig(tier);
    const usage = await consumeUsage(key, tier);
    res.setHeader('X-Plan', plan.name);
    res.setHeader('X-Usage-Limit', String(usage.limit));
    res.setHeader('X-Usage-Used', String(usage.used));
    res.setHeader('X-Usage-Remaining', String(usage.remaining));
    res.setHeader('X-Usage-Reset', Math.floor(usage.resetAt.getTime() / 1000));

    if (usage.used >= usage.limit) {
      next(new ApiError(429, 'PLAN_LIMIT', 'Monthly plan quota exceeded.', {
        limit: usage.limit,
        resetAt: usage.resetAt.toISOString(),
      }));
      return;
    }

    next();
  } catch (error) {
    next(new ApiError(503, 'USAGE_STORE_UNAVAILABLE', 'Usage metering is temporarily unavailable.', {
      reason: error instanceof Error ? error.message : 'unknown',
    }));
  }
};
