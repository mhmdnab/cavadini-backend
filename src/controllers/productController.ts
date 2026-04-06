import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const VALID_CATEGORY_TYPES = new Set([
  'watches', 'watch_straps', 'bundles', 'watch_boxes', 'workshop', 'jewelry',
]);

// Parse a query param that may be a single value or comma-separated list.
// Returns a Prisma string filter: exact match for one value, { in: [...] } for multiple.
function strFilter(value: string): string | Prisma.StringNullableFilter {
  const values = value.split(',').map((s) => s.trim()).filter(Boolean);
  return values.length === 1 ? values[0] : { in: values };
}

export const getProducts = async (req: Request, res: Response) => {
  const {
    // General
    category, theme, brand,
    isOnSale, isSecondHand,
    minPrice, maxPrice,
    // Watch-specific
    gender, movement, caseMaterial, strapMaterial,
    caseColor, strapColor, dialColor, displayType,
    waterResistance, watchShape, caseFinish, crystalType,
    bezel, caseBack, dialPattern, settingAdornment, clasp,
    functions: functionsParam, styles: stylesParam,
    // Strap-specific
    material, fitting, color, lugWidthMm,
    // Jewelry-specific (gender/material/color/style shared above)
    // Pagination & sort
    sortBy, page: pageParam, limit: limitParam,
  } = req.query as Record<string, string | undefined>;

  const where: Prisma.ProductWhereInput = { isActive: true };

  // ── Category (by slug) ─────────────────────────────────────────────────────
  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } });
    if (cat) {
      where.categoryId = cat.id;
      if (VALID_CATEGORY_TYPES.has(category)) where.category_type = category;
    } else {
      // Unknown category slug → no results
      res.json({ products: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
      return;
    }
  }

  // ── Theme (by slug) ────────────────────────────────────────────────────────
  if (theme) {
    const t = await prisma.theme.findFirst({ where: { slug: theme } });
    if (t) {
      where.productThemes = { some: { themeId: t.id } };
    } else {
      res.json({ products: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
      return;
    }
  }

  // ── Brand (by slug) ────────────────────────────────────────────────────────
  if (brand) {
    const b = await prisma.brand.findUnique({ where: { slug: brand } });
    if (b) {
      where.brandId = b.id;
    } else {
      res.json({ products: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
      return;
    }
  }

  // ── Booleans ───────────────────────────────────────────────────────────────
  if (isOnSale === 'true') where.isOnSale = true;
  if (isOnSale === 'false') where.isOnSale = false;
  if (isSecondHand === 'true') where.isSecondHand = true;
  if (isSecondHand === 'false') where.isSecondHand = false;

  // ── Price range ────────────────────────────────────────────────────────────
  if (minPrice || maxPrice) {
    const priceFilter: Prisma.FloatFilter = {};
    if (minPrice) priceFilter.gte = Number(minPrice);
    if (maxPrice) priceFilter.lte = Number(maxPrice);
    where.price = priceFilter;
  }

  // ── String filters (all support comma-separated multi-value) ──────────────
  // Single value → exact match. Multiple values → IN (OR logic).
  const stringFilters: [keyof Prisma.ProductWhereInput, string | undefined][] = [
    // Watch
    ['gender', gender],
    ['movement', movement],
    ['caseMaterial', caseMaterial],
    ['strapMaterial', strapMaterial],
    ['caseColor', caseColor],
    ['strapColor', strapColor],
    ['dialColor', dialColor],
    ['displayType', displayType],
    ['waterResistance', waterResistance],
    ['watchShape', watchShape],
    ['caseFinish', caseFinish],
    ['crystalType', crystalType],
    ['bezel', bezel],
    ['caseBack', caseBack],
    ['dialPattern', dialPattern],
    ['settingAdornment', settingAdornment],
    ['clasp', clasp],
    // Strap
    ['material', material],
    ['fitting', fitting],
    ['color', color],
  ];
  for (const [key, value] of stringFilters) {
    if (value) (where as Record<string, unknown>)[key as string] = strFilter(value);
  }

  // ── Lug width (exact numeric) ──────────────────────────────────────────────
  if (lugWidthMm) {
    const n = Number(lugWidthMm);
    if (!isNaN(n)) where.lugWidthMm = n;
  }

  // ── Array filters (TEXT[] columns) ────────────────────────────────────────
  // functions: user picks multiple → product must have ALL (AND logic)
  if (functionsParam) {
    where.functions = { hasEvery: functionsParam.split(',').map((s) => s.trim()).filter(Boolean) };
  }
  // styles: user picks multiple → product must match AT LEAST ONE (OR logic)
  if (stylesParam) {
    where.styles = { hasSome: stylesParam.split(',').map((s) => s.trim()).filter(Boolean) };
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
  switch (sortBy) {
    case 'price_asc':    orderBy = { price: 'asc' }; break;
    case 'price_desc':   orderBy = { price: 'desc' }; break;
    case 'newest':       orderBy = { createdAt: 'desc' }; break;
    case 'popular':      orderBy = { orderItems: { _count: 'desc' } }; break;
    default:             orderBy = { createdAt: 'desc' };
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  const page  = Math.max(1, Number(pageParam)  || 1);
  const limit = Math.min(100, Math.max(1, Number(limitParam) || 20));
  const skip  = (page - 1) * limit;

  // ── Query ──────────────────────────────────────────────────────────────────
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
        brand: true,
        productThemes: { include: { theme: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: products.map((p) => ({
      ...p,
      themes: p.productThemes.map((pt) => pt.theme),
      productThemes: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      brand: true,
      productThemes: { include: { theme: true } },
    },
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json({
    ...product,
    themes: product.productThemes.map((pt) => pt.theme),
    productThemes: undefined,
  });
};

export const createProduct = async (req: Request, res: Response) => {
  const { themes: themeIds, ...data } = req.body;

  // Auto-resolve categoryId from category_type if not supplied
  if (!data.categoryId && data.category_type) {
    const cat = await prisma.category.findFirst({ where: { slug: data.category_type } });
    if (cat) data.categoryId = cat.id;
  }

  // Validation (replaces pre-save hooks)
  if (data.price <= 0) throw new Error('Validation: Price must be greater than 0');
  if (!data.isOnSale) delete data.originalPrice;

  // Validate themes belong to product's category
  if (themeIds && themeIds.length > 0) {
    const wrongThemes = await prisma.theme.findMany({
      where: { id: { in: themeIds }, NOT: { categoryId: data.categoryId } },
    });
    if (wrongThemes.length > 0) {
      throw new Error(`Validation: Theme "${wrongThemes[0].name}" does not belong to this product's category`);
    }
  }

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
};

export const updateProduct = async (req: Request, res: Response) => {
  const { themes: themeIds, ...data } = req.body;

  if (data.price !== undefined && data.price <= 0) {
    throw new Error('Validation: Price must be greater than 0');
  }
  if (data.isOnSale === false) delete data.originalPrice;

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
};

export const deleteProduct = async (req: Request, res: Response) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ message: 'Product deactivated' });
};
