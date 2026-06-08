import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllBrands = async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };

  const brands = await prisma.brand.findMany({
    where: category ? { categories: { has: category } } : undefined,
  });
  res.json(brands);
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const createBrand = async (req: Request, res: Response) => {
  const { name, slug, categories } = req.body as { name?: string; slug?: string; categories?: string[] };
  if (!name) throw new Error('Validation: name is required');
  const brand = await prisma.brand.create({
    data: { name, slug: slug?.trim() || slugify(name), categories: categories ?? [] },
  });
  res.status(201).json(brand);
};

export const updateBrand = async (req: Request, res: Response) => {
  const { name, slug, categories } = req.body as { name?: string; slug?: string; categories?: string[] };
  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug: slug.trim() || slugify(name ?? '') }),
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
