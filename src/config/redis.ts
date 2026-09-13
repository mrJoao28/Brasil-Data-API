import { env } from './env';

export const redisEnabled = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);

function redisUrl(): string {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  }
  return env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
}

async function command<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${redisUrl()}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Redis request failed with HTTP ${response.status}.`);
  const body = (await response.json()) as { result: T; error?: string };
  if (body.error) throw new Error(`Redis command failed: ${body.error}`);
  return body.result;
}

export function redisGet(key: string): Promise<string | null> {
  return command<string | null>(`get/${encodeURIComponent(key)}`);
}

export function redisIncr(key: string): Promise<number> {
  return command<number>(`incr/${encodeURIComponent(key)}`);
}

export function redisExpire(key: string, seconds: number): Promise<number> {
  return command<number>(`expire/${encodeURIComponent(key)}/${seconds}`);
}

export async function redisEval<T>(script: string, keys: string[], args: string[]): Promise<T> {
  return command<T>('eval', {
    method: 'POST',
    body: JSON.stringify({ script, keys, args }),
  });
}

export async function redisPing(): Promise<boolean> {
  return (await command<string>('ping')) === 'PONG';
}
