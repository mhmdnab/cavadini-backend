import 'dotenv/config';
import 'express-async-errors';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import brandsRouter from './routes/brands';
import themesRouter from './routes/themes';
import authRouter from './routes/auth';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import newsletterRouter from './routes/newsletter';
import adminRouter from './routes/admin';
import metaRouter from './routes/meta';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Behind a hosting proxy / load balancer the real client IP arrives in
// X-Forwarded-For. Set TRUST_PROXY (e.g. "1" for one proxy hop, or a subnet) so
// the rate limiter keys on the client IP, not the proxy's. Off by default:
// blindly trusting the header would let clients spoof their IP to dodge limits.
if (process.env.TRUST_PROXY) {
  const v = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(v) ? Number(v) : v);
}

// Security headers (nosniff, frame protection, HSTS, etc.) + hide X-Powered-By.
// This is a JSON API, so the CSP is not needed for its own responses; leaving
// it off avoids breaking the separately-hosted frontends that call this API.
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3002',
  // Dev convenience origins — never trusted in production.
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
    : []),
];
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images')));

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/themes', themesRouter);
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin', adminRouter);
app.use('/api/meta', metaRouter);

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.use((_req: Request, res: Response) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
