import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { uploadImage, deleteImage } from './storage';

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
    await deleteImage(url);
    expect(fs.existsSync(path.join(uploadsDir, path.basename(url)))).toBe(false);
  });
});
