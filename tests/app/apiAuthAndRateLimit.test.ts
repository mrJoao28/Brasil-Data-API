import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Distinct keys per scenario below so each test's rate-limit bucket (keyed
// by API key) starts empty, since the limiter's in-memory store lives for
// the whole file rather than being reset between tests/app instances.
process.env.API_KEYS_FREE = 'itest-free-key-a,itest-free-key-b';
process.env.API_KEYS_PAID = 'itest-paid-key';
process.env.RATE_LIMIT_FREE_MAX = '2';
process.env.RATE_LIMIT_PAID_MAX = '5';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
// Keep the baseline (unauthenticated-route) limiter out of the way so it
// doesn't interfere with the tier-limit assertions below.
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';

// Imported after env vars above are set, since `src/config/env.ts` parses
// `process.env` once at module load time.
let createApp: typeof import('../../src/app').createApp;
let request: typeof import('supertest');

beforeAll(async () => {
  ({ createApp } = await import('../../src/app'));
  request = (await import('supertest')).default as unknown as typeof import('supertest');
});

function mockIbgeStatesFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          { id: 13, sigla: 'AM', nome: 'Amazonas', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
        ]),
    }),
  );
}

describe('API key auth + per-tier rate limiting (integration)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 401 UNAUTHORIZED when no API key is provided', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/states');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 UNAUTHORIZED when the API key is invalid', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/states').set('x-api-key', 'bogus-key');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('allows requests through with a valid API key', async () => {
    mockIbgeStatesFetch();
    const app = createApp();
    const res = await request(app).get('/api/v1/states').set('x-api-key', 'itest-free-key-a');

    expect(res.status).toBe(200);
  });

  it('rate-limits a free-tier key after its per-window quota (2) is exceeded', async () => {
    mockIbgeStatesFetch();
    const app = createApp();

    const first = await request(app).get('/api/v1/states').set('x-api-key', 'itest-free-key-b');
    const second = await request(app).get('/api/v1/states').set('x-api-key', 'itest-free-key-b');
    const third = await request(app).get('/api/v1/states').set('x-api-key', 'itest-free-key-b');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMITED');
  });

  it('gives a paid-tier key a higher quota than a free-tier key', async () => {
    mockIbgeStatesFetch();
    const app = createApp();

    const results = [];
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await request(app).get('/api/v1/states').set('x-api-key', 'itest-paid-key'));
    }

    expect(results.every((res) => res.status === 200)).toBe(true);
  });
});
