import { describe, it, expect } from 'vitest';
import { api } from './helpers';

describe('health', () => {
  it('returns ok', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
