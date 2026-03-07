import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/db';
import productsRouter from './routes/products';
import authRouter from './routes/auth';
import cartRouter from './routes/cart';
import ordersRouter from './routes/orders';
import newsletterRouter from './routes/newsletter';

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/newsletter', newsletterRouter);

const COLLECTIONS = [
  { label: 'All', slug: 'all' },
  { label: 'Royale', slug: 'royale' },
  { label: 'Noir', slug: 'noir' },
  { label: 'Meridian', slug: 'meridian' },
];
app.get('/api/collections', (_req: Request, res: Response) => res.json(COLLECTIONS));

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.use((_req: Request, res: Response) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
