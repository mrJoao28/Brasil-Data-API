import type { Request, Response } from 'express';
import { redisEnabled, redisPing } from '../config/redis';
import { sendSuccess } from '../utils/response';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  let redis: 'ok' | 'not_configured' | 'degraded' = 'not_configured';
  if (redisEnabled) {
    try {
      redis = (await redisPing()) ? 'ok' : 'degraded';
    } catch {
      redis = 'degraded';
    }
  }

  const healthy = redis !== 'degraded';
  sendSuccess(res, {
    status: healthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    dependencies: { redis },
  }, healthy ? 200 : 503);
}
