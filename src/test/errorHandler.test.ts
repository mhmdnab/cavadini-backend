import { describe, it, expect, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../middleware/errorHandler';

// Minimal Response stub capturing status + json payload.
function mockRes() {
  const r: { statusCode: number; body: unknown; status: (c: number) => typeof r; json: (b: unknown) => typeof r } = {
    statusCode: 0,
    body: undefined,
    status(c: number) { this.statusCode = c; return this; },
    json(b: unknown) { this.body = b; return this; },
  };
  return r;
}

const run = (err: Error) => {
  const res = mockRes();
  errorHandler(err, {} as Request, res as unknown as Response, (() => {}) as NextFunction);
  return res;
};

describe('errorHandler information leakage', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => { process.env.NODE_ENV = original; });

  it('does not leak Prisma validation internals in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Prisma.PrismaClientValidationError(
      'Invalid `prisma.product.create()` invocation in /Users/secret/app/src/x.ts:1\ncategoryId: "leaked-uuid"',
      { clientVersion: '6.0.0' },
    );
    const res = run(err);
    expect(res.statusCode).toBe(400);
    expect((res.body as { details?: unknown }).details).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('/Users/');
    expect(JSON.stringify(res.body)).not.toContain('leaked-uuid');
  });

  it('includes Prisma validation details in development for debugging', () => {
    process.env.NODE_ENV = 'development';
    const err = new Prisma.PrismaClientValidationError('boom detail', { clientVersion: '6.0.0' });
    const res = run(err);
    expect(res.statusCode).toBe(400);
    expect((res.body as { details?: unknown }).details).toBe('boom detail');
  });

  it('masks generic 500 messages in production', () => {
    process.env.NODE_ENV = 'production';
    const res = run(new Error('sensitive stack detail /Users/secret'));
    expect(res.statusCode).toBe(500);
    expect((res.body as { message: string }).message).toBe('Internal server error');
  });
});
