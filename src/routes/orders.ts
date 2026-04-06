import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import authMiddleware from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// POST /api/orders
router.post('/', async (req: Request, res: Response) => {
  const { shippingAddress } = req.body;

  const cart = await prisma.cart.findFirst({
    where: { userId: req.user!.id },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) {
    res.status(400).json({ message: 'Cart is empty' });
    return;
  }

  let totalAmount = 0;
  const orderItems = cart.items.map((item) => {
    totalAmount += item.product.price * item.quantity;
    return {
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    };
  });

  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      totalAmount,
      shippingAddress: shippingAddress ?? undefined,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  await prisma.cart.delete({ where: { id: cart.id } });

  res.status(201).json(order);
});

// GET /api/orders
router.get('/', async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { items: true },
  });
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }
  res.json(order);
});

export default router;
