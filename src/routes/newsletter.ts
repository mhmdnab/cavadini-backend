import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ message: 'email is required' });
      return;
    }

    const existing = await prisma.newsletter.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Already subscribed' });
      return;
    }

    await prisma.newsletter.create({ data: { email } });
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
