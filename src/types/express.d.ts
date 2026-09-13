import type { ApiKeyTier } from '../config/apiKeys';

declare global {
  namespace Express {
    interface Request {
      /** Set by `apiKeyAuth` once the request's API key has been validated. */
      apiKey?: string;
      /** Tier (`free` | `paid`) associated with `req.apiKey`. */
      apiKeyTier?: ApiKeyTier;
    }
  }
}

export {};
