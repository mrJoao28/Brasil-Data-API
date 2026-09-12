import pinoHttp from 'pino-http';
import { logger } from '../config/logger';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} -> ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,
});
