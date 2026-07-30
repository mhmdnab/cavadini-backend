import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { deriveSlug } from '../lib/slugify';

// THEMEN sidebar ordering: sortOrder first, then name as a stable tiebreaker.
const THEME_ORDER = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }];

export const getThemes = async (req: Request, res: Response) => {
  const { category, activeOnly } = req.query as { category?: string; activeOnly?: string };
  const onlyActive = activeOnly === 'true';

  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } });
    if (!cat) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    const themes = await prisma.theme.findMany({
      where: { categoryId: cat.id, ...(onlyActive && { isActive: true }) },
      orderBy: THEME_ORDER,
    });
    res.json(themes);
    return;
  }

  const themes = await prisma.theme.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: THEME_ORDER,
  });
  res.json(themes);
};

export const createTheme = async (req: Request, res: Response) => {
  const { name, nameEn, slug, categoryId, isActive } = req.body as {
    name?: string;
    nameEn?: string;
    slug?: string;
    categoryId?: string;
    isActive?: boolean;
  };
  if (!name) throw new Error('Validation: name is required');
  if (!categoryId) throw new Error('Validation: categoryId is required');

  // New themes go to the end of their category's list.
  const last = await prisma.theme.findFirst({
    where: { categoryId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  const sortOrder = (last?.sortOrder ?? -1) + 1;

  const theme = await prisma.theme.create({
    data: {
      name,
      nameEn: nameEn ?? null,
      slug: deriveSlug(name, slug),
      categoryId,
      sortOrder,
      ...(isActive !== undefined && { isActive }),
    },
  });
  res.status(201).json(theme);
};

export const updateTheme = async (req: Request, res: Response) => {
  const { name, nameEn, slug, categoryId, isActive, sortOrder } = req.body as {
    name?: string;
    nameEn?: string;
    slug?: string;
    categoryId?: string;
    isActive?: boolean;
    sortOrder?: number;
  };
  const theme = await prisma.theme.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(nameEn !== undefined && { nameEn }),
      // Only touch slug when the caller sent one; deriveSlug throws (400) rather
      // than persist an empty string.
      ...(slug !== undefined && { slug: deriveSlug(name, slug) }),
      ...(categoryId !== undefined && { categoryId }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
  res.json(theme);
};

// Rewrites sortOrder to match the given id order (index = new position). Powers
// the up/down reordering in the admin taxonomy screen.
export const reorderThemes = async (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('Validation: ids must be a non-empty array');
  }
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.theme.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  res.json({ message: 'Themes reordered', count: ids.length });
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
