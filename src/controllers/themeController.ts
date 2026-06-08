import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { deriveSlug } from '../lib/slugify';

export const getThemes = async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };

  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } });
    if (!cat) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    const themes = await prisma.theme.findMany({ where: { categoryId: cat.id } });
    res.json(themes);
    return;
  }

  const themes = await prisma.theme.findMany();
  res.json(themes);
};

export const createTheme = async (req: Request, res: Response) => {
  const { name, nameEn, slug, categoryId } = req.body as
    { name?: string; nameEn?: string; slug?: string; categoryId?: string };
  if (!name) throw new Error('Validation: name is required');
  if (!categoryId) throw new Error('Validation: categoryId is required');
  const theme = await prisma.theme.create({
    data: { name, nameEn: nameEn ?? null, slug: deriveSlug(name, slug), categoryId },
  });
  res.status(201).json(theme);
};

export const updateTheme = async (req: Request, res: Response) => {
  const { name, nameEn, slug, categoryId } = req.body as
    { name?: string; nameEn?: string; slug?: string; categoryId?: string };
  const theme = await prisma.theme.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(nameEn !== undefined && { nameEn }),
      // Only touch slug when the caller sent one; deriveSlug throws (400) rather
      // than persist an empty string.
      ...(slug !== undefined && { slug: deriveSlug(name, slug) }),
      ...(categoryId !== undefined && { categoryId }),
    },
  });
  res.json(theme);
};

export const deleteTheme = async (req: Request, res: Response) => {
  const referenceCount = await prisma.productTheme.count({ where: { themeId: req.params.id } });
  if (referenceCount > 0) {
    res.status(409).json({ message: 'Theme is in use by products', referenceCount });
    return;
  }
  await prisma.theme.delete({ where: { id: req.params.id } });
  res.json({ message: 'Theme deleted' });
};
