import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import Newsletter from '../models/Newsletter';
import adminMiddleware from '../middleware/admin';

const router = Router();
router.use(adminMiddleware);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalProducts, totalOrders, totalUsers, totalSubscribers] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Newsletter.countDocuments(),
    ]);

    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue: number = revenueAgg[0]?.total ?? 0;

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    res.json({ totalProducts, totalOrders, totalRevenue, totalUsers, totalSubscribers, recentOrders });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ id: 1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const last = await Product.findOne().sort({ id: -1 });
    const newId = last ? last.id + 1 : 1;
    const product = await Product.create({ ...req.body, id: newId });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Invalid data' });
  }
});

router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Invalid data' });
  }
});

router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOneAndDelete({ id: Number(req.params.id) });
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: string };
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Newsletter ───────────────────────────────────────────────────────────────
router.get('/newsletter', async (_req: Request, res: Response) => {
  try {
    const subs = await Newsletter.find().sort({ subscribedAt: -1 });
    res.json(subs);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/newsletter/:id', async (req: Request, res: Response) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subscriber removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
