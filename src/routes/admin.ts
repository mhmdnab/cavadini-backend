import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import adminMiddleware from '../middleware/admin';
import adminImagesRouter from './adminImages';
import adminBrandsRouter from './adminBrands';
import adminCategoriesRouter from './adminCategories';
import adminThemesRouter from './adminThemes';
import { createProduct, updateProduct, deleteProduct } from '../controllers/productController';

const router = Router();
router.use(adminMiddleware);
router.use(adminImagesRouter);
router.use('/brands', adminBrandsRouter);
router.use('/categories', adminCategoriesRouter);
router.use('/themes', adminThemesRouter);

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
router.get('/products', async (req: Request, res: Response) => {
  const { search, category_type, includeInactive, page: pageParam, limit: limitParam } =
    req.query as Record<string, string | undefined>;

  const where: Prisma.ProductWhereInput = {};
  if (includeInactive !== 'true') where.isActive = true;
  if (category_type) where.category_type = category_type;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nameEn: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { articleNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const page = Math.max(1, Number(pageParam) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitParam) || 20));

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true, brand: true, productThemes: { include: { theme: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: products.map((p) => ({ ...p, themes: p.productThemes.map((pt) => pt.theme), productThemes: undefined })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// Product create/update/delete delegate to the shared controller — single source
// of truth (incl. theme↔category validation + categoryId auto-resolve). The
// public /api/products route no longer exposes these mutations (admin-only).
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

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
