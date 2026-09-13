import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../src/config/env';
import { fetchJson } from '../../src/utils/httpClient';

const originalFetch = globalThis.fetch;

function response(status: number, body = '{}', headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers });
}

describe('httpClient', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('retries a transient 503 and succeeds', async () => {
    env.PROVIDER_RETRY_COUNT = 1;
    env.PROVIDER_RETRY_BASE_DELAY_MS = 0;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(200, '{"ok":true}'));
    globalThis.fetch = fetchMock;

    await expect(fetchJson<{ ok: boolean }>('https://provider.test', { providerName: 'TestProvider' }))
      .resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('honors Retry-After for 429, capped by max delay', async () => {
    env.PROVIDER_RETRY_COUNT = 1;
    env.PROVIDER_RETRY_MAX_DELAY_MS = 1;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(429, '{}', { 'retry-after': '0' }))
      .mockResolvedValueOnce(response(200, '{"ok":true}'));
    globalThis.fetch = fetchMock;

    await expect(fetchJson<{ ok: boolean }>('https://provider.test', { providerName: 'TestProvider' }))
      .resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient client errors', async () => {
    env.PROVIDER_RETRY_COUNT = 2;
    const fetchMock = vi.fn().mockResolvedValue(response(400));
    globalThis.fetch = fetchMock;

    await expect(fetchJson('https://provider.test', { providerName: 'TestProvider' })).rejects.toMatchObject({ statusCode: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
