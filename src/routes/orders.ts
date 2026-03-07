import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import authMiddleware from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// POST /api/orders
router.post('/', async (req: Request, res: Response) => {
  try {
    const { shippingAddress } = req.body;
    const cart = await Cart.findOne({ userId: req.user!.id });
    if (!cart || cart.items.length === 0) {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ id: { $in: productIds } });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const items = cart.items.map((item) => {
      const p = productMap[item.productId];
      if (!p) throw new Error(`Product ${item.productId} not found`);
      totalAmount += p.priceValue * item.quantity;
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        priceValue: p.priceValue,
        quantity: item.quantity,
      };
    });

    const order = await Order.create({
      userId: req.user!.id,
      items,
      totalAmount,
      shippingAddress,
    });

    await Cart.findOneAndDelete({ userId: req.user!.id });

    res.status(201).json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(500).json({ message });
  }
});

// GET /api/orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
