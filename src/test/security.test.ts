import { describe, it, expect } from 'vitest';
import { api } from './helpers';

describe('security headers (helmet)', () => {
  it('sets hardening headers on responses', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    // helmet defaults we rely on
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    // helmet hides the framework fingerprint
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('login rate limiting', () => {
  it('returns 429 after too many failed login attempts', async () => {
    // Non-existent user → 401 each time (no bcrypt), so every attempt counts
    // as a failure against the limiter. Unique email keeps other tests clean.
    const email = `ratelimit-${Date.now()}@local.test`;
    const max = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10;

    for (let i = 0; i < max; i++) {
      const res = await api.post('/api/auth/login').send({ email, password: 'wrong' });
      expect(res.status).toBe(401);
    }

    const blocked = await api.post('/api/auth/login').send({ email, password: 'wrong' });
    expect(blocked.status).toBe(429);
  });
});

describe('rate limiting on public write endpoints', () => {
  // The limiter runs before the route handler, so it emits standard RateLimit
  // headers even on a 400 — proving it is mounted without creating DB records
  // or exhausting the limit.
  it('applies a rate limiter to registration', async () => {
    const res = await api.post('/api/auth/register').send({});
    expect(res.headers['ratelimit'] ?? res.headers['ratelimit-policy']).toBeDefined();
  });

  it('applies a rate limiter to newsletter signup', async () => {
    const res = await api.post('/api/newsletter/subscribe').send({});
    expect(res.headers['ratelimit'] ?? res.headers['ratelimit-policy']).toBeDefined();
  });
});
