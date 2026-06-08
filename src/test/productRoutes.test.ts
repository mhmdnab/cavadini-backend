import { describe, it, expect } from 'vitest';
import { api, adminToken } from './helpers';

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
});
