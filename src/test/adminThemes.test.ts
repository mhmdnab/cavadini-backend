import { describe, it, expect, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { api, adminToken, nonAdminToken, uid, categoryBySlug } from './helpers';

const ids: string[] = [];
afterAll(async () => { if (ids.length) await prisma.theme.deleteMany({ where: { id: { in: ids } } }); });

describe('admin themes CRUD', () => {
  it('rejects non-admins', async () => {
    const res = await api.post('/api/admin/themes')
      .set('Authorization', `Bearer ${nonAdminToken()}`).send({ name: uid('Thema') });
    expect(res.status).toBe(403);
  });

  it('creates a theme under a category', async () => {
    const cat = await categoryBySlug('watches');
    const res = await api.post('/api/admin/themes')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: uid('Thema'), nameEn: 'Test Theme', categoryId: cat.id });
    expect(res.status).toBe(201);
    expect(res.body.categoryId).toBe(cat.id);
    expect(res.body.nameEn).toBe('Test Theme');
    ids.push(res.body.id);
  });

  it('400s when categoryId is missing', async () => {
    const res = await api.post('/api/admin/themes')
      .set('Authorization', `Bearer ${adminToken()}`).send({ name: uid('Thema') });
    expect(res.status).toBe(400);
  });

  it('updates a theme', async () => {
    const cat = await categoryBySlug('watches');
    const t = await prisma.theme.create({ data: { name: uid('Thema'), slug: uid('thema'), categoryId: cat.id } });
    ids.push(t.id);
    const res = await api.put(`/api/admin/themes/${t.id}`)
      .set('Authorization', `Bearer ${adminToken()}`).send({ nameEn: 'Updated EN' });
    expect(res.status).toBe(200);
    expect(res.body.nameEn).toBe('Updated EN');
  });

  it('blocks deleting a theme used by products (409)', async () => {
    const cat = await categoryBySlug('watches');
    const t = await prisma.theme.create({ data: { name: uid('Thema'), slug: uid('thema'), categoryId: cat.id } });
    ids.push(t.id);
    const p = await prisma.product.create({
      data: { category_type: 'watches', categoryId: cat.id, name: 'Ref', price: 10,
        productThemes: { create: [{ themeId: t.id }] } },
    });
    const res = await api.delete(`/api/admin/themes/${t.id}`).set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(409);
    expect(res.body.referenceCount).toBe(1);
    await prisma.product.delete({ where: { id: p.id } });
  });

  it('deletes an unused theme', async () => {
    const cat = await categoryBySlug('watches');
    const t = await prisma.theme.create({ data: { name: uid('Thema'), slug: uid('thema'), categoryId: cat.id } });
    ids.push(t.id);
    const res = await api.delete(`/api/admin/themes/${t.id}`).set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
  });
});
