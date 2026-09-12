import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type RequestPart = 'params' | 'query' | 'body';

/**
 * Validates (and coerces/transforms) a part of the request against a Zod
 * schema, replacing that part with the parsed result. Validation errors
 * are forwarded to the error-handling middleware, which turns ZodError
 * into a consistent 400 JSON response.
 */
export function validate(part: RequestPart, schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(result.error);
      return;
    }

    // Express 5 makes req.query a getter-only property; assigning fields
    // individually keeps this middleware compatible with both Express 4
    // and 5 without needing a version-specific code path.
    Object.assign(req[part], result.data);
    next();
  };
}
