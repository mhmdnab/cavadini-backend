import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import app from '../app';

export const api = supertest(app);

/** Signs a valid admin JWT using the same secret the middleware verifies with. */
export function adminToken(): string {
  return jwt.sign(
    { id: 'test-admin', email: 'test-admin@local', isAdmin: true },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' },
  );
}

export function nonAdminToken(): string {
  return jwt.sign(
    { id: 'test-user', email: 'test-user@local', isAdmin: false },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' },
  );
}

/** Unique suffix so test records never collide. */
export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
