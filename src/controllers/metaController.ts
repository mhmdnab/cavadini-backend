import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SCALAR_OPTION_FIELDS, ARRAY_OPTION_FIELDS, CURATED } from '../config/fieldOptions';

function merge(curated: string[] | undefined, found: string[]): string[] {
  return Array.from(new Set([...(curated ?? []), ...found])).sort((a, b) => a.localeCompare(b));
}

export const getFieldOptions = async (_req: Request, res: Response) => {
  const result: Record<string, string[]> = {};

  for (const field of SCALAR_OPTION_FIELDS) {
    const rows = await prisma.product.findMany({
      where: { [field]: { not: null } } as never,
      distinct: [field] as never,
      select: { [field]: true } as never,
    });
    const found = rows
      .map((r) => (r as Record<string, unknown>)[field])
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    result[field] = merge(CURATED[field], found);
  }

  for (const field of ARRAY_OPTION_FIELDS) {
    const rows = await prisma.product.findMany({ select: { [field]: true } as never });
    const found = rows.flatMap((r) => ((r as Record<string, unknown>)[field] as string[]) ?? []);
    result[field] = merge(CURATED[field], found.filter((v) => v && v.trim() !== ''));
  }

  res.json(result);
};
