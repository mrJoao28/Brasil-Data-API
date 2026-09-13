export interface EndpointMetrics {
  requests: number;
  successes: number;
  clientErrors: number;
  serverErrors: number;
  totalDurationMs: number;
}

export interface ApiMetrics {
  requests: number;
  successes: number;
  clientErrors: number;
  serverErrors: number;
  totalDurationMs: number;
  endpoints: Record<string, EndpointMetrics>;
}

const metrics: ApiMetrics = {
  requests: 0,
  successes: 0,
  clientErrors: 0,
  serverErrors: 0,
  totalDurationMs: 0,
  endpoints: {},
};

function updateBucket(bucket: EndpointMetrics, statusCode: number, durationMs: number): void {
  bucket.requests += 1;
  bucket.totalDurationMs += durationMs;
  if (statusCode >= 500) bucket.serverErrors += 1;
  else if (statusCode >= 400) bucket.clientErrors += 1;
  else bucket.successes += 1;
}

export function recordRequest(statusCode: number, durationMs: number, endpoint = 'unknown'): void {
  updateBucket(metrics, statusCode, durationMs);
  const bucket = metrics.endpoints[endpoint] ?? { requests: 0, successes: 0, clientErrors: 0, serverErrors: 0, totalDurationMs: 0 };
  updateBucket(bucket, statusCode, durationMs);
  metrics.endpoints[endpoint] = bucket;
}

function averageLatency(bucket: EndpointMetrics): number {
  return bucket.requests === 0 ? 0 : Number((bucket.totalDurationMs / bucket.requests).toFixed(2));
}

export function getMetrics(): Omit<ApiMetrics, 'endpoints'> & { averageLatencyMs: number; endpoints: Record<string, EndpointMetrics & { averageLatencyMs: number }> } {
  return {
    requests: metrics.requests,
    successes: metrics.successes,
    clientErrors: metrics.clientErrors,
    serverErrors: metrics.serverErrors,
    totalDurationMs: Number(metrics.totalDurationMs.toFixed(2)),
    averageLatencyMs: averageLatency(metrics),
    endpoints: Object.fromEntries(Object.entries(metrics.endpoints).map(([key, value]) => [key, { ...value, averageLatencyMs: averageLatency(value) }])),
  };
}

export function resetMetrics(): void {
  metrics.requests = 0;
  metrics.successes = 0;
  metrics.clientErrors = 0;
  metrics.serverErrors = 0;
  metrics.totalDurationMs = 0;
  metrics.endpoints = {};
}
