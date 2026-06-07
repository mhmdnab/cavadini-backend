import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { api, adminToken } from './helpers';

const created: string[] = [];
afterAll(async () => {
  if (created.length) await prisma.product.deleteMany({ where: { id: { in: created } } });
});

describe('bilingual product fields', () => {
  it('persists nameEn/descriptionEn via admin create', async () => {
    const cat = await prisma.category.findFirst({ where: { slug: 'watches' } });
    expect(cat).toBeTruthy();
    const res = await api
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        category_type: 'watches',
        categoryId: cat!.id,
        name: 'Testuhr',
        nameEn: 'Test Watch',
        description: 'Beschreibung',
        descriptionEn: 'Description',
        price: 100,
      });
    expect(res.status).toBe(201);
    expect(res.body.nameEn).toBe('Test Watch');
    expect(res.body.descriptionEn).toBe('Description');
    created.push(res.body.id);
  });
});
