import cors from 'cors';
import express, { type Application } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { getCorsOrigins } from './config/env';
import { apiKeyAuth } from './middlewares/apiKeyAuth';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiTierRateLimiter, rateLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import { apiV1Router, healthRoutes } from './routes';

function loadOpenApiDocument(): Record<string, unknown> {
  const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
  const file = fs.readFileSync(openApiPath, 'utf8');
  return YAML.parse(file) as Record<string, unknown>;
}

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: getCorsOrigins() }));
  app.use(express.json());
  app.use(requestLogger);
  app.use(rateLimiter);

  // /health is intentionally outside /api/v1 and outside the rate limiter's
  // concern for uptime checks (it is cheap and side-effect free).
  app.use(healthRoutes);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(loadOpenApiDocument()));

  // Authenticated, tier-rate-limited API surface. apiKeyAuth resolves the
  // caller's tier from the x-api-key header before apiTierRateLimiter
  // enforces that tier's request ceiling.
  app.use('/api/v1', apiKeyAuth, apiTierRateLimiter, apiV1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
