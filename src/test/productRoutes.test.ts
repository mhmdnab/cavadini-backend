import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { api, adminToken, uid, categoryBySlug } from './helpers';

const createdIds: string[] = [];
afterAll(async () => {
  if (createdIds.length) await prisma.product.deleteMany({ where: { id: { in: createdIds } } });
});

describe('product route hardening', () => {
  it('public POST /api/products is no longer available', async () => {
    const res = await api.post('/api/products').send({ name: 'x', price: 1, category_type: 'watches' });
    expect(res.status).toBe(404);
  });

  it('public PUT /api/products/:id is no longer available', async () => {
    const res = await api.put('/api/products/whatever').send({ name: 'x' });
    expect(res.status).toBe(404);
  });

  it('public DELETE /api/products/:id is no longer available', async () => {
    const res = await api.delete('/api/products/whatever');
    expect(res.status).toBe(404);
  });

  it('admin product list supports pagination and includeInactive', async () => {
    const res = await api.get('/api/admin/products?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination).toBeTruthy();
  });

  it('admin product list filters by case-insensitive search', async () => {
    const cat = await categoryBySlug('watches');
    const token = uid('Zzmarker').toLowerCase(); // unlikely to collide with real data
    const p = await prisma.product.create({
      data: { category_type: 'watches', categoryId: cat.id, name: `Searchable ${token} Watch`, price: 10 },
    });
    createdIds.push(p.id);

    // search with different casing must still match
    const hit = await api.get(`/api/admin/products?search=${token.toUpperCase()}`)
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(hit.status).toBe(200);
    expect(hit.body.products.some((x: { id: string }) => x.id === p.id)).toBe(true);

    const miss = await api.get('/api/admin/products?search=definitely-not-present-xyz-9999')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(miss.body.products.some((x: { id: string }) => x.id === p.id)).toBe(false);
  });

  it('admin POST /products validates that themes belong to the category', async () => {
    const watches = await categoryBySlug('watches');
    const jewelry = await categoryBySlug('jewelry');
    // a theme that belongs to jewelry, used on a watches product → should be rejected
    const jewelryTheme = await prisma.theme.findFirst({ where: { categoryId: jewelry.id } });
    if (!jewelryTheme) return; // skip if the cloned DB has no jewelry themes
    const res = await api.post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ category_type: 'watches', categoryId: watches.id, name: 'Bad themes', price: 10, themes: [jewelryTheme.id] });
    expect(res.status).toBe(400);
  });
});
