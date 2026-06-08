import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { deriveSlug } from '../lib/slugify';

export const getAllBrands = async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };

  const brands = await prisma.brand.findMany({
    where: category ? { categories: { has: category } } : undefined,
  });
  res.json(brands);
};

export const createBrand = async (req: Request, res: Response) => {
  const { name, slug, categories } = req.body as { name?: string; slug?: string; categories?: string[] };
  if (!name) throw new Error('Validation: name is required');
  const brand = await prisma.brand.create({
    data: { name, slug: deriveSlug(name, slug), categories: categories ?? [] },
  });
  res.status(201).json(brand);
};

export const updateBrand = async (req: Request, res: Response) => {
  const { name, slug, categories } = req.body as { name?: string; slug?: string; categories?: string[] };
  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      // Only touch slug when the caller sent one; deriveSlug throws (400) rather
      // than persist an empty string into the @unique slug column.
      ...(slug !== undefined && { slug: deriveSlug(name, slug) }),
      ...(categories !== undefined && { categories }),
    },
  });
  res.json(brand);
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
