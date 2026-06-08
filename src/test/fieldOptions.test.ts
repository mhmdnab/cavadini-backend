import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { api, uid, categoryBySlug } from './helpers';

let productId: string;
afterAll(async () => { if (productId) await prisma.product.delete({ where: { id: productId } }); });

describe('GET /api/meta/field-options', () => {
  it('returns option lists including distinct DB values', async () => {
    const cat = await categoryBySlug('watches');
    const marker = uid('Color');
    const p = await prisma.product.create({
      data: { category_type: 'watches', categoryId: cat.id, name: 'FO', price: 10, dialColor: marker, styles: [uid('Style')] },
    });
    productId = p.id;

    const res = await api.get('/api/meta/field-options');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.dialColor)).toBe(true);
    expect(res.body.dialColor).toContain(marker);
    expect(Array.isArray(res.body.styles)).toBe(true);
    expect(res.body.movement).toBeDefined(); // present even if empty
  });
});
