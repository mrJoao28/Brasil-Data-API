import type { NextFunction, Request, Response } from 'express';
import { beforeAll, describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../src/utils/errors';

process.env.API_KEYS_FREE = 'free-key-1, free-key-2';
process.env.API_KEYS_PAID = 'paid-key-1';

// Imported after env vars above are set, since `src/config/env.ts` parses
// `process.env` once at module load time.
let apiKeyAuth: typeof import('../../src/middlewares/apiKeyAuth').apiKeyAuth;

beforeAll(async () => {
  ({ apiKeyAuth } = await import('../../src/middlewares/apiKeyAuth'));
});

function buildReq(headerValue: string | undefined): Request {
  return {
    header: (name: string) => (name.toLowerCase() === 'x-api-key' ? headerValue : undefined),
  } as unknown as Request;
}

describe('apiKeyAuth middleware', () => {
  it('accepts a valid free-tier key and attaches the tier to the request', () => {
    const req = buildReq('free-key-1');
    let calledWith: unknown;
    const next: NextFunction = (err?: unknown) => {
      calledWith = err;
    };

    apiKeyAuth(req, {} as Response, next);

    expect(calledWith).toBeUndefined();
    expect(req.apiKey).toBe('free-key-1');
    expect(req.apiKeyTier).toBe('free');
  });

  it('accepts a valid paid-tier key and attaches the tier to the request', () => {
    const req = buildReq('paid-key-1');
    let calledWith: unknown;
    const next: NextFunction = (err?: unknown) => {
      calledWith = err;
    };

    apiKeyAuth(req, {} as Response, next);

    expect(calledWith).toBeUndefined();
    expect(req.apiKeyTier).toBe('paid');
  });

  it('forwards UnauthorizedError when the key is missing', () => {
    const req = buildReq(undefined);
    let calledWith: unknown;
    const next: NextFunction = (err?: unknown) => {
      calledWith = err;
    };

    apiKeyAuth(req, {} as Response, next);

    expect(calledWith).toBeInstanceOf(UnauthorizedError);
    expect((calledWith as InstanceType<typeof UnauthorizedError>).statusCode).toBe(401);
  });

  it('forwards UnauthorizedError when the key is invalid', () => {
    const req = buildReq('not-a-real-key');
    let calledWith: unknown;
    const next: NextFunction = (err?: unknown) => {
      calledWith = err;
    };

    apiKeyAuth(req, {} as Response, next);

    expect(calledWith).toBeInstanceOf(UnauthorizedError);
  });
});
