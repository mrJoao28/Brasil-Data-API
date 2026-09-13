import type { RequestHandler } from 'express';
import { recordRequest } from '../config/metrics';

export const metricsMiddleware: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const endpoint = `${req.method} ${req.route?.path ?? req.path}`;
    recordRequest(res.statusCode, durationMs, endpoint);
  });

  next();
};
