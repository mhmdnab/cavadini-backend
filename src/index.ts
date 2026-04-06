import 'dotenv/config';
import 'express-async-errors';
import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import brandsRouter from './routes/brands';
import themesRouter from './routes/themes';
import authRouter from './routes/auth';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import newsletterRouter from './routes/newsletter';
import adminRouter from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/themes', themesRouter);
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.use((_req: Request, res: Response) => res.status(404).json({ message: 'Route not found' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('SIGTERM', async () => {
  server.close();
  await prisma.$disconnect();
});
