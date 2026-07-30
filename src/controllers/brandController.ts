import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { deriveSlug } from '../lib/slugify';

// MARKEN sidebar ordering: sortOrder first, then name as a stable tiebreaker.
const BRAND_ORDER = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }];

export const getAllBrands = async (req: Request, res: Response) => {
  const { category, activeOnly } = req.query as { category?: string; activeOnly?: string };
  const onlyActive = activeOnly === 'true';

  const brands = await prisma.brand.findMany({
    where: {
      ...(category && { categories: { has: category } }),
      ...(onlyActive && { isActive: true }),
    },
    orderBy: BRAND_ORDER,
  });
  res.json(brands);
};

export const createBrand = async (req: Request, res: Response) => {
  const { name, slug, categories, isActive } = req.body as {
    name?: string;
    slug?: string;
    categories?: string[];
    isActive?: boolean;
  };
  if (!name) throw new Error('Validation: name is required');

  // New brands go to the end of the list.
  const last = await prisma.brand.findFirst({
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const brand = await prisma.brand.create({
    data: {
      name,
      slug: deriveSlug(name, slug),
      categories: categories ?? [],
      sortOrder,
      ...(isActive !== undefined && { isActive }),
    },
  });
  res.status(201).json(brand);
};

export const updateBrand = async (req: Request, res: Response) => {
  const { name, slug, categories, isActive, sortOrder } = req.body as {
    name?: string;
    slug?: string;
    categories?: string[];
    isActive?: boolean;
    sortOrder?: number;
  };
  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      // Only touch slug when the caller sent one; deriveSlug throws (400) rather
      // than persist an empty string into the @unique slug column.
      ...(slug !== undefined && { slug: deriveSlug(name, slug) }),
      ...(categories !== undefined && { categories }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  res.json(brand);
};

// Rewrites sortOrder to match the given id order (index = new position).
export const reorderBrands = async (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Validation: ids must be a non-empty array');
  }
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.brand.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  res.json({ message: 'Brands reordered', count: ids.length });
};

export const deleteBrand = async (req: Request, res: Response) => {
  const referenceCount = await prisma.product.count({ where: { brandId: req.params.id } });
  if (referenceCount > 0) {
    res.status(409).json({ message: 'Brand is in use by products', referenceCount });
    return;
  }
  await prisma.brand.delete({ where: { id: req.params.id } });
  res.json({ message: 'Brand deleted' });
};
