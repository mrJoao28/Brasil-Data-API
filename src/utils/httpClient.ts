import { env } from '../config/env';
import { UpstreamError, UpstreamTimeoutError } from './errors';

export interface FetchJsonOptions {
  /** Timeout in ms. Defaults to HTTP_TIMEOUT_MS from env. */
  timeoutMs?: number;
  /** Human-readable provider name, used in error messages/logs. */
  providerName: string;
  /** Extra fetch init options (headers, method, etc.). */
  init?: RequestInit;
  /**
   * HTTP status codes from the provider that should be treated as
   * "not found" rather than a generic upstream failure. The caller
   * receives `null` in that case instead of an error being thrown.
   */
  treatAsNotFound?: number[];
}

/**
 * Performs a GET (or other) request expecting a JSON response, applying a
 * hard timeout and translating network/parse failures into typed errors
 * so callers (services) never need to deal with raw fetch exceptions.
 */
export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T | null> {
  const { timeoutMs = env.HTTP_TIMEOUT_MS, providerName, init, treatAsNotFound = [] } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    });

    if (treatAsNotFound.includes(response.status)) {
      return null;
    }

    if (!response.ok) {
      throw new UpstreamError(`${providerName} responded with status ${response.status}`, {
        provider: providerName,
        status: response.status,
        url,
      });
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new UpstreamError(`${providerName} returned an invalid JSON payload`, {
        provider: providerName,
        url,
      });
    }
  } catch (error) {
    if (error instanceof UpstreamError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new UpstreamTimeoutError(`${providerName} did not respond within ${timeoutMs}ms`, {
        provider: providerName,
        url,
        timeoutMs,
      });
    }

    throw new UpstreamError(`Failed to reach ${providerName}`, {
      provider: providerName,
      url,
      cause: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}
