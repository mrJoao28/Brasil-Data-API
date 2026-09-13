import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { ApiError, isApiError } from '../utils/errors';

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

function buildErrorBody(code: string, message: string, details?: unknown, requestId?: string): ErrorResponseBody {
  const body: ErrorResponseBody = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  if (requestId) body.error.requestId = requestId;
  return body;
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (isApiError(error)) {
    if (error.statusCode >= 500) logger.error({ err: error, path: req.path, requestId: req.requestId }, 'Upstream/server error');
    else logger.warn({ err: error, path: req.path, requestId: req.requestId }, 'Request error');
    res.status(error.statusCode).json(buildErrorBody(error.code, error.message, error.details, req.requestId));
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json(buildErrorBody('VALIDATION_ERROR', 'Request validation failed.', error.flatten(), req.requestId));
    return;
  }

  logger.error({ err: error, path: req.path, requestId: req.requestId }, 'Unhandled error');
  res.status(500).json(buildErrorBody('INTERNAL_ERROR', 'An unexpected error occurred. Please try again.', undefined, req.requestId));
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(buildErrorBody('ROUTE_NOT_FOUND', `No route found for ${req.method} ${req.originalUrl}.`, undefined, req.requestId));
}

export { ApiError };
