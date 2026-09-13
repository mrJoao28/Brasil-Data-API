import { Router } from 'express';
import { getMetricsHandler } from '../controllers/metrics.controller';

export const metricsRouter = Router();

metricsRouter.get('/metrics', getMetricsHandler);
