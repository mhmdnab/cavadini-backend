import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Cart from '../models/Cart';
import Product from '../models/Product';

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
  try {
    const filter = resolveCartFilter(req);
    if (!filter) {
      res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
      return;
    }

    const cart = await Cart.findOne(filter);
    if (!cart) {
      res.json({ items: [] });
      return;
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ id: { $in: productIds } });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    const populated = cart.items.map((item) => ({
      product: productMap[item.productId] || null,
      quantity: item.quantity,
    }));

    res.json({ items: populated });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/cart/items
router.post('/items', async (req: Request, res: Response) => {
  try {
    const filter = resolveCartFilter(req);
    if (!filter) {
      res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
      return;
    }

    const { productId, quantity = 1 } = req.body as { productId?: number; quantity?: number };
    if (!productId) {
      res.status(400).json({ message: 'productId is required' });
      return;
    }

    const product = await Product.findOne({ id: Number(productId) });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    let cart = await Cart.findOne(filter);
    if (!cart) {
      cart = new Cart({ ...filter, items: [] });
    }

    const existing = cart.items.find((i) => i.productId === Number(productId));
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId: Number(productId), quantity });
    }

    await cart.save();
    res.status(201).json({ message: 'Item added', items: cart.items });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/cart/items/:productId
router.patch('/items/:productId', async (req: Request, res: Response) => {
  try {
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

    const cart = await Cart.findOne(filter);
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const item = cart.items.find((i) => i.productId === Number(req.params.productId));
    if (!item) {
      res.status(404).json({ message: 'Item not in cart' });
      return;
    }

    item.quantity = quantity;
    await cart.save();
    res.json({ message: 'Quantity updated', items: cart.items });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', async (req: Request, res: Response) => {
  try {
    const filter = resolveCartFilter(req);
    if (!filter) {
      res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
      return;
    }

    const cart = await Cart.findOne(filter);
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter((i) => i.productId !== Number(req.params.productId));
    await cart.save();
    res.json({ message: 'Item removed', items: cart.items });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/cart
router.delete('/', async (req: Request, res: Response) => {
  try {
    const filter = resolveCartFilter(req);
    if (!filter) {
      res.status(400).json({ message: 'Provide Authorization header or x-session-id' });
      return;
    }

    await Cart.findOneAndDelete(filter);
    res.json({ message: 'Cart cleared' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
