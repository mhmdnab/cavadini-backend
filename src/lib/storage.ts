import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UploadInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_MIME = new Set(Object.keys(EXT_BY_MIME));
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const driver = () => process.env.STORAGE_DRIVER || 'local';
const BUCKET = process.env.SUPABASE_BUCKET || 'products';

function extFor(file: UploadInput): string {
  return EXT_BY_MIME[file.mimetype] || (file.originalname.split('.').pop() || 'bin');
}

const localUploadsDir = path.join(__dirname, '..', '..', 'public', 'images', 'uploads');

async function uploadLocal(file: UploadInput): Promise<string> {
  fs.mkdirSync(localUploadsDir, { recursive: true });
  const name = `${crypto.randomUUID()}.${extFor(file)}`;
  fs.writeFileSync(path.join(localUploadsDir, name), file.buffer);
  return `/images/uploads/${name}`;
}

async function deleteLocal(url: string): Promise<void> {
  const f = path.join(localUploadsDir, path.basename(url));
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

async function uploadSupabase(file: UploadInput): Promise<string> {
  const { supabase } = await import('./supabase'); // lazy: only when driver === supabase
  const key = `uploads/${crypto.randomUUID()}.${extFor(file)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
}

async function deleteSupabase(url: string): Promise<void> {
  const { supabase } = await import('./supabase');
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // not a managed object (e.g. legacy external URL)
  const key = url.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([key]);
}

export async function uploadImage(file: UploadInput): Promise<string> {
  return driver() === 'supabase' ? uploadSupabase(file) : uploadLocal(file);
}

export async function deleteImage(url: string): Promise<void> {
  return driver() === 'supabase' ? deleteSupabase(url) : deleteLocal(url);
}
