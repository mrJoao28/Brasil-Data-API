import { env } from '../config/env';
import { UpstreamError, UpstreamTimeoutError } from './errors';

export interface FetchJsonOptions {
  timeoutMs?: number;
  providerName: string;
  init?: RequestInit;
  treatAsNotFound?: number[];
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function retryDelayMs(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, env.PROVIDER_RETRY_MAX_DELAY_MS);
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date)) return Math.max(0, Math.min(date - Date.now(), env.PROVIDER_RETRY_MAX_DELAY_MS));
  }
  return Math.min(env.PROVIDER_RETRY_BASE_DELAY_MS * 2 ** attempt, env.PROVIDER_RETRY_MAX_DELAY_MS);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T | null> {
  const { timeoutMs = env.HTTP_TIMEOUT_MS, providerName, init, treatAsNotFound = [] } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= env.PROVIDER_RETRY_COUNT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...init?.headers },
      });

      if (treatAsNotFound.includes(response.status)) return null;

      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after');
        const error = new UpstreamError(`${providerName} responded with status ${response.status}`, {
          provider: providerName, status: response.status, url,
          retryAfter: retryAfter ?? undefined,
        });
        if (!RETRYABLE_STATUSES.has(response.status) || attempt >= env.PROVIDER_RETRY_COUNT) throw error;
        lastError = error;
        await sleep(retryDelayMs(attempt, retryAfter));
        continue;
      }

      const text = await response.text();
      if (!text) return null;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new UpstreamError(`${providerName} returned an invalid JSON payload`, { provider: providerName, url });
      }
    } catch (error) {
      if (error instanceof UpstreamError) {
        const status = (error.details as { status?: number } | undefined)?.status;
        if (attempt >= env.PROVIDER_RETRY_COUNT || (status !== undefined && !RETRYABLE_STATUSES.has(status))) throw error;
        lastError = error;
        await sleep(retryDelayMs(attempt, (error.details as { retryAfter?: string } | undefined)?.retryAfter ?? null));
        continue;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new UpstreamTimeoutError(`${providerName} did not respond within ${timeoutMs}ms`, { provider: providerName, url, timeoutMs });
        if (attempt >= env.PROVIDER_RETRY_COUNT) throw timeoutError;
        lastError = timeoutError;
        await sleep(retryDelayMs(attempt, null));
        continue;
      }
      const upstreamError = new UpstreamError(`Failed to reach ${providerName}`, { provider: providerName, url, cause: error instanceof Error ? error.message : String(error) });
      if (attempt >= env.PROVIDER_RETRY_COUNT) throw upstreamError;
      lastError = upstreamError;
      await sleep(retryDelayMs(attempt, null));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new UpstreamError(`Failed to reach ${providerName}`);
}
