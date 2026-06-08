import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import { api, adminToken, categoryBySlug } from './helpers';

let productId: string;
beforeAll(async () => {
  const cat = await categoryBySlug('watches');
  const p = await prisma.product.create({
    data: { category_type: 'watches', categoryId: cat.id, name: 'Img Test', price: 50 },
  });
  productId = p.id;
});
afterAll(async () => {
  await prisma.product.delete({ where: { id: productId } });
});

describe('product images', () => {
  it('rejects unauthenticated upload', async () => {
    const res = await api.post(`/api/admin/products/${productId}/images`)
      .attach('images', Buffer.from('x'), { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });

  it('uploads and appends image urls', async () => {
    const res = await api.post(`/api/admin/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .attach('images', Buffer.from('a'), { filename: 'a.png', contentType: 'image/png' })
      .attach('images', Buffer.from('b'), { filename: 'b.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.images).toHaveLength(2);
  });

  it('rejects a disallowed mime type', async () => {
    const res = await api.post(`/api/admin/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .attach('images', Buffer.from('x'), { filename: 'a.gif', contentType: 'image/gif' });
    expect(res.status).toBe(400);
  });

  it('rejects a file larger than the size limit with 400 (not 500)', async () => {
    const tooBig = Buffer.alloc(5 * 1024 * 1024 + 1024, 1); // > MAX_BYTES (5 MB)
    const res = await api.post(`/api/admin/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .attach('images', tooBig, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('reorders images', async () => {
    const current = (await prisma.product.findUnique({ where: { id: productId } }))!.images;
    const reversed = [...current].reverse();
    const res = await api.put(`/api/admin/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ images: reversed });
    expect(res.status).toBe(200);
    expect(res.body.images).toEqual(reversed);
  });

  it('rejects reorder that is not a permutation', async () => {
    const res = await api.put(`/api/admin/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ images: ['/images/uploads/not-real.png'] });
    expect(res.status).toBe(400);
  });

  it('deletes a single image', async () => {
    const current = (await prisma.product.findUnique({ where: { id: productId } }))!.images;
    const res = await api.delete(`/api/admin/products/${productId}/images`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ url: current[0] });
    expect(res.status).toBe(200);
    expect(res.body.images).not.toContain(current[0]);
  });
});
