import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { api, adminToken, nonAdminToken, uid } from './helpers';

const ids: string[] = [];
afterAll(async () => { if (ids.length) await prisma.category.deleteMany({ where: { id: { in: ids } } }); });

describe('admin categories CRUD', () => {
  it('rejects non-admins', async () => {
    const res = await api.post('/api/admin/categories')
      .set('Authorization', `Bearer ${nonAdminToken()}`).send({ name: uid('Kat') });
    expect(res.status).toBe(403);
  });

  it('rejects creating a category whose name yields an empty slug', async () => {
    const res = await api.post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken()}`).send({ name: '!!!' });
    expect(res.status).toBe(400);
  });

  it('creates a category with EN name', async () => {
    const name = uid('Kat');
    const res = await api.post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name, nameEn: 'Test Category' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBeTruthy();
    expect(res.body.nameEn).toBe('Test Category');
    ids.push(res.body.id);
  });

  it('updates a category', async () => {
    const c = await prisma.category.create({ data: { name: uid('Kat'), slug: uid('kat') } });
    ids.push(c.id);
    const res = await api.put(`/api/admin/categories/${c.id}`)
      .set('Authorization', `Bearer ${adminToken()}`).send({ nameEn: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.nameEn).toBe('Updated');
  });

  it('blocks deleting a category referenced by products (409)', async () => {
    const c = await prisma.category.create({ data: { name: uid('Kat'), slug: uid('kat') } });
    ids.push(c.id);
    const p = await prisma.product.create({
      data: { category_type: 'watches', categoryId: c.id, name: 'Ref', price: 10 },
    });
    const res = await api.delete(`/api/admin/categories/${c.id}`).set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(409);
    expect(res.body.referenceCount).toBe(1);
    expect(res.body.productCount).toBe(1);
    expect(res.body.themeCount).toBe(0);
    await prisma.product.delete({ where: { id: p.id } });
  });

  it('blocks deleting a category referenced by a theme (409)', async () => {
    const c = await prisma.category.create({ data: { name: uid('Kat'), slug: uid('kat') } });
    ids.push(c.id);
    const t = await prisma.theme.create({ data: { name: uid('Thema'), slug: uid('thema'), categoryId: c.id } });
    const res = await api.delete(`/api/admin/categories/${c.id}`).set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(409);
    expect(res.body.themeCount).toBe(1);
    expect(res.body.productCount).toBe(0);
    await prisma.theme.delete({ where: { id: t.id } });
  });

  it('deletes an unreferenced category', async () => {
    const c = await prisma.category.create({ data: { name: uid('Kat'), slug: uid('kat') } });
    ids.push(c.id);
    const res = await api.delete(`/api/admin/categories/${c.id}`).set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
  });
});
