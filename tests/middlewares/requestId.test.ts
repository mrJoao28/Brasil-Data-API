import { describe, expect, it } from 'vitest';
import { requestId } from '../../src/middlewares/requestId';

describe('requestId middleware', () => {
  it('generates and returns a request id', () => {
    const headers: Record<string, string> = {};
    const req = { header: () => undefined } as never;
    const res = { setHeader: (name: string, value: string) => { headers[name] = value; } } as never;
    let nextCalled = false;
    requestId(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(headers['X-Request-Id']).toBeTruthy();
  });

  it('preserves a safe caller-supplied request id', () => {
    const headers: Record<string, string> = {};
    const req = { header: (name: string) => name === 'x-request-id' ? 'client-request-123' : undefined } as never;
    const res = { setHeader: (name: string, value: string) => { headers[name] = value; } } as never;
    requestId(req, res, () => undefined);
    expect(headers['X-Request-Id']).toBe('client-request-123');
  });
});
