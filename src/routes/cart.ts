import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

type CartFilter = { userId: string } | { sessionId: string };

const resolveCartFilter = (req: Request): CartFilter | null => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET as string) as { id: string };
      return { userId: decoded.id };
    } catch {
      // fall through to session
    }
  }
  const sessionId = req.headers['x-session-id'] as string | undefined;
  if (sessionId) return { sessionId };
  return null;
};

// GET /api/cart
router.get('/', async (req: Request, res: Response) => {
  const filter = resolveCartFilter(req);
  if (!filter) {
    res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
    return;
  }

  const cart = await prisma.cart.findFirst({
    where: filter,
    include: { items: { include: { product: true } } },
  });

  if (!cart) {
    res.json({ items: [] });
    return;
  }

  const populated = cart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
  }));

  res.json({ items: populated });
});

// POST /api/cart/items
router.post('/items', async (req: Request, res: Response) => {
  const filter = resolveCartFilter(req);
  if (!filter) {
    res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
    return;
  }

  const { productId, quantity = 1 } = req.body as { productId?: string; quantity?: number };
  if (!productId) {
    res.status(400).json({ message: 'productId is required' });
    return;
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  let cart = await prisma.cart.findFirst({ where: filter });
  if (!cart) {
    cart = await prisma.cart.create({ data: filter });
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true },
  });
  res.status(201).json({ message: 'Item added', items: updatedCart!.items });
});

// PATCH /api/cart/items/:productId
router.patch('/items/:productId', async (req: Request, res: Response) => {
  const filter = resolveCartFilter(req);
  if (!filter) {
    res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
    return;
  }

  const { quantity } = req.body as { quantity?: number };
  if (!quantity || quantity < 1) {
    res.status(400).json({ message: 'quantity must be >= 1' });
    return;
  }

  const cart = await prisma.cart.findFirst({ where: filter });
  if (!cart) {
    res.status(404).json({ message: 'Cart not found' });
    return;
  }

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: req.params.productId } },
  });
  if (!item) {
    res.status(404).json({ message: 'Item not in cart' });
    return;
  }

  await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId: req.params.productId } },
    data: { quantity },
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true },
  });
  res.json({ message: 'Quantity updated', items: updatedCart!.items });
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', async (req: Request, res: Response) => {
  const filter = resolveCartFilter(req);
  if (!filter) {
    res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
    return;
  }

  const cart = await prisma.cart.findFirst({ where: filter });
  if (!cart) {
    res.status(404).json({ message: 'Cart not found' });
    return;
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId: req.params.productId },
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: true },
  });
  res.json({ message: 'Item removed', items: updatedCart!.items });
});

// DELETE /api/cart
router.delete('/', async (req: Request, res: Response) => {
  const filter = resolveCartFilter(req);
  if (!filter) {
    res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
    return;
  }

  await prisma.cart.deleteMany({ where: filter });
  res.json({ message: 'Cart cleared' });
});

export default router;
