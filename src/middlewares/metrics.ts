import type { RequestHandler } from 'express';
import { recordRequest } from '../config/metrics';

export const metricsMiddleware: RequestHandler = (_req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    recordRequest(res.statusCode, durationMs);
  });

  next();
};
