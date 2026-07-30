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

const PRODUCT_INCLUDE = {
  category: true,
  brand: true,
  productThemes: { include: { theme: true } },
} as const;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

/** Flattens the productThemes junction into a plain `themes` array. */
function shapeProduct(product: ProductWithRelations) {
  return {
    ...product,
    themes: product.productThemes.map((pt) => pt.theme),
    productThemes: undefined,
  };
}

// Public: only active products. Inactive/soft-deleted products must not be
// readable by id without admin auth — otherwise anyone holding a UUID can read
// a draft or discontinued product's name and price.
export const getProductById = async (req: Request, res: Response) => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, isActive: true },
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json(shapeProduct(product));
};

// Admin: any product regardless of isActive, so the dashboard can open drafts
// and deactivated products for editing.
export const getProductByIdAdmin = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json(shapeProduct(product));
};

// System-generated article number (item 6): "KO-" + zero-padded sequence value.
// Backed by the Postgres sequence `article_number_seq`, so it's atomic under
// concurrent creates and never collides. Deliberately NOT the eBay number.
async function nextArticleNumber(): Promise<string> {
  const rows = await prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('article_number_seq')`;
  const n = Number(rows[0].nextval);
  return `KO-${String(n).padStart(5, '0')}`;
}

export const createProduct = async (req: Request, res: Response) => {
  const { themes: themeIds, ...data } = req.body;

  // Auto-resolve categoryId from category_type if not supplied
  if (!data.categoryId && data.category_type) {
    const cat = await prisma.category.findFirst({ where: { slug: data.category_type } });
    if (cat) data.categoryId = cat.id;
  }

  // Article number is always system-assigned on create — any client value is
  // ignored so it can never be set to the eBay number.
  data.articleNumber = await nextArticleNumber();

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

  // Article number is system-owned; never editable via update.
  delete data.articleNumber;

  // Auto-resolve categoryId from category_type if not supplied (matches create).
  // This also handles a product-type change (item 8): switching category_type
  // re-points categoryId to the new type's category so it moves collections.
  if (!data.categoryId && data.category_type) {
    const cat = await prisma.category.findFirst({ where: { slug: data.category_type } });
    if (cat) data.categoryId = cat.id;
  }

  if (data.price !== undefined && data.price <= 0) {
    throw new Error('Validation: Price must be greater than 0');
  }
  if (data.isOnSale === false) delete data.originalPrice;

  // Validate themes belong to the product's category (mirrors createProduct).
  // The effective category is the one being set, or the product's current one.
  if (themeIds && themeIds.length > 0) {
    let categoryId: string | undefined = data.categoryId;
    if (!categoryId) {
      const existing = await prisma.product.findUnique({
        where: { id: req.params.id },
        select: { categoryId: true },
      });
      categoryId = existing?.categoryId;
    }
    const wrongThemes = await prisma.theme.findMany({
      where: { id: { in: themeIds }, NOT: { categoryId } },
    });
    if (wrongThemes.length > 0) {
      throw new Error(`Validation: Theme "${wrongThemes[0].name}" does not belong to this product's category`);
    }
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
};

export const deleteProduct = async (req: Request, res: Response) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ message: 'Product deactivated' });
};

// Duplicate a product (item 7): copies every field except id/timestamps, gives
// it a fresh article number, drops the images (to be replaced), appends
// " (Kopie)" to the name, and leaves it inactive until the admin finishes.
// Themes are copied so the variant keeps its taxonomy.
export const duplicateProduct = async (req: Request, res: Response) => {
  const source = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { productThemes: true },
  });
  if (!source) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    articleNumber: _a,
    productThemes,
    ...rest
  } = source as typeof source & Record<string, unknown>;
  void _id;
  void _c;
  void _u;
  void _a;

  const copy = await prisma.product.create({
    data: {
      ...rest,
      name: `${source.name} (Kopie)`,
      articleNumber: await nextArticleNumber(),
      images: [],
      isActive: false,
      productThemes: {
        create: productThemes.map((pt) => ({ themeId: pt.themeId })),
      },
    },
    include: {
      category: true,
      brand: true,
      productThemes: { include: { theme: true } },
    },
  });

  res.status(201).json({
    ...copy,
    themes: copy.productThemes.map((pt) => pt.theme),
    productThemes: undefined,
  });
};
