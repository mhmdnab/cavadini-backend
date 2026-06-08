import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SCALAR_OPTION_FIELDS, ARRAY_OPTION_FIELDS, CURATED } from '../config/fieldOptions';

function merge(curated: string[] | undefined, found: string[]): string[] {
  return Array.from(new Set([...(curated ?? []), ...found])).sort((a, b) => a.localeCompare(b));
}

export const getFieldOptions = async (_req: Request, res: Response) => {
  // This endpoint is called on every admin form load, so run the per-field
  // queries concurrently rather than sequentially.
  const scalarTasks = SCALAR_OPTION_FIELDS.map(async (field) => {
    const rows = await prisma.product.findMany({
      where: { [field]: { not: null } } as never,
      distinct: [field] as never,
      select: { [field]: true } as never,
    });
    const found = rows
      .map((r) => (r as Record<string, unknown>)[field])
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    return [field, merge(CURATED[field], found)] as const;
  });

  const arrayTasks = ARRAY_OPTION_FIELDS.map(async (field) => {
    const rows = await prisma.product.findMany({ select: { [field]: true } as never });
    const found = rows.flatMap((r) => ((r as Record<string, unknown>)[field] as string[]) ?? []);
    return [field, merge(CURATED[field], found.filter((v) => v && v.trim() !== ''))] as const;
  });

  const entries = await Promise.all([...scalarTasks, ...arrayTasks]);
  res.json(Object.fromEntries(entries) as Record<string, string[]>);
};
