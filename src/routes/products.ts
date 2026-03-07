import { Router, Request, Response } from 'express';
import Product from '../models/Product';

const router = Router();

const COLLECTIONS = [
  { label: 'All', slug: 'all' },
  { label: 'Royale', slug: 'royale' },
  { label: 'Noir', slug: 'noir' },
  { label: 'Meridian', slug: 'meridian' },
];

// GET /api/collections
router.get('/collections', (_req: Request, res: Response) => {
  res.json(COLLECTIONS);
});

// GET /api/products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { collection, sort } = req.query as { collection?: string; sort?: string };
    const filter: Record<string, unknown> = {};

    if (collection && collection !== 'all') {
      filter.collectionSlug = collection;
    }

    let sortOption: Record<string, 1 | -1> = { id: 1 };
    if (sort === 'price_asc') sortOption = { priceValue: 1 };
    else if (sort === 'price_desc') sortOption = { priceValue: -1 };

    const products = await Product.find(filter).sort(sortOption);
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
