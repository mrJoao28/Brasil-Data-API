export interface ApiMetrics {
  requests: number;
  successes: number;
  clientErrors: number;
  serverErrors: number;
  totalDurationMs: number;
}

const metrics: ApiMetrics = {
  requests: 0,
  successes: 0,
  clientErrors: 0,
  serverErrors: 0,
  totalDurationMs: 0,
};

export function recordRequest(statusCode: number, durationMs: number): void {
  metrics.requests += 1;
  metrics.totalDurationMs += durationMs;

  if (statusCode >= 500) metrics.serverErrors += 1;
  else if (statusCode >= 400) metrics.clientErrors += 1;
  else metrics.successes += 1;
}

export function getMetrics(): ApiMetrics & { averageLatencyMs: number } {
  return {
    ...metrics,
    averageLatencyMs: metrics.requests === 0 ? 0 : Number((metrics.totalDurationMs / metrics.requests).toFixed(2)),
  };
}

export function resetMetrics(): void {
  metrics.requests = 0;
  metrics.successes = 0;
  metrics.clientErrors = 0;
  metrics.serverErrors = 0;
  metrics.totalDurationMs = 0;
}
