import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { api, adminToken, nonAdminToken, uid, categoryBySlug } from './helpers';

const ids: string[] = [];
afterAll(async () => { if (ids.length) await prisma.brand.deleteMany({ where: { id: { in: ids } } }); });

describe('admin brands CRUD', () => {
  it('rejects non-admins', async () => {
    const res = await api.post('/api/admin/brands')
      .set('Authorization', `Bearer ${nonAdminToken()}`).send({ name: uid('Brand') });
    expect(res.status).toBe(403);
  });

  it('creates a brand and derives slug', async () => {
    const name = uid('Brand');
    const res = await api.post('/api/admin/brands')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name, categories: ['watches'] });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBeTruthy();
    ids.push(res.body.id);
  });

  it('updates a brand', async () => {
    const b = await prisma.brand.create({ data: { name: uid('Brand'), slug: uid('brand'), categories: [] } });
    ids.push(b.id);
    const res = await api.put(`/api/admin/brands/${b.id}`)
      .set('Authorization', `Bearer ${adminToken()}`).send({ categories: ['watches', 'sale'] });
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual(['watches', 'sale']);
  });

  it('blocks deleting a brand referenced by products (409)', async () => {
    const b = await prisma.brand.create({ data: { name: uid('Brand'), slug: uid('brand'), categories: [] } });
    ids.push(b.id);
    const cat = await categoryBySlug('watches');
    const p = await prisma.product.create({
      data: { category_type: 'watches', categoryId: cat.id, brandId: b.id, name: 'Ref', price: 10 },
    });
    const res = await api.delete(`/api/admin/brands/${b.id}`).set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(409);
    expect(res.body.referenceCount).toBe(1);
    await prisma.product.delete({ where: { id: p.id } });
  });

  it('deletes an unreferenced brand', async () => {
    const b = await prisma.brand.create({ data: { name: uid('Brand'), slug: uid('brand'), categories: [] } });
    const res = await api.delete(`/api/admin/brands/${b.id}`).set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
  });
});
