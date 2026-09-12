import type { Response } from 'express';

/**
 * Sends a successful JSON response. The MVP's success shape is the plain
 * resource itself (see README examples), so this helper mainly exists to
 * keep status-code handling in one place and leave room to add an envelope
 * (e.g. `meta`) later without touching every controller.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json(data);
}
