import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { resetMetrics } from '../../src/config/metrics';

process.env.API_KEYS_FREE = 'metrics-test-key';
process.env.API_KEYS_PAID = '';
process.env.RATE_LIMIT_FREE_MAX = '20';
process.env.RATE_LIMIT_PAID_MAX = '20';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';

let createApp: typeof import('../../src/app').createApp;
let request: typeof import('supertest');

beforeAll(async () => {
  ({ createApp } = await import('../../src/app'));
  request = (await import('supertest')).default as unknown as typeof import('supertest');
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetMetrics();
});

describe('metrics endpoint', () => {
  it('requires an API key', async () => {
    const res = await request(createApp()).get('/api/v1/metrics');
    expect(res.status).toBe(401);
  });

  it('returns request and cache metrics with a valid key', async () => {
    const res = await request(createApp()).get('/api/v1/metrics').set('x-api-key', 'metrics-test-key');

    expect(res.status).toBe(200);
    expect(res.body.requests).toBeGreaterThanOrEqual(0);
    expect(res.body).toHaveProperty('averageLatencyMs');
    expect(res.body.cache).toEqual({ hits: 0, misses: 0, entries: 0 });
  });
});
