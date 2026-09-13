import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestId: RequestHandler = (req, res, next) => {
  const supplied = req.header('x-request-id')?.trim();
  const id = supplied && supplied.length <= 128 ? supplied : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};
