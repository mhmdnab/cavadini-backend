import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllBrands = async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };

  const brands = await prisma.brand.findMany({
    where: category ? { categories: { has: category } } : undefined,
  });
  res.json(brands);
};
