import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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
