import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { uploadImage, deleteImage, supabaseKeyFromUrl } from './storage';

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'images', 'uploads');
const written: string[] = [];
afterAll(() => {
  for (const url of written) {
    const f = path.join(uploadsDir, path.basename(url));
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

describe('storage (local driver)', () => {
  it('writes a file and returns a /images path', async () => {
    const url = await uploadImage({
      buffer: Buffer.from('fake-bytes'),
      originalname: 'photo.png',
      mimetype: 'image/png',
    });
    written.push(url);
    expect(url).toMatch(/^\/images\/uploads\/.+\.png$/);
    expect(fs.existsSync(path.join(uploadsDir, path.basename(url)))).toBe(true);
  });

  it('deletes a local file by url', async () => {
    const url = await uploadImage({ buffer: Buffer.from('x'), originalname: 'a.webp', mimetype: 'image/webp' });
    written.push(url); // safety net: ensure afterAll cleans up even if delete throws
    await deleteImage(url);
    expect(fs.existsSync(path.join(uploadsDir, path.basename(url)))).toBe(false);
  });

  it('rejects an unsupported mime type instead of trusting the filename', async () => {
    await expect(
      uploadImage({ buffer: Buffer.from('x'), originalname: 'evil.png', mimetype: 'image/gif' }),
    ).rejects.toThrow(/Unsupported mime type/);
  });
});

describe('supabaseKeyFromUrl', () => {
  it('extracts the object key from a Supabase public URL', () => {
    const url =
      'https://proj.supabase.co/storage/v1/object/public/products/uploads/abc.jpg';
    expect(supabaseKeyFromUrl(url, 'products')).toBe('uploads/abc.jpg');
  });

  it('returns null for a non-managed URL (e.g. legacy external image)', () => {
    expect(supabaseKeyFromUrl('https://example.com/images/legacy.jpg', 'products')).toBeNull();
  });

  it('is not fooled by the bucket name appearing elsewhere in the URL', () => {
    const url =
      'https://products.supabase.co/storage/v1/object/public/products/uploads/x.webp';
    expect(supabaseKeyFromUrl(url, 'products')).toBe('uploads/x.webp');
  });
});
