import rateLimit from 'express-rate-limit';

const minutes = (n: number) => n * 60 * 1000;

// Strict limiter for credential-checking endpoints (login) to blunt
// brute-force / credential-stuffing. Keyed by client IP (express-rate-limit's
// default, IPv6-safe). `skipSuccessfulRequests` means only FAILED attempts
// count toward the limit, so a legitimate admin logging in is never locked out.
export const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || minutes(15),
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
});

// Moderate limiter for public write endpoints that create records without auth
// (registration, newsletter signup) to curb spam / automated abuse.
export const sensitiveLimiter = rateLimit({
  windowMs: Number(process.env.SENSITIVE_RATE_LIMIT_WINDOW_MS) || minutes(60),
  limit: Number(process.env.SENSITIVE_RATE_LIMIT_MAX) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
