import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import adminMiddleware from '../middleware/admin';

const router = Router();
router.use(adminMiddleware);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  const [totalProducts, totalOrders, totalUsers, totalSubscribers] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.newsletter.count(),
  ]);

  const revenueAgg = await prisma.order.aggregate({ _sum: { totalAmount: true } });
  const totalRevenue: number = revenueAgg._sum.totalAmount ?? 0;

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  res.json({ totalProducts, totalOrders, totalRevenue, totalUsers, totalSubscribers, recentOrders });
});

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products', async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      brand: true,
      productThemes: { include: { theme: true } },
    },
  });

  const transformed = products.map((p) => ({
    ...p,
    themes: p.productThemes.map((pt) => pt.theme),
    productThemes: undefined,
  }));

  res.json(transformed);
});

router.post('/products', async (req: Request, res: Response) => {
  const { themes: themeIds, ...data } = req.body;

  // Auto-resolve categoryId from category_type if not supplied directly
  if (!data.categoryId && data.category_type) {
    const cat = await prisma.category.findFirst({ where: { slug: data.category_type } });
    if (cat) data.categoryId = cat.id;
  }

  if (data.price <= 0) throw new Error('Validation: Price must be greater than 0');
  if (!data.isOnSale) delete data.originalPrice;

  const product = await prisma.product.create({
    data: {
      ...data,
      ...(themeIds?.length && {
        productThemes: { create: themeIds.map((id: string) => ({ themeId: id })) },
      }),
    },
    include: {
      category: true,
      brand: true,
      productThemes: { include: { theme: true } },
    },
  });

  res.status(201).json({
    ...product,
    themes: product.productThemes.map((pt) => pt.theme),
    productThemes: undefined,
  });
});

router.put('/products/:id', async (req: Request, res: Response) => {
  const { themes: themeIds, ...data } = req.body;

  // Auto-resolve categoryId from category_type if not supplied directly
  if (!data.categoryId && data.category_type) {
    const cat = await prisma.category.findFirst({ where: { slug: data.category_type } });
    if (cat) data.categoryId = cat.id;
  }

  if (data.price !== undefined && data.price <= 0) {
    throw new Error('Validation: Price must be greater than 0');
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(themeIds !== undefined && {
        productThemes: {
          deleteMany: {},
          create: themeIds.map((id: string) => ({ themeId: id })),
        },
      }),
    },
    include: {
      category: true,
      brand: true,
      productThemes: { include: { theme: true } },
    },
  });

  res.json({
    ...product,
    themes: product.productThemes.map((pt) => pt.theme),
    productThemes: undefined,
  });
});

// Soft delete
router.delete('/products/:id', async (req: Request, res: Response) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ message: 'Product deactivated' });
});

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders', async (_req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });
  res.json(orders);
});

router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: status as never },
  });
  res.json(order);
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, isAdmin: true, createdAt: true, updatedAt: true },
  });
  res.json(users);
});

// ─── Newsletter ───────────────────────────────────────────────────────────────
router.get('/newsletter', async (_req: Request, res: Response) => {
  const subs = await prisma.newsletter.findMany({ orderBy: { subscribedAt: 'desc' } });
  res.json(subs);
});

router.delete('/newsletter/:id', async (req: Request, res: Response) => {
  await prisma.newsletter.delete({ where: { id: req.params.id } });
  res.json({ message: 'Subscriber removed' });
});

export default router;
