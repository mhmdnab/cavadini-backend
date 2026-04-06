import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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
