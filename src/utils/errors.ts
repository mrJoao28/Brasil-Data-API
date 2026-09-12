/**
 * Base class for all errors that should be turned into a consistent
 * JSON error response by the error-handling middleware.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(404, 'NOT_FOUND', message, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Raised when a call to an upstream/external provider fails, times out,
 * or returns an unexpected payload. Maps to HTTP 502 by default since the
 * failure originates from a dependency, not from the client's request.
 */
export class UpstreamError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(502, 'UPSTREAM_ERROR', message, details);
    this.name = 'UpstreamError';
  }
}

export class UpstreamTimeoutError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(504, 'UPSTREAM_TIMEOUT', message, details);
    this.name = 'UpstreamTimeoutError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
