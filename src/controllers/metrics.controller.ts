import type { Request, Response } from 'express';
import { getCacheStats } from '../config/cache';
import { getMetrics } from '../config/metrics';
import { getCnpjProviderStats } from '../providers/managedCnpjProvider';
import { sendSuccess } from '../utils/response';

export function getMetricsHandler(_req: Request, res: Response): void {
  sendSuccess(res, {
    ...getMetrics(),
    cache: getCacheStats(),
    providers: {
      cnpj: getCnpjProviderStats(),
    },
  });
}
