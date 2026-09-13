import type { NextFunction, Request, Response } from 'express';
import { resolveApiKeyTier } from '../config/apiKeys';
import { UnauthorizedError } from '../utils/errors';

export const API_KEY_HEADER = 'x-api-key';

/**
 * Requires a valid API key on every request it guards, resolving it to a
 * usage tier (`free` | `paid`) and attaching both to `req` for downstream
 * middleware (see `apiTierRateLimiter`) and handlers to use.
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.header(API_KEY_HEADER);

  if (!apiKey) {
    next(new UnauthorizedError(`Missing API key. Provide it via the "${API_KEY_HEADER}" header.`));
    return;
  }

  const tier = resolveApiKeyTier(apiKey);
  if (!tier) {
    next(new UnauthorizedError('Invalid API key.'));
    return;
  }

  req.apiKey = apiKey;
  req.apiKeyTier = tier;
  next();
}
