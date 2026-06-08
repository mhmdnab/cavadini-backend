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
export const MAX_IMAGES_PER_UPLOAD = 12;

const driver = () => process.env.STORAGE_DRIVER || 'local';
const BUCKET = process.env.SUPABASE_BUCKET || 'products';

function extFor(file: UploadInput): string {
  // Strict: derive the extension from the validated mime type only. We never
  // trust the (attacker-controlled) original filename to pick the extension.
  const ext = EXT_BY_MIME[file.mimetype];
  if (!ext) throw new Error(`Unsupported mime type: ${file.mimetype}`);
  return ext;
}

/**
 * Extracts the storage object key from a Supabase public URL by anchoring to the
 * well-known `/object/public/<bucket>/` path segment. Returns null when the URL
 * isn't a managed object (e.g. a legacy external image URL), so deletes no-op.
 */
export function supabaseKeyFromUrl(url: string, bucket: string): string | null {
  const prefix = `/object/public/${bucket}/`;
  const idx = url.indexOf(prefix);
  if (idx === -1) return null;
  return url.slice(idx + prefix.length);
}

const localUploadsDir = path.join(__dirname, '..', '..', 'public', 'images', 'uploads');

async function uploadLocal(file: UploadInput): Promise<string> {
  fs.mkdirSync(localUploadsDir, { recursive: true });
  const name = `${crypto.randomUUID()}.${extFor(file)}`;
  fs.writeFileSync(path.join(localUploadsDir, name), file.buffer);
  return `/images/uploads/${name}`;
}

async function deleteLocal(url: string): Promise<void> {
  // Idempotent by design: a no-op when the file is absent (e.g. the URL was
  // never stored locally). path.basename() also guards against path traversal.
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
  const key = supabaseKeyFromUrl(url, BUCKET);
  if (!key) return; // not a managed object (e.g. legacy external URL)
  const { supabase } = await import('./supabase');
  await supabase.storage.from(BUCKET).remove([key]);
}

export async function uploadImage(file: UploadInput): Promise<string> {
  return driver() === 'supabase' ? uploadSupabase(file) : uploadLocal(file);
}

export async function deleteImage(url: string): Promise<void> {
  return driver() === 'supabase' ? deleteSupabase(url) : deleteLocal(url);
}
