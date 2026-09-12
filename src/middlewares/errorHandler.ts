import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { ApiError, isApiError } from '../utils/errors';

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function buildErrorBody(code: string, message: string, details?: unknown): ErrorResponseBody {
  const body: ErrorResponseBody = { error: { code, message } };
  if (details !== undefined) {
    body.error.details = details;
  }
  return body;
}

/**
 * Express error-handling middleware (identified by its 4-arg signature).
 * Every error thrown/forwarded in the app funnels through here so the
 * client always receives the same JSON error shape.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (isApiError(error)) {
    if (error.statusCode >= 500) {
      logger.error({ err: error, path: req.path }, 'Upstream/server error');
    } else {
      logger.warn({ err: error, path: req.path }, 'Request error');
    }

    res.status(error.statusCode).json(buildErrorBody(error.code, error.message, error.details));
    return;
  }

  if (error instanceof ZodError) {
    res
      .status(400)
      .json(buildErrorBody('VALIDATION_ERROR', 'Request validation failed.', error.flatten()));
    return;
  }

  logger.error({ err: error, path: req.path }, 'Unhandled error');
  res
    .status(500)
    .json(buildErrorBody('INTERNAL_ERROR', 'An unexpected error occurred. Please try again.'));
}

/**
 * Catch-all for routes that don't match any registered handler.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json(
      buildErrorBody('ROUTE_NOT_FOUND', `No route found for ${req.method} ${req.originalUrl}.`),
    );
}

// Re-exported for convenience so routes/controllers only import from one place.
export { ApiError };
