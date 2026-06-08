import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { deriveSlug } from '../lib/slugify';

export const getAllCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
};

export const getCategoryBySlug = async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { themes: true },
  });
  if (!category) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }
  res.json(category);
};

export const createCategory = async (req: Request, res: Response) => {
  const { name, nameEn, slug } = req.body as { name?: string; nameEn?: string; slug?: string };
  if (!name) throw new Error('Validation: name is required');
  const category = await prisma.category.create({
    data: { name, nameEn: nameEn ?? null, slug: deriveSlug(name, slug) },
  });
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const { name, nameEn, slug } = req.body as { name?: string; nameEn?: string; slug?: string };
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(nameEn !== undefined && { nameEn }),
      // Only touch slug when the caller sent one; deriveSlug throws (400) rather
      // than persist an empty string. Re-deriving from the stored name requires
      // resending `name` in the same request.
      ...(slug !== undefined && { slug: deriveSlug(name, slug) }),
    },
  });
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const [productCount, themeCount] = await Promise.all([
    prisma.product.count({ where: { categoryId: req.params.id } }),
    prisma.theme.count({ where: { categoryId: req.params.id } }),
  ]);
  const referenceCount = productCount + themeCount;
  if (referenceCount > 0) {
    res.status(409).json({ message: 'Category is in use', referenceCount, productCount, themeCount });
    return;
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
};
