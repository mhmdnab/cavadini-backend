import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

export const api = supertest(app);

/**
 * Fetches a category by slug for use as a test fixture. The integration test
 * suite runs against the dev DB cloned from prod (see Phase 0), which always
 * contains the seed categories (watches, watch_straps, …). Throwing a clear,
 * actionable error here turns a missing-clone misconfiguration into an obvious
 * message instead of a cryptic assertion failure deep in a test.
 */
export async function categoryBySlug(slug: string) {
  const cat = await prisma.category.findFirst({ where: { slug } });
  if (!cat) {
    throw new Error(
      `Test prerequisite missing: category "${slug}" not found. ` +
        `Tests require the dev DB cloned from prod (see Phase 0 of the backend plan).`,
    );
  }
  return cat;
}

// Fail fast on misconfiguration: without this, jwt.sign(undefined) would mint
// tokens that the middleware also "verifies" with undefined, so every protected
// test would fail with a confusing 401 instead of a clear startup error.
function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set — run tests via `npm test` (loads .env.development)');
  }
  return secret;
}

// NOTE: the `id` values below are synthetic. The admin endpoints only verify the
// token + isAdmin flag (they never load req.user from the DB), so a fake id is
// fine. Tests for routes that look up req.user by id must insert a real user first.

/** Signs a valid admin JWT using the same secret the middleware verifies with. */
export function adminToken(): string {
  return jwt.sign(
    { id: 'test-admin', email: 'test-admin@local', isAdmin: true },
    jwtSecret(),
    { expiresIn: '1h' },
  );
}

export function nonAdminToken(): string {
  return jwt.sign(
    { id: 'test-user', email: 'test-user@local', isAdmin: false },
    jwtSecret(),
    { expiresIn: '1h' },
  );
}

/** Unique suffix so test records never collide. */
export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
