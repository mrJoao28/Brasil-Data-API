import type { RequestHandler } from 'express';
import { getPlanConfig } from '../config/plans';
import { consumeUsage, getUsage } from '../config/usage';
import { ApiError } from '../utils/errors';

export const usageMetering: RequestHandler = (req, res, next) => {
  const key = req.apiKey;
  const tier = req.apiKeyTier;

  if (!key || !tier) {
    next(new ApiError(500, 'USAGE_CONTEXT_MISSING', 'API key usage context is missing.'));
    return;
  }

  const plan = getPlanConfig(tier);
  const before = getUsage(key, tier);
  res.setHeader('X-Plan', plan.name);
  res.setHeader('X-Usage-Limit', String(before.limit));
  res.setHeader('X-Usage-Used', String(before.used));
  res.setHeader('X-Usage-Remaining', String(before.remaining));
  res.setHeader('X-Usage-Reset', Math.floor(before.resetAt.getTime() / 1000));

  if (before.used >= before.limit) {
    next(new ApiError(429, 'PLAN_LIMIT', 'Monthly plan quota exceeded.', {
      limit: before.limit,
      resetAt: before.resetAt.toISOString(),
    }));
    return;
  }

  const after = consumeUsage(key, tier);
  res.setHeader('X-Usage-Used', String(after.used));
  res.setHeader('X-Usage-Remaining', String(after.remaining));
  next();
};
