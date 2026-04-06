import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import authMiddleware from '../middleware/auth';

const router = Router();

const signToken = (user: { id: string; email: string; isAdmin: boolean }): string =>
  jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) {
      res.status(400).json({ message: 'name, email and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, isAdmin: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
